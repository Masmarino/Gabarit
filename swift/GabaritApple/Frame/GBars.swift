#if canImport(SwiftUI)
import SwiftUI

// Gabarit's frame (4.0): the ground runs under the bars too. The top bar is transparent on it, its buttons in the
// system's Liquid Glass, its title in IBM Plex in the ground's ink; the bottom bar floats, a capsule of liquid glass.
// `gFrameStyle(.graphite)` gives 3.x's frame back: the header and the rail always dark (graphite 950), flat bar buttons
// (no glass pill), the selection underlined in rust.

/// How the frame (bars, rail, bands, a window's header) is drawn.
public enum GFrameStyle: Sendable, Hashable {
    /// 4.0's: on the ground, transparent, its controls in liquid glass, in the ground's ink.
    case ground
    /// 3.x's: always dark (graphite 950), whatever the appearance, flat bar buttons.
    case graphite
}

public extension EnvironmentValues {
    /// How the frame is drawn: on the ground (4.0, the default) or graphite (3.x).
    @Entry var gFrameStyle = GFrameStyle.ground
}

public extension View {
    /// How the frame is drawn under this view: `.graphite` for 3.x's dark frame.
    func gFrameStyle(_ style: GFrameStyle) -> some View { environment(\.gFrameStyle, style) }
}

public extension EnvironmentValues {
    /// In a sheet: its header is on the page's grey, not on the dark frame (what tells a sheet from a page). Set by
    /// `GSheetStack` and `gSheetPage`, and by hand on a sheet's own navigation stack.
    @Entry var gInSheet = false
}

public extension View {
    /// Gabarit's top bar: transparent on the ground (4.0), what scrolls under it fading out; with `gFrameStyle(.graphite)`,
    /// dark on a page and on the page's grey in a sheet (`gInSheet`), as in 3.x. On the Mac, the frame is drawn by the
    /// window itself (rail and top band): nothing to do here.
    func gFrameToolbar() -> some View { modifier(GFrameToolbar()) }
}

private struct GFrameToolbar: ViewModifier {
    @Environment(\.gInSheet) private var inSheet
    @Environment(\.gFrameStyle) private var style
    @Environment(\.gResolvedGround) private var ground

    func body(content: Content) -> some View {
        #if os(iOS)
        if style == .ground {
            content
                // No ground of its own: the ground runs under it, its buttons in the system's glass.
                .toolbarBackground(.hidden, for: .navigationBar)
                .toolbarColorScheme(ground.mode == .dark ? .dark : .light, for: .navigationBar)
                .scrollEdgeEffectStyle(.soft, for: .top)
        } else if inSheet {
            content
                // No ground of its own: the page's light runs under it, without a line.
                .toolbarBackground(.hidden, for: .navigationBar)
                // What scrolls under it fades out, rather than running behind its buttons.
                .scrollEdgeEffectStyle(.soft, for: .top)
        } else {
            content
                // The light on the frame: a soft sheen from above.
                .toolbarBackground(LinearGradient(colors: [GPalette.graphite900, GFrameColor.ground], startPoint: .top, endPoint: .bottom), for: .navigationBar)
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbarColorScheme(.dark, for: .navigationBar)
                // The sheet's ground, dark like the frame: otherwise the system's light glass shows as a white thread
                // along the rounded top corners (the content paints its own ground over it).
                .presentationBackground(GFrameColor.ground)
                // The bar casts its shadow on the page, as the tab bar does: the system's bar cannot draw one, so it is
                // drawn from just above the content.
                .overlay(alignment: .top) { GBarShadowEdge() }
        }
        #else
        content
        #endif
    }
}

/// A bar button: in the system's liquid glass, in the ground's ink (4.0); with `gFrameStyle(.graphite)`, flat (without
/// the glass pill), light on the dark frame, dark on a sheet's grey.
public struct GToolbarItem<Content: View>: ToolbarContent {
    let placement: ToolbarItemPlacement
    @ViewBuilder let content: () -> Content
    @Environment(\.gFrameStyle) private var style

    public init(placement: ToolbarItemPlacement, @ViewBuilder content: @escaping () -> Content) {
        self.placement = placement
        self.content = content
    }

    public var body: some ToolbarContent {
        ToolbarItem(placement: placement) { content().gFlatBarItem() }
            .sharedBackgroundVisibility(style == .ground ? .automatic : .hidden)
    }
}

public struct GToolbarItemGroup<Content: View>: ToolbarContent {
    let placement: ToolbarItemPlacement
    @ViewBuilder let content: () -> Content
    @Environment(\.gFrameStyle) private var style

