#if canImport(SwiftUI)
import SwiftUI

// The controls on the liquid glass (4.1): buttons, chips, a segmented control's track and lens, a switch's or a slider's
// knob while it is held. The glass is the system's own (`glassEffect`), with no rim of Gabarit's: its light is the
// system's. Under the pointer it lights a little; held down it lights (`controlPressLight`) and grows
// (`controlPressScale`) on the bouncy spring. A prominent glass (the one thing to do, the chosen chip) is tinted with
// the ink, the accent or the red at `controlProminent`, its text `onPrimary`. Under an accent of the ground's or the
// app's (4.2), the ink's and the accent's prominent glass take that accent, their text the ink on it (`onAccent`).
// Less transparency: the system draws the glass dense. More contrast: a true rim (`GColor.border`). Reduced motion: no
// spring, no growth; the light stays.

public extension GColor {
    /// The accent of a prominent glass (a chosen chip): the accent on a dark ground; on a light one, its text step (rust
    /// 600), so that white text holds 4.5:1 on it at `controlProminent` (rust 500 gives 4.2:1).
    /// A ground with its own accent (4.2): that accent.
    static func prominentAccent(on ground: GGroundSpec) -> Color {
        if let accent = GAccentToneCache.tone(of: ground) { return Color(accent.accent) }
        return ground.mode == .light ? Color(GColorValues.accentText.light) : Color(GColorValues.accent.dark)
    }

    /// The red of a prominent glass (a danger button), in the ground's mode.
    static func prominentDanger(on ground: GGroundSpec) -> Color {
        Color(ground.mode == .light ? GPaletteValues.red700 : GPaletteValues.red400)
    }

    /// The ink of a prominent glass (a primary button), in the ground's mode; a ground with its own accent (4.2): that
    /// accent.
    static func prominentInk(on ground: GGroundSpec) -> Color {
        if let accent = GAccentToneCache.tone(of: ground) { return Color(accent.accent) }
        return Color(ground.mode == .light ? GColorValues.primary.light : GColorValues.primary.dark)
    }

    /// The text on a prominent glass of the ink or the red, in the ground's mode.
    static func onProminent(on ground: GGroundSpec) -> Color {
        Color(ground.mode == .light ? GColorValues.onPrimary.light : GColorValues.onPrimary.dark)
    }

    /// The text on a prominent glass of `tint` (4.2): on the ink's and the accent's, the ink on the ground's own accent
    /// when it has one (`onAccent`); else as `onProminent(on:)`.
    static func onProminent(_ tint: GProminentTint, on ground: GGroundSpec) -> Color {
        if tint != .danger, let accent = GAccentToneCache.tone(of: ground) { return Color(accent.onAccent) }
        return onProminent(on: ground)
    }
}

/// What tints a prominent glass.
public enum GProminentTint: Sendable, Hashable {
    /// The ink (a primary button).
    case ink
    /// The accent (a chosen chip).
    case accent
    /// The red (a danger button).
    case danger
}

public extension View {
    /// A control of liquid glass in `shape`: clear, or `prominent` (tinted). `hovering` and `pressed`: its answer to the
    /// pointer and the finger (the light, the growth on the bouncy spring).
    func gLiquidControl<S: Shape>(in shape: S, prominent: GProminentTint? = nil, hovering: Bool = false,
                                  pressed: Bool = false) -> some View {
        modifier(GLiquidControl(shape: shape, prominent: prominent, hovering: hovering, pressed: pressed))
    }

    /// A control of liquid glass in a capsule.
    func gLiquidControl(prominent: GProminentTint? = nil, hovering: Bool = false, pressed: Bool = false) -> some View {
        modifier(GLiquidControl(shape: Capsule(), prominent: prominent, hovering: hovering, pressed: pressed))
    }
}

/// A control of liquid glass: the system's glass, a little whiter on a dark ground (as `gLiquidGlass`), or tinted at
/// `controlProminent`; the light of the pointer and the press laid on it, under the label.
public struct GLiquidControl<S: Shape>: ViewModifier {
    let shape: S
    let prominent: GProminentTint?
    let hovering: Bool
    let pressed: Bool
    @Environment(\.gGroundTone) private var tone
    @Environment(\.gResolvedGround) private var ground
    @Environment(\.gAccentTone) private var accent
    @Environment(\.colorSchemeContrast) private var contrast
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(shape: S, prominent: GProminentTint? = nil, hovering: Bool = false, pressed: Bool = false) {
        self.shape = shape
        self.prominent = prominent
        self.hovering = hovering
        self.pressed = pressed
    }

