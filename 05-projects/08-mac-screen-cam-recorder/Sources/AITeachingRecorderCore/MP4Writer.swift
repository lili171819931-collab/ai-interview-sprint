import Foundation
import AVFoundation
import CoreMedia
import CoreVideo

/// Writes H.264 (or HEVC) video + AAC audio to an MP4 using AVAssetWriter.
/// Video frames must be BGRA CMSampleBuffers (composited by CompositionRenderer).
/// Audio buffers are LPCM and get converted to AAC.
final class MP4Writer: @unchecked Sendable {
    private let writer: AVAssetWriter
    private let videoInput: AVAssetWriterInput
    private let systemAudioInput: AVAssetWriterInput?
    private let micAudioInput: AVAssetWriterInput?
    private let writeQueue = DispatchQueue(label: "aitr.writer", qos: .userInitiated)

    private(set) var videoTrackWritten = false
    private(set) var audioFramesWritten = 0
    private var sessionStarted = false
    private var firstVideoPTS: CMTime?
    private var lastVideoPTS: CMTime?
    private var firstSysPTS: CMTime?
    private var lastSysPTS: CMTime?
    private var firstMicPTS: CMTime?
    private var lastMicPTS: CMTime?

    init?(url: URL,
          width: Int,
          height: Int,
          fps: Int,
          codec: String,
          quality: Int,
          captureSystemAudio: Bool,
          microphoneEnabled: Bool,
          audioSampleRate: Int) {
        guard let writer = try? AVAssetWriter(outputURL: url, fileType: .mp4) else { return nil }
        self.writer = writer

        let videoCodec: AVVideoCodecType = codec == "hevc" ? .hevc : .h264
        let bitrate = Double(quality) / 100.0 * 12_000_000
        var compression: [String: Any] = [
            AVVideoAverageBitRateKey: Int(bitrate),
            AVVideoExpectedSourceFrameRateKey: fps
        ]
        if videoCodec == .h264 {
            compression[AVVideoProfileLevelKey] = AVVideoProfileLevelH264HighAutoLevel
        }
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: videoCodec,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: compression
        ]
        let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        videoInput.expectsMediaDataInRealTime = true
        self.videoInput = videoInput

        func makeAudioInput() -> AVAssetWriterInput {
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVSampleRateKey: audioSampleRate,
                AVNumberOfChannelsKey: 2,
                AVEncoderBitRateKey: 128_000
            ]
            let input = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
            input.expectsMediaDataInRealTime = true
            return input
        }

        self.systemAudioInput = captureSystemAudio ? makeAudioInput() : nil
        self.micAudioInput = microphoneEnabled ? makeAudioInput() : nil

        if writer.canAdd(videoInput) { writer.add(videoInput) }
        if let systemAudioInput, writer.canAdd(systemAudioInput) { writer.add(systemAudioInput) }
        if let micAudioInput, writer.canAdd(micAudioInput) { writer.add(micAudioInput) }

        if !writer.startWriting() {
            return nil
        }
        writer.startSession(atSourceTime: .zero)
        sessionStarted = true
    }

    // MARK: Append

    func appendVideo(_ buffer: CMSampleBuffer) {
        guard sessionStarted else { return }
        let pts = CMSampleBufferGetPresentationTimeStamp(buffer)
        let base = firstVideoPTS ?? pts
        if firstVideoPTS == nil { firstVideoPTS = pts }
        var offset = CMTimeSubtract(pts, base)
        if offset.seconds < 0 { offset = .zero }
        if let last = lastVideoPTS, CMTimeCompare(offset, last) <= 0 {
            offset = CMTimeAdd(last, CMTime(value: 1, timescale: CMTimeScale(30)))
        }
        lastVideoPTS = offset

        let adjusted = CMSampleBufferCreateCopyWithAdjustedTiming(buffer, timing: offset)
        guard let adjusted else { return }

        writeQueue.async { [weak self] in
            guard let self, self.videoInput.isReadyForMoreMediaData else { return }
            self.videoInput.append(adjusted)
            self.videoTrackWritten = true
        }
    }

    func appendSystemAudio(_ buffer: CMSampleBuffer) {
        guard let systemAudioInput, sessionStarted else { return }
        appendAudio(buffer, to: systemAudioInput, firstKey: &firstSysPTS, lastKey: &lastSysPTS)
    }

    func appendMicrophoneAudio(_ buffer: CMSampleBuffer) {
        guard let micAudioInput, sessionStarted else { return }
        appendAudio(buffer, to: micAudioInput, firstKey: &firstMicPTS, lastKey: &lastMicPTS)
    }

    private func appendAudio(_ buffer: CMSampleBuffer,
                             to input: AVAssetWriterInput,
                             firstKey: inout CMTime?,
                             lastKey: inout CMTime?) {
        let pts = CMSampleBufferGetPresentationTimeStamp(buffer)
        let base = firstKey ?? pts
        if firstKey == nil { firstKey = pts }
        var offset = CMTimeSubtract(pts, base)
        if offset.seconds < 0 { offset = .zero }
        if let last = lastKey, CMTimeCompare(offset, last) <= 0 {
            let step = CMTime(value: 1024, timescale: 48000)
            offset = CMTimeAdd(last, step)
        }
        lastKey = offset

        guard let adjusted = CMSampleBufferCreateCopyWithAdjustedTiming(buffer, timing: offset) else { return }

        writeQueue.async { [weak self] in
            guard let self, input.isReadyForMoreMediaData else { return }
            input.append(adjusted)
            self.audioFramesWritten += 1
        }
    }

    // MARK: Finish

    func finish(completion: @escaping (Result<URL, Error>) -> Void) {
        writeQueue.async {
            self.videoInput.markAsFinished()
            self.systemAudioInput?.markAsFinished()
            self.micAudioInput?.markAsFinished()

            self.writer.finishWriting {
                if self.writer.status == .completed {
                    completion(.success(self.writer.outputURL))
                } else {
                    let detail = self.writer.error?.localizedDescription ?? ""
                    completion(.failure(RecorderError.encodingError(detail)))
                }
            }
        }
    }

    func cancel() {
        writeQueue.async { [weak self] in
            guard let self, self.writer.status == .writing else { return }
            self.writer.cancelWriting()
        }
    }
}

// MARK: - CMSampleBuffer timing helpers

private func CMSampleBufferCreateCopyWithAdjustedTiming(_ buffer: CMSampleBuffer, timing pts: CMTime) -> CMSampleBuffer? {
    let duration = CMSampleBufferGetDuration(buffer)
    let timingInfo = CMSampleTimingInfo(duration: duration.isNumeric ? duration : CMTime(value: 1, timescale: 30),
                                        presentationTimeStamp: pts,
                                        decodeTimeStamp: .invalid)
    var out: CMSampleBuffer?
    CMSampleBufferCreateCopyWithNewTiming(allocator: kCFAllocatorDefault,
                                          sampleBuffer: buffer,
                                          sampleTimingEntryCount: 1,
                                          sampleTimingArray: [timingInfo],
                                          sampleBufferOut: &out)
    return out
}
