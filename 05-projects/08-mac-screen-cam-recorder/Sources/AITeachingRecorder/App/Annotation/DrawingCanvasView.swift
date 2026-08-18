import AppKit
import CoreImage
import CoreVideo
import CoreGraphics
import AITeachingRecorderCore

/// A stroke drawn on the teaching canvas.
struct AnnotationStroke {
    var tool: AnnotationTool
    var color: NSColor
    var width: CGFloat
    var points: [CGPoint]
    var text: String = ""
    var frame: CGRect = .zero
}

/// Transparent drawing surface that accumulates teaching annotations.
/// Draws into an offscreen CVPixelBuffer so the compositor can bake it into the video cheaply.
final class DrawingCanvasView: NSView {
    private var canvasBuffer: CVPixelBuffer?
    private var canvasContext: CGContext?
    var pixelSize: CGSize = .zero

    var strokes: [AnnotationStroke] = []
    private var currentStroke: AnnotationStroke?

    var tool: AnnotationTool = .pen
    var color: NSColor = .systemRed
    var width: CGFloat = 5
    var isDrawingEnabled = true
    var onChanged: (() -> Void)?

    private var textField: NSTextField?
    private let lock = NSLock()

    var canvasImage: CIImage? {
        lock.lock()
        defer { lock.unlock() }
        guard let buffer = canvasBuffer else { return nil }
        return CIImage(cvPixelBuffer: buffer)
    }

    // MARK: Setup

    func setup(sizePixels: CGSize) {
        pixelSize = sizePixels
        let width = Int(sizePixels.width.rounded())
        let height = Int(sizePixels.height.rounded())
        guard width > 0, height > 0 else { return }

        var buffer: CVPixelBuffer?
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true,
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32ARGB,
            kCVPixelBufferWidthKey: width,
            kCVPixelBufferHeightKey: height
        ]
        guard CVPixelBufferCreate(kCFAllocatorDefault, width, height,
                                  kCVPixelFormatType_32ARGB, attrs as CFDictionary, &buffer) == kCVReturnSuccess,
              let buffer else { return }
        canvasBuffer = buffer

