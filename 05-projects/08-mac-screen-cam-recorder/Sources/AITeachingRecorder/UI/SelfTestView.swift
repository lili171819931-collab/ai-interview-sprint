import SwiftUI
import AITeachingRecorderCore

struct SelfTestView: View {
    @State private var isRunning = false
    @State private var report: SelfTestReport?

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Self Test").font(.title2.weight(.bold))

            GlassCard {
                VStack(alignment: .leading, spacing: 10) {
                    Text("End-to-end recording check")
                        .font(.headline)
                    Text("Records a 5-second clip of your entire screen with camera + microphone (if available) and verifies the resulting MP4. Grant permissions first — you can use the Home tab.")
                        .font(.callout)
                        .foregroundColor(.secondary)
                    HStack {
                        if isRunning {
                            ProgressView()
                                .controlSize(.small)
                            Text("Recording & verifying…")
                                .font(.callout)
                                .foregroundColor(.secondary)
                        } else if let report {
                            Text(report.passed ? "All checks passed ✅" : "Some checks failed ❌")
                                .font(.headline)
                                .foregroundColor(report.passed ? .green : .red)
                        }
                        Spacer()
                        Button {
                            run()
                        } label: {
                            Label(isRunning ? "Running…" : "Run Self Test", systemImage: "testtube.2")
                        }
                        .disabled(isRunning)
                    }
                }
            }

            if let report {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(report.checks) { check in
                        HStack(alignment: .top, spacing: 8) {
                            Text(mark(for: check.status))
                                .font(.system(size: 13))
                            VStack(alignment: .leading, spacing: 1) {
                                Text(check.name).font(.callout.weight(.medium))
                                if !check.detail.isEmpty {
                                    Text(check.detail)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            Spacer()
                        }
                        .padding(8)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Color(nsColor: .controlBackgroundColor)))
                    }
                }

                if let url = report.outputURL {
                    HStack {
                        Text("Test file: \(url.path)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                        Spacer()
                        Button("Open") { FileOutputManager.shared.open(url) }
                        Button("Show in Finder") { FileOutputManager.shared.revealInFinder(url) }
                    }
                }
            }
        }
        .padding(24)
    }

    private func mark(for status: SelfTestCheck.Status) -> String {
        switch status {
        case .passed: return "✅"
        case .failed: return "❌"
        case .skipped: return "⏭️"
        case .pending: return "…"
        }
    }

    private func run() {
        isRunning = true
        report = nil
        Task {
            let result = await SelfTestRunner.run(targetDuration: 5)
            await MainActor.run {
                report = result
                isRunning = false
            }
        }
    }
}
