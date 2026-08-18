import Foundation
import AppKit
import CoreImage
import CoreVideo
import CoreMedia
import CoreGraphics

/// Composites the camera overlay onto each screen frame using CoreImage + CoreGraphics,
/// so the overlay is baked into the final video (not just the UI preview).
final class CompositionRenderer: @unchecked Sendable {
    private let ciContext: CIContext
    private var outputSizePixels: CGSize = .zero

    init() {
        ciContext = CIContext(options: [
            .cacheIntermediates: false,
            .useSoftwareRenderer: false
        ])
    }

    func prepare(outputSize: CGSize) {
        outputSizePixels = outputSize
    }

    /// Renders `screenBuffer` (with optional region crop and camera overlay) into a new BGRA
    /// pixel buffer and returns a ready-to-write CMSampleBuffer with the screen frame's timing.
    func composite(screenBuffer: CMSampleBuffer,
                   cameraBuffer: CMSampleBuffer?,
                   overlay: CameraOverlaySettings?,
                   sourceInfo: ScreenCaptureEngine.SourceInfo,
                   mirrorCamera: Bool) -> CMSampleBuffer? {
        guard let screenImageBuffer = screenBuffer.imageBuffer else { return nil }
        let screenImage = CIImage(cvPixelBuffer: screenImageBuffer)

        var base = screenImage
        // Display / region mode: crop to the captured content rect (in pixels).
        if !sourceInfo.isWindowMode {
            let scale = sourceInfo.scale
            let content = sourceInfo.contentRectPoints
            let display = sourceInfo.displayFrame
            let crop = CGRect(x: (content.minX - display.minX) * scale,
                              y: (content.minY - display.minY) * scale,
                              width: content.width * scale,
                              height: content.height * scale)
            base = base.cropped(to: crop)
        }

        // Bake camera overlay on top.
        if let overlay, overlay.enabled, let cameraBuffer, let cameraImageBuffer = cameraBuffer.imageBuffer {
            let cameraImage = CIImage(cvPixelBuffer: cameraImageBuffer)
            let overlayLayer = makeOverlayLayer(cameraImage: cameraImage,
                                                overlay: overlay,
                                                sourceInfo: sourceInfo,
                                                mirror: mirrorCamera)
            base = overlayLayer.composited(over: base)
        }

        let outSize = outputSizePixels
        guard outSize.width > 0, outSize.height > 0 else { return nil }

        var pixelBuffer: CVPixelBuffer?
        let attrs: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true,
            kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey: Int(outSize.width),
            kCVPixelBufferHeightKey: Int(outSize.height)
        ]
        let status = CVPixelBufferCreate(kCFAllocatorDefault,
                                         Int(outSize.width),
                                         Int(outSize.height),
                                         kCVPixelFormatType_32BGRA,
                                         attrs as CFDictionary,
                                         &pixelBuffer)
        guard status == kCVReturnSuccess, let pixelBuffer else { return nil }

        ciContext.render(base, to: pixelBuffer, bounds: CGRect(origin: .zero, size: outSize), colorSpace: CGColorSpaceCreateDeviceRGB())

