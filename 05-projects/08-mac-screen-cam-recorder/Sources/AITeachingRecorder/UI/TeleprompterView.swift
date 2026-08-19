import SwiftUI
import AppKit
import AITeachingRecorderCore

/// Drives teleprompter scrolling (points-per-second) on a 30 fps timer.
/// All state lives in this model; the panel just hosts the SwiftUI view.
final class TeleprompterModel: ObservableObject {
    @Published var script: String {
        didSet { SettingsStore.shared.teleprompterScript = script }
    }
    @Published var fontSize: Double {
        didSet { SettingsStore.shared.teleprompterFontSize = fontSize }
    }
    @Published var speed: Double {          // points per second
        didSet { SettingsStore.shared.teleprompterSpeed = speed }
    }
    @Published var isPlaying = true
    @Published private(set) var offset: CGFloat = 0

    private var timer: Timer?

    init() {
        let settings = SettingsStore.shared
        script = settings.teleprompterScript
        fontSize = settings.teleprompterFontSize
        speed = settings.teleprompterSpeed
        startTimer()
    }

    func togglePlay() {
        isPlaying.toggle()
        if isPlaying { startTimer() } else { stopTimer() }
    }

    func reset() {
        offset = 0
    }

    func restart() {
        offset = 0
        isPlaying = true
        startTimer()
    }

    private func startTimer() {
        stopTimer()
        let t = Timer(timeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            guard let self, self.isPlaying else { return }
            self.offset += CGFloat(self.speed / 30.0)
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    deinit {
        timer?.invalidate()
    }
}

/// Floating teleprompter window content: scrolling script + minimal controls.
struct TeleprompterView: View {
    @ObservedObject var model = TeleprompterModel()
    var onClose: () -> Void = {}

    var body: some View {
        VStack(spacing: 0) {
            // Script area
            GeometryReader { geo in
                ZStack {
                    Color.black.opacity(0.82)
                    ScrollView([.horizontal, .vertical], showsIndicators: true) {
                        Text(model.script)
                            .font(.system(size: CGFloat(model.fontSize), weight: .regular, design: .rounded))
                            .foregroundColor(.white)
                            .lineSpacing(CGFloat(model.fontSize) * 0.55)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .offset(y: -model.offset)
                    }
                    // Reading line
                    Rectangle()
                        .fill(Color.yellow.opacity(0.7))
                        .frame(height: 2)
                        .frame(maxHeight: .infinity, alignment: .center)
                        .allowsHitTesting(false)
                }
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
            }

            // Controls
            HStack(spacing: 10) {
                Button {
                    model.togglePlay()
                } label: {
                    Image(systemName: model.isPlaying ? "pause.fill" : "play.fill")
                        .frame(width: 18)
                }
                .help(model.isPlaying ? "Pause" : "Play")

                Button {
                    model.restart()
                } label: {
                    Image(systemName: "backward.end.fill")
                }
                .help("Restart")

                Divider().frame(height: 18)

                Text("Speed")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Slider(value: $model.speed, in: 5...300)
                    .frame(width: 110)
                Text("\(Int(model.speed))")
                    .font(.caption2.monospacedDigit())
                    .foregroundColor(.secondary)
                    .frame(width: 32, alignment: .trailing)

                Divider().frame(height: 18)

                Text("Font")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Slider(value: $model.fontSize, in: 12...60)
                    .frame(width: 90)

                Spacer()

                Button {
                    onClose()
                } label: {
                    Image(systemName: "xmark")
                }
                .help("Close teleprompter")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.black.opacity(0.5))
        }
        .frame(width: 560, height: 360)
        .background(Color.black.opacity(0.05))
    }
}
