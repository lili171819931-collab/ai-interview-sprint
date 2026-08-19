import Foundation
import Darwin
import AITeachingRecorderCore

setbuf(stdout, nil)   // CLI output must be unbuffered (pipe-friendly)

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

func recordHeadless(outPath: String, seconds: Double, noCamera: Bool = false, noMic: Bool = false) async {
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
        microphoneEnabled: !noMic,
        cameraEnabled: !noCamera,
        cameraDeviceID: settings.cameraDeviceID,
        cameraOverlay: CameraOverlaySettings(enabled: !noCamera, position: CGPoint(x: 60, y: 60)),
        outputURL: url
    )
    do {
        try await controller.start(configuration: config, excludedWindowIDs: [], outputURL: url)
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

func runTimeline() async {
    var input: String?
    var out: String?
    var listSilence = false
    var removeSilence = false
    var minGap = 1.0
    var threshold: Float = 0.02
    var trimHead = 0.0
    var trimTail = 0.0
    var i = 1
    while i < args.count {
        switch args[i] {
        case "--input": if i + 1 < args.count { input = args[i + 1]; i += 2 }
        case "--out": if i + 1 < args.count { out = args[i + 1]; i += 2 }
        case "--list-silence": listSilence = true; i += 1
        case "--remove-silence": removeSilence = true; i += 1
        case "--min-gap": if i + 1 < args.count { minGap = Double(args[i + 1]) ?? 1.0; i += 2 }
        case "--threshold": if i + 1 < args.count { threshold = Float(args[i + 1]) ?? 0.02; i += 2 }
        case "--trim-head": if i + 1 < args.count { trimHead = Double(args[i + 1]) ?? 0; i += 2 }
        case "--trim-tail": if i + 1 < args.count { trimTail = Double(args[i + 1]) ?? 0; i += 2 }
        default: i += 1
        }
    }
    guard let input else {
        print("timeline requires --input <video>")
        return
    }
    let url = URL(fileURLWithPath: input)
    let model = TimelineModel()
    do {
        try await model.load(url: url)
        print("Loaded: \(url.lastPathComponent)  duration=\(String(format: "%.1f", model.duration))s")
        if trimHead > 0 { model.trimHead(seconds: trimHead); print("Trim head: \(trimHead)s") }
        if trimTail > 0 { model.trimTail(seconds: trimTail); print("Trim tail: \(trimTail)s") }
        if listSilence || removeSilence {
            let before = model.keptRanges.reduce(0) { $0 + $1.duration }
            try await model.detectSilence(threshold: threshold, minGap: minGap, autoRemove: removeSilence)
            print("Silent ranges (\(model.silentRanges.count)):")
            for r in model.silentRanges {
                print("  [\(String(format: "%.2f", r.start)) - \(String(format: "%.2f", r.end))] \(String(format: "%.2f", r.duration))s")
            }
            let after = model.keptRanges.reduce(0) { $0 + $1.duration }
            print("Kept: \(String(format: "%.2f", before))s -> \(String(format: "%.2f", after))s (\(String(format: "%.1f", before - after))s removed)")
        }
        if let out {
            let outURL = URL(fileURLWithPath: out)
            let result = try await model.export(to: outURL)
            print("✅ Exported: \(result.path)")
            let summary = FileOutputManager.shared.summary(for: result)
            print("   Duration: \(String(format: "%.1f", summary?.duration ?? 0))s")
        }
    } catch {
        print("❌ Timeline failed: \(error.localizedDescription)")
        exit(1)
    }
    exit(0)
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
} else if args.first == "timeline" {
    Task { await runTimeline() }
    RunLoop.main.run()
} else if args.first == "record" {
    var out = "/tmp/aitr-record.mp4"
    var seconds: Double = 5
    var noCamera = false
    var noMic = false
    var i = 1
    while i < args.count {
        switch args[i] {
        case "--out": if i + 1 < args.count { out = args[i + 1]; i += 2 }
        case "--seconds": if i + 1 < args.count { seconds = Double(args[i + 1]) ?? 5; i += 2 }
        case "--no-camera": noCamera = true; i += 1
        case "--no-mic": noMic = true; i += 1
        default: i += 1
        }
    }
    Task { await recordHeadless(outPath: out, seconds: seconds, noCamera: noCamera, noMic: noMic) }
    RunLoop.main.run()
} else {
    print("""
    AI Teaching Recorder CLI
      aitr-cli selftest [seconds]   end-to-end recording self test
      aitr-cli devices              list devices
      aitr-cli perms                permission status
      aitr-cli record --out URL --seconds N   headless recording
      aitr-cli timeline --input URL [--out URL] [--list-silence] [--remove-silence]
                        [--min-gap S] [--threshold F] [--trim-head S] [--trim-tail S]
    """)
    exit(0)
}
