import Foundation
import AVFoundation
import CoreMedia

/// Captures the microphone via AVCaptureSession and delivers LPCM audio CMSampleBuffers.
final class MicEngine: NSObject, @unchecked Sendable {
    private let session = AVCaptureSession()
    private var input: AVCaptureDeviceInput?
    private let output = AVCaptureAudioDataOutput()
    private let queue = DispatchQueue(label: "aitr.mic", qos: .userInitiated)

    var onSample: ((CMSampleBuffer) -> Void)?
    var onLevel: ((Float) -> Void)?
    var isRunning: Bool { session.isRunning }

    static func listDevices() -> [CameraDeviceInfo] {
        let discovery = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInMicrophone, .externalUnknown],
            mediaType: .audio,
            position: .unspecified
        )
        return discovery.devices.map {
            CameraDeviceInfo(id: $0.uniqueID, name: $0.localizedName, isBuiltIn: $0.position != .unspecified)
        }
    }

    static func defaultDevice() -> AVCaptureDevice? {
        AVCaptureDevice.default(for: .audio)
    }

    func start(deviceID: String?, sampleRate: Int) throws {
        guard let device: AVCaptureDevice = {
            if let deviceID, let d = AVCaptureDevice(uniqueID: deviceID) { return d }
            return Self.defaultDevice()
        }() else {
            throw RecorderError.deviceUnavailable("Microphone")
        }

        let newInput = try AVCaptureDeviceInput(device: device)
        session.beginConfiguration()
        session.sessionPreset = .high
        if session.canAddInput(newInput) {
            session.addInput(newInput)
        }
        output.setSampleBufferDelegate(self, queue: queue)
        if session.canAddOutput(output) {
            session.addOutput(output)
        }
        session.commitConfiguration()

        // Try to set a preferred sample rate on the device.
        try? device.lockForConfiguration()
        if device.supportsSessionPreset(.high) {
            // no-op
        }
        device.unlockForConfiguration()

        session.startRunning()
        input = newInput
    }

    func stop() {
        session.stopRunning()
        if let input {
            session.removeInput(input)
        }
        session.removeOutput(output)
        self.input = nil
    }
}

extension MicEngine: AVCaptureAudioDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput,
                       didOutput sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        onSample?(sampleBuffer)
        if let channel = connection.audioChannels.first {
            let level = channel.averagePowerLevel
            onLevel?(level)
        }
    }
}
