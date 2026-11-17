import Foundation
import GabaritCommon
import Testing

/// The tone GabaritCommon computes is tools/tokens.py's, for every ambiance of tokens/gabarit.json.
struct GGroundTests {
    static let expected: [String: GGroundTone] = [
        "light": GGroundTones.light, "dark": GGroundTones.dark, "black": GGroundTones.black,
        "aurore": GGroundTones.aurore, "lagune": GGroundTones.lagune, "braise": GGroundTones.braise,
        "nuitPolaire": GGroundTones.nuitPolaire, "sousBois": GGroundTones.sousBois, "laiton": GGroundTones.laiton,
        "givre": GGroundTones.givre, "dore": GGroundTones.dore,
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

    // MARK: The accent (4.2)

    /// Within a byte (1/255) on every channel.
    static func near(_ a: GRGBA, _ b: GRGBA) -> Bool {
        abs(a.red - b.red) <= 1.0 / 255 + 1e-9 && abs(a.green - b.green) <= 1.0 / 255 + 1e-9
            && abs(a.blue - b.blue) <= 1.0 / 255 + 1e-9
    }

    /// The accents GabaritCommon computes are tools/tokens.py's, for every ambiance that brings one.
    @Test func accentsMatchTheGenerator() throws {
        let expected: [String: GAccentTone] = ["dore": GAccentTones.dore]
        #expect(GGroundValues.all.filter { $0.accent != nil }.count == expected.count)
        for ground in GGroundValues.all {
            guard let want = expected[ground.name] else {
                #expect(ground.accentTone() == nil, "\(ground.name) has no accent")
                continue
            }
            let tone = try #require(ground.accentTone(), "\(ground.name)")
            #expect(Self.near(tone.accent, want.accent), "\(ground.name): accent")
            #expect(Self.near(tone.accentText, want.accentText), "\(ground.name): accentText \(tone.accentText)")
            #expect(Self.near(tone.onAccent, want.onAccent), "\(ground.name): onAccent \(tone.onAccent)")
            #expect(abs(tone.selected - want.selected) < 1e-9, "\(ground.name): selected")
        }
    }

    /// The reference values of the brief (gabarit-4.2.0/regle.md), on Gabarit's ambiances with other accents.
    @Test(arguments: [
        ("dore", 0xE9C979, 0xE9C979, 0x10151C, 0.16, true),
        ("dore", 0x7A5A20, 0xD7CEBC, 0xFFFFFF, 0.16, false),
        ("givre", 0xB8862B, 0x7D5E26, 0x10151C, 0.10, false),
        ("aurore", 0xE9C979, 0xF2DFAF, 0x10151C, 0.16, true),
        ("light", 0x2F6FDB, 0x2A62BE, 0x10151C, 0.10, false),
    ] as [(String, UInt32, UInt32, UInt32, Double, Bool)])
    func accentReferences(_ name: String, _ accent: UInt32, _ text: UInt32, _ on: UInt32, _ selected: Double,
                          _ holds: Bool) throws {
        let base = try #require(GGroundValues.all.first { $0.name == name })
        let ground = base.withAccent(GRGBA(hex: accent))
        let tone = try #require(ground.accentTone())
        #expect(Self.near(tone.accentText, GRGBA(hex: text)), "\(name) + \(String(accent, radix: 16)): text \(tone.accentText)")
        #expect(Self.near(tone.onAccent, GRGBA(hex: on)), "\(name) + \(String(accent, radix: 16)): on")
        #expect(abs(tone.selected - selected) < 1e-9)
        let groundTone = try #require(ground.tone())
        let edge = try #require(ground.accentEdge(under: groundTone))
        let ink = ground.onAccentContrast(tone, under: groundTone)
        #expect((edge >= 3 - 1e-9 && ink >= 4.5 - 1e-9) == holds, "\(name) + \(String(accent, radix: 16)): edge \(edge), on \(ink)")
    }

    /// An accent changes no tone: the ground's veil and inks stay, to the byte.
    @Test func anAccentLeavesTheToneAlone() throws {
        for ground in GGroundValues.all {
            #expect(ground.withAccent(GRGBA(hex: 0xE9C979)).tone() == ground.tone(), "\(ground.name)")
            #expect(ground.withAccent(nil).accentTone() == nil)
        }
    }
}
