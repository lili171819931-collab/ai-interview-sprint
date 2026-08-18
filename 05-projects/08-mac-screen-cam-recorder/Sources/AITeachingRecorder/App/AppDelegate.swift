import AppKit
import SwiftUI
import AITeachingRecorderCore

final class AppDelegate: NSObject, NSApplicationDelegate {
    static let controlBarTitle = "AITR-ControlBar"
    static let cameraPanelTitle = "AITR-CameraPreview"

    private var controlBarPanel: NSPanel?
    private var cameraPanel: NSPanel?
    private var regionPicker: RegionPickerController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        // Remember whether Screen Recording was already granted at launch. TCC requires a relaunch
        // for newly-granted Screen Recording to take effect.
        UserDefaults.standard.set(PermissionsManager.shared.screenRecordingStatus == .granted,
                                  forKey: "aitr.screenGrantedAtLaunch")
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
        settings.cameraOverlay = overlay
    }

    // MARK: - Excluded windows

    func excludedWindowIDs() -> [CGWindowID] {
        [controlBarPanel, cameraPanel].compactMap { $0?.windowNumber }
            .map { CGWindowID($0) }
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
