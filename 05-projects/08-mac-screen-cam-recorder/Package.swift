// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AITeachingRecorder",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        // Core engine: no UI, shared by app + CLI + tests
        .target(
            name: "AITeachingRecorderCore",
            path: "Sources/AITeachingRecorderCore"
        ),
        // macOS app executable
        .executableTarget(
            name: "AITeachingRecorder",
            dependencies: ["AITeachingRecorderCore"],
            path: "Sources/AITeachingRecorder"
        ),
        // Headless CLI for self-testing / debugging
        .executableTarget(
            name: "AITRCLI",
            dependencies: ["AITeachingRecorderCore"],
            path: "Sources/AITRCLI"
        ),
        // Standalone unit tests (no XCTest needed — runs with Command Line Tools)
        .executableTarget(
            name: "AITRCoreUnitTests",
            dependencies: ["AITeachingRecorderCore"],
            path: "Sources/AITRCoreUnitTests"
        )
    ]
)
