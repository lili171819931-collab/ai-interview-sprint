import Foundation
import Combine
import CoreMedia
import CoreVideo
import AVFoundation

/// Orchestrates screen + camera + mic capture, real-time overlay compositing and MP4 writing.
/// Exposes observable state for the UI and can also be driven headlessly by the CLI.
public final class RecorderController: ObservableObject {
    public static let shared = RecorderController()

    // MARK: Published state

    @Published public private(set) var phase: RecorderPhase = .idle
    @Published public private(set) var elapsed: TimeInterval = 0
    @Published public private(set) var currentFileURL: URL?
    @Published public private(set) var lastError: RecorderError?
    @Published public private(set) var micLevel: Float = -60
    @Published public private(set) var isPaused = false
    @Published public private(set) var cameraRunning = false
    @Published public private(set) var micRunning = false
    @Published public var cameraEnabled = true
    @Published public var micEnabled = true
    @Published public var systemAudioEnabled = true

    public var overlay: CameraOverlaySettings {
        get { SettingsStore.shared.cameraOverlay }
        set { SettingsStore.shared.cameraOverlay = newValue }
    }

    // MARK: Engines

    private let screenEngine = ScreenCaptureEngine()
    private let cameraEngine = CameraEngine()
    private let micEngine = MicEngine()
    private let compositor = CompositionRenderer()
    private var writer: MP4Writer?
    private var sourceInfo: ScreenCaptureEngine.SourceInfo?
    private var outputSizePixels: CGSize = .zero

    private var latestCameraBufferLock = NSLock()
    private var latestCameraBuffer: CMSampleBuffer?

    private var timer: Timer?
    private var stateMachine = RecorderStateMachine()
    private var lastFramePTS: CMTime?
    private var pausedElapsed: TimeInterval = 0

    public init() {
        cameraEngine.onSample = { [weak self] buffer in
            guard let self else { return }
            self.latestCameraBufferLock.lock()
            self.latestCameraBuffer = buffer
            self.latestCameraBufferLock.unlock()
        }
        micEngine.onLevel = { [weak self] level in
            guard let self else { return }
            let normalized = max(level, -60)
            DispatchQueue.main.async { self.micLevel = normalized }
        }
        micEngine.onSample = { [weak self] buffer in
            guard let self else { return }
            self.appendMicSample(buffer)
        }
    }

    // MARK: - Start

    public func start(configuration: RecordingConfiguration,
                      excludedWindowIDs: [CGWindowID] = [],
                      outputURL: URL? = nil) async throws {
        guard RecorderStateMachine.allowedTransitions(from: phase, event: .start) else {
            throw RecorderError.invalidConfiguration("A recording is already in progress")
        }
        setPhase(.preparing)

        // 1. Permissions preflight
        if PermissionsManager.shared.screenRecordingStatus != .granted {
            fail(.permissionDenied("Screen Recording"))
            throw RecorderError.permissionDenied("Screen Recording")
        }
        if configuration.cameraEnabled, PermissionsManager.shared.cameraStatus() != .granted {
            fail(.permissionDenied("Camera"))
            throw RecorderError.permissionDenied("Camera")
        }
        if configuration.microphoneEnabled, PermissionsManager.shared.microphoneStatus() != .granted {
            fail(.permissionDenied("Microphone"))
            throw RecorderError.permissionDenied("Microphone")
        }

        // 2. Output URL + disk space
        let url: URL
        do {
            if let outputURL {
                url = outputURL
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(),
                                                        withIntermediateDirectories: true)
            } else {
                url = try FileOutputManager.shared.makeOutputURL()
            }
        } catch {
            fail(.unknown("Could not create the output file: \(error.localizedDescription)"))
            throw RecorderError.unknown("Could not create the output file")
        }

        let freeSpace = FileOutputManager.shared.availableDiskSpace(at: url)
        if freeSpace < 1_000_000_000 {   // < 1 GB
            fail(.diskFull)
            throw RecorderError.diskFull
        }

        let settings = SettingsStore.shared

        // 3. Camera + mic first, so the first screen frames already have a camera image.
        do {
            if configuration.cameraEnabled, !cameraEngine.isRunning {
                try cameraEngine.start(deviceID: configuration.cameraDeviceID,
                                       resolution: settings.cameraResolution,
                                       fps: settings.cameraFPS)
            }
            if configuration.microphoneEnabled, !micEngine.isRunning {
                try micEngine.start(deviceID: nil, sampleRate: settings.audioSampleRate)
            }
        } catch {
            stopEnginesQuietly()
            fail(.deviceUnavailable("Camera or microphone"))
            throw RecorderError.deviceUnavailable("Camera or microphone")
        }