    public init(placement: ToolbarItemPlacement, @ViewBuilder content: @escaping () -> Content) {
        self.placement = placement
        self.content = content
    }

    public var body: some ToolbarContent {
        ToolbarItemGroup(placement: placement) { content().gFlatBarItem() }
            .sharedBackgroundVisibility(style == .ground ? .automatic : .hidden)
    }
}

extension View {
    fileprivate func gFlatBarItem() -> some View { modifier(GFlatBarItem()) }
}

/// The ground's ink (4.0); graphite: light on the dark frame (iPhone), dark on a sheet's grey; on the Mac, the window's
/// bar follows the appearance.
private struct GFlatBarItem: ViewModifier {
    @Environment(\.gInSheet) private var inSheet
    @Environment(\.gFrameStyle) private var style

    func body(content: Content) -> some View {
        #if os(iOS)
        if style == .ground {
            content.foregroundStyle(.gInk)
        } else if inSheet {
            content.foregroundStyle(GColor.textPrimary)
        } else {
            content.foregroundStyle(GColor.textPrimary).environment(\.colorScheme, .dark)
        }
        #else
        content
        #endif
    }
}

/// A bar's title: IBM Plex, in the ground's ink (4.0); graphite: light on the frame, dark on a sheet's grey.
public struct GBarTitle: View {
    let title: String
    var subtitle: String?
    @Environment(\.gInSheet) private var inSheet
    @Environment(\.gFrameStyle) private var style
    @Environment(\.colorScheme) private var scheme

    public init(title: String, subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title).font(GFont.title3).foregroundStyle(style == .ground ? AnyShapeStyle(.gInk) : AnyShapeStyle(GColor.textPrimary)).lineLimit(1)
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle).font(GFont.caption2).foregroundStyle(style == .ground ? AnyShapeStyle(.gInk2) : AnyShapeStyle(GColor.textDiscret)).lineLimit(1)
            }
        }
        .fixedSize()
        .environment(\.colorScheme, inSheet || style == .ground ? scheme : .dark)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

/// Underlined tabs (instead of a segmented control): the text, a rust line under the current tab; no line under the
/// others (4.0; graphite keeps 3.x's fine line under them all).
public struct GNavTabs<Tab: Hashable>: View {
    let tabs: [Tab]
    let title: (Tab) -> String
    @Binding var selection: Tab
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.gFrameStyle) private var style

    public init(tabs: [Tab], title: @escaping (Tab) -> String, selection: Binding<Tab>) {
        self.tabs = tabs
        self.title = title
        _selection = selection
    }

    public var body: some View {
        HStack(spacing: 20) {
            ForEach(tabs, id: \.self) { tab in
                let current = tab == selection
                Button { gWithAnimation(.snappy(duration: 0.2), reduceMotion: reduceMotion) { selection = tab } } label: {
                    GLive { hovering, pressed in
                        Text(title(tab))
                            .font(GFont.body.weight(current ? .semibold : .medium))
                            .foregroundStyle(pressed ? AnyShapeStyle(.gInk3) : current || hovering ? AnyShapeStyle(.gInk) : AnyShapeStyle(.gInk2))
                            .padding(.vertical, 8)
                            .overlay(alignment: .bottom) {
                                if current {
                                    Rectangle().fill(GColor.accent).frame(height: 2).gGlow(radius: 4)
                                } else if hovering {
                                    Rectangle().fill(GColor.border.opacity(0.5)).frame(height: 2)
                                }
                            }
                            .contentShape(Rectangle())
                            .gTouchTarget(height: 38)
                    }
                }
                .buttonStyle(GLiveStyle())
                .accessibilityAddTraits(current ? .isSelected : [])
            }
            Spacer(minLength: 0)
        }
        .overlay(alignment: .bottom) { if style == .graphite { Rectangle().fill(GColor.hairline).frame(height: 1) } }
        .gDimmedWhenDisabled()
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isTabBar)
    }
}

/// A count on an icon (a tab, a rail item): "99+" beyond 99.
func gBadgeText(_ count: Int) -> String { count > 99 ? "99+" : "\(count)" }

/// A tab of the bottom bar.
public struct GTab: Identifiable {
    public let id: String
    public let title: String
    /// A system symbol, or an image of the app's catalogue.
    public var systemImage: String?
    public var image: String?
    public var badge: Int

    public init(id: String, title: String, systemImage: String? = nil, image: String? = nil, badge: Int = 0) {
        self.id = id
        self.title = title
        self.systemImage = systemImage
        self.image = image
        self.badge = badge
    }
}

