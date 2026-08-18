import Foundation
import AITeachingRecorderCore

// Lightweight unit-test runner (no XCTest needed — works with Command Line Tools).

var failures = 0
var passed = 0

func check(_ condition: Bool, _ name: String, file: String = #file, line: Int = #line) {
    if condition {
        passed += 1
    } else {
        failures += 1
        print("❌ \(name)  (\(file):\(line))")
    }
}

func checkEqual<T: Equatable>(_ a: T, _ b: T, _ name: String, file: String = #file, line: Int = #line) {
    check(a == b, "\(name) — expected \(b), got \(a)", file: file, line: line)
}

// MARK: - State machine

func testStateMachine() {
    var sm = RecorderStateMachine()
    checkEqual(sm.phase, .idle, "starts idle")

    check(sm.transition(.start), "idle -> start allowed")
    checkEqual(sm.phase, .preparing, "phase preparing")
    check(sm.transition(.prepareSuccess), "prepare -> recording")
    checkEqual(sm.phase, .recording, "phase recording")
    check(sm.transition(.pause), "pause allowed")
    checkEqual(sm.phase, .paused, "phase paused")
    check(sm.transition(.resume), "resume allowed")
    checkEqual(sm.phase, .recording, "phase recording again")
    check(sm.transition(.stop), "stop allowed")
    checkEqual(sm.phase, .stopping, "phase stopping")
    check(sm.transition(.stopComplete(nil)), "stopComplete allowed")
    checkEqual(sm.phase, .processing, "phase processing")
    check(sm.transition(.processingComplete), "processingComplete allowed")
    checkEqual(sm.phase, .completed, "phase completed")

    // Illegal transitions
    var sm2 = RecorderStateMachine()
    check(!sm2.transition(.pause), "cannot pause while idle")
    check(!sm2.transition(.resume), "cannot resume while idle")
    check(!sm2.transition(.stopComplete(nil)), "cannot complete while idle")
    checkEqual(sm2.phase, .idle, "still idle after illegal transitions")

    // Error path
    var sm3 = RecorderStateMachine()
    sm3.transition(.start)
    check(sm3.transition(.prepareFailed(.deviceUnavailable("Camera"))), "prepareFailed allowed")
    if case .error(let err) = sm3.phase {
        checkEqual(err, .deviceUnavailable("Camera"), "error carries reason")
    } else {
        check(false, "expected error phase")
    }
    check(sm3.transition(.start), "retry from error allowed")

    // Restart from completed
    var sm4 = RecorderStateMachine()
    sm4.transition(.start); sm4.transition(.prepareSuccess); sm4.transition(.stop)
    sm4.transition(.stopComplete(nil)); sm4.transition(.processingComplete)
    checkEqual(sm4.phase, .completed, "completed after full stop")
    check(sm4.transition(.start), "record again from completed")
}

// MARK: - Settings

func testSettings() {
    let suite = "AITRUnitTests-\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suite)!
    defaults.removePersistentDomain(forName: suite)

    let settings = SettingsStore(defaults: defaults)
    checkEqual(settings.fps, 30, "default fps 30")
    checkEqual(settings.quality, 70, "default quality 70")
    checkEqual(settings.codec, "h264", "default codec h264")
    check(settings.showCursor, "default showCursor true")
    checkEqual(settings.cameraResolution, "1920x1080", "default camera resolution")
    check(settings.autoHideControlBar, "default auto-hide bar")
    checkEqual(settings.startShortcut, "⌘⇧R", "default start shortcut")
    checkEqual(settings.cameraOverlay.shape, .roundedRect, "default overlay shape")
    checkEqual(settings.cameraOverlay.sizePreset, .medium, "default overlay size")

    settings.fps = 60
    settings.quality = 45
    settings.codec = "hevc"
    settings.cameraOverlay.shape = .circle
    settings.cameraOverlay.mirror = false

    let reloaded = SettingsStore(defaults: defaults)
    checkEqual(reloaded.fps, 60, "persisted fps")
    checkEqual(reloaded.quality, 45, "persisted quality")
    checkEqual(reloaded.codec, "hevc", "persisted codec")
    checkEqual(reloaded.cameraOverlay.shape, .circle, "persisted overlay shape")
    check(!reloaded.cameraOverlay.mirror, "persisted mirror=false")
    defaults.removePersistentDomain(forName: suite)
}

// MARK: - File manager

func testFileManager() {
    let fm = FileOutputManager()
    let base = FileManager.default.temporaryDirectory.appendingPathComponent("AITR-FMTests-\(UUID().uuidString)", isDirectory: true)
    let date = Date(timeIntervalSince1970: 1_784_000_000)
    do {
        let url = try fm.makeOutputURL(baseDirectory: base, date: date)
        check(url.lastPathComponent.hasPrefix("Recording_"), "filename prefix")
        check(url.lastPathComponent.hasSuffix(".mp4"), "filename suffix mp4")
        check(url.path.contains("/2026/"), "year folder 2026")
        check(FileManager.default.fileExists(atPath: url.deletingLastPathComponent().path), "folder created")
    } catch {
        check(false, "makeOutputURL threw: \(error)")
    }
    checkEqual(fm.listRecordings(baseDirectory: base).count, 0, "empty recordings list")

    // Summary for nonexistent file should be nil or zeroed, not crash
    _ = fm.summary(for: base.appendingPathComponent("missing.mp4"))
    try? FileManager.default.removeItem(at: base)
}

// MARK: - Time formatting

func testTimeFormatting() {
    checkEqual(TimeInterval(0).recorderTimeString, "00:00:00", "zero time")
    checkEqual(TimeInterval(65).recorderTimeString, "00:01:05", "65s")
    checkEqual(TimeInterval(3723).recorderTimeString, "01:02:03", "3723s")
}

testStateMachine()
testSettings()
testFileManager()
testTimeFormatting()

print("")
print("Passed: \(passed)   Failed: \(failures)")
exit(failures == 0 ? 0 : 1)
