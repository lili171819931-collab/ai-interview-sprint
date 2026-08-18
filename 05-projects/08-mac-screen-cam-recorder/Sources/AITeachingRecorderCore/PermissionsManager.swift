import Foundation
import AppKit
import AVFoundation
import CoreGraphics

public enum PermissionStatus: Equatable {
    case notDetermined
    case granted
    case denied
    case restricted
}

/// Central place for the three system permissions the recorder needs.
public final class PermissionsManager {
    public static let shared = PermissionsManager()

    public init() {}

    // MARK: Screen recording (TCC, CoreGraphics)

    public var screenRecordingStatus: PermissionStatus {
        if #available(macOS 10.15, *) {
            return CGPreflightScreenCaptureAccess() ? .granted : .notDetermined
        }
        return .notDetermined
    }

    @discardableResult
    public func requestScreenRecording() -> Bool {
        if #available(macOS 10.15, *) {
            return CGRequestScreenCaptureAccess()
        }
        return false
    }

    public func openScreenRecordingSettings() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture") {
            NSWorkspace.shared.open(url)
        }
    }

    // MARK: Camera / Microphone (AVFoundation)

    public func cameraStatus(for mediaType: AVMediaType = .video) -> PermissionStatus {
        switch AVCaptureDevice.authorizationStatus(for: mediaType) {
        case .notDetermined: return .notDetermined
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .restricted
        @unknown default: return .notDetermined
        }
    }

    public func microphoneStatus() -> PermissionStatus {
        cameraStatus(for: .audio)
    }

    public func requestCamera() async -> Bool {
        await AVCaptureDevice.requestAccess(for: .video)
    }

    public func requestMicrophone() async -> Bool {
        await AVCaptureDevice.requestAccess(for: .audio)
    }

    public func openCameraSettings() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera") {
            NSWorkspace.shared.open(url)
        }
    }

    public func openMicrophoneSettings() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone") {
            NSWorkspace.shared.open(url)
        }
    }

    // MARK: Overall readiness

    public struct Readiness: Equatable {
        public let screen: PermissionStatus
        public let camera: PermissionStatus
        public let microphone: PermissionStatus
        public var allGranted: Bool {
            screen == .granted && camera == .granted && microphone == .granted
        }
    }

    public func readiness() -> Readiness {
        Readiness(screen: screenRecordingStatus, camera: cameraStatus(), microphone: microphoneStatus())
    }
}
