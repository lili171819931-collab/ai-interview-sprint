import SwiftUI
import AppKit
import AITeachingRecorderCore

struct SettingsView: View {
    @ObservedObject private var settings = SettingsStore.shared
    @State private var overlay = SettingsStore.shared.cameraOverlay

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Settings").font(.title2.weight(.bold))

                // Camera
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        sectionHeader("Camera", icon: "video.fill")
                        Picker("Resolution", selection: $settings.cameraResolution) {
                            Text("1280 × 720").tag("1280x720")
                            Text("1920 × 1080").tag("1920x1080")
                            Text("3840 × 2160").tag("3840x2160")
                        }
                        Picker("Frame rate", selection: $settings.cameraFPS) {
                            Text("24 fps").tag(24)
                            Text("30 fps").tag(30)
                            Text("60 fps").tag(60)
                        }
                        Toggle("Mirror camera", isOn: $overlay.mirror)
                        Picker("Overlay shape", selection: $overlay.shape) {
                            ForEach(OverlayShape.allCases) { s in
                                Text(s.displayName).tag(s)
                            }
                        }
                        Picker("Overlay size", selection: $overlay.sizePreset) {
                            ForEach(OverlaySizePreset.allCases) { s in
                                Text(s.displayName).tag(s)
                            }
                        }
                        Toggle("Border", isOn: Binding(get: { overlay.borderWidth > 0 },
                                                       set: { overlay.borderWidth = $0 ? 2 : 0 }))
                        Toggle("Shadow", isOn: $overlay.shadow)
                    }
                }

                // Video
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        sectionHeader("Video", icon: "film.fill")
                        Picker("Frame rate", selection: $settings.fps) {
                            Text("24 fps").tag(24)
                            Text("30 fps").tag(30)
                            Text("60 fps").tag(60)
                        }
                        Picker("Codec", selection: settingsCodecBinding) {
                            Text("H.264 (best compatibility)").tag("h264")
                            Text("HEVC (smaller files)").tag("hevc")
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("Quality")
                                Spacer()
                                Text("\(settings.quality)")
                                    .foregroundColor(.secondary)
                                    .font(.caption.monospacedDigit())
                            }
                            Slider(value: qualityBinding, in: 10...100, step: 5)
                        }
                        Toggle("Show mouse cursor in recording", isOn: $settings.showCursor)
                    }
                }

                // Audio
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        sectionHeader("Audio", icon: "waveform")
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text("Microphone volume")
                                Spacer()
                                Text("\(Int(settings.micVolume * 100))%")
                                    .foregroundColor(.secondary)
                                    .font(.caption.monospacedDigit())
                            }
                            Slider(value: micVolumeBinding, in: 0...1)
                        }
                    }
                }

                // Shortcuts
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionHeader("Shortcuts", icon: "keyboard")
                        ShortcutRow(name: "Start", value: settings.startShortcut)
                        ShortcutRow(name: "Pause / Resume", value: settings.pauseShortcut)
                        ShortcutRow(name: "Stop", value: settings.stopShortcut)
                        ShortcutRow(name: "Toggle Camera", value: settings.cameraShortcut)
                        ShortcutRow(name: "Toggle Microphone", value: settings.micShortcut)
                    }
                }

                // Storage
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        sectionHeader("Storage", icon: "externaldrive.fill")
                        HStack {
                            Text(settings.outputDirectory.path)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                                .truncationMode(.middle)
                            Spacer()
                            Button("Change…") {
                                chooseOutputDirectory()
                            }
                        }
                        Toggle("Auto-hide control bar", isOn: $settings.autoHideControlBar)
                    }
                }
            }
            .padding(24)
            .onChange(of: overlay) { _, newValue in
                SettingsStore.shared.cameraOverlay = newValue
            }
        }
    }

    private func sectionHeader(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.headline)
            .foregroundColor(.secondary)
    }

    private var settingsCodecBinding: Binding<String> {
        Binding(get: { settings.codec }, set: { settings.codec = $0 })
    }

    private var qualityBinding: Binding<Double> {
        Binding(get: { Double(settings.quality) }, set: { settings.quality = Int($0) })
    }

    private var micVolumeBinding: Binding<Double> {
        Binding(get: { Double(settings.micVolume) }, set: { settings.micVolume = Float($0) })
    }

    private func chooseOutputDirectory() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Choose"
        if panel.runModal() == .OK, let url = panel.url {
            settings.outputDirectory = url
        }
    }
}

struct ShortcutRow: View {
    let name: String
    let value: String

    var body: some View {
        HStack {
            Text(name)
            Spacer()
            Text(value)
                .font(.system(.callout, design: .monospaced))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(RoundedRectangle(cornerRadius: 6).fill(Color.white.opacity(0.08)))
        }
    }
}
