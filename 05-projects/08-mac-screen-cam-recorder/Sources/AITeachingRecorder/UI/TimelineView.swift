import SwiftUI
import AppKit
import UniformTypeIdentifiers
import AITeachingRecorderCore

/// Frame-level minimal timeline: load a recording, trim head/tail, detect and
/// remove silent gaps, then export a cleaned MP4.
struct TimelineView: View {
    @StateObject private var model = TimelineModel()
    @State private var recordings: [RecordingSummary] = []
    @State private var selectedRecording: RecordingSummary?
    @State private var chosenURL: URL?
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var statusIsError = false
    @State private var trimHeadSeconds = 0.0
    @State private var trimTailSeconds = 0.0
    @State private var minGap = 1.0
    @State private var threshold = 0.02

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header
            if model.sourceURL == nil {
                sourcePicker
            } else {
                timelineBody
            }
            statusLine
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear { refreshRecordings() }
    }

    // MARK: Header

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text("Timeline").font(.title2.weight(.bold))
                Text("Trim, remove silence, and re-export your recordings.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if model.sourceURL != nil {
                Button {
                    model.restoreAll()
                    statusMessage = ""
                } label: {
                    Label("Reset", systemImage: "arrow.counterclockwise")
                }
                .controlSize(.small)
                Button {
                    model.close()
                    statusMessage = ""
                } label: {
                    Label("Close", systemImage: "xmark")
                }
                .controlSize(.small)
            }
        }
    }

    // MARK: Source picker

    private var sourcePicker: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("1. Choose a recording")
                    .font(.headline)
                if recordings.isEmpty {
                    Text("No recordings found in the output folder yet.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Picker("Recording", selection: $selectedRecording) {
                        Text("Select…").tag(RecordingSummary?.none)
                        ForEach(recordings) { rec in
                            Text("\(rec.url.deletingPathExtension().lastPathComponent)  ·  \(rec.duration.recorderTimeString)")
                                .tag(Optional(rec))
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
                }
                HStack {
                    Button("Choose File…") {
                        chooseFile()
                    }
                    .controlSize(.small)
                    Button("Load") {
                        load(source: selectedRecording?.url ?? chosenURL)
                    }
                    .controlSize(.small)
                    .disabled(selectedRecording == nil && chosenURL == nil)
                    if isLoading {
                        ProgressView().controlSize(.small)
                    }
                }
            }
        }
    }

    // MARK: Timeline body

    private var timelineBody: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Bar visualization
            GlassCard(padding: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(model.sourceURL?.lastPathComponent ?? "")
                            .font(.callout.weight(.medium))
                            .lineLimit(1)
                        Spacer()
                        Text("Duration \(model.duration.recorderTimeString)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    timelineBar
                }
            }

            // Operations
            GlassCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text("2. Edit")
                        .font(.headline)

                    HStack(spacing: 14) {
                        Text("Trim head").font(.caption).foregroundColor(.secondary)
                        TextField("0", value: $trimHeadSeconds, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 70)
                        Button("Apply") {
                            model.trimHead(seconds: trimHeadSeconds)
                            statusMessage = "Trimmed \(String(format: "%.1f", trimHeadSeconds))s from the head."
                        }
                        .controlSize(.small)
                        Text("Trim tail").font(.caption).foregroundColor(.secondary)
                        TextField("0", value: $trimTailSeconds, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 70)
                        Button("Apply") {
                            model.trimTail(seconds: trimTailSeconds)
                            statusMessage = "Trimmed \(String(format: "%.1f", trimTailSeconds))s from the tail."
                        }
                        .controlSize(.small)
                    }

                    Divider()

                    HStack(spacing: 14) {
                        Text("Remove silence").font(.caption).foregroundColor(.secondary)
                        TextField("Min gap (s)", value: $minGap, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 80)
                        TextField("Threshold", value: $threshold, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 70)
                        Button {
                            Task {
                                statusMessage = "Detecting silence…"
                                do {
                                    try await model.detectSilence(threshold: Float(threshold),
                                                                  minGap: minGap,
                                                                  autoRemove: true)
                                    statusMessage = "Removed \(model.silentRanges.count) silent gap(s)."
                                } catch {
                                    statusMessage = "Detection failed: \(error.localizedDescription)"
                                    statusIsError = true
                                }
                            }
                        } label: {
                            Label("Detect & Remove", systemImage: "waveform")
                        }
                        .controlSize(.small)
                    }

                    if !model.silentRanges.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(model.silentRanges) { range in
                                    HStack(spacing: 4) {
                                        Text(String(format: "%.1f–%.1f", range.start, range.end))
                                            .font(.caption2.monospacedDigit())
                                        Button {
                                            model.toggleSilentRange(range)
                                        } label: {
                                            Image(systemName: range.removed ? "checkmark.circle.fill" : "circle")
                                        }
                                        .buttonStyle(.plain)
                                        .help(range.removed ? "Removed (click to restore)" : "Not removed (click to remove)")
                                    }
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(RoundedRectangle(cornerRadius: 6)
                                        .fill(range.removed ? Color.red.opacity(0.15) : Color.orange.opacity(0.15)))
                                }
                            }
                        }
                    }

                    Divider()

                    Text("3. Export")
                        .font(.headline)
                    HStack {
                        let kept = model.keptRanges.reduce(0) { $0 + $1.duration }
                        Text("Will export \(String(format: "%.1f", kept))s of \(String(format: "%.1f", model.duration))s")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Button {
                            export()
                        } label: {
                            Label("Export MP4…", systemImage: "square.and.arrow.up")
                        }
                        .controlSize(.large)
                        .disabled(model.keptRanges.isEmpty || model.exportState == .exporting)
                        if model.exportState == .exporting {
                            ProgressView().controlSize(.small)
                        }
                    }
                }
            }
        }
    }

    private var timelineBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.gray.opacity(0.2))
                ForEach(model.segments) { seg in
                    let w = max(1, geo.size.width * CGFloat(seg.duration / max(model.duration, 0.001)))
                    let x = geo.size.width * CGFloat(seg.start / max(model.duration, 0.001))
                    Capsule()
                        .fill(seg.removed ? Color.red.opacity(0.55) : Color.green.opacity(0.75))
                        .frame(width: w)
                        .offset(x: x)
                }
            }
            .frame(height: 18)
        }
        .frame(height: 18)
    }

    // MARK: Status

    private var statusLine: some View {
        HStack(spacing: 8) {
            if !statusMessage.isEmpty {
                Image(systemName: statusIsError ? "xmark.circle.fill" : "info.circle.fill")
                    .foregroundColor(statusIsError ? .red : .secondary)
                Text(statusMessage)
                    .font(.caption)
                    .foregroundColor(statusIsError ? .red : .secondary)
            }
            Spacer()
            if case .done(let url) = model.exportState {
                Button("Show in Finder") {
                    FileOutputManager.shared.revealInFinder(url)
                }
                .controlSize(.small)
            }
            if case .failed(let detail) = model.exportState {
                Text(detail).font(.caption).foregroundColor(.red)
            }
        }
    }

    // MARK: Actions

    private func refreshRecordings() {
        let urls = FileOutputManager.shared.listRecordings()
        recordings = urls.compactMap { FileOutputManager.shared.summary(for: $0) }
    }

    private func chooseFile() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.movie, .mpeg4Movie, .quickTimeMovie]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        if panel.runModal() == .OK, let url = panel.url {
            chosenURL = url
            load(source: url)
        }
    }

    private func load(source: URL?) {
        guard let source else { return }
        isLoading = true
        statusMessage = ""
        statusIsError = false
        Task {
            do {
                try await model.load(url: source)
                statusMessage = "Loaded \(source.lastPathComponent)."
            } catch {
                statusMessage = "Could not load: \(error.localizedDescription)"
                statusIsError = true
            }
            isLoading = false
        }
    }

    private func export() {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "\(model.sourceURL?.deletingPathExtension().lastPathComponent ?? "edited")-clean.mp4"
        panel.allowedContentTypes = [.mpeg4Movie]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        Task {
            statusMessage = "Exporting…"
            do {
                let result = try await model.export(to: url)
                statusMessage = "Exported to \(result.lastPathComponent)."
                statusIsError = false
            } catch {
                statusMessage = "Export failed: \(error.localizedDescription)"
                statusIsError = true
            }
        }
    }
}
