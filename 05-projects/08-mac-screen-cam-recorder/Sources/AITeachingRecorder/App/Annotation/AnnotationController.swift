import AppKit
import SwiftUI
import Combine
import CoreImage
import AITeachingRecorderCore

extension NSColor {
    convenience init?(hex: String) {
        var str = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("#") { str.removeFirst() }
        guard str.count == 6, let value = UInt64(str, radix: 16) else { return nil }
        self.init(srgbRed: CGFloat((value >> 16) & 0xFF) / 255,
                  green: CGFloat((value >> 8) & 0xFF) / 255,
                  blue: CGFloat(value & 0xFF) / 255,
                  alpha: 1)
    }
}

/// Manages the transparent teaching-annotation overlay and its floating toolbar.
final class AnnotationController: ObservableObject {
    static let overlayTitle = "AITR-AnnotationOverlay"
    static let toolbarTitle = "AITR-DrawingToolbar"

    @Published var tool: AnnotationTool {
        didSet {
            SettingsStore.shared.annotationTool = tool.rawValue
            canvas.tool = tool
        }
    }
    @Published var colorHex: String {
        didSet {
            SettingsStore.shared.annotationColorHex = colorHex
            canvas.color = NSColor(hex: colorHex) ?? .systemRed
        }
    }
    @Published var lineWidth: Double {
        didSet {
            SettingsStore.shared.annotationWidth = lineWidth
            canvas.width = CGFloat(lineWidth)
        }
    }
    @Published var isVisible = false

    private var overlayPanel: NSPanel?
    private var toolbarPanel: NSPanel?
    let canvas = DrawingCanvasView()

    init() {
        let settings = SettingsStore.shared
        tool = AnnotationTool(rawValue: settings.annotationTool) ?? .pen
        colorHex = settings.annotationColorHex
        lineWidth = settings.annotationWidth
        canvas.tool = tool
        canvas.color = NSColor(hex: colorHex) ?? .systemRed
        canvas.width = CGFloat(lineWidth)
        canvas.onChanged = { [weak self] in
            _ = self?.canvasImage // keep reference fresh; compositor reads it lazily
        }
    }

    var overlayWindowID: CGWindowID? {
        guard let n = overlayPanel?.windowNumber else { return nil }
        return CGWindowID(n)
    }

    var canvasImage: CIImage? { canvas.canvasImage }

    func show(over contentFrame: CGRect, pixelSize: CGSize) {
        let panel = NSPanel(contentRect: contentFrame,
                            styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered,
                            defer: false)
        panel.title = Self.overlayTitle
        panel.level = .floating
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isRestorable = false
        panel.isMovableByWindowBackground = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        canvas.frame = NSRect(origin: .zero, size: contentFrame.size)
        canvas.setup(sizePixels: pixelSize)
        canvas.isDrawingEnabled = false
        panel.contentView = canvas
        panel.setFrame(contentFrame, display: true)
        panel.orderFrontRegardless()
        overlayPanel = panel
        isVisible = true
        showToolbar()
    }

    func hide() {
        overlayPanel?.orderOut(nil)
        overlayPanel = nil
        toolbarPanel?.orderOut(nil)
        toolbarPanel = nil
        isVisible = false
    }

    func setDrawingEnabled(_ enabled: Bool) {
        canvas.isDrawingEnabled = enabled
        overlayPanel?.ignoresMouseEvents = !enabled
        if enabled {
            overlayPanel?.orderFrontRegardless()
        }
    }

    func clear() {
        canvas.clearAll()
    }

    private func showToolbar() {
        let hosting = NSHostingView(rootView: DrawingToolbarView().environmentObject(self))
        let panel = NSPanel(contentRect: NSRect(x: 0, y: 0, width: 380, height: 56),
                            styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered,
                            defer: false)
        panel.title = Self.toolbarTitle
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isRestorable = false
        panel.isMovableByWindowBackground = true
        panel.becomesKeyOnlyIfNeeded = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        panel.contentView = hosting
        panel.setContentSize(NSSize(width: 380, height: 56))
        if let screen = NSScreen.main {
            panel.setFrameOrigin(NSPoint(x: screen.visibleFrame.midX - 190, y: screen.visibleFrame.minY + 40))
        }
        panel.orderFrontRegardless()
        toolbarPanel = panel
    }
}
