import Foundation
import GabaritCommon
import Testing

/// The tone GabaritCommon computes is tools/tokens.py's, for every ambiance of tokens/gabarit.json.
struct GGroundTests {
    static let expected: [String: GGroundTone] = [
        "light": GGroundTones.light, "dark": GGroundTones.dark, "black": GGroundTones.black,
        "aurore": GGroundTones.aurore, "lagune": GGroundTones.lagune, "braise": GGroundTones.braise,
        "nuitPolaire": GGroundTones.nuitPolaire, "sousBois": GGroundTones.sousBois, "laiton": GGroundTones.laiton,
        "givre": GGroundTones.givre,
    ]

    @Test func tonesMatchTheGenerator() throws {
        #expect(GGroundValues.all.count == Self.expected.count)
        for ground in GGroundValues.all {
            let tone = try #require(ground.tone(), "\(ground.name)")
            let want = try #require(Self.expected[ground.name])
            #expect(abs(tone.veil - want.veil) < 1e-9, "\(ground.name): veil \(tone.veil) ≠ \(want.veil)")
            #expect(abs(tone.ink2 - want.ink2) < 1e-9, "\(ground.name): ink2 \(tone.ink2) ≠ \(want.ink2)")
            #expect(abs(tone.ink3 - want.ink3) < 1e-9, "\(ground.name): ink3 \(tone.ink3) ≠ \(want.ink3)")
            #expect(abs(tone.liquid - want.liquid) < 1e-9, "\(ground.name): liquid \(tone.liquid) ≠ \(want.liquid)")
            #expect(abs(tone.shade.red - want.shade.red) < 1e-6 && abs(tone.shade.blue - want.shade.blue) < 1e-6,
                    "\(ground.name): shade")
        }
    }

    /// The ink holds on the bare ground and on every glass, at every worst point.
    @Test func everyAmbianceHolds() throws {
        for ground in GGroundValues.all {
            let tone = try #require(ground.tone())
            let kind = ground.kind.values
            for point in ground.worstPoints {
                let veiled = GLuminance.laid(ground.glass, tone.veil, on: point)
                for opacity in [0, kind.thin, kind.regular, kind.thick] {
                    let under = GLuminance.laid(ground.glass, opacity, on: veiled)
                    #expect(GLuminance.contrast(GLuminance.laid(tone.ink, tone.ink2, on: under), under) >= 4.5 - 1e-9)
                    #expect(GLuminance.contrast(GLuminance.laid(tone.ink, tone.ink3, on: under), under) >= 3 - 1e-9)
                }
            }
        }
    }

    /// A ground brought at run time that is as bright as its light ink gets a veil.
    @Test func aBrightGroundGetsAVeil() throws {
        let bright = GGroundSpec(name: "pâle", mode: .dark, kind: .tinted, angle: 180,
                                 stops: [GRGBA(hex: 0xC9B6FF), GRGBA(hex: 0x8FD3FF)],
                                 light: GGroundLight(color: GRGBA(hex: 0xFFFFFF), x: 0, y: 0, radius: 0.6, strength: 0.3),
                                 glass: GRGBA(hex: 0x14102C), ink: GRGBA(hex: 0xFFFFFF))
        let tone = try #require(bright.tone())
        #expect(tone.veil > 0.3)
    }
}
