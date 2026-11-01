#if canImport(SwiftUI)
import SwiftUI

/// The dark band under a settings page's bar: the icon ringed by a fine line, the title and the sentence that says what
/// the page is for. It extends the frame, whatever the appearance. `accessory`: on the right, at the top (a Mac sheet's
/// close button); `top`: the top margin.
public struct GPageBand<Accessory: View>: View {
    let symbol: String
    let title: String
    let summary: String
    var top: CGFloat
    @ViewBuilder var accessory: Accessory
    @Environment(\.gInSheet) private var inSheet

    public init(symbol: String, title: String, summary: String, top: CGFloat = 6, @ViewBuilder accessory: () -> Accessory) {
        self.symbol = symbol
        self.title = title
        self.summary = summary
        self.top = top
        self.accessory = accessory()
    }

    public var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 22))
                .foregroundStyle(inSheet ? GColor.textPrimary : GFrameColor.text)
                .frame(width: 48, height: 48)
                .overlay { RoundedRectangle(cornerRadius: GRadius.md).strokeBorder(inSheet ? GColor.hairline : GFrameColor.rim, lineWidth: 1) }
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(GFont.title2).foregroundStyle(inSheet ? GColor.textPrimary : GFrameColor.text)
                    .accessibilityAddTraits(.isHeader)
                Text(summary).font(GFont.subheadline).foregroundStyle(inSheet ? GColor.textDiscret : GFrameColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
            accessory
        }
        .padding(.horizontal, 20)
        .padding(.top, top)
        .padding(.bottom, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background { if !inSheet { GFrameColor.ground.gFrameSheen().gBarShadow() } }
        .zIndex(1)
    }
}

public extension GPageBand where Accessory == EmptyView {
    init(symbol: String, title: String, summary: String, top: CGFloat = 6) {
        self.init(symbol: symbol, title: title, summary: summary, top: top) { EmptyView() }
    }
}

/// A page of the dark rail (Mac, iPad): the icon and its name; the current page in rust, on a slight ground, with a
/// line on the left.
public struct GRailItem: View {
    let title: String
    var systemImage: String?
    /// An image of the app's catalogue, instead of a symbol.
    var image: String?
    let current: Bool
    var badge: Int
    let action: () -> Void

    public init(title: String, systemImage: String? = nil, image: String? = nil, current: Bool, badge: Int = 0,
                action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.image = image
        self.current = current
        self.badge = badge
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            GLive { hovering, pressed in item(hovering: hovering, pressed: pressed) }
        }
        .buttonStyle(GLiveStyle())
        .gDimmedWhenDisabled()
        .environment(\.colorScheme, .dark)
        .accessibilityLabel(title)
        .accessibilityValue(badge > 0 ? gBadgeText(badge) : "")
        .accessibilityAddTraits(current ? .isSelected : [])
    }

    private func item(hovering: Bool, pressed: Bool) -> some View {
        VStack(spacing: 3) {
            icon
                .frame(height: 22)
                .overlay(alignment: .topTrailing) {
                    if badge > 0 {
                        Text(gBadgeText(badge))
                            .font(GFont.caption2.weight(.semibold).monospacedDigit())
                            .foregroundStyle(GFrameColor.text)
                            .padding(.horizontal, 4).padding(.vertical, 1)
                            .background(GFrameColor.rim, in: .rect(cornerRadius: GRadius.xs))
                            .fixedSize()
                            .offset(x: 14, y: -6)
                    }
                }
            Text(title).font(GFont.caption2.weight(current ? .semibold : .medium)).lineLimit(1).minimumScaleFactor(0.8)
        }
        .foregroundStyle(current ? GColor.accent : (hovering ? GFrameColor.text : GFrameColor.textDiscret))
        .frame(maxWidth: .infinity, minHeight: 52)
        .background(pressed || current ? GFrameColor.selected : (hovering ? GFrameColor.hover : .clear),
                    in: .rect(cornerRadius: GRadius.sm))
        .gPressScale(pressed)
        .overlay(alignment: .leading) {
            if current { Rectangle().fill(GColor.accent).frame(width: 2).padding(.vertical, 6).gGlow(radius: 5) }
        }
        .contentShape(Rectangle())
    }

    @ViewBuilder private var icon: some View {
        if let image {
            Image(image).renderingMode(.template).resizable().scaledToFit().frame(width: 22, height: 22)
        } else if let systemImage {
            Image(systemName: systemImage).font(.system(size: 17, weight: current ? .semibold : .regular))
        }
    }
}

