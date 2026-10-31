#if canImport(SwiftUI)
import SwiftUI

public extension GTone {
    var base: Color {
        switch self {
        case .success: GColor.success
        case .warning: GColor.warning
        case .error: GColor.error
        case .info: GColor.info
        }
    }

    /// The translucent ground of a badge in this state.
    var tint: Color { base.opacity(0.14) }
}

public extension View {
    /// A Gabarit surface: flat, with a fine border. `tint`: a tinted surface (selection, state).
    func gSurface<S: InsettableShape>(_ shape: S, tint: Color? = nil) -> some View {
        background(tint?.opacity(0.12) ?? GColor.surface, in: shape)
            .overlay { shape.strokeBorder(tint?.opacity(0.4) ?? GColor.hairline, lineWidth: 1) }
    }
}

/// Gabarit's buttons: ink (primary), fine frame (secondary), no ground (ghost), red (danger).
public struct GButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    public var variant: GButtonVariant
    public var compact: Bool

    public init(variant: GButtonVariant = .secondary, compact: Bool = true) {
        self.variant = variant
        self.compact = compact
    }

    public func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
        GHover { hovering in
            configuration.label
                .font(GFont.body.weight(.semibold))
                .foregroundStyle(foreground(configuration.role))
                .padding(.horizontal, compact ? 12 : 16)
                .frame(minHeight: compact ? GControlMetrics.button : 44)
                .background(background(pressed: configuration.isPressed, hovering: hovering), in: shape)
                .overlay { if variant == .secondary { shape.strokeBorder(GColor.border.opacity(hovering ? 0.8 : 0.6), lineWidth: 1) } }
                .opacity(isEnabled ? 1 : 0.45)
                .contentShape(shape)
        }
    }

    /// A destructive button ("Delete", "Leave") with no solid ground: its text in red.
    private func foreground(_ role: ButtonRole?) -> Color {
        if role == .destructive, variant == .secondary || variant == .ghost { return GTone.error.base }
        return switch variant {
        case .primary, .danger: GColor.onPrimary
        case .secondary: GColor.textPrimary
        case .ghost: GColor.textSecondary
        }
    }

    /// Hovered, a step lighter (the ink) or under the veil (the surfaces); pressed, a little more.
    private func background(pressed: Bool, hovering: Bool) -> Color {
        switch variant {
        case .primary: pressed || hovering ? GColor.primaryHover : GColor.primary
        case .secondary: pressed ? GColor.track : (hovering ? GColor.hover : GColor.surface)
        case .ghost: pressed ? GColor.track : (hovering ? GColor.hover : .clear)
        case .danger: GTone.error.base.opacity(pressed ? 0.8 : (hovering ? 0.9 : 1))
        }
    }
}

/// A frameless button that takes Gabarit's hover veil while pressed.
public struct GPressStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        GHover { hovering in
            configuration.label
                .background(configuration.isPressed ? GColor.track : (hovering ? GColor.hover : Color.clear))
                .opacity(isEnabled ? 1 : 0.35)
        }
    }
}

/// Gabarit's close button: a cross in a circle with a fine rim, on the dark frame. Escape triggers it.
public struct GCloseButton: View {
    var title: String
    /// On the dark frame (a window's header); otherwise on the page's ground, in the appearance's colours.
    var onFrame: Bool
    let action: () -> Void
    @State private var hovering = false

    public init(title: String? = nil, onFrame: Bool = true, action: @escaping () -> Void) {
        self.title = title ?? gText("Close")
        self.onFrame = onFrame
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Image(systemName: "xmark")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(onFrame ? GPalette.graphite100 : GColor.textSecondary)
                .frame(width: 28, height: 28)
                .background(hovering ? (onFrame ? GPalette.graphite100.opacity(0.12) : GColor.hover) : Color.clear, in: Circle())
                .overlay { Circle().strokeBorder(onFrame ? GPalette.graphite700 : GColor.hairline, lineWidth: 1) }
                #if os(iOS)
                // Under the finger: a 44-point target around the circle.
                .padding(8)
                .contentShape(Rectangle())
                .padding(-8)
                #else
                .contentShape(Circle())
                #endif
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.cancelAction)
        #if os(macOS)
        .onHover { hovering = $0 }
        .help(gText("\(title) (Esc)"))
        #endif
        .accessibilityLabel(title)
    }
}
#endif
