import AppKit
import SwiftUI
import AITeachingRecorderCore

final class AppDelegate: NSObject, NSApplicationDelegate {
    static let controlBarTitle = "AITR-ControlBar"
    static let cameraPanelTitle = "AITR-CameraPreview"

    private var controlBarPanel: NSPanel?
    private var cameraPanel: NSPanel?
    private var regionPicker: RegionPickerController?
    private(set) var annotationController = AnnotationController()
    private var countdownPanel: NSPanel?
    private var countdownLabel: NSTextField?
    private var countdownTimer: Timer?
    private var permissionMonitorTimer: Timer?
    private var lastReadiness: PermissionsManager.Readiness?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        // Remember whether Screen Recording was already granted at launch. TCC requires a relaunch
        // for newly-granted Screen Recording to take effect.
        UserDefaults.standard.set(PermissionsManager.shared.screenRecordingStatus == .granted,
                                  forKey: "aitr.screenGrantedAtLaunch")
        startPermissionMonitor()
    }

    /// Polls TCC status so the UI updates the moment the user grants permissions in System Settings
    /// (fixes the "permissions always show as not enabled" bug).
    private func startPermissionMonitor() {
        permissionMonitorTimer?.invalidate()
        permissionMonitorTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            let readiness = PermissionsManager.shared.readiness()
            if readiness != self?.lastReadiness {
                self?.lastReadiness = readiness
                NotificationCenter.default.post(name: .permissionsChanged, object: nil)
            }
        }
        RunLoop.main.add(permissionMonitorTimer!, forMode: .common)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    // MARK: - Floating control bar

    func showControlBar() {
        if controlBarPanel == nil {
            let hosting = NSHostingView(rootView: FloatingControlBarView())
            let panel = makeFloatingPanel(title: Self.controlBarTitle,
                                          content: hosting,
                                          size: CGSize(width: 360, height: 64),
                                          movable: true)
            panel.setFrameOrigin(CGPoint(x: NSScreen.main?.visibleFrame.midX ?? 400 - 180,
                                         y: NSScreen.main?.visibleFrame.maxY ?? 800 - 90))
            controlBarPanel = panel
        }
        controlBarPanel?.orderFrontRegardless()
    }

    func hideControlBar() {
        controlBarPanel?.orderOut(nil)
    }

    // MARK: - Camera preview panel

    func showCameraPanel() {
        if cameraPanel == nil {
            let content = CameraPanelContentView(previewLayer: RecorderController.shared.cameraPreviewLayer)
            content.onGeometryChange = { [weak self] frame in
                self?.updateOverlayFromCameraPanel(frame: frame)
            }
            content.onClose = { [weak self] in
                self?.hideCameraPanel()
                var overlay = SettingsStore.shared.cameraOverlay
                overlay.enabled = false
                SettingsStore.shared.cameraOverlay = overlay
            }
            let panel = makeFloatingPanel(title: Self.cameraPanelTitle,
                                          content: content,
                                          size: CGSize(width: 240, height: 180),
                                          movable: true)
            panel.setFrameOrigin(CGPoint(x: 120, y: 200))
            cameraPanel = panel
            updateOverlayFromCameraPanel(frame: panel.frame)
        }
        // Re-enable the overlay in the video whenever the panel is shown again.
        var overlay = SettingsStore.shared.cameraOverlay
        overlay.enabled = true
        SettingsStore.shared.cameraOverlay = overlay
        cameraPanel?.orderFrontRegardless()
    }

    func hideCameraPanel() {
        cameraPanel?.orderOut(nil)
    }

    private func updateOverlayFromCameraPanel(frame: NSRect) {
        let settings = SettingsStore.shared
        var overlay = settings.cameraOverlay
        // Convert NSWindow frame (bottom-left origin) to global top-left-origin points.
        guard let screen = NSScreen.screens.first(where: { NSMouseInRect(NSPoint(x: frame.midX, y: frame.midY), $0.frame, false) })
                ?? NSScreen.main else { return }
        let topLeft = CGPoint(x: frame.minX, y: screen.frame.maxY - frame.maxY)
        overlay.position = topLeft
        overlay.customSize = frame.size
        overlay.sizePreset = .custom
        settings.cameraOverlay = overlay
    }

    // MARK: - Excluded windows

    func excludedWindowIDs() -> [CGWindowID] {
        var ids: [CGWindowID] = [controlBarPanel, cameraPanel].compactMap { $0?.windowNumber }.map { CGWindowID($0) }
        if let annotationID = annotationController.overlayWindowID {
            ids.append(annotationID)
        }
        return ids
    }

    // MARK: - Teaching annotations

    func showAnnotationOverlay(contentFrame: CGRect, pixelSize: CGSize) {
        annotationController.show(over: contentFrame, pixelSize: pixelSize)
    }

    func hideAnnotationOverlay() {
        annotationController.hide()
    }

    func setDrawingEnabled(_ enabled: Bool) {
        annotationController.setDrawingEnabled(enabled)
    }

    func toggleDrawingMode() {
        annotationController.setDrawingEnabled(!annotationController.canvas.isDrawingEnabled)
    }

    var annotationCanvasImageProvider: (() -> CoreImage.CIImage?)? {
        { [weak annotationController] in annotationController?.canvasImage }
    }

    // MARK: - Countdown

    func showCountdown(_ seconds: Int, completion: @escaping () -> Void) {
        let panel = NSPanel(contentRect: NSRect(x: 0, y: 0, width: 360, height: 220),
                            styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered,
                            defer: false)
        panel.title = "AITR-Countdown"
        panel.level = .screenSaver
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        let label = NSTextField(labelWithString: "\(seconds)")
        label.font = NSFont.systemFont(ofSize: 96, weight: .bold)
        label.textColor = .white
        label.alignment = .center
        let container = NSView(frame: NSRect(x: 0, y: 0, width: 360, height: 220))
        container.wantsLayer = true
        container.layer?.backgroundColor = NSColor.black.withAlphaComponent(0.55).cgColor
        container.layer?.cornerRadius = 24
        label.frame = container.bounds
        label.autoresizingMask = [.width, .height]
        container.addSubview(label)
        panel.contentView = container
        if let screen = NSScreen.main {
            panel.setFrameOrigin(NSPoint(x: screen.visibleFrame.midX - 180, y: screen.visibleFrame.midY - 110))
        }
        panel.orderFrontRegardless()
        countdownPanel = panel
        countdownLabel = label

        var remaining = seconds
        countdownTimer?.invalidate()
        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
            remaining -= 1
            if remaining > 0 {
                label.stringValue = "\(remaining)"
                NSSound.beep()
            } else {
                timer.invalidate()
                self.countdownTimer = nil
                panel.orderOut(nil)
                self.countdownPanel = nil
                self.countdownLabel = nil
                completion()
            }
        }
        RunLoop.main.add(countdownTimer!, forMode: .common)
    }

    // MARK: - Region picker

    func showRegionPicker(display: DisplayInfo, onSelect: @escaping (CGRect) -> Void) {
        regionPicker = RegionPickerController(display: display) { [weak self] rect in
            onSelect(rect)
            self?.regionPicker = nil
        }
        regionPicker?.show()
    }

    // MARK: - Panel factory

    private func makeFloatingPanel(title: String, content: NSView, size: CGSize, movable: Bool) -> NSPanel {
        let panel = NSPanel(contentRect: NSRect(origin: .zero, size: size),
                            styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered,
                            defer: false)
        panel.title = title
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isMovableByWindowBackground = movable
        panel.becomesKeyOnlyIfNeeded = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        panel.contentView = content
        panel.setContentSize(size)
        return panel
    }
}

extension AppDelegate {
    /// Ensures the camera panel is visible when a recording with camera starts.
    func showCameraPanelIfNeeded() {
        if RecorderController.shared.cameraEnabled { showCameraPanel() }
    }
}
