#if canImport(SwiftUI)
import SwiftUI

// Gabarit's depth, a little of it. Three levels: the page; what rests on it (a card, a soft shadow and the light on its
// top edge); what can be pressed (a button, a chip: a little volume, a tighter shadow, and it sinks when pressed). What
// holds a value (a switch's track, a slider's, a field) is slightly hollow, and the frame's bars cast a shadow on the page.
// One light, from above: top edges catch it, bottom edges fall into shade, the page is lit at its top, and what is on (a
// switch, the current tab, a selection) glows a little. A hairline stays the edge of things: all this only adds to it.

public extension View {
    /// Raised: a soft shadow and the light on the top edge. `pressed`: sunk, neither. `onInk`: on a dark ground (a
    /// primary button), the light is the same in both appearances. `active` false: nothing (a ghost button).
    func gRaised<S: InsettableShape>(_ shape: S, pressed: Bool = false, onInk: Bool = false, active: Bool = true) -> some View {
        modifier(GRaised(shape: shape, lit: active && !pressed, onInk: onInk))
    }
}

/// A slight hollow, for what holds a value: `GColor.track.gHollow()` as a shape's fill.
public extension ShapeStyle where Self == Color {
    func gHollow(_ strength: Double = 0.12) -> some ShapeStyle {
        shadow(.inner(color: .black.opacity(strength), radius: 1.5, y: 1))
    }
}

public extension View {
    /// Rests on the page (a card): behind the view, its surface and a soft shadow; on it, the light on the top edge.
    func gCardDepth<S: InsettableShape>(_ shape: S, fill: Color = GColor.surface) -> some View {
        background { shape.fill(fill).shadow(color: GColor.cardShadow, radius: GShadowValues.card.radius, x: GShadowValues.card.x, y: GShadowValues.card.y) }
            .overlay {
                // Light on the top edge, shade on the bottom one.
                shape.inset(by: 1).strokeBorder(LinearGradient(stops: [.init(color: GColor.reliefHighlight, location: 0), .init(color: .clear, location: 0.2),
                                                                       .init(color: .clear, location: 0.85), .init(color: GColor.reliefShade, location: 1)],
                                                               startPoint: .top, endPoint: .bottom), lineWidth: 1)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
    }

    /// What is on glows a little, in its colour (a switch, the current tab, a selection). `active` false: nothing.
    func gGlow(_ color: Color = GColor.accent, radius: CGFloat = 5, active: Bool = true) -> some View {
        shadow(color: active ? color.opacity(0.45) : .clear, radius: radius)
    }

    /// The light on one of the frame's dark bars: a soft sheen from above, a lit top edge.
    func gFrameSheen() -> some View {
        overlay {
            LinearGradient(stops: [.init(color: .white.opacity(0.07), location: 0), .init(color: .clear, location: 0.7)], startPoint: .top, endPoint: .bottom)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }

    /// A shadow cast on the page by one of the frame's bars. `up`: from a bar at the bottom.
    func gBarShadow(up: Bool = false) -> some View {
        let bar = GShadowValues.bar
        return shadow(color: Color(bar.color), radius: bar.radius, x: 0, y: up ? -1 : bar.y)
    }
}

/// A switch's or a slider's knob: white, a little rounded by the light.
public struct GKnob: View {
    public init() {}

    public var body: some View {
        Circle().fill(LinearGradient(colors: [.white, Color(white: 0.93)], startPoint: .top, endPoint: .bottom))
    }
}

private struct GRaised<S: InsettableShape>: ViewModifier {
    let shape: S
    let lit: Bool
    let onInk: Bool

    func body(content: Content) -> some View {
        content
            .overlay {
                // A little volume: lighter at the top, a touch darker at the bottom.
                if lit {
                    shape.fill(LinearGradient(colors: [.white.opacity(0.07), .clear, .black.opacity(0.04)], startPoint: .top, endPoint: .bottom))
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                    // Light on the top edge, shade on the bottom one.
                    shape.strokeBorder(LinearGradient(stops: [.init(color: onInk ? Color.white.opacity(0.2) : GColor.reliefHighlight, location: 0),
                                                              .init(color: .clear, location: 0.5),
                                                              .init(color: GColor.reliefShade, location: 1)],
                                                      startPoint: .top, endPoint: .bottom), lineWidth: 1)
                        .allowsHitTesting(false)
                        .accessibilityHidden(true)
                }
            }
            // One shadow for the whole, not one per element (the text's would blur it).
            .compositingGroup()
            .shadow(color: lit ? GColor.reliefShadow : .clear, radius: GShadowValues.raised.radius,
                    x: GShadowValues.raised.x, y: GShadowValues.raised.y)
    }
}
#endif
