import Foundation
import CoreMedia
import CoreVideo
import CoreImage
import CoreGraphics
import AVFoundation
@testable import AITeachingRecorderCore

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

// MARK: - V0.2 tests

func testKeyboardComboLabel() {
    let cmdK = KeyboardComboLabel.label(keyCode: 40, flags: [.maskCommand], unicode: "k")
    checkEqual(cmdK, "⌘K", "cmd+K label")
    let cmdShiftP = KeyboardComboLabel.label(keyCode: 35, flags: [.maskCommand, .maskShift], unicode: "P")
    checkEqual(cmdShiftP, "⇧⌘P", "cmd+shift+P label (modifier order)")
    let ctrlAltA = KeyboardComboLabel.label(keyCode: 0, flags: [.maskControl, .maskAlternate], unicode: "a")
    checkEqual(ctrlAltA, "⌃⌥A", "ctrl+alt+A label")
    let space = KeyboardComboLabel.label(keyCode: 49, flags: [], unicode: " ")
    checkEqual(space, "Space", "space key label")
    let esc = KeyboardComboLabel.label(keyCode: 53, flags: [], unicode: nil)
    checkEqual(esc, "Esc", "escape key label")
    let bare = KeyboardComboLabel.modifierPrefix([.maskCommand])
    checkEqual(bare, "⌘", "bare command modifier")
}