        // 4. Screen capture
        let info: ScreenCaptureEngine.SourceInfo
        do {
            info = try await screenEngine.start(configuration: configuration,
                                                excludedWindowIDs: excludedWindowIDs,
                                                showsCursor: settings.showCursor,
                                                audioSampleRate: settings.audioSampleRate)
        } catch {
            stopEnginesQuietly()
            fail(.unknown("Could not start screen capture: \(error.localizedDescription)"))
            throw RecorderError.unknown("Could not start screen capture: \(error.localizedDescription)")
        }
        sourceInfo = info
        outputSizePixels = CGSize(width: info.contentRectPoints.width * info.scale,
                                  height: info.contentRectPoints.height * info.scale)
        compositor.prepare(outputSize: outputSizePixels)

        // 5. Writer (needs the resolved output size)
        guard let newWriter = MP4Writer(url: url,
                                        width: Int(outputSizePixels.width.rounded()),
                                        height: Int(outputSizePixels.height.rounded()),
                                        fps: configuration.fps,
                                        codec: settings.codec,
                                        quality: settings.quality,
                                        captureSystemAudio: configuration.captureSystemAudio,
                                        microphoneEnabled: configuration.microphoneEnabled,
                                        audioSampleRate: settings.audioSampleRate) else {
            stopEnginesQuietly()
            fail(.encodingError("Could not initialize the video encoder"))
            throw RecorderError.encodingError("Could not initialize the video encoder")
        }
        writer = newWriter

        // 6. Wire callbacks
        screenEngine.onVideoSample = { [weak self] buffer in
            self?.handleScreenVideo(buffer)
        }
        screenEngine.onAudioSample = { [weak self] buffer in
            self?.handleSystemAudio(buffer)
        }
        screenEngine.onStoppedWithError = { [weak self] error in
            DispatchQueue.main.async {
                self?.fail(.unknown(error.localizedDescription))
            }
        }

        currentFileURL = url
        elapsed = 0
        pausedElapsed = 0
        isPaused = false
        cameraRunning = cameraEngine.isRunning
        micRunning = micEngine.isRunning

