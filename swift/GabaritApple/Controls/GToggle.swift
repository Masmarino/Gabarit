#if canImport(SwiftUI)
import SwiftUI

/// Gabarit's switch: a flat track (rust when on, the track's grey when off), a white knob. The label: its title, then,
/// if there is one, the sentence that explains it, more discreet.
public struct GToggleStyle: ToggleStyle {
    public init() {}

    public func makeBody(configuration: Configuration) -> some View {
        GToggleRow(configuration: configuration)
    }
}

private struct GToggleRow: View {
    let configuration: ToggleStyleConfiguration
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        // A button: reached by the keyboard (Tab, then Space), not only by a click or a tap. The switch animates itself:
        // the change is not wrapped in an animation, which would animate everything that depends on the setting.
        Button { configuration.isOn.toggle() } label: { GLive { hovering, pressed in row(hovering, pressed) } }
            .buttonStyle(GLiveStyle())
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isToggle)
            .accessibilityValue(configuration.isOn ? gText("on") : gText("off"))
    }

    private func row(_ hovering: Bool, _ pressed: Bool) -> some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Group(subviews: configuration.label) { parts in
                    if let title = parts.first {
                        title.font(GFont.body).foregroundStyle(GColor.textPrimary)
                    }
                    ForEach(parts.dropFirst()) { detail in
                        detail.font(GFont.caption).foregroundStyle(GColor.textDiscret)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            Spacer(minLength: 12)
            GSwitch(isOn: configuration.isOn, hovering: hovering, pressed: pressed)
        }
        .opacity(isEnabled ? 1 : GOpacity.disabled)
        .contentShape(Rectangle())
    }
}

/// A switch's track and knob; held down, the knob becomes liquid glass (4.1).
public struct GSwitch: View {
    let isOn: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorSchemeContrast) private var contrast
    #if os(macOS)
    private let size = CGSize(width: 36, height: 20)
    #else
    private let size = CGSize(width: 46, height: 28)
    #endif

    /// Under the pointer: its rim stronger, its glow wider. Held down: the knob turns to liquid glass and grows.
    var hovering = false
    var pressed = false

    public init(isOn: Bool, hovering: Bool = false, pressed: Bool = false) {
        self.isOn = isOn
        self.hovering = hovering
        self.pressed = pressed
    }

    public var body: some View {
        Capsule()
            .fill((isOn ? GColor.accent : GColor.track).gHollow())
            // Off, a rim stronger than the fine line: the track shows on a white card too.
            .overlay { Capsule().strokeBorder(isOn ? Color.clear : hovering || contrast == .increased ? GColor.border : GColor.border.opacity(0.35), lineWidth: 1) }
            .frame(width: size.width, height: size.height)
            .gGlow(radius: hovering ? 7 : 5, active: isOn)
            .overlay(alignment: isOn ? .trailing : .leading) {
                knob.padding(2)
            }
            .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: isOn)
            .animation(reduceMotion ? nil : GAnimation.bouncy, value: pressed)
            .accessibilityHidden(true)
    }

    /// The knob: white at rest; held down, a lens of liquid glass, wider and a little taller than the track's height
    /// (as iOS's), the track's colour seen through it. Reduced motion: the glass, at the knob's size.
    @ViewBuilder private var knob: some View {
        let side = size.height - 4
        let grown = pressed && !reduceMotion
        if pressed {
            Capsule().fill(Color.white.opacity(0.0001))
                .gLiquidControl(pressed: true)
                .frame(width: grown ? side * 1.5 : side, height: grown ? side * 1.2 : side)
        } else {
            GKnob()
                .frame(width: side, height: side)
                .shadow(color: .black.opacity(0.18), radius: 1.5, y: 1)
        }
    }
}
#endif
