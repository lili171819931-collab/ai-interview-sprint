import Foundation
import CoreGraphics

// MARK: - Capture modes

public enum CaptureMode: String, Codable, CaseIterable, Identifiable {
    case entireScreen
    case display
    case window
    case region

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .entireScreen: return "Entire Screen"
        case .display: return "Display"
        case .window: return "Window"
        case .region: return "Region"
        }
    }
}

// MARK: - Camera overlay

public enum OverlayShape: String, Codable, CaseIterable, Identifiable {
    case roundedRect
    case circle
    case ellipse
    case square
    case diamond

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .roundedRect: return "Rounded Rectangle"
        case .circle: return "Circle"
        case .ellipse: return "Ellipse"
        case .square: return "Square"
        case .diamond: return "Diamond"
        }
    }
}

/// Where/how the camera appears in the recording (mirrors the web app's split modes).
public enum CameraLayout: String, Codable, CaseIterable, Identifiable {
    case floating        // free draggable PiP (default, 画中画)
    case topLeft
    case topRight
    case bottomLeft
    case bottomRight
    case topBar          // 上下分屏: camera as a full-width bar on top
    case bottomBar       // 上下分屏: camera as a full-width bar at the bottom
    case circle          // 圆形浮窗

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .floating: return "Floating PiP"
        case .topLeft: return "Top Left"
        case .topRight: return "Top Right"
        case .bottomLeft: return "Bottom Left"
        case .bottomRight: return "Bottom Right"
        case .topBar: return "Top Bar"
        case .bottomBar: return "Bottom Bar"
        case .circle: return "Circle"
        }
    }
}

public enum CameraFilterPreset: String, Codable, CaseIterable, Identifiable {
    case none
    case warm
    case cool
    case bw
    case retro

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .none: return "Original"
        case .warm: return "Warm"
        case .cool: return "Cool"
        case .bw: return "Black & White"
        case .retro: return "Retro"
        }
    }
}

/// Teaching annotation tools (integrated from the web app's annotation engine).
public enum AnnotationTool: String, Codable, CaseIterable, Identifiable {
    case pen
    case arrow
    case rect
    case ellipse
    case text
    case eraser

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .pen: return "Pen"
        case .arrow: return "Arrow"
        case .rect: return "Rectangle"
        case .ellipse: return "Ellipse"
        case .text: return "Text"
        case .eraser: return "Eraser"
        }
    }
    public var iconName: String {
        switch self {
        case .pen: return "pencil.tip"
        case .arrow: return "arrow.up.right"
        case .rect: return "rectangle"
        case .ellipse: return "circle"
        case .text: return "textformat"
        case .eraser: return "eraser"
        }
    }
}

/// Beauty adjustments applied to the camera before compositing (磨皮/美白/红润/清晰度).
public struct BeautySettings: Codable, Equatable {
    public var enabled: Bool
    public var whitening: Double    // 0...1
    public var blush: Double        // 0...1
    public var clarity: Double      // 0...1
    public var smooth: Double       // 0...1

    public init(enabled: Bool = false,
                whitening: Double = 0.3,
                blush: Double = 0.2,
                clarity: Double = 0.2,
                smooth: Double = 0.2) {
        self.enabled = enabled
        self.whitening = whitening
        self.blush = blush
        self.clarity = clarity
        self.smooth = smooth
    }
}

public enum OverlaySizePreset: String, Codable, CaseIterable, Identifiable {
    case small
    case medium
    case large
    case custom

    public var id: String { rawValue }
    public var displayName: String { rawValue.capitalized }

    public var size: CGSize {
        switch self {
        case .small: return CGSize(width: 160, height: 120)
        case .medium: return CGSize(width: 240, height: 180)
        case .large: return CGSize(width: 320, height: 240)
        case .custom: return CGSize(width: 240, height: 180)
        }
    }
}

public struct CameraOverlaySettings: Codable, Equatable {
    public var enabled: Bool
    public var mirror: Bool
    public var shape: OverlayShape
    public var sizePreset: OverlaySizePreset
    public var customSize: CGSize
    public var position: CGPoint      // top-left, in global display points
    public var borderWidth: CGFloat
    public var borderColorHex: String
    public var shadow: Bool
    public var layout: CameraLayout
    public var filterPreset: CameraFilterPreset
    public var beauty: BeautySettings

    public init(
        enabled: Bool = true,
        mirror: Bool = true,
        shape: OverlayShape = .roundedRect,
        sizePreset: OverlaySizePreset = .medium,
        customSize: CGSize = CGSize(width: 240, height: 180),
        position: CGPoint = CGPoint(x: 80, y: 80),
        borderWidth: CGFloat = 2,
        borderColorHex: String = "#FFFFFF",
        shadow: Bool = true,
        layout: CameraLayout = .floating,
        filterPreset: CameraFilterPreset = .none,
        beauty: BeautySettings = BeautySettings()
    ) {
        self.enabled = enabled
        self.mirror = mirror
        self.shape = shape
        self.sizePreset = sizePreset
        self.customSize = customSize
        self.position = position
        self.borderWidth = borderWidth
        self.borderColorHex = borderColorHex
        self.shadow = shadow
        self.layout = layout
        self.filterPreset = filterPreset
        self.beauty = beauty
    }

