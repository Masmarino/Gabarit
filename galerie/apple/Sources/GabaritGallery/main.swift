import AppKit
import GabaritApple
import SwiftUI

// Draws each section of the gallery, light and dark, to <folder>/<section>-<appearance>.png.

// `--live`: a window to try the controls with the real pointer.
let live = CommandLine.arguments.contains("--live")
let folder = URL(fileURLWithPath: CommandLine.arguments.dropFirst().first ?? ".")
if !live { try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true) }

@MainActor func draw<V: View>(_ name: String, _ view: V, width: CGFloat = 600) {
    for (appearance, scheme) in [("light", ColorScheme.light), ("dark", .dark)] {
        let page = view.frame(width: width).padding(20).background(GColor.background).environment(\.colorScheme, scheme)
        var png: Data?
        // Gabarit's colours resolve against the drawing appearance, as in an app's window.
        NSAppearance(named: scheme == .dark ? .darkAqua : .aqua)!.performAsCurrentDrawingAppearance {
            let renderer = ImageRenderer(content: page)
            renderer.scale = 2
            if let tiff = renderer.nsImage?.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff) {
                png = bitmap.representation(using: .png, properties: [:])
            }
        }
        guard let png else { continue }
        let file = folder.appendingPathComponent("\(name)-\(appearance).png")
        try? png.write(to: file)
        print(file.path)
    }
}

MainActor.assumeIsolated {
    GFonts.register()
    if live {
        let application = NSApplication.shared
        application.setActivationPolicy(.regular)
        let window = NSWindow(contentViewController: NSHostingController(rootView: LiveSection()))
        window.title = "Gabarit"
        window.makeKeyAndOrderFront(nil)
        application.activate()
        application.run()
    }
    draw("states", StatesSection(), width: 800)
    draw("controls", ControlsSection())
    draw("forms", FormsSection())
    draw("frame", FrameSection())
    draw("feedback", FeedbackSection())
    draw("window", WindowSection())
    draw("overlays", OverlaysSection())
}
