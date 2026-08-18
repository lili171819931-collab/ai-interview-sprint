import Foundation

// MARK: - Errors

public enum RecorderError: Error, LocalizedError, Equatable {
    public var errorDescription: String? { userMessage }

    case permissionDenied(String)
    case deviceUnavailable(String)
    case encodingError(String)
    case diskFull
    case invalidConfiguration(String)
    case unknown(String)

    public var userMessage: String {
        switch self {
        case .permissionDenied(let thing):
            return "\(thing) permission is required.\nPlease open System Settings → Privacy & Security and grant access."
        case .deviceUnavailable(let thing):
            return "\(thing) is unavailable.\nPlease check whether another application is using it."
        case .encodingError(let detail):
            return "Video encoding failed.\(detail.isEmpty ? "" : "\n\(detail)")"
        case .diskFull:
            return "Not enough disk space to save the recording."
        case .invalidConfiguration(let detail):
            return "Invalid recording settings.\(detail.isEmpty ? "" : "\n\(detail)")"
        case .unknown(let detail):
            return "Something went wrong.\(detail.isEmpty ? "" : "\n\(detail)")"
        }
    }
}

// MARK: - State machine

public enum RecorderPhase: Equatable {
    case idle
    case preparing
    case recording
    case paused
    case stopping
    case processing
    case completed
    case error(RecorderError)

    public var isActive: Bool {
        switch self {
        case .recording, .paused: return true
        default: return false
        }
    }

    public var isBusy: Bool {
        switch self {
        case .preparing, .stopping, .processing: return true
        default: return false
        }
    }

    public var displayName: String {
        switch self {
        case .idle: return "Ready"
        case .preparing: return "Preparing…"
        case .recording: return "Recording"
        case .paused: return "Paused"
        case .stopping: return "Stopping…"
        case .processing: return "Processing…"
        case .completed: return "Completed"
        case .error: return "Error"
        }
    }
}

public enum RecorderEvent: Equatable {
    case start
    case prepareSuccess
    case prepareFailed(RecorderError)
    case pause
    case resume
    case stop
    case stopComplete(URL?)
    case processingComplete
    case failed(RecorderError)
}

public struct RecorderStateMachine {
    public private(set) var phase: RecorderPhase = .idle
    public private(set) var lastTransitionReason: String = ""

    public init() {}

    public mutating func transition(_ event: RecorderEvent) -> Bool {
        let allowed = Self.allowedTransitions(from: phase, event: event)
        if allowed {
            apply(event)
            return true
        }
        lastTransitionReason = "Illegal transition \(phase) <- \(event)"
        return false
    }

    private mutating func apply(_ event: RecorderEvent) {
        switch (phase, event) {
        case (.idle, .start):
            phase = .preparing
        case (.preparing, .prepareSuccess):
            phase = .recording
        case (.preparing, .prepareFailed(let err)):
            phase = .error(err)
        case (.recording, .pause):
            phase = .paused
        case (.paused, .resume):
            phase = .recording
        case (.recording, .stop), (.paused, .stop):
            phase = .stopping
        case (.stopping, .stopComplete):
            phase = .processing
        case (.processing, .processingComplete):
            phase = .completed
        case (_, .failed(let err)):
            phase = .error(err)
        default:
            break
        }
    }

    public static func allowedTransitions(from phase: RecorderPhase, event: RecorderEvent) -> Bool {
        switch (phase, event) {
        case (.idle, .start): return true
        case (.preparing, .prepareSuccess): return true
        case (.preparing, .prepareFailed): return true
        case (.preparing, .failed): return true
        case (.recording, .pause): return true
        case (.recording, .stop): return true
        case (.recording, .failed): return true
        case (.paused, .resume): return true
        case (.paused, .stop): return true
        case (.paused, .failed): return true
        case (.stopping, .stopComplete): return true
        case (.stopping, .failed): return true
        case (.processing, .processingComplete): return true
        case (.processing, .failed): return true
        case (.error, .start): return true       // allow retry from error
        case (.completed, .start): return true  // allow record again
        default: return false
        }
    }
}

// MARK: - Formatting

public extension TimeInterval {
    var recorderTimeString: String {
        let total = Int(self)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return String(format: "%02d:%02d:%02d", h, m, s)
    }
}
