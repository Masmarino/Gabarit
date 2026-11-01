#if canImport(SwiftUI)
import SwiftUI

// Gabarit's form controls: switch, choice (menu or chips), text field, slider, stepper, close button, drawn by Gabarit
// (no grey button, system pop-up or system switch), on the Mac as on iPhone and iPad (where they keep finger-sized
// targets). `gControls()` puts them on a whole form at once (switches, fields, buttons); choices, sliders and steppers
// are written with `GPicker`, `GSlider` and `GStepper`.

public extension View {
    /// Gabarit's switches, text fields and buttons for everything below (a button with its own style keeps it). On
    /// iPhone and iPad, under a system `Form` (`gFormLayout` false), the system's controls stay.
    func gControls() -> some View { modifier(GControlsModifier()) }
}

private struct GControlsModifier: ViewModifier {
    @Environment(\.gFormLayout) private var gabarit

    func body(content: Content) -> some View {
        #if os(iOS)
        if gabarit { styled(content) } else { content }
        #else
        styled(content)
        #endif
    }

    private func styled(_ content: Content) -> some View {
        content.toggleStyle(GToggleStyle())
            .textFieldStyle(GTextFieldStyle())
            .buttonStyle(GFormButtonStyle())
    }
}

/// A form's buttons: in a card's row, a row (`GFormRowButtonStyle`), not a framed button in the frame; elsewhere,
/// Gabarit's secondary button. Decided where the button is drawn: a style set around a card does not reach the rows
/// a form takes apart, the one set around the whole form does.
struct GFormButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        GFormButton(configuration: configuration)
    }
}

private struct GFormButton: View {
    let configuration: ButtonStyleConfiguration
    @Environment(\.gFormCardRow) private var inCard

    var body: some View {
        if inCard {
            GFormRowButtonStyle().makeBody(configuration: configuration)
        } else {
            GButtonStyle(variant: .secondary).makeBody(configuration: configuration)
        }
    }
}

public extension EnvironmentValues {
    /// Forms drawn by Gabarit rather than by the system (title in the page, sections as cards, Gabarit's controls).
    @Entry var gFormLayout = true

    /// The system's controls rather than Gabarit's: on iPhone and iPad, under a system `Form`.
    var gSystemControls: Bool {
        #if os(iOS)
        !gFormLayout
        #else
        false
        #endif
    }
}

/// The controls' measures: the Mac's, or finger-sized (iPhone, iPad).
public enum GControlMetrics {
    #if os(macOS)
    public static let height: CGFloat = 30
    public static let compact: CGFloat = 28
    public static let button: CGFloat = 30
    #else
    public static let height: CGFloat = 44
    public static let compact: CGFloat = 36
    public static let button: CGFloat = 38
    #endif
}

/// A string of Gabarit's own (accessibility values, tooltips), in English or French.
func gText(_ key: String.LocalizationValue) -> String {
    String(localized: key, bundle: .module)
}
#endif
