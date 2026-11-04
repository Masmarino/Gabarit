import Foundation
import GabaritCommon
import Testing

/// The apps' colours meet WCAG's contrasts, light and dark: 7:1 for the main text, 4.5:1 for other text (and the
/// states and the accent used as text), 3:1 for what draws a control (borders, the accent of a switch).
struct GContrastTests {
    typealias Pick = @Sendable (GColorPair) -> GRGBA
    static let appearances: [(String, Pick)] = [("light", { $0.light }), ("dark", { $0.dark })]
    static let grounds: [(String, GColorPair)] = [("background", GColorValues.background), ("surface", GColorValues.surface)]

    @Test(arguments: [("textPrimary", GColorValues.textPrimary, 7.0), ("textSecondary", GColorValues.textSecondary, 4.5),
                      ("textDiscret", GColorValues.textDiscret, 4.5), ("accentText", GColorValues.accentText, 4.5),
                      ("error", GColorValues.error, 3.0), ("success", GColorValues.success, 3.0),
                      ("warning", GColorValues.warning, 3.0), ("info", GColorValues.info, 3.0),
                      ("errorText", GColorValues.errorText, 4.5), ("successText", GColorValues.successText, 4.5),
                      ("warningText", GColorValues.warningText, 4.5), ("infoText", GColorValues.infoText, 4.5),
                      ("border", GColorValues.border, 3.0), ("accent", GColorValues.accent, 3.0)])
    func onTheGrounds(_ name: String, _ colour: GColorPair, _ minimum: Double) {
        for (appearance, pick) in Self.appearances {
            for (groundName, ground) in Self.grounds {
                let value = ratio(pick(colour), over: pick(ground))
                #expect(value >= minimum, "\(name) on \(groundName), \(appearance): \(value)")
            }
        }
    }

    @Test func inkButtons() {
        for (appearance, pick) in Self.appearances {
            #expect(ratio(pick(GColorValues.onPrimary), over: pick(GColorValues.primary)) >= 4.5, "primary, \(appearance)")
            #expect(ratio(pick(GColorValues.onPrimary), over: pick(GColorValues.primaryHover)) >= 4.5, "primary hovered, \(appearance)")
            #expect(ratio(pick(GColorValues.onPrimary), over: pick(GColorValues.error)) >= 4.5, "danger, \(appearance)")
        }
    }

    /// A badge's text on its state's tint (the state at 14 % over the ground).
    @Test func badges() {
        let pairs = [(GColorValues.successOnTint, GColorValues.success), (GColorValues.warningOnTint, GColorValues.warning),
                     (GColorValues.errorOnTint, GColorValues.error), (GColorValues.infoOnTint, GColorValues.info)]
        for (appearance, pick) in Self.appearances {
            for (groundName, ground) in Self.grounds {
                for (text, state) in pairs {
                    let tint = pick(state).opacity(0.14)
                    let a = tint.alpha, g = pick(ground)
                    let laid = GRGBA(red: tint.red * a + g.red * (1 - a), green: tint.green * a + g.green * (1 - a),
                                     blue: tint.blue * a + g.blue * (1 - a), alpha: 1)
                    #expect(ratio(pick(text), over: laid) >= 4.5, "badge on \(groundName), \(appearance)")
                }
            }
        }
    }

    /// `top` at its opacity on the opaque `under`.
    private func laid(_ top: GRGBA, on under: GRGBA) -> GRGBA {
        let a = top.alpha
        return GRGBA(red: top.red * a + under.red * (1 - a), green: top.green * a + under.green * (1 - a),
                     blue: top.blue * a + under.blue * (1 - a), alpha: 1)
    }

    private func mix(_ a: GRGBA, _ b: GRGBA, by t: Double) -> GRGBA {
        GRGBA(red: a.red * (1 - t) + b.red * t, green: a.green * (1 - t) + b.green * t, blue: a.blue * (1 - t) + b.blue * t, alpha: 1)
    }

    /// Text stays readable under the pointer and held down: on the veils of hover and press, over the page and a
    /// surface, and on the ink buttons' grounds of those states (as GButtonStyle draws them).
    @Test func pointerStates() {
        let black = GRGBA(hex: 0x000000), white = GRGBA(hex: 0xFFFFFF)
        for (appearance, pick) in Self.appearances {
            for (groundName, ground) in Self.grounds {
                let under = laid(pick(ground), on: pick(GColorValues.background))
                for (veilName, veil) in [("hover", GColorValues.hover), ("press", GColorValues.press)] {
                    let lit = laid(pick(veil), on: under)
                    for (name, colour) in [("textPrimary", GColorValues.textPrimary), ("textSecondary", GColorValues.textSecondary),
                                           ("errorText", GColorValues.errorText)] {
                        let value = ratio(pick(colour), over: lit)
                        #expect(value >= 4.5, "\(name) on \(veilName) on \(groundName), \(appearance): \(value)")
                    }
                }
            }
            let on = pick(GColorValues.onPrimary), ink = pick(GColorValues.primary), inkHover = pick(GColorValues.primaryHover), red = pick(GColorValues.error)
            for (name, ground) in [("primary hovered", mix(ink, inkHover, by: 0.55)), ("primary pressed", inkHover),
                                   ("danger hovered", mix(red, white, by: 0.1)), ("danger pressed", mix(red, black, by: 0.18))] {
                let value = ratio(on, over: ground)
                #expect(value >= 4.5, "\(name), \(appearance): \(value)")
            }
        }
    }

    /// `over` an opaque ground: a translucent colour is first laid on it.
    private func ratio(_ colour: GRGBA, over ground: GRGBA) -> Double {
        let a = colour.alpha
        let r = colour.red * a + ground.red * (1 - a), g = colour.green * a + ground.green * (1 - a), b = colour.blue * a + ground.blue * (1 - a)
        func channel(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        func luminance(_ r: Double, _ g: Double, _ b: Double) -> Double { 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) }
        let (l1, l2) = (luminance(r, g, b), luminance(ground.red, ground.green, ground.blue))
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    }
}
