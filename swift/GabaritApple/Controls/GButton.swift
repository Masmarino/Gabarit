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
    /// A Gabarit surface: a card of content glass, with no line (4.0; 3.x drew a fine border). `tint`: a tinted surface
    /// (selection, state), the tint over the glass.
    func gSurface<S: InsettableShape>(_ shape: S, tint: Color? = nil) -> some View {
        // A card, whatever it holds: it rests on the ground (`gCardDepth`), tinted or not.
        background(tint?.opacity(0.12) ?? .clear, in: shape)
            .gCardDepth(shape)
    }
}

/// What a Gabarit button is drawn in: the liquid glass (4.1), or 4.0's solid faces.
public enum GButtonMaterial: Sendable, Hashable {
    /// Liquid glass, in a capsule: clear (secondary, ghost, in the ground's ink), tinted (primary: the ink; danger: the
    /// red). Held down, it lights and grows a little on the bouncy spring.
    case glass
    /// 4.0's faces, in a rounded rectangle: ink (primary), a fine frame (secondary), no ground (ghost), red (danger).
    case solid
}

/// Gabarit's buttons (4.1): liquid glass by default, clear for the secondary and the ghost (`.gGlass`), tinted for the
/// primary (`.gGlassProminent`) and the danger; `material: .solid` gives 4.0's faces back.
public struct GButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.gPointerPreview) private var preview
    @Environment(\.gAccentTone) private var accent
    public var variant: GButtonVariant
    public var compact: Bool
    public var material: GButtonMaterial

    public init(variant: GButtonVariant = .secondary, compact: Bool = true, material: GButtonMaterial = .glass) {
        self.variant = variant
        self.compact = compact
        self.material = material
    }

    public func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed || (preview == .pressed && isEnabled)
        GHover { hovering in
            if material == .glass {
                glass(configuration, hovering: hovering, pressed: pressed)
            } else {
                solid(configuration, hovering: hovering, pressed: pressed)
            }
        }
    }

    private func glass(_ configuration: Configuration, hovering: Bool, pressed: Bool) -> some View {
        configuration.label
            .font(GFont.body.weight(variant == .ghost ? .medium : .semibold))
            .foregroundStyle(glassForeground(configuration.role))
            .padding(.horizontal, compact ? 14 : 18)
            .frame(minHeight: compact ? GControlMetrics.button : 44)
            .modifier(GLiquidControl(shape: Capsule(), prominent: prominent, hovering: hovering, pressed: pressed))
            .modifier(GDestructiveWash(active: configuration.role == .destructive && prominent == nil, hovering: hovering, pressed: pressed))
            .opacity(isEnabled ? 1 : GOpacity.disabled)
            .contentShape(Capsule())
            .gTouchTarget(height: compact ? GControlMetrics.button : 44)
    }

    private var prominent: GProminentTint? {
        switch variant {
        case .primary: .ink
        case .danger: .danger
        case .secondary, .ghost: nil
        }
    }

    /// On the glass: the ground's ink; on a tinted glass, `onPrimary`; a destructive button's text in red on a light
    /// ground (no red holds 4.5:1 on the liquid glass of a dark ground: there, the ink, on glass washed with red).
    private func glassForeground(_ role: ButtonRole?) -> AnyShapeStyle {
        switch variant {
        case .primary: AnyShapeStyle(GOnProminent(.ink))
        case .danger: AnyShapeStyle(GOnProminent(.danger))
        case .secondary, .ghost: role == .destructive ? AnyShapeStyle(GDestructiveInk()) : AnyShapeStyle(.gInk)
        }
    }

    private func solid(_ configuration: Configuration, hovering: Bool, pressed: Bool) -> some View {
        let shape = RoundedRectangle(cornerRadius: GRadius.sm, style: .continuous)
        return configuration.label
            .font(GFont.body.weight(.semibold))
            .foregroundStyle(foreground(configuration.role))
            .padding(.horizontal, compact ? 12 : 16)
            .frame(minHeight: compact ? GControlMetrics.button : 44)
            .background(background(pressed: pressed, hovering: hovering), in: shape)
            .background(variant == .secondary ? AnyShapeStyle(.gControlGround) : AnyShapeStyle(Color.clear), in: shape)
            .overlay { if variant == .secondary { shape.strokeBorder(GColor.border.opacity(hovering ? 0.8 : 0.6), lineWidth: 1) } }
            .gRaised(shape, hovering: hovering, pressed: pressed, onInk: variant == .primary || variant == .danger, active: variant != .ghost)
            .opacity(isEnabled ? 1 : GOpacity.disabled)
            .contentShape(shape)
            .gTouchTarget(height: compact ? GControlMetrics.button : 44)
            .animation(GAnimation.press, value: pressed)
    }

    /// A destructive button ("Delete", "Leave") with no solid ground: its text in red.
    private func foreground(_ role: ButtonRole?) -> Color {
        // The text's red: 4.5:1 on the hover's and the press's grounds too.
        if role == .destructive, variant == .secondary || variant == .ghost { return GTone.error.text }
        if variant == .primary, let accent { return Color(accent.onAccent) }
        return switch variant {
        case .primary, .danger: GColor.onPrimary
        case .secondary: GColor.textPrimary
        case .ghost: GColor.textSecondary
        }
    }

    /// Hovered, a step lighter (the ink) or under the veil (the surfaces); pressed, a little more.
    private func background(pressed: Bool, hovering: Bool) -> Color {
        // An accent of the ground's or the app's (4.2): the accent, a step toward its ink hovered, two held down.
        if variant == .primary, let accent {
            let fill = Color(accent.accent), on = Color(accent.onAccent)
            return pressed ? fill.mix(with: on, by: 0.2) : (hovering ? fill.mix(with: on, by: 0.1) : fill)
        }
        return switch variant {
        // On ink, a step towards the hover's colour; held down, the whole way, under its shade (gRaised): it never fades.
        case .primary: pressed ? GColor.primaryHover : (hovering ? GColor.primary.mix(with: GColor.primaryHover, by: 0.55) : GColor.primary)
        // On the surface (laid below), a veil; a stronger one held down.
        case .secondary: pressed ? GColor.press : (hovering ? GColor.hover : .clear)
        case .ghost: pressed ? GColor.press : (hovering ? GColor.hover : .clear)
        case .danger: pressed ? GTone.error.base.mix(with: .black, by: 0.18) : (hovering ? GTone.error.base.mix(with: .white, by: 0.1) : GTone.error.base)
        }
    }
}

