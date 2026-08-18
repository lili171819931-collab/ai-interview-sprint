import AppKit
import AITeachingRecorderCore

/// Fullscreen overlay on a display where the user drags to define a recording region.
final class RegionPickerController: NSObject {
    private let display: DisplayInfo
    private let onSelect: (CGRect) -> Void
    private var panel: NSPanel?
    private let content = RegionPickerContentView()

    init(display: DisplayInfo, onSelect: @escaping (CGRect) -> Void) {
        self.display = display
        self.onSelect = onSelect
        super.init()
        content.onSelection = { [weak self] rect in self?.finish(rect) }
    }

    func show() {
        let screen = NSScreen.screens.first { $0.displayID == display.id } ?? NSScreen.main
        guard let screen else { return }
        let panel = NSPanel(contentRect: screen.frame,
                            styleMask: [.borderless, .nonactivatingPanel],
                            backing: .buffered,
                            defer: false)
        panel.title = "AITR-RegionPicker"
        panel.level = .screenSaver
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.contentView = content
        panel.setFrame(screen.frame, display: true)
        panel.orderFrontRegardless()
        self.panel = panel
        content.displayFrame = display.frame
    }

    private func finish(_ rect: CGRect) {
        panel?.orderOut(nil)
        panel = nil
        onSelect(rect)
    }
}

/// Draws a dim overlay and a selection rectangle.
final class RegionPickerContentView: NSView {
    var displayFrame: CGRect = .zero
    var onSelection: ((CGRect) -> Void)?

    private var dragStart: CGPoint?
    private var currentRect: CGRect?

    override func mouseDown(with event: NSEvent) {
        let p = convert(event.locationInWindow, from: nil)
        dragStart = p
        currentRect = CGRect(origin: p, size: .zero)
        needsDisplay = true
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start = dragStart else { return }
        let p = convert(event.locationInWindow, from: nil)
        currentRect = CGRect(x: min(start.x, p.x),
                             y: min(start.y, p.y),
                             width: abs(p.x - start.x),
                             height: abs(p.y - start.y))
        needsDisplay = true
    }

    override func mouseUp(with event: NSEvent) {
        guard let rect = currentRect, rect.width > 40, rect.height > 40 else {
            dragStart = nil
            currentRect = nil
            needsDisplay = true
            return
        }
        // Convert local (bottom-left origin) to global top-left-origin points.
        let global = CGPoint(x: displayFrame.minX + rect.minX,
                             y: displayFrame.minY + (bounds.height - rect.maxY))
        onSelection?(CGRect(x: global.x, y: global.y, width: rect.width, height: rect.height))
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        NSColor.black.withAlphaComponent(0.35).setFill()
        bounds.fill()

        if let rect = currentRect {
            NSColor.clear.setFill()
            rect.fill()
            NSColor.white.setStroke()
            let path = NSBezierPath(rect: rect)
            path.lineWidth = 2
            path.stroke()
            let sizeText = String(format: "%d × %d", Int(rect.width), Int(rect.height))
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.monospacedDigitSystemFont(ofSize: 13, weight: .medium),
                .foregroundColor: NSColor.white
            ]
            (sizeText as NSString).draw(at: NSPoint(x: rect.maxX + 8, y: rect.maxY + 8), withAttributes: attrs)
        } else {
            let hint = "Drag to select a recording region"
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: 16, weight: .medium),
                .foregroundColor: NSColor.white
            ]
            let size = (hint as NSString).size(withAttributes: attrs)
            (hint as NSString).draw(at: NSPoint(x: (bounds.width - size.width) / 2, y: bounds.height - 60),
                                    withAttributes: attrs)
        }
    }

    override var acceptsFirstResponder: Bool { true }
    override func keyDown(with event: NSEvent) {
        if event.keyCode == 53 { // Esc
            onSelection?(CGRect(x: -1, y: -1, width: 0, height: 0))
        } else {
            super.keyDown(with: event)
        }
    }
}

extension NSScreen {
    var displayID: CGDirectDisplayID? {
        deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? CGDirectDisplayID
    }
}
