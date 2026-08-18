import Foundation
import AppKit
import CoreImage
import CoreVideo
import CoreMedia
import CoreGraphics

/// Composites the camera overlay and teaching annotations onto each screen frame using
/// CoreImage + CoreGraphics, so both are baked into the final video (not just the UI preview).
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

    /// Renders `screenBuffer` (with optional region crop, camera overlay + annotations)
    /// into a new BGRA pixel buffer and returns a ready-to-write CMSampleBuffer.
    func composite(screenBuffer: CMSampleBuffer,
                   cameraBuffer: CMSampleBuffer?,
                   overlay: CameraOverlaySettings?,
                   sourceInfo: ScreenCaptureEngine.SourceInfo,
                   mirrorCamera: Bool,
                   drawingImage: CIImage?) -> CMSampleBuffer? {
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

        // Teaching annotations on top of everything.
        if let drawingImage {
            base = drawingImage.composited(over: base)
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

    // MARK: - Camera overlay

    /// Builds the camera overlay as a CIImage: filtered/mirrored camera inside the chosen shape,
    /// with an optional border, positioned at the overlay's screen location.
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
        let originPx = CGPoint(x: px, y: outputHeight - py - sizePx.height)

        // 1) Camera image with filter + beauty applied.
        let enhanced = applyEnhancements(to: cameraImage, overlay: overlay)

        guard let cameraCG = ciContext.createCGImage(enhanced, from: enhanced.extent) else {
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

        let rect = CGRect(origin: .zero, size: sizePx)
        ctx.addPath(shapePath(in: rect, shape: overlay.shape, scale: scale))
        ctx.clip()

        if overlay.shadow {
            ctx.setShadow(offset: CGSize(width: 0, height: -3 * scale),
                          blur: 8 * scale,
                          color: CGColor(gray: 0, alpha: 0.35))
        }

        ctx.saveGState()
        if mirror {
            ctx.translateBy(x: sizePx.width, y: 0)
            ctx.scaleBy(x: -1, y: 1)
        }
        ctx.draw(cameraCG, in: CGRect(x: drawX, y: drawY, width: drawW, height: drawH))
        ctx.restoreGState()

        if overlay.borderWidth > 0 {
            ctx.setShadow(offset: .zero, blur: 0)
            let borderColor = NSColor(hex: overlay.borderColorHex) ?? .white
            ctx.setStrokeColor(borderColor.cgColor)
            ctx.setLineWidth(overlay.borderWidth * scale)
            let inset = overlay.borderWidth * scale / 2
            ctx.addPath(shapePath(in: rect.insetBy(dx: inset, dy: inset), shape: overlay.shape, scale: scale))
            ctx.strokePath()
        }

        guard let overlayCG = ctx.makeImage() else { return CIImage.empty() }
        let overlayCI = CIImage(cgImage: overlayCG)
        return overlayCI.transformed(by: CGAffineTransform(translationX: originPx.x, y: originPx.y))
    }

    // MARK: - Filter + beauty

    private func applyEnhancements(to image: CIImage, overlay: CameraOverlaySettings) -> CIImage {
        var out = image
        let beauty = overlay.beauty

        // Skin smoothing: semi-transparent blurred copy over the original.
        if beauty.enabled && beauty.smooth > 0.01 {
            let radius = max(0.6, 2.5 * beauty.smooth)
            let blurred = out.applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: radius])
            let faded = blurred.applyingFilter("CIColorMatrix", parameters: [
                "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.55 * beauty.smooth)
            ])
            out = faded.composited(over: out)
        }

        if beauty.enabled {
            // Whitening: brightness up, slight desaturation (keeps skin tones soft).
            if beauty.whitening > 0.01 {
                out = out.applyingFilter("CIColorControls", parameters: [
                    kCIInputBrightnessKey: 0.06 * beauty.whitening,
                    kCIInputSaturationKey: 1.0 - 0.06 * beauty.whitening
                ])
            }
            // Blush: gentle red/pink warm boost via color matrix.
            if beauty.blush > 0.01 {
                let b = beauty.blush
                out = out.applyingFilter("CIColorMatrix", parameters: [
                    "inputRVector": CIVector(x: 1 + 0.18 * b, y: 0, z: 0, w: 0),
                    "inputGVector": CIVector(x: 0, y: 1, z: 0, w: 0),
                    "inputBVector": CIVector(x: 0, y: 0, z: 1 - 0.08 * b, w: 0),
                    "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1)
                ])
            }
            // Clarity: micro-contrast + sharpness.
            if beauty.clarity > 0.01 {
                let c = beauty.clarity
                out = out.applyingFilter("CIColorControls", parameters: [
                    kCIInputContrastKey: 1 + 0.08 * c,
                    kCIInputSaturationKey: 1 + 0.05 * c
                ])
                out = out.applyingFilter("CISharpenLuminance", parameters: [
                    kCIInputSharpnessKey: 0.5 * c
                ])
            }
        }

        // Color filter preset (applied last so it tints the final look).
        switch overlay.filterPreset {
        case .none:
            break
        case .warm:
            out = out.applyingFilter("CIColorControls", parameters: [
                kCIInputSaturationKey: 1.28, kCIInputContrastKey: 1.04, kCIInputBrightnessKey: 0.02
            ])
            out = out.applyingFilter("CITemperatureAndTint", parameters: [
                "inputTargetNeutral": CIVector(x: 4500, y: 0)
            ])
        case .cool:
            out = out.applyingFilter("CIColorControls", parameters: [
                kCIInputSaturationKey: 0.92, kCIInputContrastKey: 1.03, kCIInputBrightnessKey: 0.02
            ])
            out = out.applyingFilter("CITemperatureAndTint", parameters: [
                "inputTargetNeutral": CIVector(x: 16000, y: 0)
            ])
        case .bw:
            out = out.applyingFilter("CIColorControls", parameters: [
                kCIInputSaturationKey: 0, kCIInputContrastKey: 1.12
            ])
        case .retro:
            out = out.applyingFilter("CIColorControls", parameters: [
                kCIInputSaturationKey: 0.82, kCIInputContrastKey: 1.06, kCIInputBrightnessKey: -0.02
            ])
            out = out.applyingFilter("CISepiaTone", parameters: [kCIInputIntensityKey: 0.35])
        }
        return out
    }

    // MARK: - Shape paths

    private func shapePath(in rect: CGRect, shape: OverlayShape, scale: CGFloat) -> CGPath {
        switch shape {
        case .roundedRect:
            let radius = min(rect.width, rect.height) * 0.18
            return CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
        case .square:
            let radius = min(rect.width, rect.height) * 0.04
            return CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
        case .circle:
            // Inscribed circle (uses the smaller dimension) so a non-square box still looks like a circle.
            let r = min(rect.width, rect.height) / 2
            let circleRect = CGRect(x: rect.midX - r, y: rect.midY - r, width: r * 2, height: r * 2)
            return CGPath(ellipseIn: circleRect, transform: nil)
        case .ellipse:
            return CGPath(ellipseIn: rect, transform: nil)
        case .diamond:
            let path = CGMutablePath()
            path.move(to: CGPoint(x: rect.midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.midY))
            path.closeSubpath()
            return path
        }
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
