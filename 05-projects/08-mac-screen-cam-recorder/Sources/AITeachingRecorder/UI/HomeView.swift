import SwiftUI
import AppKit
import AITeachingRecorderCore

struct HomeView: View {
    @EnvironmentObject private var controller: RecorderController

    @State private var selectedMode: CaptureMode = .entireScreen
    @State private var displays: [DisplayInfo] = []
    @State private var windows: [WindowInfo] = []
    @State private var cameras: [CameraDeviceInfo] = []
    @State private var mics: [CameraDeviceInfo] = []
    @State private var selectedDisplayID: CGDirectDisplayID?
    @State private var selectedWindowID: CGWindowID?
    @State private var region: CGRect?
    @State private var permissions = PermissionsManager.shared.readiness()
    @State private var showSettings = false
    @State private var screenGrantedAtLaunch = UserDefaults.standard.bool(forKey: "aitr.screenGrantedAtLaunch")

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                permissionSection
                if !screenGrantedAtLaunch && permissions.screen == .granted {
                    PermissionBanner(title: "Screen Recording permission granted",
                                     message: "Please restart AI Teaching Recorder so the new permission takes effect.",
                                     buttonTitle: "Quit & Reopen") {
                                        NSApp.terminate(nil)
                    }
                }
                if controller.phase.isActive || controller.phase.isBusy {
                    recordingStatusSection
                } else if case .completed = controller.phase {
                    completionSection
                } else {
                    modeSection
                    sourceSection
                    startSection
                }
            }
            .padding(24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(nsColor: .windowBackgroundColor))
        .onAppear { refresh() }
        .onReceive(NotificationCenter.default.publisher(for: .permissionsChanged)) { _ in
            refreshPermissions()
        }
        .sheet(isPresented: $showSettings) { SettingsView() }
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 4) {
                Text("AI Teaching Recorder")
                    .font(.system(size: 26, weight: .bold))
                Text("Record your screen with a live camera overlay — like a real teaching studio.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if !controller.phase.isActive && !controller.phase.isBusy {
                Button {
                    startRecording()
                } label: {
                    Label("Start Recording", systemImage: "record.circle")
                        .font(.callout.weight(.semibold))
                        .padding(.horizontal, 4)
                }
                .controlSize(.large)
                .tint(.red)
                .disabled(!canStart)
                .help("Start recording (⌘⇧R)")
            }
            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
            .help("Settings")
        }
    }

    // MARK: Permissions

    @ViewBuilder
    private var permissionSection: some View {
        if permissions.screen != .granted || (controller.cameraEnabled && permissions.camera != .granted) ||
            (controller.micEnabled && permissions.microphone != .granted) {
            VStack(spacing: 8) {
                if permissions.screen != .granted {
                    PermissionBanner(title: "Screen Recording permission required",
                                     message: "AI Teaching Recorder needs Screen Recording to capture your screen.",
                                     buttonTitle: "Open System Settings") {
                        PermissionsManager.shared.requestScreenRecording()
                        refreshPermissions()
                    }
                }
                if controller.cameraEnabled && permissions.camera != .granted {
                    PermissionBanner(title: "Camera permission required",
                                     message: "Allow camera access to show your camera overlay.",
                                     buttonTitle: "Open System Settings") {
                        PermissionsManager.shared.openCameraSettings()
                        refreshPermissions()
                    }
                }
                if controller.micEnabled && permissions.microphone != .granted {
                    PermissionBanner(title: "Microphone permission required",
                                     message: "Allow microphone access to record your voice.",
                                     buttonTitle: "Open System Settings") {
                        PermissionsManager.shared.openMicrophoneSettings()
                        refreshPermissions()
                    }
                }
                HStack {
                    Spacer()
                    Button("Re-check permissions") {
                        refreshPermissions()
                    }
                    .controlSize(.small)
                }
            }
        }
    }

    // MARK: Recording status

    private var recordingStatusSection: some View {
        GlassCard {
            HStack(spacing: 16) {
                Circle()
                    .fill(controller.isPaused ? Color.orange : Color.red)
                    .frame(width: 14, height: 14)
                    .shadow(color: (controller.isPaused ? Color.orange : Color.red).opacity(0.6), radius: 5)
                VStack(alignment: .leading, spacing: 2) {
                    Text(controller.phase.displayName)
                        .font(.headline)
                    Text("Recording to \(controller.currentFileURL?.lastPathComponent ?? "…")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text(controller.elapsed.recorderTimeString)
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                Button {
                    if controller.isPaused { controller.resume() } else { controller.pause() }
                } label: {
                    Label(controller.isPaused ? "Resume" : "Pause", systemImage: controller.isPaused ? "play.fill" : "pause.fill")
                }
                .controlSize(.large)
                Button {
                    controller.stop()
                } label: {
                    Label("Stop", systemImage: "stop.fill")
                }
                .controlSize(.large)
                .tint(.red)
            }
        }
    }

    // MARK: Completion

    private var completionSection: some View {
        GlassCard {
            VStack(spacing: 14) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 44))
                    .foregroundColor(.green)
                Text("Recording Complete")
                    .font(.title2.weight(.bold))
                if let url = controller.currentFileURL {
                    Text(url.lastPathComponent)
                        .font(.callout)
                        .foregroundColor(.secondary)
                }
                Text(controller.elapsed.recorderTimeString)
                    .font(.system(size: 30, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                HStack(spacing: 12) {
                    if let url = controller.currentFileURL {
                        Button {
                            FileOutputManager.shared.open(url)
                        } label: {
                            Label("Open Video", systemImage: "play.circle.fill")
                        }
                        .controlSize(.large)
                        Button {
                            FileOutputManager.shared.revealInFinder(url)
                        } label: {
                            Label("Show in Finder", systemImage: "folder")
                        }
                        .controlSize(.large)
                    }
                    Button {
                        controller.cancel()
                    } label: {
                        Label("Record Again", systemImage: "arrow.counterclockwise")
                    }
                    .controlSize(.large)
                    .tint(.accentColor)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
    }

    // MARK: Mode

    private var modeSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("What do you want to record?")
                .font(.headline)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ModeCard(title: "Entire Screen",
                         subtitle: "Record the full primary display",
                         icon: "macwindow",
                         selected: selectedMode == .entireScreen) { selectedMode = .entireScreen }
                ModeCard(title: "Display",
                         subtitle: "Choose a specific monitor",
                         icon: "display",
                         selected: selectedMode == .display) { selectedMode = .display }
                ModeCard(title: "Window",
                         subtitle: "Record a single app window",
                         icon: "square.split.2x1",
                         selected: selectedMode == .window) { selectedMode = .window }
                ModeCard(title: "Region",
                         subtitle: "Drag to select an area",
                         icon: "viewfinder",
                         selected: selectedMode == .region) { selectedMode = .region }
            }

            if selectedMode == .display || selectedMode == .region {
                Picker("Display", selection: $selectedDisplayID) {
                    Text("Primary").tag(CGDirectDisplayID?.none)
                    ForEach(displays) { d in
                        Text("\(d.name) · \(d.widthPixels)×\(d.heightPixels)").tag(Optional(d.id))
                    }
                }
                .pickerStyle(.menu)
                .labelsHidden()
            }

            if selectedMode == .window {
                WindowPickerView(windows: windows, selection: $selectedWindowID)
            }

            if selectedMode == .region {
                HStack {
                    Text(region.map { String(format: "Region: %d × %d", Int($0.width), Int($0.height)) } ?? "No region selected")
                        .font(.callout)
                        .foregroundColor(region == nil ? .secondary : .primary)
                    Spacer()
                    Button(region == nil ? "Select Region…" : "Reselect") {
                        pickRegion()
                    }
                    .controlSize(.small)
                }
            }
        }
    }

    // MARK: Sources

    private var sourceSection: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Sources")
                    .font(.headline)

                HStack(alignment: .top, spacing: 16) {
                    // Camera preview
                    VStack(alignment: .leading, spacing: 6) {
                        ToggleRow(icon: "video.fill", title: "Camera", subtitle: cameraSubtitle, isOn: $controller.cameraEnabled)
                        if controller.cameraEnabled {
                            CameraPreviewView(layer: controller.cameraPreviewLayer)
                                .frame(width: 300, height: 170)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1)))
                            if !cameras.isEmpty {
                                Picker("Device", selection: cameraSelection) {
                                    ForEach(cameras) { c in
                                        Text(c.name).tag(c.id)
                                    }
                                }
                                .pickerStyle(.menu)
                                .labelsHidden()
                            }
                        }
                    }

                    Divider()

                    // Audio
                    VStack(alignment: .leading, spacing: 10) {
                        ToggleRow(icon: "mic.fill", title: "Microphone", subtitle: "Record your voice", isOn: $controller.micEnabled)
                        if controller.micEnabled {
                            if !mics.isEmpty {
                                Picker("Mic", selection: micSelection) {
                                    ForEach(mics) { m in
                                        Text(m.name).tag(m.id)
                                    }
                                }
                                .pickerStyle(.menu)
                                .labelsHidden()
                            }
                            MicLevelMeter(level: controller.micLevel)
                        }
                        ToggleRow(icon: "speaker.wave.2.fill", title: "System Audio",
                                  subtitle: "Record computer sound", isOn: $controller.systemAudioEnabled)
                    }
                }
            }
        }
        .onChange(of: controller.cameraEnabled) { _, on in
            handleCameraToggle(on)
        }
        .onChange(of: controller.micEnabled) { _, on in
            handleMicToggle(on)
        }
        .onChange(of: controller.systemAudioEnabled) { _, on in
            _ = on
        }
    }

    // MARK: Start

    private var startSection: some View {
        VStack(spacing: 8) {
            Button {
                startRecording()
            } label: {
                Label("Start Recording", systemImage: "record.circle")
                    .font(.title3.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .controlSize(.large)
            .tint(.red)
            .disabled(!canStart)
            Text("You can pause with ⌘⇧P and stop with ⌘⇧S at any time.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: Logic

    private var canStart: Bool {
        guard permissions.screen == .granted else { return false }
        if controller.cameraEnabled, permissions.camera != .granted { return false }
        if controller.micEnabled, permissions.microphone != .granted { return false }
        switch selectedMode {
        case .entireScreen: return true
        case .display: return selectedDisplayID != nil
        case .window: return selectedWindowID != nil
        case .region: return region != nil
        }
    }

    private var cameraSubtitle: String {
        if let id = SettingsStore.shared.cameraDeviceID, let cam = cameras.first(where: { $0.id == id }) {
            return cam.name
        }
        return cameras.first?.name ?? "No camera found"
    }

    private var cameraSelection: Binding<String> {
        Binding(
            get: { SettingsStore.shared.cameraDeviceID ?? cameras.first?.id ?? "" },
            set: { SettingsStore.shared.cameraDeviceID = $0 }
        )
    }

    private var micSelection: Binding<String> {
        Binding(
            get: { mics.first?.id ?? "" },
            set: { _ in }
        )
    }

    private func refresh() {
        refreshPermissions()
        Task {
            let (newDisplays, newWindows) = await (DeviceDiscovery.listDisplays(), DeviceDiscovery.listWindows())
            displays = newDisplays
            windows = newWindows
            if selectedDisplayID == nil { selectedDisplayID = displays.first?.id }
            cameras = DeviceLibrary.listCameras()
            mics = DeviceLibrary.listMicrophones()
            if controller.cameraEnabled { handleCameraToggle(true) }
            if controller.micEnabled { handleMicToggle(true) }
        }
    }

    private func refreshPermissions() {
        permissions = PermissionsManager.shared.readiness()
    }

    private func handleCameraToggle(_ on: Bool) {
        if on {
            guard PermissionsManager.shared.cameraStatus() != .notDetermined || true else { return }
            Task {
                if PermissionsManager.shared.cameraStatus() == .notDetermined {
                    _ = await PermissionsManager.shared.requestCamera()
                    refreshPermissions()
                }
                if PermissionsManager.shared.cameraStatus() == .granted {
                    try? controller.startCameraPreview()
                }
            }
        } else {
            controller.stopCameraPreview()
        }
    }

    private func handleMicToggle(_ on: Bool) {
        if on {
            Task {
                if PermissionsManager.shared.microphoneStatus() == .notDetermined {
                    _ = await PermissionsManager.shared.requestMicrophone()
                    refreshPermissions()
                }
                if PermissionsManager.shared.microphoneStatus() == .granted {
                    try? controller.startMicPreview()
                }
            }
        } else {
            controller.stopMicPreview()
        }
    }

    private func pickRegion() {
        let target = displays.first(where: { $0.id == selectedDisplayID }) ?? displays.first
        guard let target else { return }
        guard let delegate = NSApp.delegate as? AppDelegate else { return }
        delegate.showRegionPicker(display: target) { rect in
            if rect.width > 0 {
                region = rect
            } else {
                region = nil
            }
        }
    }

    private func startRecording() {
        // Show the floating windows FIRST so their window IDs exist and can be excluded from the capture.
        appDelegate.showControlBar()
        appDelegate.showCameraPanelIfNeeded()
        if SettingsStore.shared.annotationsEnabled, let geometry = annotationGeometry() {
            appDelegate.showAnnotationOverlay(contentFrame: geometry.frame, pixelSize: geometry.pixelSize)
        }
        controller.drawingImageProvider = appDelegate.annotationCanvasImageProvider

        let countdown = SettingsStore.shared.countdown
        if countdown > 0 {
            appDelegate.showCountdown(countdown) {
                self.beginRecording()
            }
        } else {
            beginRecording()
        }
    }

    private func beginRecording() {
        Task {
            do {
                try await controller.startWith(mode: selectedMode,
                                               displayID: selectedMode == .display || selectedMode == .region ? selectedDisplayID : nil,
                                               windowID: selectedMode == .window ? selectedWindowID : nil,
                                               region: selectedMode == .region ? region : nil,
                                               excludedWindowIDs: appDelegate.excludedWindowIDs())
            } catch {
                appDelegate.hideControlBar()
                appDelegate.hideCameraPanel()
                appDelegate.hideAnnotationOverlay()
                controller.drawingImageProvider = nil
                // controller.lastError is already surfaced by the phase; nothing else to do.
            }
        }
    }

    /// Frame (global points) + pixel size the annotation canvas must cover, matching the captured content.
    private func annotationGeometry() -> (frame: CGRect, pixelSize: CGSize)? {
        func scale(for display: DisplayInfo) -> CGFloat {
            CGFloat(display.widthPixels) / max(display.frame.width, 1)
        }
        switch selectedMode {
        case .entireScreen:
            guard let d = displays.first else { return nil }
            let sc = scale(for: d)
            return (d.frame, CGSize(width: d.frame.width * sc, height: d.frame.height * sc))
        case .display:
            guard let id = selectedDisplayID, let d = displays.first(where: { $0.id == id }) else { return nil }
            let sc = scale(for: d)
            return (d.frame, CGSize(width: d.frame.width * sc, height: d.frame.height * sc))
        case .region:
            guard let r = region, let d = displays.first(where: { $0.id == selectedDisplayID }) else { return nil }
            let sc = scale(for: d)
            return (r, CGSize(width: r.width * sc, height: r.height * sc))
        case .window:
            guard let w = windows.first(where: { $0.id == selectedWindowID }) else { return nil }
            return (w.frame, CGSize(width: w.frame.width * 2, height: w.frame.height * 2))
        }
    }

    private var appDelegate: AppDelegate {
        (NSApp.delegate as? AppDelegate) ?? AppDelegate()
    }
}

// MARK: - Mic level meter

struct MicLevelMeter: View {
    let level: Float

    private var fraction: CGFloat {
        let clamped = min(max(level + 60, 0) / 60.0, 1.0)
        return CGFloat(clamped)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("Microphone level")
                .font(.caption2)
                .foregroundColor(.secondary)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.1))
                    Capsule()
                        .fill(LinearGradient(colors: [.green, .yellow, .red],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(4, geo.size.width * fraction))
                }
            }
            .frame(height: 6)
        }
    }
}
