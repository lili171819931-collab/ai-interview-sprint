import Foundation

public struct SelfTestCheck: Identifiable, Equatable {
    public enum Status: Equatable { case passed, failed, skipped, pending }
    public let id: String
    public let name: String
    public let status: Status
    public let detail: String

    public init(id: String, name: String, status: Status, detail: String = "") {
        self.id = id
        self.name = name
        self.status = status
        self.detail = detail
    }
}

public struct SelfTestReport: Equatable {
    public let passed: Bool
    public let checks: [SelfTestCheck]
    public let outputURL: URL?
    public let duration: TimeInterval
    public let outputSize: String
    public let fps: Int

    public init(passed: Bool,
                checks: [SelfTestCheck],
                outputURL: URL? = nil,
                duration: TimeInterval = 0,
                outputSize: String = "",
                fps: Int = 0) {
        self.passed = passed
        self.checks = checks
        self.outputURL = outputURL
        self.duration = duration
        self.outputSize = outputSize
        self.fps = fps
    }
}

/// End-to-end self test: records a short clip (screen + camera + mic as available) and verifies
/// that the resulting MP4 is valid. Requires permissions to have been granted already.
public enum SelfTestRunner {
    public static func run(targetDuration: TimeInterval = 5) async -> SelfTestReport {
        var checks: [SelfTestCheck] = []
        let perms = PermissionsManager.shared

        // 1. Permissions
        if perms.screenRecordingStatus != .granted {
            checks.append(SelfTestCheck(id: "screen", name: "Screen Recording permission",
                                        status: .failed,
                                        detail: "Grant Screen Recording in System Settings, then run self test again."))
            return SelfTestReport(passed: false, checks: checks)
        }
        checks.append(SelfTestCheck(id: "screen", name: "Screen Recording permission", status: .passed))

        let cameraGranted = perms.cameraStatus() == .granted
        let micGranted = perms.microphoneStatus() == .granted
        checks.append(SelfTestCheck(id: "camera-perm", name: "Camera permission",
                                    status: cameraGranted ? .passed : .skipped,
                                    detail: cameraGranted ? "" : "Not granted — camera overlay will be skipped"))
        checks.append(SelfTestCheck(id: "mic-perm", name: "Microphone permission",
                                    status: micGranted ? .passed : .skipped,
                                    detail: micGranted ? "" : "Not granted — mic audio will be skipped"))

        // 2. Devices
        let cameras = CameraEngine.listDevices()
        let mics = MicEngine.listDevices()
        checks.append(SelfTestCheck(id: "camera-dev", name: "Camera device",
                                    status: cameras.isEmpty ? .failed : .passed,
                                    detail: cameras.isEmpty ? "No camera found" : cameras.first?.name ?? ""))
        checks.append(SelfTestCheck(id: "mic-dev", name: "Microphone device",
                                    status: mics.isEmpty ? .failed : .passed,
                                    detail: mics.isEmpty ? "No microphone found" : mics.first?.name ?? ""))

        // 3. Record
        let controller = RecorderController()
        controller.cameraEnabled = cameraGranted && !cameras.isEmpty
        controller.micEnabled = micGranted && !mics.isEmpty
        controller.systemAudioEnabled = true

        let settings = SettingsStore.shared
        let config = RecordingConfiguration(
            mode: .entireScreen,
            displayID: nil,
            windowID: nil,
            region: nil,
            width: 0,
            height: 0,
            fps: settings.fps,
            captureSystemAudio: true,
            microphoneEnabled: controller.micEnabled,
            cameraEnabled: controller.cameraEnabled,
            cameraDeviceID: settings.cameraDeviceID,
            cameraOverlay: CameraOverlaySettings(enabled: controller.cameraEnabled,
                                                 position: CGPoint(x: 60, y: 60)),
            outputURL: nil
        )

        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent("AITRSelfTest", isDirectory: true)
        try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        let stamp = Int(Date().timeIntervalSince1970)
        let outURL = tempDir.appendingPathComponent("selftest_\(stamp).mp4")

        do {
            try await controller.start(configuration: config, excludedWindowIDs: [], outputURL: outURL)
        } catch {
            checks.append(SelfTestCheck(id: "record", name: "Start recording", status: .failed,
                                        detail: error.localizedDescription))
            return SelfTestReport(passed: false, checks: checks)
        }
        checks.append(SelfTestCheck(id: "record", name: "Start recording", status: .passed))

        // Wait targetDuration, then stop.
        try? await Task.sleep(nanoseconds: UInt64(targetDuration * 1_000_000_000))
        controller.stop()

        // Wait for completion (timeout 20s).
        let deadline = Date().addingTimeInterval(20)
        while controller.phase != .completed && Date() < deadline {
            try? await Task.sleep(nanoseconds: 100_000_000)
        }

        guard controller.phase == .completed, let fileURL = controller.currentFileURL else {
            checks.append(SelfTestCheck(id: "complete", name: "Finish recording", status: .failed,
                                        detail: "Recording did not complete: \(controller.phase)"))
            return SelfTestReport(passed: false, checks: checks)
        }
        checks.append(SelfTestCheck(id: "complete", name: "Finish recording", status: .passed,
                                    detail: fileURL.lastPathComponent))

        // 4. Verify file
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            checks.append(SelfTestCheck(id: "file", name: "MP4 file exists", status: .failed))
            return SelfTestReport(passed: false, checks: checks, outputURL: fileURL)
        }
        checks.append(SelfTestCheck(id: "file", name: "MP4 file exists", status: .passed))

        let summary = FileOutputManager.shared.summary(for: fileURL)
        let duration = summary?.duration ?? 0
        let size = summary.map { "\($0.width)×\($0.height)" } ?? ""
        let fps = summary?.fps ?? 0

        let minDuration = max(0.5, targetDuration - 2)
        let durationOK = duration >= minDuration
        checks.append(SelfTestCheck(id: "duration", name: "Duration ≥ \(Int(minDuration))s",
                                    status: durationOK ? .passed : .failed,
                                    detail: String(format: "%.1fs", duration)))

        let videoOK = (summary?.width ?? 0) > 0 && (summary?.height ?? 0) > 0
        checks.append(SelfTestCheck(id: "video", name: "Video track", status: videoOK ? .passed : .failed,
                                    detail: size))

        if controller.micEnabled || controller.systemAudioEnabled {
            let audioOK = (summary?.hasSystemAudio ?? false) || (summary?.hasMicrophone ?? false)
            checks.append(SelfTestCheck(id: "audio", name: "Audio track",
                                        status: audioOK ? .passed : .failed,
                                        detail: "system:\(summary?.hasSystemAudio ?? false) mic:\(summary?.hasMicrophone ?? false)"))
        } else {
            checks.append(SelfTestCheck(id: "audio", name: "Audio track", status: .skipped))
        }

        let allPassed = checks.allSatisfy { $0.status == .passed || $0.status == .skipped }
        return SelfTestReport(passed: allPassed,
                              checks: checks,
                              outputURL: fileURL,
                              duration: duration,
                              outputSize: size,
                              fps: fps)
    }
}