    public func body(content: Content) -> some View {
        content
            .background {
                ZStack {
                    if let tint {
                        shape.fill(tint.opacity(GGlassValues.controlProminent))
                    }
                    // The light: on a prominent glass under white text (a light ground), none, it would pale the text.
                    if prominent == nil || ground.mode == .dark {
                        shape.fill(Color.white.opacity(pressed ? GGlassValues.controlPressLight : hovering ? GGlassValues.controlPressLight / 2 : 0))
                    }
                }
                .allowsHitTesting(false)
            }
            .glassEffect(Glass.regular.tint(Color.white.opacity(tone.liquid * 0.5)), in: shape)
            // In a light surface (4.1.1), a clear glass takes its shade at the bottom (`GNestedFloat`).
            .modifier(GNestedFloat(shape: shape, active: prominent == nil))
            .overlay {
                if contrast == .increased {
                    shape.stroke(GColor.border, lineWidth: 1).allowsHitTesting(false).accessibilityHidden(true)
                }
            }
            .scaleEffect(pressed && !reduceMotion ? GGlassValues.controlPressScale : 1)
            .animation(reduceMotion ? nil : GAnimation.bouncy, value: pressed)
            .animation(GAnimation.hover, value: hovering)
    }

    private var tint: Color? {
        // An accent of the ground's or the app's (4.2): the one thing to do and the chosen chip take it.
        if let accent, prominent == .ink || prominent == .accent { return Color(accent.accent) }
        return switch prominent {
        case .ink: GColor.prominentInk(on: ground)
        case .accent: GColor.prominentAccent(on: ground)
        case .danger: GColor.prominentDanger(on: ground)
        case nil: nil
        }
    }
}

// MARK: Hollow

public extension View {
    /// The hollow of thin glass a field is (4.1): the ground's glass colour at its thin density, the ground's shade falling
    /// in from the top edge (`hollow` of the glass's kind), no rim. Less transparency: a dense colour.
    func gGlassHollow<S: InsettableShape>(in shape: S) -> some View {
        modifier(GGlassHollow(shape: shape))
    }
}

/// The glass's colour at its thin density, a faint veil of the ground's shade (`hollow` × 0.4: on a light ground, white
/// glass alone would not show on a card of white glass), and the shade falling in from the top edge (`glassHollow`).
/// Laid in a light surface (a sheet, a card: 4.1.1), the same ground, and a hollow's edge: the ink's shadow under its
/// top edge, a trace of ink all round, the light on its bottom edge.
struct GGlassHollow<S: InsettableShape>: ViewModifier {
    let shape: S
    @Environment(\.gResolvedGround) private var ground
    @Environment(\.gNestedLight) private var nested
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    func body(content: Content) -> some View {
        let tone = GGroundToneCache.tone(of: ground)
        let fill = reduceTransparency ? Color(ground.glass.opacity(GGlassValues.reduced)) : ground.glassColor(.thin)
        let shade = nested ? Color(tone.ink).opacity(GNestedEdgeValues.hollowShadow) : Color(tone.shade).opacity(ground.kind.values.hollow)
        content.background {
            ZStack {
                shape.fill(fill)
                if nested {
                    shape.fill(Color(tone.shade).opacity(ground.kind.values.hollow * 0.4).shadow(.inner(color: shade, radius: 2, y: 1)))
                    shape.strokeBorder(Color(tone.ink).opacity(GNestedEdgeValues.hollowTrace), lineWidth: 1)
                    shape.strokeBorder(LinearGradient(stops: [.init(color: .white.opacity(0), location: 0.5),
                                                              .init(color: .white.opacity(0.9), location: 1)],
                                                      startPoint: .top, endPoint: .bottom), lineWidth: 1)
                } else {
                    shape.fill(Color(tone.shade).opacity(ground.kind.values.hollow * 0.4).shadow(.inner(color: shade, radius: 2.5, y: 1.5)))
                }
            }
            .allowsHitTesting(false)
        }
    }
}
#endif
