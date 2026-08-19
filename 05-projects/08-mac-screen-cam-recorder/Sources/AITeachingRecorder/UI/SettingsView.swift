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
                        Picker("Layout", selection: $overlay.layout) {
                            ForEach(CameraLayout.allCases) { l in
                                Text(l.displayName).tag(l)
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
                        Divider()
                        Picker("Color filter", selection: $overlay.filterPreset) {
                            ForEach(CameraFilterPreset.allCases) { f in
                                Text(f.displayName).tag(f)
                            }
                        }
                        Toggle("Beauty", isOn: $overlay.beauty.enabled)
                        if overlay.beauty.enabled {
                            VStack(alignment: .leading, spacing: 6) {
                                HStack { Text("Whitening"); Spacer(); Text("\(Int(overlay.beauty.whitening * 100))%").foregroundColor(.secondary).font(.caption) }
                                Slider(value: $overlay.beauty.whitening, in: 0...1)
                                HStack { Text("Blush"); Spacer(); Text("\(Int(overlay.beauty.blush * 100))%").foregroundColor(.secondary).font(.caption) }
                                Slider(value: $overlay.beauty.blush, in: 0...1)
                                HStack { Text("Clarity"); Spacer(); Text("\(Int(overlay.beauty.clarity * 100))%").foregroundColor(.secondary).font(.caption) }
                                Slider(value: $overlay.beauty.clarity, in: 0...1)
                                HStack { Text("Smooth"); Spacer(); Text("\(Int(overlay.beauty.smooth * 100))%").foregroundColor(.secondary).font(.caption) }
                                Slider(value: $overlay.beauty.smooth, in: 0...1)
                            }
                            .padding(.leading, 8)
                        }
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
                        Toggle("Show mouse click effects", isOn: $settings.showMouseClicks)
                        Picker("Countdown before recording", selection: $settings.countdown) {
                            Text("None").tag(0)
                            Text("3 seconds").tag(3)
                            Text("5 seconds").tag(5)
                            Text("10 seconds").tag(10)
                        }
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

                // Teaching
                GlassCard {
                    VStack(alignment: .leading, spacing: 12) {
                        sectionHeader("Teaching Annotations", icon: "pencil.tip")
                        Toggle("Enable annotations while recording", isOn: $settings.annotationsEnabled)
                        if settings.annotationsEnabled {
                            Picker("Default tool", selection: $settings.annotationTool) {
                                ForEach(AnnotationTool.allCases) { t in
                                    Text(t.displayName).tag(t.rawValue)
                                }
                            }
                            Picker("Default color", selection: $settings.annotationColorHex) {
                                Text("Red").tag("#FF3B30")
                                Text("Orange").tag("#FF9500")
                                Text("Yellow").tag("#FFCC00")
                                Text("Green").tag("#34C759")
                                Text("Blue").tag("#32ADE6")
                                Text("Purple").tag("#AF52DE")
                                Text("White").tag("#FFFFFF")
                            }
                            HStack {
                                Text("Line width")
                                Spacer()
                                Slider(value: $settings.annotationWidth, in: 2...16, step: 1).frame(width: 160)
                            }
                        }
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
        panel.canCreateDirectories = true
        panel.prompt = "Select"
        panel.message = "Choose where recordings are saved."
        // Default to the current output folder so an accidental "Select" never
        // silently moves recordings to ~/Documents or another wrong location.
        panel.directoryURL = settings.outputDirectory
        guard panel.runModal() == .OK, let url = panel.url else { return }
        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: url.path, isDirectory: &isDir), isDir.boolValue else { return }
        settings.outputDirectory = url
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
