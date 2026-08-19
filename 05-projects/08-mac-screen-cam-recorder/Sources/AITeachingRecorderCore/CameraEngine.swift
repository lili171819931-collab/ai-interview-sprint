import Foundation
import AVFoundation
import CoreMedia

/// Captures a webcam via AVCaptureSession and delivers camera CMSampleBuffers.
final class CameraEngine: NSObject, @unchecked Sendable {
    private let session = AVCaptureSession()
    private var input: AVCaptureDeviceInput?
    private let output = AVCaptureVideoDataOutput()
    private let queue = DispatchQueue(label: "aitr.camera", qos: .userInitiated)

    var onSample: ((CMSampleBuffer) -> Void)?
    var onError: ((Error) -> Void)?
    var isRunning: Bool { session.isRunning }

    lazy var previewLayer: AVCaptureVideoPreviewLayer = {
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        return layer
    }()

    static func listDevices() -> [CameraDeviceInfo] {
        let discovery = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInWideAngleCamera, .externalUnknown],
            mediaType: .video,
            position: .unspecified
        )
        return discovery.devices.map {
            CameraDeviceInfo(id: $0.uniqueID,
                             name: $0.localizedName,
                             isBuiltIn: $0.position != .unspecified)
        }
    }

    static func defaultDevice() -> AVCaptureDevice? {
        AVCaptureDevice.default(for: .video)
    }

    func start(deviceID: String?, resolution: String, fps: Int) throws {
        guard let device: AVCaptureDevice = {
            if let deviceID, let d = AVCaptureDevice(uniqueID: deviceID) { return d }
            return Self.defaultDevice()
        }() else {
            throw RecorderError.deviceUnavailable("Camera")
        }

        try configure(device: device, resolution: resolution, fps: fps)

        let newInput = try AVCaptureDeviceInput(device: device)
        session.beginConfiguration()
        session.sessionPreset = .high
        if session.canAddInput(newInput) {
            session.addInput(newInput)
        }
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.alwaysDiscardsLateVideoFrames = true
        output.setSampleBufferDelegate(self, queue: queue)
        if session.canAddOutput(output) {
            session.addOutput(output)
        }
        session.commitConfiguration()

        if session.canSetSessionPreset(.high) {
            session.sessionPreset = .high
        }

        session.startRunning()
        input = newInput
    }

    private func configure(device: AVCaptureDevice, resolution: String, fps: Int) throws {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        let parts = resolution.split(separator: "x").compactMap { Int($0) }
        let targetWidth = parts.first ?? 1920
        let targetHeight = parts.count > 1 ? parts[1] : 1080

        // Prefer an exact-matching format; fall back to the highest available.
        var best: AVCaptureDevice.Format?
        var bestScore = -1
        for format in device.formats {
            let desc = format.formatDescription
            let dims = CMVideoFormatDescriptionGetDimensions(desc)
            let score: Int
            if Int(dims.width) == targetWidth && Int(dims.height) == targetHeight {
                score = 10000
            } else {
                score = Int(dims.width) * Int(dims.height)
            }
            if score > bestScore {
                bestScore = score
                best = format
            }
        }
        if let best {
            device.activeFormat = best
        }

        var selectedFPS = fps
        if let best, best.videoSupportedFrameRateRanges.first(where: { $0.maxFrameRate >= Double(fps) }) == nil {
            selectedFPS = Int(best.videoSupportedFrameRateRanges.first?.maxFrameRate ?? 30)
        }
        device.activeVideoMinFrameDuration = CMTime(value: 1, timescale: CMTimeScale(selectedFPS))
        device.activeVideoMaxFrameDuration = CMTime(value: 1, timescale: CMTimeScale(selectedFPS))
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

extension CameraEngine: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput,
                       didOutput sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        onSample?(sampleBuffer)
    }

    func captureOutput(_ output: AVCaptureOutput,
                       didDrop sampleBuffer: CMSampleBuffer,
                       from connection: AVCaptureConnection) {
        // Dropping is fine; we always use the latest camera frame for the overlay.
    }
}