#if os(macOS)
/// The header of a window drawn by the app (settings windows): Gabarit's dark frame, an icon, a title and a subtitle,
/// and on the right what one puts there (the close cross). A fine line borders it at the bottom.
public struct GWindowHeader<Icon: View, Trailing: View>: View {
    let title: String
    var subtitle: String?
    /// The left margin (the window's buttons, when they sit on the header).
    var leading: CGFloat
    @ViewBuilder var icon: Icon
    @ViewBuilder var trailing: Trailing

    public init(title: String, subtitle: String? = nil, leading: CGFloat = 16, @ViewBuilder icon: () -> Icon,
                @ViewBuilder trailing: () -> Trailing) {
        self.title = title
        self.subtitle = subtitle
        self.leading = leading
        self.icon = icon()
        self.trailing = trailing()
    }

    public var body: some View {
        HStack(spacing: 10) {
            icon
            VStack(alignment: .leading, spacing: 0) {
                Text(title).font(GFont.headline).foregroundStyle(GFrameColor.text).lineLimit(1)
                if let subtitle {
                    Text(subtitle).font(GFont.caption).foregroundStyle(GFrameColor.textDiscret).lineLimit(1)
                }
            }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 12)
            trailing
        }
        .padding(.leading, leading).padding(.trailing, 14)
        .frame(height: 52)
        .frame(maxWidth: .infinity)
        .background(GFrameColor.ground.gFrameSheen().gBarShadow())
        .zIndex(1)
        .overlay(alignment: .bottom) { Rectangle().fill(GFrameColor.line).frame(height: 1) }
        .environment(\.colorScheme, .dark)
    }
}

public extension View {
    /// The window that holds this view, without macOS's decoration: no title bar (the content rises to the top, under
    /// a Gabarit header), no red, yellow and green buttons (Gabarit's cross replaces them). It moves by its ground; ⌘W
    /// still closes it.
    func gWindowChrome() -> some View { background(GWindowChrome()) }
}

private struct GWindowChrome: NSViewRepresentable {
    func makeNSView(context: Context) -> NSView { WindowWatcher() }
    func updateNSView(_ view: NSView, context: Context) {}

    private final class WindowWatcher: NSView {
        override func viewDidMoveToWindow() {
            super.viewDidMoveToWindow()
            titlebar = nil
            strip()
            for delay in [0.1, 0.5, 1.5] { DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.strip() } }
        }

        // SwiftUI puts the title bar back afterwards (on opening, on a page change): at each layout, it is removed again.
        override func layout() {
            super.layout()
            strip()
        }

        /// The title bar's container, found once per window (not searched again at every layout).
        private weak var titlebar: NSView?

        // Each property is set only when it differs: setting it again would lay the title bar out again.
        private func strip() {
            guard let window else { return }
            if !window.styleMask.contains(.fullSizeContentView) { window.styleMask.insert(.fullSizeContentView) }
            if !window.titlebarAppearsTransparent { window.titlebarAppearsTransparent = true }
            if window.titleVisibility != .hidden { window.titleVisibility = .hidden }
            if !window.isMovableByWindowBackground { window.isMovableByWindowBackground = true }
            if window.titlebarSeparatorStyle != .none { window.titlebarSeparatorStyle = .none }
            // No system toolbar (SwiftUI puts an empty one in a Settings window), no red, yellow and green buttons, nor
            // the title bar's glass, which stayed painted over the header.
            if window.toolbar != nil { window.toolbar = nil }
            if titlebar == nil {
                titlebar = window.contentView?.superview?.subviews.first { String(describing: type(of: $0)) == "NSTitlebarContainerView" }
            }
            if titlebar?.isHidden == false { titlebar?.isHidden = true }
        }
    }
}
#endif
#endif
