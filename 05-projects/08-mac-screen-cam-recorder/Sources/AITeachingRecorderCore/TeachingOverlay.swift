import Foundation
import CoreGraphics

// MARK: - Teaching overlay state (V0.2)
//
// Describes the per-frame state the compositor needs to bake the keyboard OSD
// and the mouse spotlight into the final video. Produced by RecorderController
// on the screen-capture queue; consumed by CompositionRenderer.

public struct TeachingOverlayState {
    public var keyboardCombo: String?
    public var keyboardVisible: Bool
    public var spotlightEnabled: Bool
    public var spotlightRadius: CGFloat      // points
    public var spotlightOpacity: CGFloat     // 0...1
    public var mouseLocation: CGPoint        // global top-left-origin points

    public init(keyboardCombo: String? = nil,
                keyboardVisible: Bool = false,
                spotlightEnabled: Bool = false,
                spotlightRadius: CGFloat = 120,
                spotlightOpacity: CGFloat = 0.35,
                mouseLocation: CGPoint = .zero) {
        self.keyboardCombo = keyboardCombo
        self.keyboardVisible = keyboardVisible
        self.spotlightEnabled = spotlightEnabled
        self.spotlightRadius = spotlightRadius
        self.spotlightOpacity = spotlightOpacity
        self.mouseLocation = mouseLocation
    }

    public var hasAnyOverlay: Bool {
        (keyboardVisible && !(keyboardCombo?.isEmpty ?? true)) || spotlightEnabled
    }
}

// MARK: - Keyboard combo label builder (pure, unit-testable)

/// Builds the on-screen label shown by the keyboard OSD, e.g. "⌘K" / "⌘⇧P".
public enum KeyboardComboLabel {
    /// Standard modifier prefix in display order: ⌃ ⌥ ⇧ ⌘
    public static func modifierPrefix(_ flags: CGEventFlags) -> String {
        var parts: [String] = []
        if flags.contains(.maskControl) { parts.append("⌃") }
        if flags.contains(.maskAlternate) { parts.append("⌥") }
        if flags.contains(.maskShift) { parts.append("⇧") }
        if flags.contains(.maskCommand) { parts.append("⌘") }
        return parts.joined()
    }

    /// Fallback display names for non-character key codes (ANSI layout).
    public static let keyNameByCode: [Int: String] = [
        36: "Return", 48: "Tab", 51: "Delete", 53: "Esc", 49: "Space",
        123: "←", 124: "→", 125: "↓", 126: "↑",
        122: "F1", 120: "F2", 99: "F3", 118: "F4", 96: "F5", 97: "F6",
        98: "F7", 100: "F8", 101: "F9", 109: "F10", 103: "F11", 111: "F12",
        115: "Home", 119: "End", 116: "PgUp", 121: "PgDn",
        0: "A", 11: "B", 8: "C", 2: "D", 14: "E", 3: "F", 5: "G", 4: "H",
        34: "I", 38: "J", 40: "K", 37: "L", 46: "M", 45: "N", 31: "O", 35: "P",
        12: "Q", 15: "R", 1: "S", 17: "T", 32: "U", 9: "V", 13: "W", 7: "X",
        16: "Y", 6: "Z"
    ]

    /// Builds the label for a key event.
    /// - Parameters:
    ///   - keyCode: virtual key code
    ///   - flags: modifier flags (from the event)
    ///   - unicode: optional unicode character produced by the event
    public static func label(keyCode: CGKeyCode, flags: CGEventFlags, unicode: String?) -> String {
        let prefix = modifierPrefix(flags)
        let code = Int(keyCode)

        // Letter keys: use the fixed ANSI map so the display is stable ("K", not "k").
        if let key = keyNameByCode[code], key.count == 1, key.range(of: "[A-Z]", options: .regularExpression) != nil {
            return prefix + key
        }
        // Character keys (non-whitespace): uppercase if alphanumeric.
        let normalized = (unicode ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !normalized.isEmpty {
            let scalar = normalized.unicodeScalars
            if scalar.count == 1, let first = scalar.first, CharacterSet.alphanumerics.contains(first) {
                return prefix + normalized.uppercased()
            }
            return prefix + normalized
        }
        // Named keys (Space / Return / Esc / arrows / F-keys …).
        if let key = keyNameByCode[code] {
            return prefix + key
        }
        return prefix.isEmpty ? "⌨" : prefix
    }
}
