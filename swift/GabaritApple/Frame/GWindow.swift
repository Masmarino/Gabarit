#if canImport(SwiftUI) && os(macOS)
import AppKit
import SwiftUI

// Gabarit's windows on the Mac. The main window: `GWindows.main` makes it (transparent title bar, the content up to
// the top, moved by its ground) and `GAppShell` lays it out (the dark rail, the top band, the page in a sheet with a
// rounded corner). Secondary windows (settings, history, tools): `GWindow`, with Gabarit's dark header and its cross
// instead of macOS's title bar and buttons.

/// A secondary window drawn by the app: no title bar nor red, yellow and green buttons, Gabarit's dark header (an
/// icon, a title, a subtitle, the cross that closes, Escape and ⌘W), then the content.
public struct GWindow<Icon: View, Content: View>: View {
    let title: String
    var subtitle: String?
    var close: (() -> Void)?
    @ViewBuilder var icon: Icon
    @ViewBuilder var content: Content

    /// `close`: what the cross does; by default, it closes the window.
    public init(title: String, subtitle: String? = nil, close: (() -> Void)? = nil, @ViewBuilder icon: () -> Icon,
                @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.close = close
        self.icon = icon()
        self.content = content()
    }

    public var body: some View {
        VStack(spacing: 0) {
            GWindowHeader(title: title, subtitle: subtitle) {
                icon
            } trailing: {
                GCloseButton { (close ?? { NSApp.keyWindow?.performClose(nil) })() }
            }
            VStack(spacing: 0) { content }.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        // Up to the top of the window: the title bar, transparent and empty, keeps no room.
        .ignoresSafeArea(.container, edges: .top)
        .gWindowChrome()
    }
}

public extension GWindow where Icon == EmptyView {
    init(title: String, subtitle: String? = nil, close: (() -> Void)? = nil, @ViewBuilder content: () -> Content) {
        self.init(title: title, subtitle: subtitle, close: close, icon: { EmptyView() }, content: content)
    }
}

/// How the page of `GAppShell` is grounded under its rounded corner.
public enum GShellPageGround: Sendable {
    /// The page's background, cut by the corner (pages that paint no ground of their own).
    case background
    /// The frame's dark ground: the page paints all of its own (its lists, its columns), and nothing light shows at the
    /// corner's smoothed pixels.
    case frame
}

/// The main window's layout, as on the iPad: always dark (the rail on the left, the top band under the window's
/// buttons); the page follows the appearance, in a sheet with a rounded top-left corner.
public struct GAppShell<Rail: View, Bar: View, Page: View, Over: View>: View {
    var ground: GShellPageGround
    @ViewBuilder var rail: Rail
    @ViewBuilder var bar: Bar
    @ViewBuilder var page: Page
    /// Over the band and the page, not the rail (an assistant's bubble).
    @ViewBuilder var over: Over

    /// The rail's width: enough for a section's name in bold.
    public static var railWidth: CGFloat { 92 }
    /// The top band's height, at the height of the window's buttons.
    public static var barHeight: CGFloat { 52 }

    public init(ground: GShellPageGround = .background, @ViewBuilder rail: () -> Rail, @ViewBuilder bar: () -> Bar,
                @ViewBuilder page: () -> Page, @ViewBuilder over: () -> Over) {
        self.ground = ground
        self.rail = rail()
        self.bar = bar()
        self.page = page()
        self.over = over()
    }

