import SwiftUI
import AITeachingRecorderCore

@main
struct AITeachingRecorderApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var controller = RecorderController.shared
    @State private var selection: MainSection = .home

    var body: some Scene {
        WindowGroup {
            MainView(selection: $selection)
                .environmentObject(controller)
                .frame(minWidth: 960, minHeight: 680)
                .navigationTitle("AI Teaching Recorder")
        }
        .commands {
            CommandGroup(replacing: .newItem) {}
            CommandMenu("Record") {
                Button("Start / Stop Recording") {
                    toggleRecordingShortcut()
                }
                .keyboardShortcut("r", modifiers: [.command, .shift])
                Button("Pause / Resume") {
                    togglePauseShortcut()
                }
                .keyboardShortcut("p", modifiers: [.command, .shift])
                Button("Toggle Camera") {
                    controller.toggleCamera()
                }
                .keyboardShortcut("c", modifiers: [.command, .shift])
                Button("Toggle Microphone") {
                    controller.toggleMicrophone()
                }
                .keyboardShortcut("m", modifiers: [.command, .shift])
            }
            CommandMenu("Window") {
                Button("Show Control Bar") {
                    (NSApp.delegate as? AppDelegate)?.showControlBar()
                }
                .keyboardShortcut("0", modifiers: [.command, .option])
                Button("Show Camera Window") {
                    (NSApp.delegate as? AppDelegate)?.showCameraPanel()
                }
                .keyboardShortcut("1", modifiers: [.command, .option])
                Divider()
                Button("Minimize") {
                    NSApp.keyWindow?.miniaturize(nil)
                }
                .keyboardShortcut("m", modifiers: [.command])
                Button("Close Window") {
                    NSApp.keyWindow?.performClose(nil)
                }
                .keyboardShortcut("w", modifiers: [.command])
            }
        }
    }

    private func toggleRecordingShortcut() {
        switch controller.phase {
        case .idle, .completed, .error:
            Task {
                try? await controller.startWith(mode: .entireScreen,
                                                displayID: nil,
                                                windowID: nil,
                                                region: nil,
                                                excludedWindowIDs: appDelegate.excludedWindowIDs())
                appDelegate.showControlBar()
                if controller.cameraEnabled { appDelegate.showCameraPanel() }
            }
        case .recording, .paused:
            controller.stop()
        default:
            break
        }
    }

    private func togglePauseShortcut() {
        if controller.isPaused { controller.resume() } else if controller.phase == .recording { controller.pause() }
    }
}

enum MainSection: String, CaseIterable, Identifiable {
    case home, recordings, timeline, settings, selftest
    var id: String { rawValue }
    var title: String {
        switch self {
        case .home: return "Home"
        case .recordings: return "Recordings"
        case .settings: return "Settings"
        case .selftest: return "Self Test"
        case .timeline: return "Timeline"
        }
    }
    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .recordings: return "film.stack.fill"
        case .settings: return "gearshape.fill"
        case .selftest: return "checkmark.seal.fill"
        case .timeline: return "scissors"
        }
    }
}