        CVPixelBufferLockBaseAddress(buffer, [])
        if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buffer),
                               width: width,
                               height: height,
                               bitsPerComponent: 8,
                               bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
                               space: CGColorSpaceCreateDeviceRGB(),
                               bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue) {
            ctx.clear(CGRect(x: 0, y: 0, width: width, height: height))
            canvasContext = ctx
        }
        CVPixelBufferUnlockBaseAddress(buffer, [])
        needsDisplay = true
    }

    func clearAll() {
        strokes.removeAll()
        redraw()
    }

    // MARK: Rendering

    private func redraw() {
        lock.lock()
        defer { lock.unlock() }
        guard let buffer = canvasBuffer, let ctx = canvasContext else { return }
        CVPixelBufferLockBaseAddress(buffer, [])
        ctx.clear(CGRect(x: 0, y: 0, width: ctx.width, height: ctx.height))
        let scale = CGFloat(ctx.width) / max(bounds.width, 1)
        for stroke in strokes {
            draw(stroke, in: ctx, scale: scale)
        }
        if var live = currentStroke, live.points.count > 0 {
            draw(live, in: ctx, scale: scale)
        }
        CVPixelBufferUnlockBaseAddress(buffer, [])
        needsDisplay = true
        onChanged?()
    }

    private func draw(_ stroke: AnnotationStroke, in ctx: CGContext, scale: CGFloat) {
        ctx.saveGState()
        ctx.setStrokeColor(stroke.color.cgColor)
        ctx.setFillColor(stroke.color.cgColor)
        ctx.setLineWidth(stroke.width * scale)
        ctx.setLineCap(.round)
        ctx.setLineJoin(.round)

        switch stroke.tool {
        case .pen:
            guard stroke.points.count > 1 else { break }
            let path = CGMutablePath()
            path.move(to: stroke.points[0].scaled(scale))
            for p in stroke.points.dropFirst() {
                path.addLine(to: p.scaled(scale))
            }
            ctx.addPath(path)
            ctx.strokePath()
        case .arrow:
            guard let start = stroke.points.first, let end = stroke.points.last else { break }
            ctx.move(to: start.scaled(scale))
            ctx.addLine(to: end.scaled(scale))
            ctx.strokePath()
            // Arrowhead
            let angle = atan2(end.y - start.y, end.x - start.x)
            let len = (12 + stroke.width * 2) * scale
            for delta in [CGFloat.pi * 0.22, -CGFloat.pi * 0.22] {
                let a = angle + delta
                let tip = CGPoint(x: end.x * scale - cos(a) * len, y: end.y * scale - sin(a) * len)
                ctx.move(to: CGPoint(x: end.x * scale, y: end.y * scale))
                ctx.addLine(to: tip)
            }
            ctx.strokePath()
        case .rect:
            guard let start = stroke.points.first, let end = stroke.points.last else { break }
            ctx.stroke(CGRect(x: min(start.x, end.x) * scale,
                              y: min(start.y, end.y) * scale,
                              width: abs(end.x - start.x) * scale,
                              height: abs(end.y - start.y) * scale))
        case .ellipse:
            guard let start = stroke.points.first, let end = stroke.points.last else { break }
            ctx.strokeEllipse(in: CGRect(x: min(start.x, end.x) * scale,
                                         y: min(start.y, end.y) * scale,
                                         width: abs(end.x - start.x) * scale,
                                         height: abs(end.y - start.y) * scale))
        case .text:
            guard !stroke.text.isEmpty else { break }
            let font = NSFont.systemFont(ofSize: max(14, stroke.width * 4) * scale)
            let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: stroke.color]
            let point = stroke.points.first ?? .zero
            // NSString drawing needs an active NSGraphicsContext, otherwise it silently no-ops.
            let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = nsCtx
            (stroke.text as NSString).draw(at: point.scaled(scale), withAttributes: attrs)
            NSGraphicsContext.restoreGraphicsState()
        case .eraser:
            break // eraser removes strokes, it never renders
        }
        ctx.restoreGState()
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        guard let buffer = canvasBuffer else {
            NSColor.clear.setFill()
            bounds.fill()
            return
        }
        let ciImage = CIImage(cvPixelBuffer: buffer)
        let context = CIContext(options: [.useSoftwareRenderer: false])
        if let cg = context.createCGImage(ciImage, from: ciImage.extent) {
            NSGraphicsContext.current?.cgContext.draw(cg, in: bounds)
        }
    }

    // MARK: Mouse

    override var acceptsFirstResponder: Bool { true }

    override func mouseDown(with event: NSEvent) {
        guard isDrawingEnabled else { return }
        let p = convert(event.locationInWindow, from: nil)
        if tool == .text {
            beginTextInput(at: p)
            return
        }
        currentStroke = AnnotationStroke(tool: tool, color: color, width: width, points: [p])
        redraw()
    }

    override func mouseDragged(with event: NSEvent) {
        guard isDrawingEnabled, currentStroke != nil else { return }
        let p = convert(event.locationInWindow, from: nil)
        if tool == .eraser {
            eraseStrokes(intersecting: p, radius: width / 2)
            return
        }
        currentStroke?.points.append(p)
        redraw()
    }

    override func mouseUp(with event: NSEvent) {
        guard isDrawingEnabled else { return }
        if let stroke = currentStroke {
            strokes.append(stroke)
        }
        currentStroke = nil
        redraw()
    }

    private func eraseStrokes(intersecting point: CGPoint, radius: CGFloat) {
        var toRemove: [Int] = []
        for (i, stroke) in strokes.enumerated() {
            for p in stroke.points where hypot(p.x - point.x, p.y - point.y) < radius {
                toRemove.append(i)
                break
            }
            if stroke.tool == .text, stroke.frame.insetBy(dx: -radius, dy: -radius).contains(point) {
                toRemove.append(i)
            }
        }
        for i in toRemove.reversed() {
            strokes.remove(at: i)
        }
        currentStroke = nil
        redraw()
    }

    // MARK: Text input

    private func beginTextInput(at point: NSPoint) {
        let field = NSTextField(frame: NSRect(x: point.x, y: point.y, width: 220, height: 32))
        field.font = NSFont.systemFont(ofSize: max(14, width * 4))
        field.textColor = color
        field.backgroundColor = NSColor.black.withAlphaComponent(0.35)
        field.textColor = .white
        field.drawsBackground = true
        field.bezelStyle = .roundedBezel
        field.placeholderString = "Type text, press Enter"
        field.target = self
        field.action = #selector(commitText(_:))
        addSubview(field)
        field.window?.makeFirstResponder(field)
        textField = field
    }

    @objc private func commitText(_ sender: NSTextField) {
        let text = sender.stringValue
        let origin = convert(sender.frame.origin, from: nil)
        if !text.isEmpty {
            let stroke = AnnotationStroke(tool: .text, color: color, width: width, points: [origin], text: text,
                                          frame: NSRect(origin: origin, size: NSSize(width: 260, height: 40)))
            strokes.append(stroke)
            redraw()
        }
        sender.removeFromSuperview()
        textField = nil
        window?.makeFirstResponder(nil)
    }

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 53, textField != nil { // Esc cancels text input
            textField?.removeFromSuperview()
            textField = nil
        } else {
            super.keyDown(with: event)
        }
    }
}

private extension CGPoint {
    func scaled(_ s: CGFloat) -> CGPoint {
        CGPoint(x: x * s, y: y * s)
    }
}
