import SwiftUI
import AppKit
import AITeachingRecorderCore

/// Floating toolbar for teaching annotations (pen/arrow/rect/ellipse/text/eraser).
struct DrawingToolbarView: View {
    @EnvironmentObject private var controller: AnnotationController

    var body: some View {
        HStack(spacing: 8) {
            ForEach(AnnotationTool.allCases) { tool in
                ToolButton(tool: tool, selected: controller.tool == tool) {
                    controller.tool = tool
                }
            }
            Divider().frame(height: 28)
            ForEach(Palette.colors) { color in
                ColorButton(color: color, selected: controller.colorHex == color.hex) {
                    controller.colorHex = color.hex
                }
            }
            Divider().frame(height: 28)
            Slider(value: $controller.lineWidth, in: 2...16, step: 1).frame(width: 70)
            Button {
                minimizeToolbar()
            } label: {
                Image(systemName: "minus")
            }
            .buttonStyle(.plain)
            .help("Minimize")
            Button {
                controller.clear()
            } label: {
                Image(systemName: "trash")
            }
            .buttonStyle(.plain)
            .help("Clear all")
            Button {
                controller.setDrawingEnabled(false)
                controller.hide()
            } label: {
                Image(systemName: "xmark")
            }
            .buttonStyle(.plain)
            .help("Close")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(barBackground)
    }

    private func minimizeToolbar() {
        if let window = NSApp.windows.first(where: { $0.title == AnnotationController.toolbarTitle }) {
            window.miniaturize(nil)
        }
    }

    private var barBackground: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(.ultraThinMaterial)
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.15), lineWidth: 1))
            .shadow(color: .black.opacity(0.2), radius: 10, y: 3)
    }
}

private struct ToolButton: View {
    let tool: AnnotationTool
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: tool.iconName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(selected ? .white : .white.opacity(0.6))
                .frame(width: 30, height: 30)
                .background(RoundedRectangle(cornerRadius: 8)
                    .fill(selected ? Color.accentColor : Color.white.opacity(0.08)))
        }
        .buttonStyle(.plain)
        .help(tool.displayName)
    }
}

private struct Palette {
    struct ColorOption: Identifiable {
        let hex: String
        let name: String
        var id: String { hex }
    }

    static let colors: [ColorOption] = [
        ColorOption(hex: "#FF3B30", name: "Red"),
        ColorOption(hex: "#FF9500", name: "Orange"),
        ColorOption(hex: "#FFCC00", name: "Yellow"),
        ColorOption(hex: "#34C759", name: "Green"),
        ColorOption(hex: "#32ADE6", name: "Blue"),
        ColorOption(hex: "#AF52DE", name: "Purple"),
        ColorOption(hex: "#FFFFFF", name: "White"),
        ColorOption(hex: "#111111", name: "Black")
    ]
}

private struct ColorButton: View {
    let color: Palette.ColorOption
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Circle()
                .fill(SwiftColor(hex: color.hex))
                .frame(width: 18, height: 18)
                .overlay(Circle().stroke(selected ? Color.white : Color.white.opacity(0.2),
                                         lineWidth: selected ? 2 : 1))
        }
        .buttonStyle(.plain)
        .help(color.name)
    }

    private func SwiftColor(hex: String) -> Color {
        let ns = NSColor(hex: hex) ?? .white
        return Color(nsColor: ns)
    }
}
