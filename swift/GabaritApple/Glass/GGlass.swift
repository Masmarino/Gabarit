#if canImport(SwiftUI)
import SwiftUI

// The two glasses (4.0). The content glass (`gGlass`) for panels, cards, lists, forms: dense enough that a long text
// reads, the light on its top edge and a half-point rim, a wide soft shadow, 22 points of radius. The liquid glass
// (`gLiquidGlass`, `GGlassGroup`, `.buttonStyle(.glass)`) for what commands and floats: a tab bar, a search, a round
// button, a menu. Never the liquid glass for content (bubbles, lists, forms).
// "Reduce transparency": the content glass becomes a dense colour (`GGlassValues.reduced`). "Increase contrast": its
// light becomes a true rim (`GColor.border`).

/// The content glass's density: thin (behind a little text), regular (a panel), thick (a sheet, a long text, the
/// chosen row).
public enum GGlassDensity: Sendable, Hashable, CaseIterable {
    case thin, regular, thick

    /// Its colour's opacity on a ground of this kind.
    public func opacity(_ kind: GGlassKind) -> Double {
        switch self {
        case .thin: kind.values.thin
        case .regular: kind.values.regular
        case .thick: kind.values.thick
        }
    }
}

public extension GGroundSpec {
    /// The content glass's colour at a density.
    func glassColor(_ density: GGlassDensity) -> Color { Color(glass.opacity(density.opacity(kind))) }
}

public extension View {
    /// The content glass behind this view, in `shape` (by default a rounded rectangle of `GRadius.glass`).
    func gGlass(_ density: GGlassDensity = .regular) -> some View {
        modifier(GGlass(density: density, shape: RoundedRectangle(cornerRadius: GRadius.glass, style: .continuous)))
    }

    /// The content glass behind this view, in a shape of one's own.
    func gGlass<S: InsettableShape>(_ density: GGlassDensity = .regular, in shape: S) -> some View {
        modifier(GGlass(density: density, shape: shape))
    }
}

/// The content glass: the system's glass tinted with the ground's glass colour at the density, its light (a point on
/// the top edge, a half-point rim), its two shadows. A dense colour when the system asks for less transparency.
public struct GGlass<S: InsettableShape>: ViewModifier {
    let density: GGlassDensity
    let shape: S
    @Environment(\.gGround) private var ground
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

    public init(density: GGlassDensity, shape: S) {
        self.density = density
        self.shape = shape
    }

    public func body(content: Content) -> some View {
        let spec = ground ?? (scheme == .dark ? GGroundValues.dark : GGroundValues.light)
        let tone = GGroundToneCache.tone(of: spec)
        let kind = spec.kind.values
        content
            .background {
                if reduceTransparency {
                    shape.fill(Color(spec.glass.opacity(GGlassValues.reduced)))
                } else {
                    shape.fill(Color.clear)
                        .glassEffect(.clear.tint(spec.glassColor(density)), in: shape)
                }
            }
            .background {
                GGlassShadow(shape: shape, color: Color(tone.shade), far: kind.shadow, near: kind.shadowNear)
            }
            .overlay { GGlassRim(shape: shape, rim: kind.rim, edge: kind.rimEdge) }
    }
}

/// The content glass's light: a point of light on its top edge, a half-point rim all round; a true rim (`GColor.border`)
/// when the system asks for more contrast.
struct GGlassRim<S: InsettableShape>: View {
    let shape: S
    let rim: Double
    let edge: Double
    @Environment(\.colorSchemeContrast) private var contrast