public extension ButtonStyle where Self == GButtonStyle {
    /// Gabarit's clear liquid glass button (4.1), in the ground's ink: the default of secondary buttons.
    static var gGlass: GButtonStyle { GButtonStyle(variant: .secondary) }

    /// Gabarit's prominent liquid glass button (4.1), tinted with the ink: the one thing to do.
    static var gGlassProminent: GButtonStyle { GButtonStyle(variant: .primary) }
}

/// A destructive button's text on a clear glass: red on a light ground, the ink on a dark one.
struct GDestructiveInk: ShapeStyle {
    func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        environment.gResolvedGround.mode == .light ? GTone.error.text.resolve(in: environment) : GInk(.primary).resolve(in: environment)
    }
}

/// On a dark ground, a destructive button's clear glass washed with red (its text is the ink there).
private struct GDestructiveWash: ViewModifier {
    let active: Bool
    let hovering: Bool
    let pressed: Bool
    @Environment(\.gResolvedGround) private var ground

    func body(content: Content) -> some View {
        if active, ground.mode == .dark {
            content.background { Capsule().fill(Color(GPaletteValues.red400).opacity(0.3)).allowsHitTesting(false) }
        } else {
            content
        }
    }
}

/// The text on a prominent glass of `tint`, in the ground's mode (`onPrimary`); on the ink's and the accent's, under an
/// accent of the ground's or the app's (4.2), the ink on that accent (`onAccent`).
struct GOnProminent: ShapeStyle {
    let tint: GProminentTint

    init(_ tint: GProminentTint) { self.tint = tint }

    func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        if tint != .danger, let accent = environment.gAccentTone { return Color(accent.onAccent).resolve(in: environment) }
        return GColor.onProminent(on: environment.gResolvedGround).resolve(in: environment)
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

/// Gabarit's close button: a cross in a circle of liquid glass (4.0), that lights and grows held down (4.1); graphite: a fine rim, on the dark frame. Escape
/// triggers it.
public struct GCloseButton: View {
    var title: String
    /// On the dark frame (a window's header); otherwise on the page's ground, in the appearance's colours.
    var onFrame: Bool
    let action: () -> Void
    /// The cross and its circle grow with the text size (iPhone, iPad).
    @ScaledMetric(relativeTo: .caption) private var glyph: CGFloat = 11
    @ScaledMetric(relativeTo: .caption) private var circle: CGFloat = 28
    @Environment(\.gFrameStyle) private var style

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

    @ViewBuilder private func cross(_ hovering: Bool, _ pressed: Bool) -> some View {
        if style == .ground { glassCross(hovering, pressed) } else { graphiteCross(hovering, pressed) }
    }

    private func glassCross(_ hovering: Bool, _ pressed: Bool) -> some View {
        Image(systemName: "xmark")
            .font(.system(size: glyph, weight: .bold))
            .foregroundStyle(hovering ? AnyShapeStyle(.gInk) : AnyShapeStyle(.gInk2))
            .frame(width: circle, height: circle)
            .gLiquidControl(in: Circle(), hovering: hovering, pressed: pressed)
            #if os(iOS)
            .padding(8)
            .contentShape(Rectangle())
            .padding(-8)
            #else
            .contentShape(Circle())
            #endif
    }

    private func graphiteCross(_ hovering: Bool, _ pressed: Bool) -> some View {
        Image(systemName: "xmark")
            .font(.system(size: glyph, weight: .bold))
            .foregroundStyle(onFrame ? GFrameColor.text : GColor.textSecondary)
            .frame(width: circle, height: circle)
            .background(pressed ? (onFrame ? GFrameColor.selected : GColor.press) : hovering ? (onFrame ? GFrameColor.closeHover : GColor.hover) : Color.clear, in: Circle())
            .overlay { Circle().strokeBorder(onFrame ? GFrameColor.rim : GColor.hairline, lineWidth: 1) }
            .gRaised(Circle(), hovering: hovering, pressed: pressed, active: !onFrame)
            .gPressScale(onFrame && pressed, to: 0.94)
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
