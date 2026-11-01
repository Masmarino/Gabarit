#if canImport(SwiftUI)
import SwiftUI

// Gabarit's relief, discreet: what can be pressed stands a little above the page (a soft shadow, the light catching its
// top edge) and sinks when pressed; what holds a value (a switch's track, a slider's, a field) is slightly hollow; a card
// rests on the page. A hairline stays the edge of things: the relief only adds to it.

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

private struct GRaised<S: InsettableShape>: ViewModifier {
    let shape: S
    let lit: Bool
    let onInk: Bool

    func body(content: Content) -> some View {
        content
            .overlay {
                if lit {
                    shape.strokeBorder(LinearGradient(colors: [onInk ? Color.white.opacity(0.18) : GColor.reliefHighlight, .clear],
                                                      startPoint: .top, endPoint: .center), lineWidth: 1)
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