func testMetadataRecorder() {
    let dir = FileManager.default.temporaryDirectory
        .appendingPathComponent("aitr-meta-\(UUID().uuidString)", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    let url = dir.appendingPathComponent("clip.metadata.json")

    let recorder = RecordingMetadataRecorder()
    recorder.start(outputURL: url)
    Thread.sleep(forTimeInterval: 0.35)   // let the cursor sampler fire
    let written = recorder.stop()
    check(written != nil, "metadata recorder stopped and wrote a file")
    guard let written, let data = try? Data(contentsOf: written) else {
        check(false, "metadata file readable")
        return
    }
    do {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let file = try decoder.decode(MetadataFile.self, from: data)
        checkEqual(file.formatVersion, RecordingMetadataRecorder.formatVersion, "metadata format version")
        check(file.session.duration >= 0, "metadata session duration present")
        check(file.events.contains { $0.type == "cursor" } || file.events.isEmpty,
              "metadata contains cursor events or is empty")
    } catch {
        check(false, "metadata JSON decodes: \(error)")
    }
    try? FileManager.default.removeItem(at: dir)
}

func testTimelineModel() {
    let timeline = TimelineModel(duration: 10)
    checkEqual(timeline.duration, 10, "timeline duration")
    checkEqual(timeline.keptRanges.map { $0.duration }.reduce(0, +), 10, "full duration kept initially")

    timeline.removeRange(start: 2, end: 4)
    let kept = timeline.keptRanges
    checkEqual(kept.count, 2, "range removal splits into two kept clips")
    checkEqual(kept.reduce(0) { $0 + $1.duration }, 8, "kept total = 8 after removing 2s")
    check(abs(kept[0].end - 2) < 0.001 && abs(kept[1].start - 4) < 0.001, "kept ranges are [0,2) [4,10)")

    timeline.trimHead(seconds: 1)
    let afterTrim = timeline.keptRanges
    check(abs(afterTrim[0].start - 1) < 0.001, "trim head removes 1s")

    timeline.restoreAll()
    checkEqual(timeline.keptRanges.reduce(0) { $0 + $1.duration }, 10, "restore all brings back full duration")

    timeline.removeRange(start: 0, end: 10)
    check(timeline.keptRanges.isEmpty, "removing everything leaves nothing")
}

func testSilenceWindowClassifier() {
    // Pure classifier: 1s tone + 1s silence + 1s tone at 16 kHz.
    let sampleRate = 16000.0
    let total = Int(sampleRate * 3)
    var samples: [Float] = []
    samples.reserveCapacity(total)
    for i in 0..<total {
        let t = Double(i) / sampleRate
        let amp = (i < Int(sampleRate) || i >= Int(sampleRate * 2)) ? 0.3 : 0.0
        samples.append(Float(amp * sin(2 * .pi * 440.0 * t)))
    }
    let ranges = SilenceDetector.detectSilentRanges(samples: samples,
                                                    sampleRate: sampleRate,
                                                    threshold: 0.01,
                                                    minGap: 0.5,
                                                    window: 0.1)
    check(ranges.count == 1, "silence classifier finds the 1s silent gap (got \(ranges.count))")
    if let r = ranges.first {
        check(abs(r.start - 1.0) < 0.25, "silence starts near 1s (got \(r.start))")
        check(r.duration > 0.5 && r.duration < 1.6, "silence gap ~1s (got \(r.duration))")
    }
}

func testSilenceDetectorOnFile() {
    // End-to-end: read a real MP4's audio track. Uses ffmpeg to synthesize the
    // fixture (1s tone + 1s silence + 1s tone); skipped if ffmpeg is unavailable.
    let ffmpeg = "/opt/homebrew/bin/ffmpeg"
    guard FileManager.default.isExecutableFile(atPath: ffmpeg) else {
        print("  ⏭ skip silence-on-file (ffmpeg not found)")
        return
    }
    let url = FileManager.default.temporaryDirectory
        .appendingPathComponent("aitr-silence-\(UUID().uuidString).mp4")
    let process = Process()
    process.executableURL = URL(fileURLWithPath: ffmpeg)
    process.arguments = ["-y",
                         "-f", "lavfi", "-i", "color=c=gray:s=160x120:r=10:d=3",
                         "-f", "lavfi", "-i", "aevalsrc=if(between(t\\,0\\,1)+between(t\\,2\\,3)\\,0.3*sin(2*PI*440*t)\\,0):s=16000:d=3",
                         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                         "-shortest", url.path]
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    do {
        try process.run()
        process.waitUntilExit()
    } catch {
        check(false, "could not run ffmpeg: \(error)")
        return
    }
    guard process.terminationStatus == 0 else {
        check(false, "ffmpeg failed to generate the fixture (status \(process.terminationStatus))")
        return
    }
    let sem = DispatchSemaphore(value: 0)
    var ranges: [TimelineSegment] = []
    Task {
        ranges = (try? await SilenceDetector.detectSilentRanges(url: url, threshold: 0.01, minGap: 0.5)) ?? []
        sem.signal()
    }
    _ = sem.wait(timeout: .now() + 30)
    check(ranges.count == 1, "silence detector reads MP4 audio and finds 1 gap (got \(ranges.count))")
    try? FileManager.default.removeItem(at: url)
}


func testCompositionBakesTeachingOverlay() {
    guard let screen = makePixelBuffer(width: 100, height: 100, r: 200, g: 200, b: 200),
          let screenSB = sampleBuffer(from: screen, pts: CMTime(value: 1, timescale: 30)) else {
        check(false, "could not create synthetic screen")
        return
    }
    let renderer = CompositionRenderer()
    renderer.prepare(outputSize: CGSize(width: 100, height: 100))
    let sourceInfo = ScreenCaptureEngine.SourceInfo(displayFrame: CGRect(x: 0, y: 0, width: 100, height: 100),
                                                    contentRectPoints: CGRect(x: 0, y: 0, width: 100, height: 100),
                                                    videoSizePixels: CGSize(width: 100, height: 100),
                                                    isWindowMode: false,
                                                    scale: 1)
    var teaching = TeachingOverlayState()
    teaching.spotlightEnabled = true
    teaching.spotlightRadius = 40
    teaching.spotlightOpacity = 0.5
    teaching.mouseLocation = CGPoint(x: 50, y: 50)
    teaching.keyboardCombo = "⌘K"
    teaching.keyboardVisible = true

    guard let out = renderer.composite(screenBuffer: screenSB,
                                       cameraBuffer: nil,
                                       overlay: nil,
                                       sourceInfo: sourceInfo,
                                       mirrorCamera: false,
                                       drawingImage: nil,
                                       teaching: teaching)?.imageBuffer else {
        check(false, "composite with teaching returned nil")
        return
    }
    let center = pixel(out, x: 50, y: 50)
    check(center.0 > 220 && center.1 > 220 && center.2 > 220,
          "spotlight brightens the mouse area (got \(center))")
    let corner = pixel(out, x: 2, y: 2)
    check(corner.0 <= 205, "far corner not brightened (got \(corner))")
    // Badge: dark rounded rect near the bottom-right corner (output pixels: bottom-right).
    // Badge for "⌘K" @ 13pt is ~ (40..84, 62..84); sample its center.
    let badgePx = pixel(out, x: 70, y: 72)
    check(badgePx.0 < 160, "keyboard badge darkens bottom-right corner (got \(badgePx))")
}

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

// MARK: - Camera layout & shapes

func testCameraLayout() {
    let frame = CGRect(x: 0, y: 0, width: 1000, height: 800)
    let s = CameraOverlaySettings(position: CGPoint(x: 100, y: 100))
    let tl = s.rect(for: .topLeft, in: frame)
    checkEqual(tl.origin.x, 24, "topLeft x")
    checkEqual(tl.origin.y, 24, "topLeft y")
    let tr = s.rect(for: .topRight, in: frame)
    checkEqual(tr.maxX, frame.maxX - 24, "topRight maxX")
    let br = s.rect(for: .bottomRight, in: frame)
    checkEqual(br.maxY, frame.maxY - 24, "bottomRight maxY")
    let bar = s.rect(for: .bottomBar, in: frame)
    checkEqual(bar.width, 1000, "bottomBar full width")
    checkEqual(bar.maxY, 800, "bottomBar at bottom")
    // floating keeps custom position
    let fl = s.rect(for: .floating, in: frame)
    checkEqual(fl.origin, CGPoint(x: 100, y: 100), "floating uses position")
    checkEqual(s.rect(for: .circle, in: frame).width, s.rect(for: .circle, in: frame).height, "circle is square")
}

func testBeautyDefaults() {
    let b = BeautySettings()
    check(b.enabled == false, "beauty disabled by default")
    check(b.whitening >= 0 && b.whitening <= 1, "whitening in range")
    let s = CameraOverlaySettings()
    checkEqual(s.filterPreset, .none, "filter default none")
    checkEqual(s.layout, .floating, "layout default floating")
    checkEqual(OverlayShape.allCases.count, 5, "five overlay shapes")
    checkEqual(CameraLayout.allCases.count, 8, "eight layouts")
}

// MARK: - Composition integration (synthetic buffers)

func makePixelBuffer(width: Int, height: Int, r: UInt8, g: UInt8, b: UInt8) -> CVPixelBuffer? {
    var pb: CVPixelBuffer?
    let attrs: [CFString: Any] = [
        kCVPixelBufferCGImageCompatibilityKey: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey: true,
        kCVPixelBufferPixelFormatTypeKey: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey: width,
        kCVPixelBufferHeightKey: height
    ]
    guard CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &pb) == kCVReturnSuccess, let pb else { return nil }
    CVPixelBufferLockBaseAddress(pb, [])
    let base = CVPixelBufferGetBaseAddress(pb)!.assumingMemoryBound(to: UInt8.self)
    let row = CVPixelBufferGetBytesPerRow(pb)
    for y in 0..<height {
        for x in 0..<width {
            let off = y * row + x * 4
            base[off] = b       // B
            base[off + 1] = g   // G
            base[off + 2] = r   // R
            base[off + 3] = 255 // A
        }
    }
    CVPixelBufferUnlockBaseAddress(pb, [])
    return pb
}

