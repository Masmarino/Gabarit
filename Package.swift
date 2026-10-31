// swift-tools-version: 6.2
import PackageDescription

// Gabarit's native packages. GabaritCommon: the tokens as plain values, for every platform (Apple, Windows,
// Linux). GabaritApple: SwiftUI. GabaritGtk (GTK 4) and GabaritWinUI (WinUI 3) come next; their generated
// resources are already in swift/. The tokens come from tokens/gabarit.json, through tools/tokens.py.
let package = Package(
    name: "Gabarit",
    defaultLocalization: "en",
    platforms: [.macOS(.v26), .iOS(.v26)],
    products: [
        .library(name: "GabaritCommon", targets: ["GabaritCommon"]),
        .library(name: "GabaritApple", targets: ["GabaritApple"]),
    ],
    targets: [
        .target(name: "GabaritCommon", path: "swift/GabaritCommon"),
        .target(name: "GabaritApple", dependencies: ["GabaritCommon"], path: "swift/GabaritApple",
                resources: [.copy("Resources/Fonts"), .process("Resources/en.lproj"), .process("Resources/fr.lproj")]),
        .testTarget(name: "GabaritCommonTests", dependencies: ["GabaritCommon"], path: "swift/Tests/GabaritCommonTests"),
    ]
)
