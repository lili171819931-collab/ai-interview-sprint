import SwiftUI
import AppKit
import AITeachingRecorderCore

struct RecordingsView: View {
    @State private var recordings: [RecordingSummary] = []
    @State private var refreshID = UUID()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Recordings").font(.title2.weight(.bold))
                    Text(SettingsStore.shared.outputDirectory.path)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                Spacer()
                Button {
                    refresh()
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .help("Refresh")
            }

            if recordings.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "film.stack")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    Text("No recordings yet")
                        .font(.headline)
                    Text("Recordings are saved automatically to the folder above.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(recordings) { rec in
                            RecordingRow(summary: rec) {
                                refresh()
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding(24)
        .onAppear { refresh() }
        .id(refreshID)
    }

    private func refresh() {
        let urls = FileOutputManager.shared.listRecordings()
        recordings = urls.compactMap { FileOutputManager.shared.summary(for: $0) }
    }
}

struct RecordingRow: View {
    let summary: RecordingSummary
    let onDeleted: () -> Void
    @State private var confirmDelete = false

    var body: some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 8)
                .fill(LinearGradient(colors: [.blue.opacity(0.7), .purple.opacity(0.7)],
                                     startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 54, height: 36)
                .overlay(Image(systemName: "play.fill").foregroundColor(.white))

            VStack(alignment: .leading, spacing: 3) {
                Text(summary.url.deletingPathExtension().lastPathComponent)
                    .font(.callout.weight(.medium))
                    .lineLimit(1)
                HStack(spacing: 8) {
                    Text(summary.createdAt.formatted(date: .abbreviated, time: .shortened))
                    Text("·")
                    Text(summary.duration.recorderTimeString)
                    if summary.width > 0 {
                        Text("·")
                        Text("\(summary.width)×\(summary.height)")
                    }
                    if summary.hasCamera || summary.hasMicrophone || summary.hasSystemAudio {
                        Text("·")
                        HStack(spacing: 3) {
                            if summary.hasCamera { Image(systemName: "video.fill") }
                            if summary.hasMicrophone { Image(systemName: "mic.fill") }
                            if summary.hasSystemAudio { Image(systemName: "speaker.wave.2.fill") }
                        }
                    }
                }
                .font(.caption2)
                .foregroundColor(.secondary)
            }

            Spacer()

            Text(summary.fileSizeString)
                .font(.caption)
                .foregroundColor(.secondary)

            Button {
                FileOutputManager.shared.open(summary.url)
            } label: {
                Image(systemName: "play.circle")
            }
            .help("Play")

            Button {
                FileOutputManager.shared.revealInFinder(summary.url)
            } label: {
                Image(systemName: "folder")
            }
            .help("Show in Finder")

            Button(role: .destructive) {
                confirmDelete = true
            } label: {
                Image(systemName: "trash")
            }
            .help("Delete")
            .confirmationDialog("Delete this recording?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    try? FileOutputManager.shared.delete(summary.url)
                    onDeleted()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color(nsColor: .controlBackgroundColor)))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.06), lineWidth: 1))
    }
}
