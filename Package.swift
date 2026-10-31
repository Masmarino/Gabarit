// swift-tools-version: 6.4
import PackageDescription

// Gabarit's native packages. GabaritCommon: the tokens as plain values, for every platform (Apple, Windows,
// Linux). GabaritApple: SwiftUI. GabaritGtk: GTK 4 (Linux). GabaritWinUI (WinUI 3): its XAML resources in swift/.
// The tokens come from tokens/gabarit.json, through tools/tokens.py.
let package = Package(
    name: "Gabarit",
    defaultLocalization: "en",
    platforms: [.macOS(.v26), .iOS(.v26)],
    products: [
        .library(name: "GabaritCommon", targets: ["GabaritCommon"]),
        .library(name: "GabaritApple", targets: ["GabaritApple"]),
        .library(name: "GabaritGtk", targets: ["GabaritGtk"]),
    ],
    targets: [
        .target(name: "GabaritCommon", path: "swift/GabaritCommon"),
        .target(name: "GabaritApple", dependencies: ["GabaritCommon"], path: "swift/GabaritApple",
                resources: [.copy("Resources/Fonts"), .process("Resources/en.lproj"), .process("Resources/fr.lproj")]),
        // GTK 4 (Linux): GTK's widgets dressed by Gabarit's style sheets. Elsewhere, the target is empty.
        .systemLibrary(name: "CGtk", path: "swift/CGtk", pkgConfig: "gtk4", providers: [.apt(["libgtk-4-dev"])]),
        .target(name: "GabaritGtk", dependencies: ["GabaritCommon", .target(name: "CGtk", condition: .when(platforms: [.linux]))],
                path: "swift/GabaritGtk", resources: [.copy("Resources/fonts"), .copy("Resources/gabarit-light.css"),
                                                      .copy("Resources/gabarit-dark.css"), .copy("Resources/gabarit.css"),
                                                      .copy("Resources/components.css"), .copy("Resources/icons")]),
        .testTarget(name: "GabaritCommonTests", dependencies: ["GabaritCommon"], path: "swift/Tests/GabaritCommonTests"),
    ]
)
