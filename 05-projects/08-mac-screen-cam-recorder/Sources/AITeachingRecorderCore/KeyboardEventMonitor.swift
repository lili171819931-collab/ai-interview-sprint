import Foundation
import CoreGraphics
import ApplicationServices

/// Listens for global key combinations and exposes the latest combo for the
/// on-screen keyboard display (OSD). Uses a listen-only CGEventTap; requires
/// Accessibility permission (macOS). When the permission is missing the tap
/// cannot be created — `isAvailable` becomes false and the UI shows a hint.
public final class KeyboardEventMonitor: @unchecked Sendable {
    public static let shared = KeyboardEventMonitor()
    /// How long the last key combination stays visible on screen.
    public static let displayDuration: TimeInterval = 1.6

    private let lock = NSLock()
    private var tap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var runLoop: CFRunLoop?
    private var thread: Thread?
    private var _currentCombo: String?
    private var _lastEventAt: Date?
    private var _running = false
    private var _available = false

    public init() {}

    public static var isAccessibilityTrusted: Bool {
        AXIsProcessTrusted()
    }

    public var currentCombo: String? {
        lock.lock(); defer { lock.unlock() }
        return _currentCombo
    }

    public var lastEventAt: Date? {
        lock.lock(); defer { lock.unlock() }
        return _lastEventAt
    }

    public var isRunning: Bool {
        lock.lock(); defer { lock.unlock() }
        return _running
    }

    /// Whether the event tap could be created (i.e. accessibility is granted).
    public var isAvailable: Bool {
        lock.lock(); defer { lock.unlock() }
        return _available
    }

    /// Whether a combo should currently be drawn (within the display window).
    public var isShowingCombo: Bool {
        guard let last = lastEventAt else { return false }
        return Date().timeIntervalSince(last) < Self.displayDuration
    }

    public func start() {
        lock.lock()
        guard !_running else { lock.unlock(); return }
        _running = true
        _available = false
        lock.unlock()

        let thread = Thread { [weak self] in
            self?.runTapLoop()
        }
        thread.name = "AITR-KeyboardOSD"
        thread.qualityOfService = .userInitiated
        self.thread = thread
        thread.start()
    }

    public func stop() {
        lock.lock()
        let tap = self.tap
        let loop = self.runLoop
        self.tap = nil
        self.runLoopSource = nil
        self.runLoop = nil
        _running = false
        lock.unlock()

        if let tap {
            CGEvent.tapEnable(tap: tap, enable: false)
        }
        if let loop {
            CFRunLoopStop(loop)
        }
        thread?.cancel()
        thread = nil
    }

    private func runTapLoop() {
        let mask: CGEventMask =
            (1 << CGEventType.keyDown.rawValue) |
            (1 << CGEventType.flagsChanged.rawValue)

        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .listenOnly,
            eventsOfInterest: mask,
            callback: { _, type, event, refcon in
                guard let refcon else { return Unmanaged.passUnretained(event) }
                let monitor = Unmanaged<KeyboardEventMonitor>.fromOpaque(refcon).takeUnretainedValue()
                monitor.handle(event: event, type: type)
                return Unmanaged.passUnretained(event)
            },
            userInfo: Unmanaged.passUnretained(self).toOpaque()
        ) else {
            lock.lock()
            _available = false
            _running = false
            lock.unlock()
            return
        }

        lock.lock()
        self.tap = tap
        _available = true
        lock.unlock()

        let loop = CFRunLoopGetCurrent()
        let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        lock.lock()
        self.runLoopSource = source
        self.runLoop = loop
        lock.unlock()
        CFRunLoopAddSource(loop, source, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)
        CFRunLoopRun()

        lock.lock()
        self.tap = nil
        self.runLoopSource = nil
        lock.unlock()
    }

    private func handle(event: CGEvent, type: CGEventType) {
        guard type == .keyDown || type == .flagsChanged else { return }

        var unicode: String?
        if type == .keyDown {
            var length = 0
            var chars = [UniChar](repeating: 0, count: 8)
            event.keyboardGetUnicodeString(maxStringLength: 8,
                                           actualStringLength: &length,
                                           unicodeString: &chars)
            if length > 0 {
                unicode = String(utf16CodeUnits: chars, count: length)
            }
        }

        let label = KeyboardComboLabel.label(keyCode: CGKeyCode(event.getIntegerValueField(.keyboardEventKeycode)),
                                             flags: event.flags,
                                             unicode: unicode)
        let now = Date()

        lock.lock()
        if type == .flagsChanged {
            // Modifier-only events: update only when there is something to show.
            if !label.isEmpty {
                _currentCombo = label
                _lastEventAt = now
            }
        } else {
            _currentCombo = label
            _lastEventAt = now
        }
        lock.unlock()
    }
}
