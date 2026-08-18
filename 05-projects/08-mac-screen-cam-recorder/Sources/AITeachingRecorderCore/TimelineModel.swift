import Foundation
import AVFoundation
import CoreMedia
import Combine

// MARK: - Minimal frame-level timeline (V0.2)
//
// A lightweight editing model over a recorded video:
//   - `segments` always tile the whole [0, duration] range in time order
//     (kept + removed), so the UI can draw a simple bar visualization.
//   - `silentRanges` are detected silent gaps (with a `removed` flag).
//   - `export` re-assembles kept ranges into a new MP4 via AVMutableComposition.

public struct TimelineSegment: Identifiable, Equatable, Codable {
    public var id: UUID
    public var start: Double      // seconds
    public var end: Double        // seconds
    public var removed: Bool

    public init(id: UUID = UUID(), start: Double, end: Double, removed: Bool = false) {
        self.id = id
        self.start = start
        self.end = end
        self.removed = removed
    }

    public var duration: Double { max(0, end - start) }
}

public enum TimelineExportState: Equatable {
    case idle
    case exporting
    case done(URL)
    case failed(String)
}

public final class TimelineModel: ObservableObject {
    @Published public private(set) var sourceURL: URL?
    @Published public private(set) var duration: Double = 0
    @Published public private(set) var segments: [TimelineSegment] = []
    @Published public private(set) var silentRanges: [TimelineSegment] = []
    @Published public private(set) var exportState: TimelineExportState = .idle

    public init() {}

    /// Test/CLI convenience: builds a timeline with the given duration.
    public convenience init(duration: Double) {
        self.init()
        self.duration = max(0, duration)
        self.segments = [TimelineSegment(start: 0, end: self.duration, removed: false)]
    }

    // MARK: - Load

    public func load(url: URL) async throws {
        let asset = AVURLAsset(url: url)
        var seconds = (try? await asset.load(.duration).seconds) ?? 0
        if !seconds.isFinite || seconds <= 0 {
            // Some containers (e.g. bare PCM wav) report 0 duration; fall back to track time ranges.
            let videoTrack = try await asset.loadTracks(withMediaType: .video).first
            let audioTrack = try await asset.loadTracks(withMediaType: .audio).first
            if let track = videoTrack ?? audioTrack {
                seconds = try await track.load(.timeRange).duration.seconds
            }
        }
        guard seconds.isFinite, seconds > 0 else {
            throw RecorderError.invalidConfiguration("Could not read the video duration")
        }
        sourceURL = url
        duration = seconds
        segments = [TimelineSegment(start: 0, end: seconds, removed: false)]
        silentRanges = []
        exportState = .idle
    }

    // MARK: - Editing operations

    /// Marks the given time range as removed (splits overlapping segments).
    public func removeRange(start: Double, end: Double) {
        let s = max(0, min(start, duration))
        let e = min(max(end, s), duration)
        guard e - s > 0.001 else { return }

        var newSegments: [TimelineSegment] = []
        for seg in segments {
            if seg.removed {
                newSegments.append(seg)
                continue
            }
            if e <= seg.start || s >= seg.end {
                newSegments.append(seg)
                continue
            }
            if s <= seg.start && e >= seg.end {
                var removed = seg
                removed.removed = true
                newSegments.append(removed)
                continue
            }
            if s > seg.start {
                newSegments.append(TimelineSegment(start: seg.start, end: s, removed: false))
            }
            if e < seg.end {
                newSegments.append(TimelineSegment(start: e, end: seg.end, removed: false))
            }
        }
        segments = newSegments.sorted { $0.start < $1.start }
    }

    /// Trims `seconds` from the head (0...seconds becomes removed).
    public func trimHead(seconds: Double) {
        guard seconds > 0 else { return }
        removeRange(start: 0, end: seconds)
    }

    /// Trims `seconds` from the tail.
    public func trimTail(seconds: Double) {
        guard seconds > 0 else { return }
        removeRange(start: max(0, duration - seconds), end: duration)
    }

    public func restoreAll() {
        segments = [TimelineSegment(start: 0, end: duration, removed: false)]
        silentRanges = []
        exportState = .idle
    }