    var body: some View {
        Group {
            if contrast == .increased {
                shape.strokeBorder(GColor.border, lineWidth: 1)
            } else {
                ZStack {
                    shape.strokeBorder(Color.white.opacity(edge), lineWidth: 0.5)
                    shape.strokeBorder(LinearGradient(stops: [.init(color: .white.opacity(rim), location: 0),
                                                              .init(color: .white.opacity(0), location: 0.12)],
                                                      startPoint: .top, endPoint: .bottom), lineWidth: 1)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// The glass's shadows, as CSS draws a box's: a wide soft one and a near one, each moved down and shrunk by its spread,
/// and cut out under the glass (a translucent panel would show its own shadow through it).
struct GGlassShadow<S: InsettableShape>: View {
    let shape: S
    let color: Color
    let far: Double
    let near: Double
    var liquid = false

    var body: some View {
        let v = GGlassValues.self
        ZStack {
            if liquid {
                layer(opacity: far, y: v.shadowLiquidY, blur: v.shadowLiquidBlur, spread: v.shadowLiquidSpread)
            } else {
                layer(opacity: far, y: v.shadowY, blur: v.shadowBlur, spread: v.shadowSpread)
                layer(opacity: near, y: v.shadowNearY, blur: v.shadowNearBlur, spread: v.shadowNearSpread)
            }
        }
        .mask {
            // Everything but the glass itself.
            ZStack {
                Rectangle().padding(-120)
                shape.blendMode(.destinationOut)
            }
            .compositingGroup()
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func layer(opacity: Double, y: Double, blur: Double, spread: Double) -> some View {
        shape.inset(by: -spread).fill(color.opacity(opacity)).offset(y: y).blur(radius: blur / 2)
    }
}

// MARK: Liquid glass

public extension View {
    /// The liquid glass (Liquid Glass): for what commands and floats (a tab bar, a search, a round button, a menu). It
    /// answers the finger and the pointer (`interactive`). In a `GGlassGroup`, neighbouring glasses melt into each other.
    /// `thin` (4.1): the system's clear glass, what is under it seen as it is (a label, a segmented control's track), so
    /// the text that holds on the ground holds on it.
    func gLiquidGlass<S: Shape>(in shape: S, interactive: Bool = true, thin: Bool = false) -> some View {
        modifier(GLiquidGlass(shape: shape, interactive: interactive, thin: thin))
    }

    /// The liquid glass in a capsule.
    func gLiquidGlass(interactive: Bool = true, thin: Bool = false) -> some View {
        modifier(GLiquidGlass(shape: Capsule(), interactive: interactive, thin: thin))
    }
}

/// The liquid glass: the system's own, a little whiter on a dark ground (the tone's `liquid`). With less transparency,
/// the system draws it dense by itself.
public struct GLiquidGlass<S: Shape>: ViewModifier {
    let shape: S
    let interactive: Bool
    var thin: Bool
    @Environment(\.gGroundTone) private var tone
    @Environment(\.colorSchemeContrast) private var contrast

    public init(shape: S, interactive: Bool = true, thin: Bool = false) {
        self.shape = shape
        self.interactive = interactive
        self.thin = thin
    }

    public func body(content: Content) -> some View {
        let glass = (thin ? Glass.clear : Glass.regular.tint(Color.white.opacity(tone.liquid * 0.5))).interactive(interactive)
        content
            .glassEffect(glass, in: shape)
            .overlay {
                if contrast == .increased {
                    shape.stroke(GColor.border, lineWidth: 1).allowsHitTesting(false).accessibilityHidden(true)
                }
            }
    }
}

/// Liquid glasses that sit together (a bar's buttons, a search and its button): they melt into each other when they
/// come close, and share one sampling of what is under them. `spacing`: how close is close.
public struct GGlassGroup<Content: View>: View {
    var spacing: CGFloat?
    @ViewBuilder let content: Content

    public init(spacing: CGFloat? = nil, @ViewBuilder content: () -> Content) {
        self.spacing = spacing
        self.content = content()
    }

    public var body: some View {
        GlassEffectContainer(spacing: spacing) { content }
    }
}

/// A round button of liquid glass (an icon: compose, call, close): the system's glass button, in a circle, with Gabarit's
/// ink. `prominent`: filled with the ink (the one thing to do).
public struct GRoundButton: View {
    let systemImage: String
    let title: String
    var prominent: Bool
    let action: () -> Void
    @ScaledMetric(relativeTo: .body) private var size: CGFloat = 20

    public init(systemImage: String, title: String, prominent: Bool = false, action: @escaping () -> Void) {
        self.systemImage = systemImage
        self.title = title
        self.prominent = prominent
        self.action = action
    }

    public var body: some View {
        if prominent {
            Button(action: action) { label }
                .buttonStyle(.glassProminent)
                .buttonBorderShape(.circle)
                .tint(GColor.primary)
                .help(title)
                .accessibilityLabel(title)
        } else {
            Button(action: action) { label.foregroundStyle(.gInk) }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .help(title)
                .accessibilityLabel(title)
        }
    }

    private var label: some View {
        Image(systemName: systemImage)
            .font(.system(size: min(size, 28) * 0.8, weight: .medium))
            .frame(width: min(size, 28), height: min(size, 28))
            .padding(4)
    }
}
#endif
