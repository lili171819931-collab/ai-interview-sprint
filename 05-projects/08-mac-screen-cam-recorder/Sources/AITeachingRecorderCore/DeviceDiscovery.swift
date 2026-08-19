import Foundation
import CoreGraphics
import ScreenCaptureKit

/// Lists displays and windows for the recorder UI.
public enum DeviceDiscovery {
    /// Lists displays using ScreenCaptureKit (requires Screen Recording permission for full info;
    /// falls back to CoreGraphics otherwise).
    public static func listDisplays() async -> [DisplayInfo] {
        if let content = try? await SCShareableContent.current {
            return content.displays.map {
                DisplayInfo(id: $0.displayID,
                            name: "Display \($0.displayID)",
                            frame: $0.frame,
                            widthPixels: $0.width,
                            heightPixels: $0.height)
            }
        }
        return legacyDisplays()
    }

    /// Lists on-screen windows via ScreenCaptureKit when permitted, else CoreGraphics.
    public static func listWindows() async -> [WindowInfo] {
        if let content = try? await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true) {
            return content.windows
                .filter { $0.frame.width > 40 && $0.frame.height > 40 }
                .map { WindowInfo(id: $0.windowID,
                                  title: $0.title ?? "",
                                  ownerName: $0.owningApplication?.applicationName ?? "Unknown",
                                  frame: $0.frame,
                                  windowLayer: Int($0.windowLayer)) }
                .sorted { $0.ownerName.localizedCaseInsensitiveCompare($1.ownerName) == .orderedAscending }
        }
        return legacyWindows()
    }

    // MARK: Fallbacks (no screen-recording permission)

    private static func legacyDisplays() -> [DisplayInfo] {
        var result: [DisplayInfo] = []
        let maxDisplays: UInt32 = 16
        var ids = [CGDirectDisplayID](repeating: 0, count: Int(maxDisplays))
        var count: UInt32 = 0
        let err = CGGetActiveDisplayList(maxDisplays, &ids, &count)
        guard err == .success else { return result }
        for i in 0..<Int(count) {
            let id = ids[i]
            let bounds = CGDisplayBounds(id)
            result.append(DisplayInfo(id: id,
                                      name: "Display \(id)",
                                      frame: bounds,
                                      widthPixels: Int(CGDisplayPixelsWide(id)),
                                      heightPixels: Int(CGDisplayPixelsHigh(id))))
        }
        return result
    }

    private static func legacyWindows() -> [WindowInfo] {
        guard let infoList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
                as? [[String: Any]] else { return [] }
        var result: [WindowInfo] = []
        for info in infoList {
            guard let number = info[kCGWindowNumber as String] as? NSNumber,
                  let owner = info[kCGWindowOwnerName as String] as? String,
                  let boundsDict = info[kCGWindowBounds as String] as? [String: Any],
                  let width = boundsDict["Width"] as? CGFloat,
                  let height = boundsDict["Height"] as? CGFloat,
                  width > 40, height > 40 else { continue }
            let title = info[kCGWindowName as String] as? String ?? ""
            let layer = (info[kCGWindowLayer as String] as? NSNumber)?.intValue ?? 0
            let x = boundsDict["X"] as? CGFloat ?? 0
            let y = boundsDict["Y"] as? CGFloat ?? 0
            result.append(WindowInfo(id: CGWindowID(number.uint32Value),
                                     title: title,
                                     ownerName: owner,
                                     frame: CGRect(x: x, y: y, width: width, height: height),
                                     windowLayer: layer))
        }
        return result.sorted { $0.ownerName.localizedCaseInsensitiveCompare($1.ownerName) == .orderedAscending }
    }
}
