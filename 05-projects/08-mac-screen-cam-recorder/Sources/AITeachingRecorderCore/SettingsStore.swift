import Foundation
import CoreGraphics
import Combine

/// User preferences persisted in UserDefaults.
public final class SettingsStore: ObservableObject {
    public static let shared = SettingsStore()

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private var cancellables = Set<AnyCancellable>()

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.fps = Self.loadInt(defaults, Key.fps, 30)
        self.quality = Self.loadInt(defaults, Key.quality, 70)
        self.showCursor = Self.loadBool(defaults, Key.showCursor, true)
        self.showMouseClicks = Self.loadBool(defaults, Key.showMouseClicks, false)
        self.countdown = Self.loadInt(defaults, Key.countdown, 0)
        self.annotationsEnabled = Self.loadBool(defaults, Key.annotationsEnabled, false)
        self.annotationTool = defaults.string(forKey: Key.annotationTool) ?? "pen"
        self.annotationColorHex = defaults.string(forKey: Key.annotationColorHex) ?? "#FF3B30"
        self.annotationWidth = defaults.object(forKey: Key.annotationWidth) == nil ? 5.0 : defaults.double(forKey: Key.annotationWidth)
        self.cameraDeviceID = defaults.string(forKey: Key.cameraDeviceID)
        self.cameraResolution = defaults.string(forKey: Key.cameraResolution) ?? "1920x1080"
        self.cameraFPS = Self.loadInt(defaults, Key.cameraFPS, 30)
        self.cameraOverlay = (try? JSONDecoder().decode(CameraOverlaySettings.self, from: defaults.data(forKey: Key.overlay) ?? Data())) ?? CameraOverlaySettings()
        self.micVolume = defaults.object(forKey: Key.micVolume) == nil ? 1.0 : defaults.float(forKey: Key.micVolume)
        self.autoHideControlBar = Self.loadBool(defaults, Key.autoHideBar, true)
        self.startShortcut = defaults.string(forKey: Key.startShortcut) ?? "⌘⇧R"
        self.pauseShortcut = defaults.string(forKey: Key.pauseShortcut) ?? "⌘⇧P"
        self.stopShortcut = defaults.string(forKey: Key.stopShortcut) ?? "⌘⇧S"
        self.cameraShortcut = defaults.string(forKey: Key.cameraShortcut) ?? "⌘⇧C"
        self.micShortcut = defaults.string(forKey: Key.micShortcut) ?? "⌘⇧M"
        self.keyboardOSDEnabled = Self.loadBool(defaults, Key.keyboardOSDEnabled, false)
        self.spotlightEnabled = Self.loadBool(defaults, Key.spotlightEnabled, false)
        self.spotlightRadius = defaults.object(forKey: Key.spotlightRadius) == nil ? 120.0 : defaults.double(forKey: Key.spotlightRadius)
        self.spotlightOpacity = defaults.object(forKey: Key.spotlightOpacity) == nil ? 0.35 : defaults.double(forKey: Key.spotlightOpacity)
        self.metadataRecordingEnabled = Self.loadBool(defaults, Key.metadataRecordingEnabled, true)
        self.teleprompterEnabled = Self.loadBool(defaults, Key.teleprompterEnabled, false)
        self.teleprompterVisibleInRecording = Self.loadBool(defaults, Key.teleprompterVisibleInRecording, false)
        self.teleprompterFontSize = defaults.object(forKey: Key.teleprompterFontSize) == nil ? 28.0 : defaults.double(forKey: Key.teleprompterFontSize)
        self.teleprompterSpeed = defaults.object(forKey: Key.teleprompterSpeed) == nil ? 45.0 : defaults.double(forKey: Key.teleprompterSpeed)
        self.teleprompterScript = defaults.string(forKey: Key.teleprompterScript) ?? Self.defaultTeleprompterScript
    }

    // MARK: Keys

    private enum Key {
        static let outputDirectory = "aitr.outputDirectory"
        static let fps = "aitr.fps"
        static let codec = "aitr.codec"
        static let quality = "aitr.quality"
        static let cameraDeviceID = "aitr.cameraDeviceID"
        static let cameraResolution = "aitr.cameraResolution"
        static let cameraFPS = "aitr.cameraFPS"
        static let overlay = "aitr.cameraOverlay"
        static let micVolume = "aitr.micVolume"
        static let autoHideBar = "aitr.autoHideControlBar"
        static let startShortcut = "aitr.shortcut.start"
        static let pauseShortcut = "aitr.shortcut.pause"
        static let stopShortcut = "aitr.shortcut.stop"
        static let cameraShortcut = "aitr.shortcut.camera"
        static let micShortcut = "aitr.shortcut.mic"
        static let showCursor = "aitr.showCursor"
        static let showMouseClicks = "aitr.showMouseClicks"
        static let countdown = "aitr.countdown"
        static let annotationsEnabled = "aitr.annotationsEnabled"
        static let annotationTool = "aitr.annotationTool"
        static let annotationColorHex = "aitr.annotationColorHex"
        static let annotationWidth = "aitr.annotationWidth"
        static let audioSampleRate = "aitr.audioSampleRate"
        static let excludeOwnWindows = "aitr.excludeOwnWindows"
        static let keyboardOSDEnabled = "aitr.keyboardOSDEnabled"
        static let spotlightEnabled = "aitr.spotlightEnabled"
        static let spotlightRadius = "aitr.spotlightRadius"
        static let spotlightOpacity = "aitr.spotlightOpacity"
        static let metadataRecordingEnabled = "aitr.metadataRecordingEnabled"
        static let teleprompterEnabled = "aitr.teleprompterEnabled"
        static let teleprompterVisibleInRecording = "aitr.teleprompterVisibleInRecording"
        static let teleprompterFontSize = "aitr.teleprompterFontSize"
        static let teleprompterSpeed = "aitr.teleprompterSpeed"
        static let teleprompterScript = "aitr.teleprompterScript"
    }

    public static let defaultTeleprompterScript = """
欢迎来到本节课！
今天我们一起来学习……

（在下方编辑你的讲稿，录制时它会自动滚动。）
"""

    // MARK: Default output directory

    public var defaultOutputDirectory: URL {
        let movies = FileManager.default.urls(for: .moviesDirectory, in: .userDomainMask).first
            ?? FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Movies")
        return movies.appendingPathComponent("AI Teaching Recorder", isDirectory: true)
    }

    public var outputDirectory: URL {
        get {
            if let path = defaults.string(forKey: Key.outputDirectory) {
                return URL(fileURLWithPath: path, isDirectory: true)
            }
            return defaultOutputDirectory
        }
        set { defaults.set(newValue.path, forKey: Key.outputDirectory) }
    }

    public var useDefaultSaveDirectory: Bool {
        get { defaults.object(forKey: Key.outputDirectory) == nil }
        set {
            if newValue { defaults.removeObject(forKey: Key.outputDirectory) }
        }
    }

    // MARK: Video

    @Published public var fps: Int {
        didSet { defaults.set(fps, forKey: Key.fps) }
    }

    public var codec: String {  // "h264" | "hevc"
        get { defaults.string(forKey: Key.codec) ?? "h264" }
        set { defaults.set(newValue, forKey: Key.codec) }
    }

    @Published public var quality: Int {  // 0..100
        didSet { defaults.set(max(0, min(100, quality)), forKey: Key.quality) }
    }

    @Published public var showCursor: Bool {
        didSet { defaults.set(showCursor, forKey: Key.showCursor) }
    }

    @Published public var showMouseClicks: Bool {
        didSet { defaults.set(showMouseClicks, forKey: Key.showMouseClicks) }
    }

    @Published public var countdown: Int {
        didSet { defaults.set(countdown, forKey: Key.countdown) }
    }

    @Published public var annotationsEnabled: Bool {
        didSet { defaults.set(annotationsEnabled, forKey: Key.annotationsEnabled) }
    }

    @Published public var annotationTool: String {
        didSet { defaults.set(annotationTool, forKey: Key.annotationTool) }
    }

    @Published public var annotationColorHex: String {
        didSet { defaults.set(annotationColorHex, forKey: Key.annotationColorHex) }
    }

    @Published public var annotationWidth: Double {
        didSet { defaults.set(annotationWidth, forKey: Key.annotationWidth) }
    }

    public var audioSampleRate: Int {
        get { defaults.object(forKey: Key.audioSampleRate) == nil ? 48000 : defaults.integer(forKey: Key.audioSampleRate) }
        set { defaults.set(newValue, forKey: Key.audioSampleRate) }
    }

    public var excludeOwnWindows: Bool {
        get { defaults.object(forKey: Key.excludeOwnWindows) == nil ? true : defaults.bool(forKey: Key.excludeOwnWindows) }
        set { defaults.set(newValue, forKey: Key.excludeOwnWindows) }
    }

    // MARK: Camera

    @Published public var cameraDeviceID: String? {
        didSet { defaults.set(cameraDeviceID, forKey: Key.cameraDeviceID) }
    }

    @Published public var cameraResolution: String {  // "1280x720" | "1920x1080"
        didSet { defaults.set(cameraResolution, forKey: Key.cameraResolution) }
    }

    @Published public var cameraFPS: Int {
        didSet { defaults.set(cameraFPS, forKey: Key.cameraFPS) }
    }

    @Published public var cameraOverlay: CameraOverlaySettings {
        didSet {
            if let data = try? encoder.encode(cameraOverlay) {
                defaults.set(data, forKey: Key.overlay)
            }
        }
    }

    // MARK: Teaching overlays (V0.2)

    @Published public var keyboardOSDEnabled: Bool {
        didSet { defaults.set(keyboardOSDEnabled, forKey: Key.keyboardOSDEnabled) }
    }

    @Published public var spotlightEnabled: Bool {
        didSet { defaults.set(spotlightEnabled, forKey: Key.spotlightEnabled) }
    }

    @Published public var spotlightRadius: Double {
        didSet { defaults.set(max(20, min(400, spotlightRadius)), forKey: Key.spotlightRadius) }
    }

    @Published public var spotlightOpacity: Double {
        didSet { defaults.set(max(0.05, min(0.9, spotlightOpacity)), forKey: Key.spotlightOpacity) }
    }

    @Published public var metadataRecordingEnabled: Bool {
        didSet { defaults.set(metadataRecordingEnabled, forKey: Key.metadataRecordingEnabled) }
    }

    // MARK: Teleprompter (V0.2)

    @Published public var teleprompterEnabled: Bool {
        didSet { defaults.set(teleprompterEnabled, forKey: Key.teleprompterEnabled) }
    }

    @Published public var teleprompterVisibleInRecording: Bool {
        didSet { defaults.set(teleprompterVisibleInRecording, forKey: Key.teleprompterVisibleInRecording) }
    }

    @Published public var teleprompterFontSize: Double {
        didSet { defaults.set(max(12, min(72, teleprompterFontSize)), forKey: Key.teleprompterFontSize) }
    }

    @Published public var teleprompterSpeed: Double {
        didSet { defaults.set(max(5, min(300, teleprompterSpeed)), forKey: Key.teleprompterSpeed) }
    }

    @Published public var teleprompterScript: String {
        didSet { defaults.set(teleprompterScript, forKey: Key.teleprompterScript) }
    }

    // MARK: Audio

    @Published public var micVolume: Float {
        didSet { defaults.set(max(0, min(1, micVolume)), forKey: Key.micVolume) }
    }

    @Published public var autoHideControlBar: Bool {
        didSet { defaults.set(autoHideControlBar, forKey: Key.autoHideBar) }
    }

    // MARK: Shortcuts

    @Published public var startShortcut: String {
        didSet { defaults.set(startShortcut, forKey: Key.startShortcut) }
    }
    @Published public var pauseShortcut: String {
        didSet { defaults.set(pauseShortcut, forKey: Key.pauseShortcut) }
    }
    @Published public var stopShortcut: String {
        didSet { defaults.set(stopShortcut, forKey: Key.stopShortcut) }
    }
    @Published public var cameraShortcut: String {
        didSet { defaults.set(cameraShortcut, forKey: Key.cameraShortcut) }
    }
    @Published public var micShortcut: String {
        didSet { defaults.set(micShortcut, forKey: Key.micShortcut) }
    }

    // MARK: Init from defaults

    private static func loadBool(_ defaults: UserDefaults, _ key: String, _ fallback: Bool) -> Bool {
        defaults.object(forKey: key) == nil ? fallback : defaults.bool(forKey: key)
    }

    private static func loadInt(_ defaults: UserDefaults, _ key: String, _ fallback: Int) -> Int {
        defaults.object(forKey: key) == nil ? fallback : defaults.integer(forKey: key)
    }

    // MARK: Build configuration from settings

    public func makeConfiguration(mode: CaptureMode,
                                  displayID: CGDirectDisplayID?,
                                  windowID: CGWindowID?,
                                  region: CGRect?,
                                  cameraEnabled: Bool,
                                  microphoneEnabled: Bool,
                                  systemAudioEnabled: Bool,
                                  cameraDeviceID: String?,
                                  overlay: CameraOverlaySettings) -> RecordingConfiguration {
        RecordingConfiguration(
            mode: mode,
            displayID: displayID,
            windowID: windowID,
            region: region,
            width: 0,
            height: 0,
            fps: fps,
            captureSystemAudio: systemAudioEnabled,
            microphoneEnabled: microphoneEnabled,
            cameraEnabled: cameraEnabled,
            cameraDeviceID: cameraDeviceID ?? self.cameraDeviceID,
            cameraOverlay: overlay,
            countdown: countdown,
            showMouseClicks: showMouseClicks,
            outputURL: nil
        )
    }
}