    /// Computes the camera overlay rect (in global display points) for a given layout.
    public func rect(for layout: CameraLayout, in frame: CGRect) -> CGRect {
        let size = resolvedSize
        let margin: CGFloat = 24
        switch layout {
        case .floating:
            return CGRect(origin: position, size: size)
        case .topLeft:
            return CGRect(x: frame.minX + margin, y: frame.minY + margin, width: size.width, height: size.height)
        case .topRight:
            return CGRect(x: frame.maxX - size.width - margin, y: frame.minY + margin, width: size.width, height: size.height)
        case .bottomLeft:
            return CGRect(x: frame.minX + margin, y: frame.maxY - size.height - margin, width: size.width, height: size.height)
        case .bottomRight:
            return CGRect(x: frame.maxX - size.width - margin, y: frame.maxY - size.height - margin, width: size.width, height: size.height)
        case .topBar:
            return CGRect(x: frame.minX, y: frame.minY, width: frame.width, height: size.height + 20)
        case .bottomBar:
            return CGRect(x: frame.minX, y: frame.maxY - size.height - 20, width: frame.width, height: size.height + 20)
        case .circle:
            let r = size.width
            return CGRect(x: frame.maxX - r - margin, y: frame.minY + margin, width: r, height: r)
        }
    }

    public var resolvedSize: CGSize {
        if sizePreset == .custom { return customSize }
        return sizePreset.size
    }
}

// MARK: - Recording configuration

public struct RecordingConfiguration: Codable, Equatable {
    public var mode: CaptureMode
    public var displayID: CGDirectDisplayID?
    public var windowID: CGWindowID?
    public var region: CGRect?            // in global display points
    public var width: Int
    public var height: Int
    public var fps: Int
    public var captureSystemAudio: Bool
    public var microphoneEnabled: Bool
    public var cameraEnabled: Bool
    public var cameraDeviceID: String?
    public var cameraOverlay: CameraOverlaySettings
    public var countdown: Int
    public var showMouseClicks: Bool
    public var outputURL: URL?

    public init(
        mode: CaptureMode = .entireScreen,
        displayID: CGDirectDisplayID? = nil,
        windowID: CGWindowID? = nil,
        region: CGRect? = nil,
        width: Int = 1920,
        height: Int = 1080,
        fps: Int = 30,
        captureSystemAudio: Bool = true,
        microphoneEnabled: Bool = true,
        cameraEnabled: Bool = true,
        cameraDeviceID: String? = nil,
        cameraOverlay: CameraOverlaySettings = CameraOverlaySettings(),
        countdown: Int = 0,
        showMouseClicks: Bool = false,
        outputURL: URL? = nil
    ) {
        self.mode = mode
        self.displayID = displayID
        self.windowID = windowID
        self.region = region
        self.width = width
        self.height = height
        self.fps = fps
        self.captureSystemAudio = captureSystemAudio
        self.microphoneEnabled = microphoneEnabled
        self.cameraEnabled = cameraEnabled
        self.cameraDeviceID = cameraDeviceID
        self.cameraOverlay = cameraOverlay
        self.countdown = countdown
        self.showMouseClicks = showMouseClicks
        self.outputURL = outputURL
    }
}

// MARK: - Devices

public struct CameraDeviceInfo: Identifiable, Equatable {
    public let id: String
    public let name: String
    public let isBuiltIn: Bool
    public let hasTorch: Bool

    public init(id: String, name: String, isBuiltIn: Bool = false, hasTorch: Bool = false) {
        self.id = id
        self.name = name
        self.isBuiltIn = isBuiltIn
        self.hasTorch = hasTorch
    }
}

public struct DisplayInfo: Identifiable, Equatable {
    public let id: CGDirectDisplayID
    public let name: String
    public let frame: CGRect       // global points
    public let widthPixels: Int
    public let heightPixels: Int

    public init(id: CGDirectDisplayID, name: String, frame: CGRect, widthPixels: Int, heightPixels: Int) {
        self.id = id
        self.name = name
        self.frame = frame
        self.widthPixels = widthPixels
        self.heightPixels = heightPixels
    }
}

public struct WindowInfo: Identifiable, Equatable {
    public let id: CGWindowID
    public let title: String
    public let ownerName: String
    public let frame: CGRect      // global points
    public let windowLayer: Int

    public init(id: CGWindowID, title: String, ownerName: String, frame: CGRect, windowLayer: Int) {
        self.id = id
        self.title = title
        self.ownerName = ownerName
        self.frame = frame
        self.windowLayer = windowLayer
    }

    public var displayName: String {
        if title.isEmpty { return ownerName }
        return "\(title) — \(ownerName)"
    }
}

// MARK: - Recording summary

public struct RecordingSummary: Identifiable, Equatable, Hashable {
    public let id: UUID
    public let url: URL
    public let duration: TimeInterval
    public let width: Int
    public let height: Int
    public let fps: Int
    public let hasCamera: Bool
    public let hasMicrophone: Bool
    public let hasSystemAudio: Bool
    public let createdAt: Date
    public let fileSize: Int64

    public init(
        id: UUID = UUID(),
        url: URL,
        duration: TimeInterval,
        width: Int,
        height: Int,
        fps: Int,
        hasCamera: Bool,
        hasMicrophone: Bool,
        hasSystemAudio: Bool,
        createdAt: Date,
        fileSize: Int64
    ) {
        self.id = id
        self.url = url
        self.duration = duration
        self.width = width
        self.height = height
        self.fps = fps
        self.hasCamera = hasCamera
        self.hasMicrophone = hasMicrophone
        self.hasSystemAudio = hasSystemAudio
        self.createdAt = createdAt
        self.fileSize = fileSize
    }

    public var fileSizeString: String {
        ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }
}
