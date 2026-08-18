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

    public var id: String { rawValue }
    public var displayName: String {
        switch self {
        case .roundedRect: return "Rounded Rectangle"
        case .circle: return "Circle"
        }
    }
}

public enum OverlaySizePreset: String, Codable, CaseIterable, Identifiable {
    case small
    case medium
    case large

    public var id: String { rawValue }
    public var displayName: String { rawValue.capitalized }

    public var size: CGSize {
        switch self {
        case .small: return CGSize(width: 160, height: 120)
        case .medium: return CGSize(width: 240, height: 180)
        case .large: return CGSize(width: 320, height: 240)
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

    public init(
        enabled: Bool = true,
        mirror: Bool = true,
        shape: OverlayShape = .roundedRect,
        sizePreset: OverlaySizePreset = .medium,
        customSize: CGSize = CGSize(width: 240, height: 180),
        position: CGPoint = CGPoint(x: 80, y: 80),
        borderWidth: CGFloat = 2,
        borderColorHex: String = "#FFFFFF",
        shadow: Bool = true
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
    }

    public var resolvedSize: CGSize {
        switch sizePreset {
        case .small, .medium, .large: return sizePreset.size
        }
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

public struct RecordingSummary: Identifiable, Equatable {
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
