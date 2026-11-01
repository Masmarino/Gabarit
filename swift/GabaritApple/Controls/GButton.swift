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
    @Environment(\.gPointerPreview) private var preview
    public var variant: GButtonVariant
    public var compact: Bool

    public init(variant: GButtonVariant = .secondary, compact: Bool = true) {
        self.variant = variant
        self.compact = compact
    }

    public func makeBody(configuration: Configuration) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
        let pressed = configuration.isPressed || (preview == .pressed && isEnabled)
        GHover { hovering in
            configuration.label
                .font(GFont.body.weight(.semibold))
                .foregroundStyle(foreground(configuration.role))
                .padding(.horizontal, compact ? 12 : 16)
                .frame(minHeight: compact ? GControlMetrics.button : 44)
                .background(background(pressed: pressed, hovering: hovering), in: shape)
                .background(variant == .secondary ? GColor.surface : .clear, in: shape)
                .overlay { if variant == .secondary { shape.strokeBorder(GColor.border.opacity(hovering ? 0.8 : 0.6), lineWidth: 1) } }
                .gRaised(shape, hovering: hovering, pressed: pressed, onInk: variant == .primary || variant == .danger, active: variant != .ghost)
                .opacity(isEnabled ? 1 : GOpacity.disabled)
                .contentShape(shape)
                .gTouchTarget(height: compact ? GControlMetrics.button : 44)
                .animation(GAnimation.press, value: pressed)
        }
    }

    /// A destructive button ("Delete", "Leave") with no solid ground: its text in red.
    private func foreground(_ role: ButtonRole?) -> Color {
        // The text's red: 4.5:1 on the hover's and the press's grounds too.
        if role == .destructive, variant == .secondary || variant == .ghost { return GTone.error.text }
        return switch variant {
        case .primary, .danger: GColor.onPrimary
        case .secondary: GColor.textPrimary
        case .ghost: GColor.textSecondary
        }
    }

    /// Hovered, a step lighter (the ink) or under the veil (the surfaces); pressed, a little more.
    private func background(pressed: Bool, hovering: Bool) -> Color {
        switch variant {
        // On ink, a step towards the hover's colour; held down, the whole way, under its shade (gRaised): it never fades.
        case .primary: pressed ? GColor.primaryHover : (hovering ? GColor.primary.mix(with: GColor.primaryHover, by: 0.55) : GColor.primary)
        // On the surface (laid below), a veil; a stronger one held down.
        case .secondary: pressed ? GColor.press : (hovering ? GColor.hover : .clear)
        case .ghost: pressed ? GColor.press : (hovering ? GColor.hover : .clear)
        case .danger: pressed ? GTone.error.base.mix(with: .black, by: 0.18) : (hovering ? GTone.error.base.mix(with: .white, by: 0.1) : GTone.error.base)
        }
    }
}

/// A frameless button that takes Gabarit's hover veil while pressed.
public struct GPressStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.gPointerPreview) private var preview

    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed || (preview == .pressed && isEnabled)
        GHover { hovering in
            configuration.label
                .background(pressed ? GColor.press : (hovering ? GColor.hover : Color.clear))
                .opacity(isEnabled ? 1 : GOpacity.disabled)
        }
    }
}

/// Gabarit's close button: a cross in a circle with a fine rim, on the dark frame. Escape triggers it.
public struct GCloseButton: View {
    var title: String
    /// On the dark frame (a window's header); otherwise on the page's ground, in the appearance's colours.
    var onFrame: Bool
    let action: () -> Void
    /// The cross and its circle grow with the text size (iPhone, iPad).
    @ScaledMetric(relativeTo: .caption) private var glyph: CGFloat = 11
    @ScaledMetric(relativeTo: .caption) private var circle: CGFloat = 28

    public init(title: String? = nil, onFrame: Bool = true, action: @escaping () -> Void) {
        self.title = title ?? gText("Close")
        self.onFrame = onFrame
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            GLive { hovering, pressed in cross(hovering, pressed) }
        }
        .buttonStyle(GLiveStyle())
        .gDimmedWhenDisabled()
        .keyboardShortcut(.cancelAction)
        #if os(macOS)
        .help(gText("\(title) (Esc)"))
        #endif
        .accessibilityLabel(title)
    }

    private func cross(_ hovering: Bool, _ pressed: Bool) -> some View {
        Image(systemName: "xmark")
            .font(.system(size: glyph, weight: .bold))
            .foregroundStyle(onFrame ? GFrameColor.text : GColor.textSecondary)
            .frame(width: circle, height: circle)
            .background(pressed ? (onFrame ? GFrameColor.selected : GColor.press) : hovering ? (onFrame ? GFrameColor.closeHover : GColor.hover) : Color.clear, in: Circle())
            .overlay { Circle().strokeBorder(onFrame ? GFrameColor.rim : GColor.hairline, lineWidth: 1) }
            .gRaised(Circle(), hovering: hovering, pressed: pressed, active: !onFrame)
            .scaleEffect(onFrame && pressed ? 0.94 : 1)
            #if os(iOS)
            // Under the finger: a 44-point target around the circle.
            .padding(8)
            .contentShape(Rectangle())
            .padding(-8)
            #else
            .contentShape(Circle())
            #endif
    }
}
#endif