    public var body: some View {
        let corner = UnevenRoundedRectangle(topLeadingRadius: GRadius.lg, style: .continuous)
        HStack(spacing: 0) {
            VStack(spacing: 4) { rail }
                .padding(.horizontal, 6)
                .frame(width: Self.railWidth)
                .environment(\.colorScheme, .dark)
            VStack(spacing: 0) {
                HStack(spacing: 12) { bar }
                    .padding(.horizontal, 16)
                    .frame(height: Self.barHeight)
                    // What the band holds (a search's panel) may spill over the page.
                    .zIndex(1)
                page
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(alignment: .topLeading) {
                        switch ground {
                        case .frame: GColor.frame
                        // The page's ground cut by the same corner, on the frame's: nothing dark shows in the page,
                        // nothing light out of it.
                        case .background: GColor.frame.overlay { GColor.background.clipShape(corner) }
                        }
                    }
                    .clipShape(corner)
            }
            .overlay { over }
        }
        // Up to the top of the window: the page's title beside the window's buttons.
        .ignoresSafeArea(.container, edges: .top)
        .background(GPalette.graphite950.ignoresSafeArea())
    }
}

public extension GAppShell where Over == EmptyView {
    init(ground: GShellPageGround = .background, @ViewBuilder rail: () -> Rail, @ViewBuilder bar: () -> Bar,
         @ViewBuilder page: () -> Page) {
        self.init(ground: ground, rail: rail, bar: bar, page: page) { EmptyView() }
    }
}

/// A small button at the bottom of the rail: lit in rust. `value`: a setting's state ("on", "off", in the app's words
/// and grammar), added to the tooltip and said to screen readers.
public struct GRailButton: View {
    let symbol: String
    let help: String
    let isOn: Bool
    var value: String?
    let action: () -> Void

    public init(symbol: String, help: String, isOn: Bool = false, value: String? = nil, action: @escaping () -> Void) {
        self.symbol = symbol
        self.help = help
        self.isOn = isOn
        self.value = value
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            GHover { hovering in
                Image(systemName: symbol)
                    .font(.system(size: 15))
                    .foregroundStyle(isOn ? GColor.accent : (hovering ? GPalette.graphite100 : GPalette.graphite400))
                    .frame(maxWidth: .infinity, minHeight: 32)
                    .background(isOn ? GPalette.graphite100.opacity(0.09) : (hovering ? GPalette.graphite100.opacity(0.05) : .clear),
                                in: .rect(cornerRadius: GRadius.sm))
                    .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        .help(value.map { "\(help) : \($0)" } ?? help)
        .accessibilityLabel(help)
        .accessibilityValue(value ?? "")
    }
}

/// The rail's square button (Settings): a symbol in a square with a fine rim.
public struct GRailSquareButton: View {
    let symbol: String
    let help: String
    let action: () -> Void

    public init(symbol: String, help: String, action: @escaping () -> Void) {
        self.symbol = symbol
        self.help = help
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            GHover { hovering in
                Image(systemName: symbol)
                    .font(.system(size: 18))
                    .foregroundStyle(hovering ? GPalette.graphite100 : GPalette.graphite300)
                    .frame(width: 44, height: 44)
                    .background(hovering ? GPalette.graphite100.opacity(0.05) : .clear, in: .rect(cornerRadius: GRadius.sm))
                    .overlay { RoundedRectangle(cornerRadius: GRadius.sm).strokeBorder(GPalette.graphite700, lineWidth: 1) }
                    .contentShape(Rectangle())
            }
        }
        .buttonStyle(.plain)
        .help(help)
        .accessibilityLabel(help)
    }
}

/// The windows Gabarit makes with AppKit.
@MainActor
public enum GWindows {
    /// A size that fits: `preferred`, but no more than `fraction` of the screen, and never under `minimum`.
    public static func size(preferred: CGSize, minimum: CGSize, fraction: CGFloat = 0.85) -> CGSize {
        let visible = NSScreen.main?.visibleFrame.size ?? preferred
        return CGSize(width: max(minimum.width, min(preferred.width, visible.width * fraction)),
                      height: max(minimum.height, min(preferred.height, visible.height * fraction)))
    }

    /// The main window: titled, closable, resizable, its content up to the top under a transparent title bar (the
    /// window's buttons on the dark band), moved by its ground, kept in memory when closed. `autosave`: the name under
    /// which its place and size are kept from one launch to the next (nil: none). The root view should say its minimum
    /// too (`frame(minWidth:minHeight:)`): NSHostingView replaces `contentMinSize` by the view's.
    public static func main<Root: View>(title: String, minimum: CGSize, size: CGSize, autosave: String?,
                                        root: Root) -> NSWindow {
        let window = NSWindow(contentRect: NSRect(origin: .zero, size: size),
                              styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                              backing: .buffered, defer: false)
        window.title = title
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.isMovableByWindowBackground = true
        window.isReleasedWhenClosed = false
        window.contentMinSize = minimum
        window.contentView = NSHostingView(rootView: root)
        window.center()
        if let autosave { window.setFrameAutosaveName(autosave) }
        return window
    }
}
#endif
