import SwiftUI
import AppKit
import AITeachingRecorderCore

/// The always-on-top control bar shown while recording.
/// It is excluded from the recording via SCContentFilter window exclusion.
struct FloatingControlBarView: View {
    @ObservedObject var controller = RecorderController.shared
    @State private var compact = false
    @State private var mouseTimer: Timer?

    var body: some View {
        HStack(spacing: 10) {
            // Record indicator + timer
            HStack(spacing: 6) {
                Circle()
                    .fill(controller.isPaused ? Color.orange : Color.red)
                    .frame(width: 10, height: 10)
                Text(controller.elapsed.recorderTimeString)
                    .font(.system(.callout, design: .monospaced).weight(.semibold))
                    .foregroundColor(.white)
                    .monospacedDigit()
            }
            .padding(.leading, 4)

            if !compact {
                Divider().frame(height: 22).overlay(Color.white.opacity(0.25))

                ControlBarButton(systemName: controller.micRunning ? "mic.fill" : "mic.slash.fill",
                                 active: controller.micRunning,
                                 help: "Toggle Microphone (⌘⇧M)") {
                    controller.toggleMicrophone()
                }

                ControlBarButton(systemName: controller.cameraRunning ? "video.fill" : "video.slash.fill",
                                 active: controller.cameraRunning,
                                 help: "Toggle Camera (⌘⇧C)") {
                    controller.toggleCamera()
                }

                ControlBarButton(systemName: controller.isPaused ? "play.fill" : "pause.fill",
                                 active: !controller.isPaused,
                                 help: controller.isPaused ? "Resume (⌘⇧P)" : "Pause (⌘⇧P)") {
                    if controller.isPaused { controller.resume() } else { controller.pause() }
                }

                ControlBarButton(systemName: "stop.fill",
                                 active: false,
                                 destructive: true,
                                 help: "Stop & Save (⌘⇧S)") {
                    controller.stop()
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.25), radius: 12, y: 4)
        )
        .frame(width: compact ? 150 : 340)
        .animation(.easeInOut(duration: 0.2), value: compact)
        .onAppear { startMouseTimer() }
        .onDisappear { mouseTimer?.invalidate() }
    }

    private func startMouseTimer() {
        mouseTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            guard SettingsStore.shared.autoHideControlBar else {
                compact = false
                return
            }
            let mouse = NSEvent.mouseLocation
            guard let window = NSApp.windows.first(where: { $0.title == AppDelegate.controlBarTitle }) else { return }
            let windowFrame = window.frame
            let padded = windowFrame.insetBy(dx: -30, dy: -30)
            let near = padded.contains(mouse)
            withAnimation(.easeInOut(duration: 0.2)) {
                compact = !near
            }
        }
        RunLoop.main.add(mouseTimer!, forMode: .common)
    }
}

struct ControlBarButton: View {
    let systemName: String
    var active: Bool
    var destructive = false
    let help: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(active ? .white : (destructive ? .white : .white.opacity(0.45)))
                .frame(width: 30, height: 30)
                .background(
                    Circle()
                        .fill(active ? (destructive ? Color.red.opacity(0.85) : Color.white.opacity(0.18))
                                     : Color.black.opacity(0.2))
                )
        }
        .buttonStyle(.plain)
        .help(help)
    }
}
