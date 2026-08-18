import Foundation
import AITeachingRecorderCore

// AITRCLI — headless helper for self-testing and debugging.
//
//   aitr-cli selftest [seconds]   run end-to-end recording self test (default 5s)
//   aitr-cli devices              list cameras / microphones / displays
//   aitr-cli perms                print permission status
//   aitr-cli record --out URL --seconds N   headless short recording
//
// Requires Screen Recording (and Camera/Microphone if enabled) permission.
// When run from a terminal, the terminal app needs the permission.

let args = Array(CommandLine.arguments.dropFirst())

func printPerms() {
    let p = PermissionsManager.shared
    func s(_ x: PermissionStatus) -> String {
        switch x {
        case .notDetermined: return "notDetermined"
        case .granted: return "granted"
        case .denied: return "denied"
        case .restricted: return "restricted"
        }
    }
    print("Screen Recording : \(s(p.screenRecordingStatus))")
    print("Camera           : \(s(p.cameraStatus()))")
    print("Microphone       : \(s(p.microphoneStatus()))")
}

func printDevices() {
    print("== Cameras ==")
    for d in DeviceLibrary.listCameras() {
        print("  \(d.id)  \(d.name)\(d.isBuiltIn ? " (built-in)" : "")")
    }
    print("== Microphones ==")
    for d in DeviceLibrary.listMicrophones() {
        print("  \(d.id)  \(d.name)\(d.isBuiltIn ? " (built-in)" : "")")
    }
    print("== Displays ==")
    let sem = DispatchSemaphore(value: 0)
    Task {
        let displays = await DeviceDiscovery.listDisplays()
        for d in displays {
            print("  \(d.id)  \(d.name)  \(Int(d.frame.width))x\(Int(d.frame.height))pt  \(d.widthPixels)x\(d.heightPixels)px")
        }
        sem.signal()
    }
    _ = sem.wait(timeout: .now() + 10)
}

func runSelfTest(seconds: Double) async {
    print("Running self test (\(Int(seconds))s)...")
    let report = await SelfTestRunner.run(targetDuration: seconds)
    print("")
    for check in report.checks {
        let mark: String
        switch check.status {
        case .passed: mark = "✅ PASS"
        case .failed: mark = "❌ FAIL"
        case .skipped: mark = "⏭ SKIP"
        case .pending: mark = "…"
        }
        print("\(mark)  \(check.name)\(check.detail.isEmpty ? "" : " — \(check.detail)")")
    }
    print("")
    if let url = report.outputURL {
        print("Output: \(url.path)")
    }
    print("Result: \(report.passed ? "PASSED" : "FAILED")")
    exit(report.passed ? 0 : 1)
}

func recordHeadless(outPath: String, seconds: Double) async {
    print("Recording \(Int(seconds))s -> \(outPath)")
    let controller = RecorderController()
    let settings = SettingsStore.shared
    let url = URL(fileURLWithPath: outPath)
    let config = RecordingConfiguration(
        mode: .entireScreen,
        displayID: nil,
        windowID: nil,
        region: nil,
        width: 0, height: 0,
        fps: settings.fps,
        captureSystemAudio: true,
        microphoneEnabled: true,
        cameraEnabled: true,
        cameraDeviceID: settings.cameraDeviceID,
        cameraOverlay: CameraOverlaySettings(enabled: true, position: CGPoint(x: 60, y: 60)),
        outputURL: url
    )
    do {
        try await controller.start(configuration: config, excludedWindowIDs: [])
    } catch {
        print("Failed to start: \(error.localizedDescription)")
        exit(1)
    }
    try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    controller.stop()
    let deadline = Date().addingTimeInterval(20)
    while controller.phase != .completed && Date() < deadline {
        try? await Task.sleep(nanoseconds: 100_000_000)
    }
    if controller.phase == .completed, let url = controller.currentFileURL {
        let summary = FileOutputManager.shared.summary(for: url)
        print("✅ Recording complete: \(url.path)")
        print("   Duration: \(String(format: "%.1f", summary?.duration ?? 0))s  Size: \(summary?.width ?? 0)x\(summary?.height ?? 0)  FPS: \(summary?.fps ?? 0)")
        exit(0)
    } else {
        print("❌ Recording failed: phase=\(controller.phase)")
        exit(1)
    }
}

if args.first == "selftest" {
    let seconds = args.count > 1 ? (Double(args[1]) ?? 5) : 5
    Task { await runSelfTest(seconds: seconds) }
    RunLoop.main.run()
} else if args.first == "devices" {
    printDevices()
    exit(0)
} else if args.first == "perms" {
    printPerms()
    exit(0)
} else if args.first == "record" {
    var out = "/tmp/aitr-record.mp4"
    var seconds: Double = 5
    var i = 1
    while i < args.count {
        switch args[i] {
        case "--out": if i + 1 < args.count { out = args[i + 1]; i += 2 }
        case "--seconds": if i + 1 < args.count { seconds = Double(args[i + 1]) ?? 5; i += 2 }
        default: i += 1
        }
    }
    Task { await recordHeadless(outPath: out, seconds: seconds) }
    RunLoop.main.run()
} else {
    print("""
    AI Teaching Recorder CLI
      aitr-cli selftest [seconds]   end-to-end recording self test
      aitr-cli devices              list devices
      aitr-cli perms                permission status
      aitr-cli record --out URL --seconds N   headless recording
    """)
    exit(0)
}
