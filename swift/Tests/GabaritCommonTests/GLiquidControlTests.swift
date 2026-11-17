import Foundation
import GabaritCommon
import Testing

/// The controls on the liquid glass (4.1): the text on a prominent glass (`onPrimary` on the ink, the accent or the
/// red at `controlProminent`) holds 4.5:1 at every ground's worst point, the liquid glass's white under it. On a light
/// ground the accent's glass takes the accent's text step (rust 600: rust 500 at 0.86 gives white 4.2:1 only), and a
/// prominent glass takes no press light (white text on a lightened tint falls to 3.4:1); on a dark ground (dark text),
/// the press light only raises the contrast.
struct GLiquidControlTests {
    /// The colour under a control's text: the ground's point, the liquid glass's white, the tint at `controlProminent`,
    /// then, pressed, the press's white.
    static func under(_ tint: GRGBA, on point: GRGBA, tone: GGroundTone, pressed: Bool) -> GRGBA {
        let glass = GLuminance.laid(GRGBA(hex: 0xFFFFFF), tone.liquid * 0.5, on: point)
        let tinted = GLuminance.laid(tint, GGlassValues.controlProminent, on: glass)
        return pressed ? GLuminance.laid(GRGBA(hex: 0xFFFFFF), GGlassValues.controlPressLight, on: tinted) : tinted
    }

    @Test(arguments: GGroundValues.all)
    func prominentText(_ ground: GGroundSpec) throws {
        let tone = try #require(ground.tone())
        let light = ground.mode == .light
        func pick(_ pair: GColorPair) -> GRGBA { light ? pair.light : pair.dark }
        let tints = [("ink", pick(GColorValues.primary)), ("accent", light ? GColorValues.accentText.light : GColorValues.accent.dark),
                     ("danger", light ? GPaletteValues.red700 : GPaletteValues.red400)]
        for (name, tint) in tints {
            for point in ground.worstPoints {
                for pressed in light ? [false] : [false, true] {
                    let value = GLuminance.contrast(pick(GColorValues.onPrimary), Self.under(tint, on: point, tone: tone, pressed: pressed))
                    #expect(value >= GGlassValues.textMinimum, "\(name) on \(ground.name)\(pressed ? ", pressed" : ""): \(value)")
                }
            }
        }
    }
}