func sampleBuffer(from pixelBuffer: CVPixelBuffer, pts: CMTime) -> CMSampleBuffer? {
    var formatDesc: CMVideoFormatDescription?
    CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault, imageBuffer: pixelBuffer, formatDescriptionOut: &formatDesc)
    guard let formatDesc else { return nil }
    var timing = CMSampleTimingInfo(duration: CMTime(value: 1, timescale: 30), presentationTimeStamp: pts, decodeTimeStamp: .invalid)
    var sb: CMSampleBuffer?
    CMSampleBufferCreateReadyWithImageBuffer(allocator: kCFAllocatorDefault, imageBuffer: pixelBuffer, formatDescription: formatDesc, sampleTiming: &timing, sampleBufferOut: &sb)
    return sb
}

func pixel(_ buffer: CVPixelBuffer, x: Int, y: Int) -> (UInt8, UInt8, UInt8) {
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    let base = CVPixelBufferGetBaseAddress(buffer)!.assumingMemoryBound(to: UInt8.self)
    let row = CVPixelBufferGetBytesPerRow(buffer)
    let off = y * row + x * 4
    return (base[off + 2], base[off + 1], base[off]) // R,G,B
}

func testCompositionBakesCameraOverlay() {
    guard let screen = makePixelBuffer(width: 100, height: 100, r: 10, g: 10, b: 60),
          let camera = makePixelBuffer(width: 40, height: 40, r: 240, g: 30, b: 30),
          let screenSB = sampleBuffer(from: screen, pts: CMTime(value: 1, timescale: 30)),
          let cameraSB = sampleBuffer(from: camera, pts: CMTime(value: 1, timescale: 30)) else {
        check(false, "could not create synthetic buffers")
        return
    }

    let renderer = CompositionRenderer()
    renderer.prepare(outputSize: CGSize(width: 100, height: 100))

    let sourceInfo = ScreenCaptureEngine.SourceInfo(displayFrame: CGRect(x: 0, y: 0, width: 100, height: 100),
                                                    contentRectPoints: CGRect(x: 0, y: 0, width: 100, height: 100),
                                                    videoSizePixels: CGSize(width: 100, height: 100),
                                                    isWindowMode: false,
                                                    scale: 1)

    var overlay = CameraOverlaySettings(enabled: true,
                                        shape: .roundedRect,
                                        sizePreset: .custom,
                                        customSize: CGSize(width: 20, height: 20),
                                        position: CGPoint(x: 10, y: 10))
    overlay.customSize = CGSize(width: 20, height: 20)
    overlay.borderWidth = 0

    guard let out = renderer.composite(screenBuffer: screenSB,
                                       cameraBuffer: cameraSB,
                                       overlay: overlay,
                                       sourceInfo: sourceInfo,
                                       mirrorCamera: false,
                                       drawingImage: nil)?.imageBuffer else {
        check(false, "composite returned nil")
        return
    }
    let inDot = pixel(out, x: 20, y: 20)   // inside overlay
    let outside = pixel(out, x: 80, y: 80) // background
    check(inDot.0 > 180 && inDot.1 < 120, "overlay pixel is red-ish (got \(inDot))")
    check(outside.2 > 40 && outside.0 < 60, "background is blue-ish (got \(outside))")
}

