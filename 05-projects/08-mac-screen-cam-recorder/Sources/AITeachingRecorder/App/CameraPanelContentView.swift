import AppKit
import AVFoundation

/// Hosts the live camera preview and supports drag-to-resize from the bottom-right corner.
final class CameraPanelContentView: NSView {
    let previewLayer: AVCaptureVideoPreviewLayer
    var onGeometryChange: ((NSRect) -> Void)?
    var onClose: (() -> Void)?

    private var isResizing = false
    private var initialFrame: NSRect = .zero
    private var dragStart: NSPoint = .zero
    private var isDraggingWindow = false
    private let minSize = CGSize(width: 140, height: 105)

    init(previewLayer: AVCaptureVideoPreviewLayer) {
        self.previewLayer = previewLayer
        super.init(frame: .zero)
        wantsLayer = true
        layer?.backgroundColor = NSColor.clear.cgColor
        previewLayer.frame = bounds
        previewLayer.videoGravity = .resizeAspectFill
        layer?.addSublayer(previewLayer)
        setupWindowControls()
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    private func setupWindowControls() {
        let minimize = makeControlButton(symbol: "minus", help: "Minimize", action: #selector(minimizeWindow))
        let close = makeControlButton(symbol: "xmark", help: "Close", action: #selector(closeWindow))
        close.wantsLayer = true
        close.layer?.backgroundColor = NSColor.red.withAlphaComponent(0.85).cgColor

        minimize.translatesAutoresizingMaskIntoConstraints = false
        close.translatesAutoresizingMaskIntoConstraints = false
        addSubview(minimize)
        addSubview(close)

        NSLayoutConstraint.activate([
            minimize.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            minimize.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
            minimize.widthAnchor.constraint(equalToConstant: 20),
            minimize.heightAnchor.constraint(equalToConstant: 20),

            close.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            close.trailingAnchor.constraint(equalTo: minimize.leadingAnchor, constant: -6),
            close.widthAnchor.constraint(equalToConstant: 20),
            close.heightAnchor.constraint(equalToConstant: 20)
        ])
    }

    private func makeControlButton(symbol: String, help: String, action: Selector) -> NSButton {
        let button = NSButton(title: "", target: self, action: action)
        button.bezelStyle = .inline
        button.isBordered = false
        button.toolTip = help
        button.wantsLayer = true
        button.layer?.backgroundColor = NSColor.black.withAlphaComponent(0.45).cgColor
        button.layer?.cornerRadius = 10
        button.image = NSImage(systemSymbolName: symbol, accessibilityDescription: help)
        button.imagePosition = .imageOnly
        button.contentTintColor = .white
        return button
    }

    @objc private func minimizeWindow() {
        window?.miniaturize(nil)
    }

    @objc private func closeWindow() {
        onClose?()
    }

    override func layout() {
        super.layout()
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        previewLayer.frame = bounds
        CATransaction.commit()
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        // Resize handle
        let handle = NSRect(x: bounds.width - 22, y: 0, width: 22, height: 22)
        let path = NSBezierPath()
        path.move(to: NSPoint(x: handle.maxX - 6, y: handle.minY + 2))
        path.line(to: NSPoint(x: handle.maxX - 2, y: handle.minY + 6))
        path.move(to: NSPoint(x: handle.maxX - 12, y: handle.minY + 2))
        path.line(to: NSPoint(x: handle.maxX - 2, y: handle.minY + 12))
        NSColor.white.withAlphaComponent(0.85).setStroke()
        path.lineWidth = 2
        path.stroke()
    }

    override func mouseDown(with event: NSEvent) {
        let p = convert(event.locationInWindow, from: nil)
        let handleRect = NSRect(x: bounds.width - 24, y: 0, width: 24, height: 24)
        if handleRect.contains(p) {
            isResizing = true
            initialFrame = window?.frame ?? .zero
            dragStart = event.locationInWindow
        } else {
            isDraggingWindow = true
            // Move the panel manually so dragging anywhere works even with nonactivating panels.
        }
    }

    override func mouseDragged(with event: NSEvent) {
        guard let window else { return }
        if isResizing {
            let dx = event.locationInWindow.x - dragStart.x
            let dy = dragStart.y - event.locationInWindow.y
            var frame = initialFrame
            frame.size.width = max(minSize.width, initialFrame.width + dx)
            frame.size.height = max(minSize.height, initialFrame.height + dy)
            window.setFrame(frame, display: true)
            onGeometryChange?(frame)
        } else if isDraggingWindow {
            let origin = window.frame.origin
            let newOrigin = NSPoint(x: origin.x + event.deltaX, y: origin.y - event.deltaY)
            window.setFrameOrigin(newOrigin)
            onGeometryChange?(window.frame)
        }
    }

    override func mouseUp(with event: NSEvent) {
        isResizing = false
        isDraggingWindow = false
    }

    override func resetCursorRects() {
        let handleRect = NSRect(x: bounds.width - 24, y: 0, width: 24, height: 24)
        addCursorRect(handleRect, cursor: .resizeUpDown)
    }
}
