import Foundation
import AppKit
import AVFoundation

/// Manages the on-disk recordings library under ~/Movies/AI Teaching Recorder/YYYY/MM/.
public final class FileOutputManager {
    public static let shared = FileOutputManager()

    public init() {}

    /// Creates the dated folder and returns the target file URL:
    /// ~/Movies/AI Teaching Recorder/2026/08/Recording_20260818_201530.mp4
    public func makeOutputURL(baseDirectory: URL = SettingsStore.shared.outputDirectory,
                              date: Date = Date()) throws -> URL {
        let cal = Calendar.current
        let year = cal.component(.year, from: date)
        let month = cal.component(.month, from: date)
        let day = cal.component(.day, from: date)
        let hour = cal.component(.hour, from: date)
        let minute = cal.component(.minute, from: date)
        let second = cal.component(.second, from: date)

        let dir = baseDirectory
            .appendingPathComponent(String(format: "%04d", year), isDirectory: true)
            .appendingPathComponent(String(format: "%02d", month), isDirectory: true)

        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)

        let name = String(format: "Recording_%04d%02d%02d_%02d%02d%02d.mp4", year, month, day, hour, minute, second)
        return dir.appendingPathComponent(name)
    }

    /// Lists recordings from the library folder, newest first.
    public func listRecordings(baseDirectory: URL = SettingsStore.shared.outputDirectory) -> [URL] {
        let fm = FileManager.default
        guard let en = fm.enumerator(at: baseDirectory,
                                     includingPropertiesForKeys: [.isRegularFileKey, .contentModificationDateKey],
                                     options: [.skipsHiddenFiles]) else { return [] }
        var result: [URL] = []
        for case let url as URL in en {
            guard url.pathExtension.lowercased() == "mp4" else { continue }
            let values = try? url.resourceValues(forKeys: [.isRegularFileKey])
            if values?.isRegularFile == true { result.append(url) }
        }
        result.sort {
            ((try? $0.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast)
                > ((try? $1.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast)
        }
        return result
    }

    /// Builds a summary for a recording file using AVFoundation metadata.
    public func summary(for url: URL) -> RecordingSummary? {
        let asset = AVURLAsset(url: url)
        let duration = CMTimeGetSeconds(asset.duration)
        var width = 0, height = 0, fps = 0
        var hasCamera = false, hasMic = false, hasSystemAudio = false

        let semaphore = DispatchSemaphore(value: 0)
        Task {
            do {
                let tracks = try await asset.loadTracks(withMediaType: .video)
                if let video = tracks.first {
                    let size = try await video.load(.naturalSize)
                    width = Int(size.width)
                    height = Int(size.height)
                    let nominal = try await video.load(.nominalFrameRate)
                    fps = Int(nominal.rounded())
                }
                let audioTracks = try await asset.loadTracks(withMediaType: .audio)
                hasSystemAudio = audioTracks.count >= 1
                hasMic = audioTracks.count >= 2
                hasCamera = !tracks.isEmpty
            } catch {
                // fall back to empty metadata
            }
            semaphore.signal()
        }
        semaphore.wait()

        let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
        let created = (try? url.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? Date()

        return RecordingSummary(
            url: url,
            duration: duration.isFinite ? duration : 0,
            width: width,
            height: height,
            fps: fps,
            hasCamera: hasCamera,
            hasMicrophone: hasMic,
            hasSystemAudio: hasSystemAudio,
            createdAt: created,
            fileSize: Int64(size)
        )
    }

    public func delete(_ url: URL) throws {
        try FileManager.default.removeItem(at: url)
    }

    public func revealInFinder(_ url: URL) {
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }

    public func open(_ url: URL) {
        NSWorkspace.shared.open(url)
    }

    public func availableDiskSpace(at url: URL) -> Int64 {
        var checkURL = url
        var isDir: ObjCBool = false
        if !FileManager.default.fileExists(atPath: checkURL.path, isDirectory: &isDir) {
            checkURL = URL(fileURLWithPath: "/", isDirectory: true)
        }
        let values = try? checkURL.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        if let v = values?.volumeAvailableCapacityForImportantUsage, v > 0 {
            return v
        }
        let values2 = try? checkURL.resourceValues(forKeys: [.volumeAvailableCapacityKey])
        if let v = values2?.volumeAvailableCapacity, v > 0 {
            return Int64(v)
        }
        var stats = statfs()
        if statfs(checkURL.path, &stats) == 0 {
            return Int64(stats.f_bavail) * Int64(stats.f_bsize)
        }
        return 0
    }
}
