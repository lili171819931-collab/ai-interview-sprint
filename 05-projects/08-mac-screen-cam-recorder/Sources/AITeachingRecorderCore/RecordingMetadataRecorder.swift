import Foundation
import AppKit
import CoreGraphics

// MARK: - Recording metadata side-channel (V0.2)
//
// While recording, this records cursor positions, mouse clicks and the
// frontmost app/window into a JSON sidecar file next to the video
// (`<video>.metadata.json`). This "director's log" powers the future
// V1.0 AI Director: auto-zoom / auto-framing / highlight generation.
//
// Coordinate convention: global display points, top-left origin — the same
// space used by ScreenCaptureKit frames, so the JSON can be mapped directly
// onto the recorded video.

public struct MetadataEvent: Codable, Equatable {
    public var t: TimeInterval
    public var type: String        // "cursor" | "click" | "window"
    public var x: Double?
    public var y: Double?
    public var button: String?
    public var app: String?
    public var title: String?

    public init(t: TimeInterval,
                type: String,
                x: Double? = nil,
                y: Double? = nil,
                button: String? = nil,
                app: String? = nil,
                title: String? = nil) {
        self.t = t
        self.type = type
        self.x = x
        self.y = y
        self.button = button
        self.app = app
        self.title = title
    }
}

public struct MetadataSession: Codable {
    public var startedAt: Date
    public var duration: TimeInterval
    public var cursorSampleHz: Int
}

public struct MetadataFile: Codable {
    public var formatVersion: Int
    public var session: MetadataSession
    public var events: [MetadataEvent]
}

public final class RecordingMetadataRecorder: @unchecked Sendable {
    public static let formatVersion = 1
    public static let cursorSampleHz = 10

    private let lock = NSLock()
    private let queue = DispatchQueue(label: "aitr.metadata", qos: .utility)
    private var events: [MetadataEvent] = []
    private var cursorTimer: DispatchSourceTimer?
    private var clickMonitors: [Any] = []
    private var activationObserver: NSObjectProtocol?
    private var startedAt: Date?
    private var outputURL: URL?
    private var lastMouse = CGPoint(x: CGFloat.greatestFiniteMagnitude, y: CGFloat.greatestFiniteMagnitude)
    private var lastCursorAt: TimeInterval = 0
    private var _isRecording = false

    public var isRecording: Bool {
        lock.lock(); defer { lock.unlock() }
        return _isRecording
    }

    /// Starts recording metadata. `outputURL` is the sidecar JSON destination.
    public func start(outputURL: URL) {
        lock.lock()
        guard !_isRecording else { lock.unlock(); return }
        _isRecording = true
        events = []
        startedAt = Date()
        self.outputURL = outputURL
        lock.unlock()

        // Cursor sampling timer (background queue — never touch the main thread).
        let timer = DispatchSource.makeTimerSource(queue: queue)
        timer.schedule(deadline: .now() + 0.1, repeating: 0.1)
        timer.setEventHandler { [weak self] in self?.sampleCursor() }
        timer.resume()
        cursorTimer = timer

        // Global mouse click monitors must be registered on the main thread.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let left = NSEvent.addGlobalMonitorForEvents(matching: .leftMouseDown) { [weak self] e in
                self?.recordClick(e, button: "left")
            }
            let right = NSEvent.addGlobalMonitorForEvents(matching: .rightMouseDown) { [weak self] e in
                self?.recordClick(e, button: "right")
            }
            let other = NSEvent.addGlobalMonitorForEvents(matching: .otherMouseDown) { [weak self] e in
                self?.recordClick(e, button: "other")
            }
            self.clickMonitors = [left, right, other].compactMap { $0 }

            self.activationObserver = NSWorkspace.shared.notificationCenter.addObserver(
                forName: NSWorkspace.didActivateApplicationNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.recordActivation()
            }
        }
    }

    /// Stops recording and writes the JSON sidecar. Returns the written URL.
    @discardableResult
    public func stop() -> URL? {
        lock.lock()
        guard _isRecording else { lock.unlock(); return nil }
        _isRecording = false
        let eventsSnapshot = events
        let started = startedAt ?? Date()
        let url = outputURL
        lock.unlock()

        cursorTimer?.cancel()
        cursorTimer = nil
        let monitors = clickMonitors
        clickMonitors = []
        let observer = activationObserver
        activationObserver = nil
        DispatchQueue.main.async {
            for m in monitors {
                NSEvent.removeMonitor(m)
            }
            if let observer {
                NSWorkspace.shared.notificationCenter.removeObserver(observer)
            }
        }

        guard let url else { return nil }
        let file = MetadataFile(
            formatVersion: Self.formatVersion,
            session: MetadataSession(startedAt: started,
                                     duration: Date().timeIntervalSince(started),
                                     cursorSampleHz: Self.cursorSampleHz),
            events: eventsSnapshot
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        do {
            let data = try encoder.encode(file)
            try data.write(to: url, options: .atomic)
            return url
        } catch {
            return nil
        }
    }

    // MARK: - Event capture

    private func append(_ event: MetadataEvent) {
        lock.lock()
        events.append(event)
        lock.unlock()
    }

    private func now() -> TimeInterval {
        lock.lock()
        let base = startedAt ?? Date()
        lock.unlock()
        return Date().timeIntervalSince(base)
    }

    private func sampleCursor() {
        let p = currentMousePoint()
        let t = now()
        lock.lock()
        let moved = hypot(p.x - lastMouse.x, p.y - lastMouse.y) > 2
        let aged = t - lastCursorAt > 0.25
        lock.unlock()
        if moved || aged {
            lock.lock()
            lastMouse = p
            lastCursorAt = t
            lock.unlock()
            append(MetadataEvent(t: t, type: "cursor", x: p.x, y: p.y))
        }
    }

    private func recordClick(_ event: NSEvent, button: String) {
        let p = currentMousePoint()
        append(MetadataEvent(t: now(), type: "click", x: p.x, y: p.y, button: button))
    }

    private func recordActivation() {
        let app = NSWorkspace.shared.frontmostApplication?.localizedName ?? "Unknown"
        let title = frontmostWindowTitle()
        append(MetadataEvent(t: now(), type: "window", app: app, title: title))
    }

    /// Current mouse position in global display coordinates (top-left origin, points).
    private func currentMousePoint() -> CGPoint {
        CGEvent(source: nil)?.location ?? .zero
    }

    /// Best-effort title of the frontmost window (used for the window-switch log).
    private func frontmostWindowTitle() -> String? {
        guard let app = NSWorkspace.shared.frontmostApplication else { return nil }
        let pid = app.processIdentifier
        guard let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
                as? [[String: Any]] else { return nil }
        for info in list {
            guard let ownerPID = info[kCGWindowOwnerPID as String] as? Int, ownerPID == pid else { continue }
            if let layer = info[kCGWindowLayer as String] as? Int, layer == 0,
               let title = info[kCGWindowName as String] as? String, !title.isEmpty {
                return title
            }
        }
        return nil
    }
}