        // Wrap in a CMSampleBuffer using the screen frame's timing.
        var formatDescription: CMVideoFormatDescription?
        let fdStatus = CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault,
                                                                    imageBuffer: pixelBuffer,
                                                                    formatDescriptionOut: &formatDescription)
        guard fdStatus == noErr, let formatDescription else { return nil }

        let pts = CMSampleBufferGetPresentationTimeStamp(screenBuffer)
        let duration = CMSampleBufferGetDuration(screenBuffer)
        var timing = CMSampleTimingInfo(duration: duration.isNumeric ? duration : CMTime(value: 1, timescale: 30),
                                        presentationTimeStamp: pts,
                                        decodeTimeStamp: .invalid)

        var outBuffer: CMSampleBuffer?
        let sbStatus = CMSampleBufferCreateReadyWithImageBuffer(allocator: kCFAllocatorDefault,
                                                                imageBuffer: pixelBuffer,
                                                                formatDescription: formatDescription,
                                                                sampleTiming: &timing,
                                                                sampleBufferOut: &outBuffer)
        guard sbStatus == noErr, let outBuffer else { return nil }
        return outBuffer
    }

    /// Builds the camera overlay as a CIImage: mirrored/scaled camera inside a rounded-rect or
    /// circle, with an optional border, positioned at the overlay's screen location.
    private func makeOverlayLayer(cameraImage: CIImage,
                                  overlay: CameraOverlaySettings,
                                  sourceInfo: ScreenCaptureEngine.SourceInfo,
                                  mirror: Bool) -> CIImage {
        let scale = sourceInfo.scale
        let sizePts = overlay.resolvedSize
        let sizePx = CGSize(width: sizePts.width * scale, height: sizePts.height * scale)

        // Position relative to the captured content (global top-left-origin points -> pixels).
        let content = sourceInfo.contentRectPoints
        let relX = overlay.position.x - content.minX
        let relY = overlay.position.y - content.minY
        let px = relX * scale
        let py = relY * scale
        let outputHeight = sourceInfo.videoSizePixels.height
        // CI coordinate space is bottom-left origin; convert the top-left anchor.
        let originPx = CGPoint(x: px, y: outputHeight - py - sizePx.height)

        // 1) Camera CGImage (aspect-fill into the overlay box).
        guard let cameraCG = ciContext.createCGImage(cameraImage, from: cameraImage.extent) else {
            return CIImage.empty()
        }
        let cameraSizePx = CGSize(width: cameraCG.width, height: cameraCG.height)
        let fillScale = max(sizePx.width / cameraSizePx.width, sizePx.height / cameraSizePx.height)
        let drawW = cameraSizePx.width * fillScale
        let drawH = cameraSizePx.height * fillScale
        let drawX = (sizePx.width - drawW) / 2
        let drawY = (sizePx.height - drawH) / 2

        // 2) Draw overlay into a CGContext: clip to shape, draw camera, border.
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let ctx = CGContext(data: nil,
                                  width: Int(sizePx.width.rounded()),
                                  height: Int(sizePx.height.rounded()),
                                  bitsPerComponent: 8,
                                  bytesPerRow: 0,
                                  space: colorSpace,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            return CIImage.empty()
        }
        ctx.clear(CGRect(origin: .zero, size: sizePx))

        // Shape clip.
        let rect = CGRect(origin: .zero, size: sizePx)
        switch overlay.shape {
        case .roundedRect:
            let radius = min(rect.width, rect.height) * 0.18
            ctx.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
            ctx.clip()
        case .circle:
            ctx.addEllipse(in: rect)
            ctx.clip()
        }

        // Shadow (if enabled) — applied to the whole composited layer later via filter; here we
        // keep a simple drop shadow under the clip.
        if overlay.shadow {
            ctx.setShadow(offset: CGSize(width: 0, height: -3 * scale),
                          blur: 8 * scale,
                          color: CGColor(gray: 0, alpha: 0.35))
        }

        // Camera image (mirror horizontally if requested).
        ctx.saveGState()
        if mirror {
            ctx.translateBy(x: sizePx.width, y: 0)
            ctx.scaleBy(x: -1, y: 1)
        }
        ctx.draw(cameraCG, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))
        ctx.restoreGState()

        // Border.
        if overlay.borderWidth > 0 {
            ctx.setShadow(offset: .zero, blur: 0) // no shadow on the border stroke
            let borderColor = NSColor(hex: overlay.borderColorHex) ?? .white
            ctx.setStrokeColor(borderColor.cgColor)
            ctx.setLineWidth(overlay.borderWidth * scale)
            switch overlay.shape {
            case .roundedRect:
                let radius = min(rect.width, rect.height) * 0.18
                ctx.addPath(CGPath(roundedRect: rect.insetBy(dx: overlay.borderWidth * scale / 2,
                                                             dy: overlay.borderWidth * scale / 2),
                                   cornerWidth: radius, cornerHeight: radius, transform: nil))
            case .circle:
                ctx.addEllipse(in: rect.insetBy(dx: overlay.borderWidth * scale / 2,
                                                dy: overlay.borderWidth * scale / 2))
            }
            ctx.strokePath()
        }

        guard let overlayCG = ctx.makeImage() else { return CIImage.empty() }
        let overlayCI = CIImage(cgImage: overlayCG)
        return overlayCI.transformed(by: CGAffineTransform(translationX: originPx.x, y: originPx.y))
    }
}

extension NSColor {
    /// Simple hex color initializer, e.g. "#FFFFFF" or "FFFFFF".
    convenience init?(hex: String) {
        var str = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("#") { str.removeFirst() }
        guard str.count == 6, let value = UInt64(str, radix: 16) else { return nil }
        let r = CGFloat((value >> 16) & 0xFF) / 255
        let g = CGFloat((value >> 8) & 0xFF) / 255
        let b = CGFloat(value & 0xFF) / 255
        self.init(srgbRed: r, green: g, blue: b, alpha: 1)
    }
}
