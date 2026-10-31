#if canImport(SwiftUI)
import SwiftUI

/// A Gabarit menu line (icon and text in IBM Plex), for bubble menus.
public struct GMenuItem: View {
    let title: String
    let systemImage: String
    var role: ButtonRole?
    /// A tick on the right (a setting that turns on or off).
    var checked: Bool?
    let action: () -> Void

    public init(title: String, systemImage: String, role: ButtonRole? = nil, checked: Bool? = nil, action: @escaping () -> Void) {
        self.title = title
        self.systemImage = systemImage
        self.role = role
        self.checked = checked
        self.action = action
    }

    public var body: some View {
        Button(role: role, action: action) {
            GHover { hovering in row.background(hovering ? GColor.hover : Color.clear) }
        }
        .buttonStyle(.plain)
        .gDimmedWhenDisabled()
        .accessibilityAddTraits(checked == true ? .isSelected : [])
    }

    private var row: some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage).font(GFont.subheadline).frame(width: 20).accessibilityHidden(true)
            Text(title).font(GFont.body)
            Spacer(minLength: 12)
            if let checked {
                // Always drawn, hidden when unticked: the lines keep the same width (and no empty symbol is asked for).
                Image(systemName: "checkmark")
                    .font(GFont.subheadline.weight(.semibold))
                    .foregroundStyle(GColor.accent)
                    .frame(width: 16)
                    .opacity(checked ? 1 : 0)
                    .accessibilityHidden(true)
            }
        }
        .foregroundStyle(role == .destructive ? GTone.error.base : GColor.textPrimary)
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

/// A Gabarit bubble menu: flat lines on the surface, split by a fine line. The bubble takes the appearance of the
/// view that opens it.
public struct GMenu<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.colorScheme) private var colorScheme

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(spacing: 0) {
            Group(subviews: content) { rows in
                ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                    if index > 0 { Rectangle().fill(GColor.hairline).frame(height: 1) }
                    row
                }
            }
        }
        .frame(minWidth: 240)
        .background(GColor.surface)
        .presentationCompactAdaptation(.popover)
        .preferredColorScheme(colorScheme)
    }
}
#endif
