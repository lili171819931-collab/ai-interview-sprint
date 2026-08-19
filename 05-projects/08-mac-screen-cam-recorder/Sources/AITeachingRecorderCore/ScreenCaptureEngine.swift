import Foundation
import ScreenCaptureKit
import CoreMedia
import CoreGraphics

/// Wraps ScreenCaptureKit: captures the selected screen/window/region plus system audio.
/// Delivers uncompressed BGRA video CMSampleBuffers and LPCM audio CMSampleBuffers.
final class ScreenCaptureEngine: NSObject, @unchecked Sendable {
    private var stream: SCStream?
    private var contentFilter: SCContentFilter?
    private var streamConfig: SCStreamConfiguration?

    let queue = DispatchQueue(label: "aitr.screencapture", qos: .userInitiated)

    var onVideoSample: ((CMSampleBuffer) -> Void)?
    var onAudioSample: ((CMSampleBuffer) -> Void)?
    var onStoppedWithError: ((Error) -> Void)?

    /// Information about the captured source, needed by the compositor to map overlay positions.
    struct SourceInfo {
        var displayFrame: CGRect        // points, global (Quartz, top-left origin)
        var contentRectPoints: CGRect   // rect of captured content in global points
        var videoSizePixels: CGSize     // captured buffer size
        var isWindowMode: Bool
        var scale: CGFloat              // pixels per point
    }

    func start(configuration: RecordingConfiguration,
               excludedWindowIDs: [CGWindowID],
               showsCursor: Bool,
               showMouseClicks: Bool,
               audioSampleRate: Int) async throws -> SourceInfo {
        let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
        let filter: SCContentFilter
        var displayFrame: CGRect
        var videoSize: CGSize
        var contentRectPoints: CGRect = .zero
        var isWindowMode = false
        var scale: CGFloat = 1

        switch configuration.mode {
        case .entireScreen, .display:
            guard let display = content.displays.first(where: {
                configuration.mode == .entireScreen || $0.displayID == configuration.displayID
            }) ?? (configuration.mode == .entireScreen ? content.displays.first : nil) else {
                throw RecorderError.deviceUnavailable("No display available")
            }
            let excluded = content.windows.filter { excludedWindowIDs.contains($0.windowID) }
            filter = SCContentFilter(display: display, excludingWindows: excluded)
            displayFrame = display.frame
            scale = CGFloat(display.width) / max(display.frame.width, 1)
            videoSize = CGSize(width: display.width, height: display.height)
            contentRectPoints = display.frame
            isWindowMode = false
        case .window:
            guard let windowID = configuration.windowID,
                  let window = content.windows.first(where: { $0.windowID == windowID }) else {
                throw RecorderError.deviceUnavailable("The selected window is not available")
            }
            filter = SCContentFilter(desktopIndependentWindow: window)
            displayFrame = window.frame
            // Window capture outputs in points; request 2x for crispness, capped at reasonable size.
            scale = 2
            videoSize = CGSize(width: min(Int(window.frame.width) * 2, 3840),
                               height: min(Int(window.frame.height) * 2, 2160))
            contentRectPoints = window.frame
            isWindowMode = true
        case .region:
            guard let displayID = configuration.displayID,
                  let display = content.displays.first(where: { $0.displayID == displayID }),
                  let region = configuration.region else {
                throw RecorderError.invalidConfiguration("Region recording requires a selected display and region")
            }
            filter = SCContentFilter(display: display, excludingWindows: [])
            displayFrame = display.frame
            scale = CGFloat(display.width) / max(display.frame.width, 1)
            videoSize = CGSize(width: display.width, height: display.height)
            contentRectPoints = region
            isWindowMode = false
        }

        let config = SCStreamConfiguration()
        config.width = Int(videoSize.width.rounded())
        config.height = Int(videoSize.height.rounded())
        config.minimumFrameInterval = CMTime(value: 1, timescale: CMTimeScale(configuration.fps))
        config.pixelFormat = kCVPixelFormatType_32BGRA
        config.queueDepth = 6
        config.showsCursor = showsCursor
        if #available(macOS 15.0, *) {
            config.showMouseClicks = showMouseClicks
        }
        config.scalesToFit = true
        config.capturesAudio = configuration.captureSystemAudio
        config.sampleRate = audioSampleRate
        config.channelCount = 2
        config.excludesCurrentProcessAudio = true

        let newStream = SCStream(filter: filter, configuration: config, delegate: self)
        try await newStream.addStreamOutput(self, type: .screen, sampleHandlerQueue: queue)
        if configuration.captureSystemAudio {
            try await newStream.addStreamOutput(self, type: .audio, sampleHandlerQueue: queue)
        }

        stream = newStream
        contentFilter = filter
        streamConfig = config

        try await startCapture(stream: newStream)

        return SourceInfo(displayFrame: displayFrame,
                          contentRectPoints: contentRectPoints,
                          videoSizePixels: videoSize,
                          isWindowMode: isWindowMode,
                          scale: scale)
    }

    private func startCapture(stream: SCStream) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            stream.startCapture { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    func stop() async {
        guard let stream else { return }
        self.stream = nil
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            stream.stopCapture { _ in
                continuation.resume()
            }
        }
    }
}

extension ScreenCaptureEngine: SCStreamOutput {
    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        switch type {
        case .screen:
            onVideoSample?(sampleBuffer)
        case .audio:
            onAudioSample?(sampleBuffer)
        @unknown default:
            break
        }
    }
}

extension ScreenCaptureEngine: SCStreamDelegate {
    func stream(_ stream: SCStream, didStopWithError error: Error) {
        onStoppedWithError?(error)
    }
}
