// swift-tools-version: 6.2
import PackageDescription

// Gabarit's gallery for GTK 4 (Linux): the main window and a settings window, light or dark, to compare with the
// Mac's. `swift run GabaritGtkGallery shell|window light|dark`, then capture the screen (galerie/gtk/capture.sh).
let package = Package(
    name: "GabaritGtkGallery",
    dependencies: [.package(name: "Gabarit", path: "../..")],
    targets: [
        .executableTarget(name: "GabaritGtkGallery", dependencies: [.product(name: "GabaritGtk", package: "Gabarit")]),
    ]
)