func testCompositionBakesDrawing() {
    guard let screen = makePixelBuffer(width: 80, height: 80, r: 10, g: 10, b: 10),
          let screenSB = sampleBuffer(from: screen, pts: CMTime(value: 1, timescale: 30)) else {
        check(false, "could not create synthetic screen")
        return
    }
    // White drawing image covering the whole frame
    guard let drawingPB = makePixelBuffer(width: 80, height: 80, r: 255, g: 255, b: 255) else {
        check(false, "could not create drawing buffer")
        return
    }
    let renderer = CompositionRenderer()
    renderer.prepare(outputSize: CGSize(width: 80, height: 80))
    let sourceInfo = ScreenCaptureEngine.SourceInfo(displayFrame: CGRect(x: 0, y: 0, width: 80, height: 80),
                                                    contentRectPoints: CGRect(x: 0, y: 0, width: 80, height: 80),
                                                    videoSizePixels: CGSize(width: 80, height: 80),
                                                    isWindowMode: false,
                                                    scale: 1)
    guard let out = renderer.composite(screenBuffer: screenSB,
                                       cameraBuffer: nil,
                                       overlay: nil,
                                       sourceInfo: sourceInfo,
                                       mirrorCamera: false,
                                       drawingImage: CIImage(cvPixelBuffer: drawingPB))?.imageBuffer else {
        check(false, "composite with drawing returned nil")
        return
    }
    let p = pixel(out, x: 40, y: 40)
    check(p.0 > 200 && p.1 > 200 && p.2 > 200, "drawing pixel is white (got \(p))")
}

testStateMachine()
testSettings()
testFileManager()
testTimeFormatting()
testCameraLayout()
testBeautyDefaults()
testCompositionBakesCameraOverlay()
testCompositionBakesDrawing()
testKeyboardComboLabel()
testMetadataRecorder()
testTimelineModel()
testSilenceWindowClassifier()
testSilenceDetectorOnFile()
testCompositionBakesTeachingOverlay()

print("")
print("Passed: \(passed)   Failed: \(failures)")
exit(failures == 0 ? 0 : 1)
