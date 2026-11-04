// swift-tools-version: 6.4
import PackageDescription

// Gabarit's gallery for Apple: every component, light and dark, drawn to PNG files (one per section), to compare a
// pre-release with the previous one and with the apps. `swift run GabaritGallery <folder>`.
let package = Package(
    name: "GabaritGallery",
    platforms: [.macOS(.v26)],
    dependencies: [.package(name: "Gabarit", path: "../..")],
    targets: [
        .executableTarget(name: "GabaritGallery", dependencies: [.product(name: "GabaritApple", package: "Gabarit")]),
    ]
)