    /// Resets the timeline back to the empty state.
    public func close() {
        sourceURL = nil
        duration = 0
        segments = []
        silentRanges = []
        exportState = .idle
    }

    /// Kept (non-removed) ranges in time order — what export will write.
    public var keptRanges: [TimelineSegment] {
        segments.filter { !$0.removed }.sorted { $0.start < $1.start }
    }

    // MARK: - Silence detection

    /// Detects silent gaps; `autoRemove` marks them removed in the timeline.
    public func detectSilence(threshold: Float = 0.02,
                              minGap: Double = 1.0,
                              autoRemove: Bool = true) async throws {
        guard let url = sourceURL else { return }
        let ranges = try await SilenceDetector.detectSilentRanges(url: url,
                                                                  threshold: threshold,
                                                                  minGap: minGap)
        silentRanges = ranges
        if autoRemove {
            for r in ranges {
                removeRange(start: r.start, end: r.end)
            }
        }
    }

    /// Toggles removal of a detected silent range (re-splits the timeline).
    public func toggleSilentRange(_ range: TimelineSegment) {
        guard let idx = silentRanges.firstIndex(where: { $0.id == range.id }) else { return }
        silentRanges[idx].removed.toggle()
        if silentRanges[idx].removed {
            removeRange(start: range.start, end: range.end)
        } else {
            restoreRange(start: range.start, end: range.end)
        }
    }

    /// Restores (un-removes) a time range.
    public func restoreRange(start: Double, end: Double) {
        var newSegments: [TimelineSegment] = []
        for seg in segments {
            if !seg.removed {
                newSegments.append(seg)
                continue
            }
            let s = max(seg.start, start)
            let e = min(seg.end, end)
            if e > s {
                if seg.start < s {
                    newSegments.append(TimelineSegment(start: seg.start, end: s, removed: true))
                }
                newSegments.append(TimelineSegment(start: s, end: e, removed: false))
                if e < seg.end {
                    newSegments.append(TimelineSegment(start: e, end: seg.end, removed: true))
                }
            } else {
                newSegments.append(seg)
            }
        }
        segments = newSegments.sorted { $0.start < $1.start }
    }

    // MARK: - Export

    public func export(to outputURL: URL) async throws -> URL {
        let ranges = keptRanges
        guard !ranges.isEmpty, let sourceURL else {
            throw RecorderError.invalidConfiguration("Nothing to export (timeline is empty)")
        }
        exportState = .exporting

        let asset = AVURLAsset(url: sourceURL)
        let videoTracks = try await asset.loadTracks(withMediaType: .video)
        let audioTracks = try await asset.loadTracks(withMediaType: .audio)
        guard let videoTrack = videoTracks.first else {
            throw RecorderError.encodingError("No video track found")
        }

        let composition = AVMutableComposition()
        guard let compVideo = composition.addMutableTrack(withMediaType: .video,
                                                          preferredTrackID: kCMPersistentTrackID_Invalid),
              let compAudio = composition.addMutableTrack(withMediaType: .audio,
                                                          preferredTrackID: kCMPersistentTrackID_Invalid) else {
            throw RecorderError.encodingError("Could not create composition tracks")
        }

        var cursor = CMTime.zero
        for r in ranges {
            let range = CMTimeRange(start: CMTime(seconds: r.start, preferredTimescale: 600),
                                    duration: CMTime(seconds: r.duration, preferredTimescale: 600))
            try compVideo.insertTimeRange(range, of: videoTrack, at: cursor)
            for audioTrack in audioTracks {
                try compAudio.insertTimeRange(range, of: audioTrack, at: cursor)
            }
            cursor = CMTimeAdd(cursor, range.duration)
        }

        guard let session = AVAssetExportSession(asset: composition,
                                                 presetName: AVAssetExportPresetHighestQuality) else {
            throw RecorderError.encodingError("Could not create export session")
        }
        session.outputURL = outputURL
        session.outputFileType = .mp4
        session.shouldOptimizeForNetworkUse = true

        do {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                session.exportAsynchronously {
                    switch session.status {
                    case .completed:
                        continuation.resume()
                    case .cancelled:
                        continuation.resume(throwing: RecorderError.unknown("Export was cancelled"))
                    default:
                        let detail = session.error?.localizedDescription ?? "unknown error"
                        continuation.resume(throwing: RecorderError.encodingError(detail))
                    }
                }
            }
        } catch {
            exportState = .failed(error.localizedDescription)
            throw error
        }
        exportState = .done(outputURL)
        return outputURL
    }
}

