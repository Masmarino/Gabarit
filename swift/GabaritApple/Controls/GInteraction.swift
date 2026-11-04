#if canImport(SwiftUI)
import SwiftUI

// How Gabarit's clickable things answer the pointer: a hover state (Mac, iPad with a trackpad), read by `GHover`, and
// the pointing hand over them on the Mac (`gPointer`).

public extension GAnimation {
    /// A hover, a focus that comes and goes: the same short fade everywhere.
    static let hover = Animation.easeOut(duration: 0.12)
}

public extension GColor {
    /// A control's rim (a field, a picker, a stepper): the fine line, the stronger border when the system asks for
    /// more contrast (a 3:1 rim).
    static func controlRim(_ contrast: ColorSchemeContrast) -> Color {
        contrast == .increased ? border : hairline
    }
}

/// Runs `change` animated, or at once when the system asks for reduced motion.
@MainActor
public func gWithAnimation(_ animation: Animation, reduceMotion: Bool, _ change: () -> Void) {
    if reduceMotion { change() } else { withAnimation(animation, change) }
}

public extension View {
    /// Under the finger (iPhone, iPad), a target of 44 points at least around a control drawn `height` high: the drawing
    /// does not change, only where a touch lands. Nothing on the Mac.
    @ViewBuilder func gTouchTarget(height: CGFloat) -> some View {
        #if os(iOS)
        let inset = max(0, (44 - height) / 2)
        padding(.vertical, inset).contentShape(Rectangle()).padding(.vertical, -inset)
        #else
        self
        #endif
    }

    /// Dimmed when disabled (`GOpacity.disabled`), the same for every control.
    func gDimmedWhenDisabled() -> some View { modifier(GDimmed()) }

    /// The pointing hand over this view on the Mac: it can be clicked (not when it is disabled).
    func gPointer() -> some View { modifier(GPointer()) }
}

public extension GAnimation {
    /// A press: quicker than a hover, it answers the finger.
    static let press = Animation.easeOut(duration: 0.07)
}

/// How a control is drawn under the pointer, to force it in a gallery (`gPointerPreview`).
public enum GPointerPreview: Sendable {
    case hover, pressed
}

public extension EnvironmentValues {
    /// A gallery draws what is below as hovered or pressed, without a pointer.
    @Entry var gPointerPreview: GPointerPreview?
    /// The button around this is held down (`GLiveStyle`).
    @Entry var gButtonPressed = false
}

/// A button's style that draws nothing itself and tells its label it is held down: `GLive` reads it.
public struct GLiveStyle: ButtonStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label.environment(\.gButtonPressed, configuration.isPressed)
    }
}

/// Reads whether the pointer is over its content, and redraws it so: `GHover { hovering in … }`.
public struct GHover<Content: View>: View {
    let content: (Bool) -> Content

    public init(@ViewBuilder content: @escaping (_ hovering: Bool) -> Content) {
        self.content = content
    }

    public var body: some View {
        GLive { hovering, _ in content(hovering) }
    }
}

/// Reads whether the pointer is over its content, and whether it is held down (the button's style is `GLiveStyle`):
/// `GLive { hovering, pressed in … }`.
public struct GLive<Content: View>: View {
    @State private var hovering = false
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.gButtonPressed) private var buttonPressed
    @Environment(\.gPointerPreview) private var preview
    let content: (Bool, Bool) -> Content

    public init(@ViewBuilder content: @escaping (_ hovering: Bool, _ pressed: Bool) -> Content) {
        self.content = content
    }

    public var body: some View {
        let pressed = isEnabled && (buttonPressed || preview == .pressed)
        content(isEnabled && (hovering || preview != nil), pressed)
            .onHover { hovering = $0 }
            .gPointer()
            .animation(GAnimation.hover, value: hovering)
            .animation(GAnimation.press, value: pressed)
    }
}

private struct GPointer: ViewModifier {
    @Environment(\.isEnabled) private var isEnabled

    func body(content: Content) -> some View {
        #if os(macOS)
        content.pointerStyle(isEnabled ? .link : nil)
        #else
        content
        #endif
    }
}

private struct GDimmed: ViewModifier {
    @Environment(\.isEnabled) private var isEnabled

    func body(content: Content) -> some View {
        content.opacity(isEnabled ? 1 : GOpacity.disabled)
    }
}
#endif
