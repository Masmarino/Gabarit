#if canImport(SwiftUI)
import SwiftUI

/// The dark frame's colours (the rail, the bands, a window's header, the "⌘ + K" button): the same in both
/// appearances, as GTK's and WinUI's (GFrame…, GOnFrame…).
public enum GFrameColor {
    public static var ground: Color { GPalette.graphite950 }
    public static var text: Color { GPalette.graphite100 }
    public static var textSecondary: Color { GPalette.graphite300 }
    public static var textDiscret: Color { GPalette.graphite400 }
    /// A rim, a badge's ground.
    public static var rim: Color { GPalette.graphite700 }
    /// The line under a header.
    public static var line: Color { GPalette.graphite700.opacity(0.7) }
    public static var hover: Color { GPalette.graphite100.opacity(0.05) }
    public static var selected: Color { GPalette.graphite100.opacity(0.09) }
    /// The close cross's hover: a little stronger, on a small circle.
    public static var closeHover: Color { GPalette.graphite100.opacity(0.12) }
}
#endif