// MARK: - Silence detection

public enum SilenceDetector {
    /// Detects silent ranges in the first audio track of the video.
    /// - Parameters:
    ///   - threshold: normalized RMS threshold (0...1) below which audio counts as silence.
    ///   - minGap: minimum silent duration (seconds) to report.
    ///   - window: analysis window length in seconds.
    public static func detectSilentRanges(url: URL,
                                          threshold: Float = 0.02,
                                          minGap: Double = 1.0,
                                          window: Double = 0.1) async throws -> [TimelineSegment] {
        let asset = AVURLAsset(url: url)
        let tracks = try await asset.loadTracks(withMediaType: .audio)
        guard let track = tracks.first else { return [] }

        let reader = try AVAssetReader(asset: asset)
        let sampleRate: Double = 16000
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatLinearPCM,
            AVSampleRateKey: sampleRate,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 32,
            AVLinearPCMIsFloatKey: true,
            AVLinearPCMIsBigEndianKey: false,
            AVLinearPCMIsNonInterleaved: false
        ]
        let output = AVAssetReaderAudioMixOutput(audioTracks: [track], audioSettings: settings)
        guard reader.canAdd(output) else { return [] }
        reader.add(output)
        guard reader.startReading() else { return [] }

        var samples: [Float] = []
        samples.reserveCapacity(Int(sampleRate * 30))
        while let buffer = output.copyNextSampleBuffer() {
            guard let blockBuffer = CMSampleBufferGetDataBuffer(buffer) else { continue }
            var length = 0
            var dataPointer: UnsafeMutablePointer<Int8>?
            guard CMBlockBufferGetDataPointer(blockBuffer,
                                              atOffset: 0,
                                              lengthAtOffsetOut: &length,
                                              totalLengthOut: nil,
                                              dataPointerOut: &dataPointer) == kCMBlockBufferNoErr,
                  let ptr = dataPointer else { continue }
            let sampleCount = length / 4
            ptr.withMemoryRebound(to: Float.self, capacity: sampleCount) { floatPtr in
                samples.append(contentsOf: UnsafeBufferPointer(start: floatPtr, count: sampleCount))
            }
        }
        reader.cancelReading()

        return detectSilentRanges(samples: samples,
                                  sampleRate: sampleRate,
                                  threshold: threshold,
                                  minGap: minGap,
                                  window: window)
    }

    /// Pure window classifier — unit-testable without any media file.
    public static func detectSilentRanges(samples: [Float],
                                          sampleRate: Double,
                                          threshold: Float = 0.02,
                                          minGap: Double = 1.0,
                                          window: Double = 0.1) -> [TimelineSegment] {
        let samplesPerWindow = Int(sampleRate * window)
        guard samplesPerWindow > 0 else { return [] }

        var sumSquares: Double = 0
        var count = 0
        var silentWindows: [TimelineSegment] = []
        var cursor: Double = 0

        for v in samples {
            sumSquares += Double(v) * Double(v)
            count += 1
            if count >= samplesPerWindow {
                let rms = Float(sqrt(sumSquares / Double(count)))
                if rms < threshold {
                    if let last = silentWindows.last, abs(last.end - cursor) < 0.01 {
                        silentWindows[silentWindows.count - 1].end = cursor + window
                    } else {
                        silentWindows.append(TimelineSegment(start: cursor, end: cursor + window, removed: false))
                    }
                }
                cursor += window
                sumSquares = 0
                count = 0
            }
        }
        return silentWindows
            .filter { $0.duration >= minGap }
            .sorted { $0.start < $1.start }
    }
}