/// Gabarit's bottom bar (4.0): a capsule of liquid glass floating on the ground, the current tab lit by a lens of glass,
/// its icon in rust; on the Mac too (the gallery, a narrow window). With `gFrameStyle(.graphite)` (iPhone), 3.x's: flat
/// on the surface, a fine line above, the current tab in rust and underlined from the top.
public struct GTabBar: View {
    let tabs: [GTab]
    @Binding var selection: String
    @Environment(\.gFrameStyle) private var style
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var lens
    /// The icons grow with the text size (Dynamic Type), from 20 points.
    @ScaledMetric(relativeTo: .caption2) private var iconSize: CGFloat = 20

    public init(tabs: [GTab], selection: Binding<String>) {
        self.tabs = tabs
        _selection = selection
    }

    public var body: some View {
        if style == .graphite { graphite } else { floating }
    }

    private var floating: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { tab in
                let current = tab.id == selection
                Button { gWithAnimation(GAnimation.page, reduceMotion: reduceMotion) { selection = tab.id } } label: {
                    VStack(spacing: 2) {
                        icon(tab, current: current)
                            .frame(height: 24)
                            .foregroundStyle(current ? AnyShapeStyle(GColor.accent) : AnyShapeStyle(.gInk2))
                            .overlay(alignment: .topTrailing) { badge(tab) }
                        Text(tab.title)
                            .font(GFont.caption2.weight(current ? .semibold : .medium))
                            .foregroundStyle(current ? AnyShapeStyle(.gInk) : AnyShapeStyle(.gInk2))
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .background {
                        if current {
                            Capsule().fill(Color.white.opacity(0.0001))
                                .gLiquidGlass(interactive: false)
                                .padding(.horizontal, 2)
                                .matchedGeometryEffect(id: "lens", in: lens)
                        }
                    }
                    .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .modifier(GTabAccessibility(tab: tab, current: current, icon: icon(tab, current: current)))
            }
        }
        .padding(4)
        .gLiquidGlass(interactive: false)
        .padding(.horizontal, GSpacing.page)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isTabBar)
        .zIndex(1)
    }

    private var graphite: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { tab in
                let current = tab.id == selection
                Button { selection = tab.id } label: {
                    VStack(spacing: 3) {
                        icon(tab, current: current)
                            .frame(height: 24)
                            .overlay(alignment: .topTrailing) { badge(tab) }
                        Text(tab.title)
                            .font(GFont.caption2.weight(current ? .semibold : .medium))
                            .lineLimit(1)
                    }
                    .foregroundStyle(current ? GColor.accentText : GColor.textSecondary)
                    .frame(maxWidth: .infinity, minHeight: 54)
                    .overlay(alignment: .top) {
                        if current { Rectangle().fill(GColor.accent).frame(height: 2).padding(.horizontal, 18) }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .modifier(GTabAccessibility(tab: tab, current: current, icon: icon(tab, current: current)))
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isTabBar)
        .background(GColor.surface.gBarShadow(up: true).ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) { Rectangle().fill(GColor.hairline).frame(height: 1) }
        .zIndex(1)
    }

    @ViewBuilder private func badge(_ tab: GTab) -> some View {
        if tab.badge > 0 {
            Text(gBadgeText(tab.badge))
                .font(GFont.caption2.weight(.semibold).monospacedDigit())
                .foregroundStyle(style == .ground ? GColor.onPrimary : GColor.textPrimary)
                .padding(.horizontal, 5).padding(.vertical, 1)
                .background(style == .ground ? GColor.accent : GColor.track, in: .capsule)
                .fixedSize()
                .offset(x: 16, y: -6)
        }
    }

    @ViewBuilder private func icon(_ tab: GTab, current: Bool) -> some View {
        if let name = tab.image {
            Image(name).renderingMode(.template).resizable().scaledToFit().frame(width: 24, height: 24)
        } else if let symbol = tab.systemImage {
            Image(systemName: symbol).font(.system(size: min(iconSize, 28), weight: current ? .semibold : .regular))
        }
    }
}

/// A tab's name, its count, its state, said to screen readers; shown large on a long press when the text is very large.
private struct GTabAccessibility<Icon: View>: ViewModifier {
    let tab: GTab
    let current: Bool
    let icon: Icon

    func body(content: Content) -> some View {
        content
            .accessibilityLabel(tab.title)
            .accessibilityValue(tab.badge > 0 ? gBadgeText(tab.badge) : "")
            .accessibilityAddTraits(current ? .isSelected : [])
            // A long press shows the tab large when the text is very large (the bar does not grow).
            .accessibilityShowsLargeContentViewer {
                icon
                Text(tab.title)
            }
    }
}
#endif
