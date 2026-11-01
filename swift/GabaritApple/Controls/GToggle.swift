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

/// A switch's track and knob (a little larger under the finger).
public struct GSwitch: View {
    let isOn: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorSchemeContrast) private var contrast
    #if os(macOS)
    private let size = CGSize(width: 36, height: 20)
    #else
    private let size = CGSize(width: 46, height: 28)
    #endif

    /// Under the pointer: its rim stronger, its glow wider. Held down: the knob stretches.
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
                GKnob()
                    .frame(width: size.height - 4, height: size.height - 4)
                    .scaleEffect(x: pressed && !reduceMotion ? 1.18 : 1, anchor: isOn ? .trailing : .leading)
                    .shadow(color: .black.opacity(0.18), radius: 1.5, y: 1)
                    .padding(2)
            }
            .animation(reduceMotion ? nil : .snappy(duration: 0.18), value: isOn)
            .accessibilityHidden(true)
    }
}
#endif
