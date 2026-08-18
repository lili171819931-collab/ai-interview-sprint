import SwiftUI
import AppKit
import ScreenCaptureKit
import AITeachingRecorderCore

/// Visual window picker (thumbnails) for Window capture mode, linked to the Start button via `selection`.
struct WindowPickerView: View {
    let windows: [WindowInfo]
    @Binding var selection: CGWindowID?
    @State private var thumbnails: [CGWindowID: NSImage] = [:]
    @State private var loading = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Select a window to record")
                    .font(.callout.weight(.medium))
                Spacer()
                Button {
                    Task { await loadThumbnails() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(loading)
                .help("Refresh window thumbnails")
            }

            if windows.isEmpty {
                Text("No windows available")
                    .font(.callout)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                ScrollView(.horizontal) {
                    LazyHStack(spacing: 12) {
                        ForEach(windows) { w in
                            windowCard(w)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .frame(height: 168)
            }
        }
        .onAppear {
            Task { await loadThumbnails() }
        }
    }

    private func windowCard(_ w: WindowInfo) -> some View {
        let selected = selection == w.id
        return Button {
            selection = w.id
        } label: {
            VStack(spacing: 6) {
                Group {
                    if let img = thumbnails[w.id] {
                        Image(nsImage: img)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } else {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.white.opacity(0.08))
                            .overlay(Image(systemName: "appwindow")
                                .font(.system(size: 28))
                                .foregroundColor(.secondary))
                    }
                }
                .frame(width: 200, height: 120)
                .clipShape(RoundedRectangle(cornerRadius: 8))

                Text(w.displayName)
                    .font(.caption)
                    .lineLimit(1)
                    .frame(width: 200)
            }
            .padding(8)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(selected ? Color.accentColor.opacity(0.18) : Color(nsColor: .controlBackgroundColor))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selected ? Color.accentColor : Color.white.opacity(0.08),
                            lineWidth: selected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
        .help(w.displayName)
    }

    private func loadThumbnails() async {
        loading = true
        defer { loading = false }
        for w in windows {
            if thumbnails[w.id] == nil, let img = await captureThumbnail(windowID: w.id) {
                thumbnails[w.id] = img
            }
        }
    }

    private func captureThumbnail(windowID: CGWindowID) async -> NSImage? {
        guard let content = try? await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true),
              let window = content.windows.first(where: { $0.windowID == windowID }) else { return nil }
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let config = SCStreamConfiguration()
        config.width = 400
        config.height = 240
        config.showsCursor = false
        guard let cg = try? await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config) else { return nil }
        return NSImage(cgImage: cg, size: NSSize(width: 400, height: 240))
    }
}
