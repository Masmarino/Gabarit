import AppKit
import GabaritApple
import SwiftUI

// Shows each section of the gallery in a real window, on the ground, light, dark and on the aurore ambiance, and
// captures the window as the Mac draws it (screencapture -l, without its shadow) to
// <folder>/apple-<section>-<appearance>.png. A window, not ImageRenderer: the renderer draws neither the system's glass
// (glassEffect) nor its materials. `swift run GabaritGallery <folder> [sections…]`.
// `--live`: a window to try the controls with the real pointer.

let arguments = Array(CommandLine.arguments.dropFirst())
let live = arguments.contains("--live")
let positional = arguments.filter { !$0.hasPrefix("--") }
let folder = URL(fileURLWithPath: positional.first ?? ".")
let wanted = Set(positional.dropFirst())

/// A section: its name, its view, its width.
struct GallerySection {
    let name: String
    let width: CGFloat
    let view: AnyView

    init<V: View>(_ name: String, width: CGFloat = 640, _ view: V) {
        self.name = name
        self.width = width
        self.view = AnyView(view)
    }
}

/// The appearances each section is captured in: Gabarit's light and dark grounds, and an ambiance.
let appearances: [(name: String, scheme: ColorScheme, ground: GGroundSpec)] = [
    ("light", .light, GGroundValues.light), ("dark", .dark, GGroundValues.dark), ("aurore", .dark, GGroundValues.aurore),
]

@MainActor func sections() -> [GallerySection] { [
    GallerySection("glass", width: 760, GlassSection()),
    GallerySection("states", width: 800, StatesSection()),
    GallerySection("controls", ControlsSection()),
    GallerySection("forms", FormsSection()),
    GallerySection("frame", FrameSection()),
    GallerySection("feedback", FeedbackSection()),
    GallerySection("window", width: 700, WindowSection()),
    GallerySection("overlays", OverlaysSection()),
] }

/// A section on its ground, as a window shows it.
@MainActor func page(_ section: GallerySection, scheme: ColorScheme, ground: GGroundSpec) -> some View {
    section.view
        .frame(width: section.width)
        .padding(24)
        .fixedSize(horizontal: false, vertical: true)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .gGround(ground)
        .environment(\.colorScheme, scheme)
}

/// A window with no title bar to speak of: its content up to the top, the window's buttons hidden.
@MainActor func window<V: View>(_ root: V, scheme: ColorScheme) -> NSWindow {
    let host = NSHostingView(rootView: root)
    let size = host.fittingSize
    let window = NSWindow(contentRect: NSRect(origin: .zero, size: size),
                          styleMask: [.titled, .fullSizeContentView], backing: .buffered, defer: false)
    window.titlebarAppearsTransparent = true
    window.titleVisibility = .hidden
    for button in [NSWindow.ButtonType.closeButton, .miniaturizeButton, .zoomButton] { window.standardWindowButton(button)?.isHidden = true }
    window.appearance = NSAppearance(named: scheme == .dark ? .darkAqua : .aqua)
    window.isReleasedWhenClosed = false
    // No opening or closing animation: a capture taken during one is a small, skewed window.
    window.animationBehavior = .none
    window.contentView = host
    window.center()
    return window
}

/// Shows each section in each appearance, captures it, closes it; then quits.
@MainActor func captureAll() async {
    try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    for section in sections() where wanted.isEmpty || wanted.contains(section.name) {
        for appearance in appearances {
            let shown = window(page(section, scheme: appearance.scheme, ground: appearance.ground), scheme: appearance.scheme)
            shown.makeKeyAndOrderFront(nil)
            NSApplication.shared.activate()
            let file = folder.appendingPathComponent("apple-\(section.name)-\(appearance.name).png")
            // The capture's expected size, in pixels (the window's frame at the screen's scale).
            let scale = shown.backingScaleFactor
            let expected = CGSize(width: shown.frame.width * scale, height: shown.frame.height * scale)
            var done = false
            for attempt in 1...4 where !done {
                // Until the window is on screen and drawn: a few turns of the loop, then time for the glass to settle.
                for _ in 0..<10 where !shown.isVisible || !shown.occlusionState.contains(.visible) {
                    try? await Task.sleep(for: .milliseconds(100))
                }
                shown.displayIfNeeded()
                try? await Task.sleep(for: .seconds(attempt == 1 ? 1.6 : 1))
                try? FileManager.default.removeItem(at: file)
                let capture = Process()
                capture.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
                capture.arguments = ["-o", "-x", "-l", "\(shown.windowNumber)", file.path]
                try? capture.run()
                capture.waitUntilExit()
                // Checked afterwards: the image must have the window's size (within a few pixels).
                if let image = NSImageRep(contentsOf: file), abs(CGFloat(image.pixelsWide) - expected.width) <= 4,
                   abs(CGFloat(image.pixelsHigh) - expected.height) <= 4 {
                    done = true
                } else {
                    FileHandle.standardError.write(Data("retry \(file.lastPathComponent) (attempt \(attempt))\n".utf8))
                }
            }
            print(done ? file.path : "FAILED \(file.path)")
            shown.close()
        }
    }
    NSApplication.shared.terminate(nil)
}

MainActor.assumeIsolated {
    GFonts.register()
    let application = NSApplication.shared
    application.setActivationPolicy(.regular)
    if live {
        let window = NSWindow(contentViewController: NSHostingController(rootView: LiveSection().gGround()))
        window.title = "Gabarit"
        window.makeKeyAndOrderFront(nil)
        application.activate()
    } else {
        Task { await captureAll() }
    }
    application.run()
}
