#if canImport(SwiftUI)
import SwiftUI

// Gabarit's frame: the header (the top bar) and, on the Mac, the left rail are always dark (graphite 950), whatever
// the appearance; the content follows light or dark. Bar buttons are flat (no glass pill), the title in IBM Plex, the
// selection underlined in rust.

public extension View {
    /// Gabarit's dark top bar (graphite ground, light titles and buttons). On the Mac, the frame is drawn by the window
    /// itself (rail and top band): nothing to do here.
    @ViewBuilder func gFrameToolbar() -> some View {
        #if os(iOS)
        toolbarBackground(GPalette.graphite950, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            // The sheet's ground, dark like the frame: otherwise the system's light glass shows as a white thread along
            // the rounded top corners (the content paints its own ground over it).
            .presentationBackground(GPalette.graphite950)
        #else
        self
        #endif
    }
}

/// A flat bar button: without the system's glass pill, light on the dark frame.
public struct GToolbarItem<Content: View>: ToolbarContent {
    let placement: ToolbarItemPlacement
    @ViewBuilder let content: () -> Content

    public init(placement: ToolbarItemPlacement, @ViewBuilder content: @escaping () -> Content) {
        self.placement = placement
        self.content = content
    }

    public var body: some ToolbarContent {
        ToolbarItem(placement: placement) { content().gFlatBarItem() }
            .sharedBackgroundVisibility(.hidden)
    }
}

public struct GToolbarItemGroup<Content: View>: ToolbarContent {
    let placement: ToolbarItemPlacement
    @ViewBuilder let content: () -> Content

    public init(placement: ToolbarItemPlacement, @ViewBuilder content: @escaping () -> Content) {
        self.placement = placement
        self.content = content
    }

    public var body: some ToolbarContent {
        ToolbarItemGroup(placement: placement) { content().gFlatBarItem() }
            .sharedBackgroundVisibility(.hidden)
    }
}

extension View {
    /// Light on the dark frame (iPhone); on the Mac, the window's bar follows the appearance.
    @ViewBuilder fileprivate func gFlatBarItem() -> some View {
        #if os(iOS)
        foregroundStyle(GColor.textPrimary).environment(\.colorScheme, .dark)
        #else
        self
        #endif
    }
}

/// A bar's title: IBM Plex, light on the frame.
public struct GBarTitle: View {
    let title: String
    var subtitle: String?

    public init(title: String, subtitle: String? = nil) {
        self.title = title
        self.subtitle = subtitle
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title).font(GFont.title3).foregroundStyle(GColor.textPrimary).lineLimit(1)
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle).font(GFont.caption2).foregroundStyle(GColor.textDiscret).lineLimit(1)
            }
        }
        .fixedSize()
        .environment(\.colorScheme, .dark)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

/// Underlined tabs (instead of a segmented control): the text, a rust line under the current tab.
public struct GNavTabs<Tab: Hashable>: View {
    let tabs: [Tab]
    let title: (Tab) -> String
    @Binding var selection: Tab

    public init(tabs: [Tab], title: @escaping (Tab) -> String, selection: Binding<Tab>) {
        self.tabs = tabs
        self.title = title
        _selection = selection
    }

    public var body: some View {
        HStack(spacing: 20) {
            ForEach(tabs, id: \.self) { tab in
                let current = tab == selection
                Button { withAnimation(.snappy(duration: 0.2)) { selection = tab } } label: {
                    GHover { hovering in
                        Text(title(tab))
                            .font(GFont.body.weight(current ? .semibold : .medium))
                            .foregroundStyle(current || hovering ? GColor.textPrimary : GColor.textSecondary)
                            .padding(.vertical, 8)
                            .overlay(alignment: .bottom) {
                                if current {
                                    Rectangle().fill(GColor.accent).frame(height: 2)
                                } else if hovering {
                                    Rectangle().fill(GColor.border.opacity(0.5)).frame(height: 2)
                                }
                            }
                            .contentShape(Rectangle())
                    }
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(current ? .isSelected : [])
            }
            Spacer(minLength: 0)
        }
        .overlay(alignment: .bottom) { Rectangle().fill(GColor.hairline).frame(height: 1) }
        .gDimmedWhenDisabled()
    }
}

/// A count on an icon (a tab, a rail item): "99+" beyond 99.
func gBadgeText(_ count: Int) -> String { count > 99 ? "99+" : "\(count)" }

#if os(iOS)
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

/// Gabarit's bottom bar: flat on the surface, a fine line above, the current tab in rust and underlined from the top.
public struct GTabBar: View {
    let tabs: [GTab]
    @Binding var selection: String

    public init(tabs: [GTab], selection: Binding<String>) {
        self.tabs = tabs
        _selection = selection
    }

    public var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs) { tab in
                let current = tab.id == selection
                Button { selection = tab.id } label: {
                    VStack(spacing: 3) {
                        icon(tab, current: current)
                            .frame(height: 24)
                            .overlay(alignment: .topTrailing) {
                                if tab.badge > 0 {
                                    Text(gBadgeText(tab.badge))
                                        .font(GFont.caption2.weight(.semibold).monospacedDigit())
                                        .foregroundStyle(GColor.textPrimary)
                                        .padding(.horizontal, 5).padding(.vertical, 1)
                                        .background(GColor.track, in: .rect(cornerRadius: GRadius.xs))
                                        .fixedSize()
                                        .offset(x: 16, y: -6)
                                }
                            }
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
                .accessibilityLabel(tab.title)
                .accessibilityAddTraits(current ? .isSelected : [])
            }
        }
        .background(GColor.surface.ignoresSafeArea(edges: .bottom))
        .overlay(alignment: .top) { Rectangle().fill(GColor.hairline).frame(height: 1) }
    }

    @ViewBuilder private func icon(_ tab: GTab, current: Bool) -> some View {
        if let name = tab.image {
            Image(name).renderingMode(.template).resizable().scaledToFit().frame(width: 24, height: 24)
        } else if let symbol = tab.systemImage {
            Image(systemName: symbol).font(.system(size: 20, weight: current ? .semibold : .regular))
        }
    }
}
#endif
#endif
