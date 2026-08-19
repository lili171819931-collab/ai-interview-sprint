import SwiftUI
import AITeachingRecorderCore

struct MainView: View {
    @Binding var selection: MainSection
    @EnvironmentObject private var controller: RecorderController

    var body: some View {
        NavigationSplitView {
            List(MainSection.allCases, selection: $selection) { section in
                Label(section.title, systemImage: section.icon)
                    .tag(section)
            }
            .listStyle(.sidebar)
            .navigationSplitViewColumnWidth(min: 170, ideal: 190)
            .safeAreaInset(edge: .bottom) {
                statusFooter
            }
        } detail: {
            switch selection {
            case .home: HomeView()
            case .recordings: RecordingsView()
            case .timeline: TimelineView()
            case .settings: SettingsView()
            case .selftest: SelfTestView()
            }
        }
        .frame(minWidth: 960, minHeight: 680)
        .navigationTitle("AI Teaching Recorder")
        .onChange(of: controller.phase) { _, newPhase in
            if !newPhase.isActive, let delegate = NSApp.delegate as? AppDelegate {
                delegate.hideControlBar()
                delegate.hideCameraPanel()
                delegate.hideAnnotationOverlay()
                controller.drawingImageProvider = nil
            }
        }
    }

    private var statusFooter: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle()
                    .fill(controller.phase.isActive ? Color.green : Color.secondary.opacity(0.5))
                    .frame(width: 8, height: 8)
                Text(controller.phase.displayName)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            if case .error(let err) = controller.phase {
                Text(err.userMessage)
                    .font(.caption2)
                    .foregroundColor(.red)
                    .lineLimit(3)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
