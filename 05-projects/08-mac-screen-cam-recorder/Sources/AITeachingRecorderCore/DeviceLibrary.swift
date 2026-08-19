import Foundation

/// Public device enumeration (CameraEngine/MicEngine are internal to Core).
public enum DeviceLibrary {
    public static func listCameras() -> [CameraDeviceInfo] {
        CameraEngine.listDevices()
    }

    public static func listMicrophones() -> [CameraDeviceInfo] {
        MicEngine.listDevices()
    }
}