        setPhase(.recording)
        startTimer()
    }

    // MARK: - Pre-recording preview (used by the home screen)

    public var cameraPreviewLayer: AVCaptureVideoPreviewLayer { cameraEngine.previewLayer }

    public func startCameraPreview() throws {
        guard !cameraEngine.isRunning else { return }
        let settings = SettingsStore.shared
        try cameraEngine.start(deviceID: settings.cameraDeviceID,
                               resolution: settings.cameraResolution,
                               fps: settings.cameraFPS)
        cameraRunning = cameraEngine.isRunning
    }

    public func stopCameraPreview() {
        cameraEngine.stop()
        cameraRunning = false
    }

    public func startMicPreview() throws {
        guard !micEngine.isRunning else { return }
        let settings = SettingsStore.shared
        try micEngine.start(deviceID: nil, sampleRate: settings.audioSampleRate)
        micRunning = micEngine.isRunning
    }

    public func stopMicPreview() {
        micEngine.stop()
        micRunning = false
    }

    // MARK: - Pause / Resume

    public func pause() {
        guard phase == .recording, !isPaused else { return }
        isPaused = true
        stopTimer()
        setPhase(.paused)
    }

    public func resume() {
        guard phase == .paused, isPaused else { return }
        isPaused = false
        startTimer()
        setPhase(.recording)
    }

    // MARK: - Stop

    public func stop() {
        guard phase == .recording || phase == .paused else { return }
        setPhase(.stopping)
        stopTimer()
        isPaused = false

        stopEnginesQuietly()

        guard let writer else {
            fail(.unknown("No active recording writer"))
            return
        }
        self.writer = nil
        setPhase(.processing)
        writer.finish { [weak self] result in
            DispatchQueue.main.async {
                guard let self else { return }
                switch result {
                case .success(let url):
                    self.currentFileURL = url
                    self.setPhase(.completed)
                case .failure(let error):
                    self.fail(error as? RecorderError ?? .unknown(error.localizedDescription))
                }
            }
        }
    }

    public func cancel() {
        stopTimer()
        isPaused = false
        stopEnginesQuietly()
        writer?.cancel()
        writer = nil
        currentFileURL = nil
        setPhase(.idle)
    }

    // MARK: - Toggles during recording

    public func toggleCamera(deviceID: String? = nil, resolution: String? = nil, fps: Int? = nil) {
        if cameraRunning {
            cameraEngine.stop()
            cameraRunning = false
            latestCameraBufferLock.lock()
            latestCameraBuffer = nil
            latestCameraBufferLock.unlock()
        } else {
            let settings = SettingsStore.shared
            do {
                try cameraEngine.start(deviceID: deviceID ?? settings.cameraDeviceID,
                                       resolution: resolution ?? settings.cameraResolution,
                                       fps: fps ?? settings.cameraFPS)
                cameraRunning = cameraEngine.isRunning
            } catch {
                lastError = .deviceUnavailable("Camera")
            }
        }
    }

    public func toggleMicrophone() {
        if micRunning {
            micEngine.stop()
            micRunning = false
        } else {
            let settings = SettingsStore.shared
            do {
                try micEngine.start(deviceID: nil, sampleRate: settings.audioSampleRate)
                micRunning = micEngine.isRunning
            } catch {
                lastError = .deviceUnavailable("Microphone")
            }
        }
    }

    // MARK: - Sample handling

    private func handleScreenVideo(_ buffer: CMSampleBuffer) {
        guard !isPaused, phase == .recording, let writer else { return }

        var camera: CMSampleBuffer?
        latestCameraBufferLock.lock()
        camera = latestCameraBuffer
        latestCameraBufferLock.unlock()

        let overlay = cameraEnabled ? self.overlay : nil
        guard let sourceInfo,
              let composed = compositor.composite(screenBuffer: buffer,
                                                  cameraBuffer: camera,
                                                  overlay: overlay,
                                                  sourceInfo: sourceInfo,
                                                  mirrorCamera: overlay?.mirror ?? true) else { return }
        writer.appendVideo(composed)
    }

    private func handleSystemAudio(_ buffer: CMSampleBuffer) {
        guard !isPaused, phase == .recording, let writer else { return }
        writer.appendSystemAudio(buffer)
    }

    private func appendMicSample(_ buffer: CMSampleBuffer) {
        guard !isPaused, phase == .recording, let writer else { return }
        writer.appendMicrophoneAudio(buffer)
    }

    // MARK: - Helpers

    private func startTimer() {
        stopTimer()
        let t = Timer(timeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            if self.phase == .recording, !self.isPaused {
                self.elapsed += 1
            }
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    private func stopEnginesQuietly() {
        cameraEngine.stop()
        micEngine.stop()
        let semaphore = DispatchSemaphore(value: 0)
        Task {
            await screenEngine.stop()
            semaphore.signal()
        }
        _ = semaphore.wait(timeout: .now() + 2)
        screenEngine.onVideoSample = nil
        screenEngine.onAudioSample = nil
        screenEngine.onStoppedWithError = nil
    }

    private func setPhase(_ newPhase: RecorderPhase) {
        stateMachine.transition(phaseTransition(for: newPhase))
        phase = newPhase
        if case .error(let err) = newPhase {
            lastError = err
        }
    }

    private func phaseTransition(for newPhase: RecorderPhase) -> RecorderEvent {
        switch newPhase {
        case .preparing: return .start
        case .recording: return .prepareSuccess
        case .paused: return .pause
        case .stopping: return .stop
        case .processing: return .stopComplete(nil)
        case .completed: return .processingComplete
        case .error: return .failed(.unknown(""))
        case .idle: return .processingComplete
        }
    }

    private func fail(_ error: RecorderError) {
        stopTimer()
        isPaused = false
        lastError = error
        setPhase(.error(error))
    }
}

extension RecorderController {
    /// Convenience: start with current settings & mode, used by the app.
    public func startWith(mode: CaptureMode,
                          displayID: CGDirectDisplayID?,
                          windowID: CGWindowID?,
                          region: CGRect?,
                          excludedWindowIDs: [CGWindowID] = []) async throws {
        let settings = SettingsStore.shared
        let config = RecordingConfiguration(
            mode: mode,
            displayID: displayID,
            windowID: windowID,
            region: region,
            width: 0,
            height: 0,
            fps: settings.fps,
            captureSystemAudio: systemAudioEnabled,
            microphoneEnabled: micEnabled,
            cameraEnabled: cameraEnabled,
            cameraDeviceID: settings.cameraDeviceID,
            cameraOverlay: overlay,
            outputURL: nil
        )
        try await start(configuration: config, excludedWindowIDs: excludedWindowIDs)
    }
}
