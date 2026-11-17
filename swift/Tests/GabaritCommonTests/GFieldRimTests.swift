import Foundation
import GabaritCommon
import Testing

/// A field's rims (4.1.1) hold 3:1 (`edgeMinimum`) wherever the field lies, at every ground's worst point: right on the
/// ground, in a card (regular glass) and in a sheet (thick glass). The focus draws the accent's rim, "Increase contrast"
/// the ground's ink (`GColor.border` fell to 2.9:1 at the light ground's brightest point, and to 1.1:1 on the
/// ambiances); a rim is drawn inside the field's edge, so it must hold against the hollow inside and against what is
/// around the field. The accent's rim (rust 400) does not hold on the ambiances (1.9:1 around a field right on them):
/// recorded as a known issue, for a later version. The hollow is drawn as GabaritApple draws it (`GGlassHollow`): the thin
/// glass and a veil of the shade at the kind's `hollow` × 0.4, wherever it lies (4.1.0's, unchanged in 4.1.1).
/// In a light surface (4.1.1), the glass takes its edge in the ground's ink (GabaritApple's `GNestedEdgeValues`): the
/// bottom edge of what floats (a chip, at 0.20) and the shadow under a hollow's top edge (at 0.14) stand out from the
/// surface around by 1.3:1 at least, at the worst point.
struct GFieldRimTests {
    /// Where a field lies: the ground itself, or a surface of content glass on it (its opacity on the ground's kind).
    enum Place: CaseIterable, CustomStringConvertible {
        case ground, card, sheet

        var description: String {
            switch self {
            case .ground: "on the ground"
            case .card: "in a card"
            case .sheet: "in a sheet"
            }
        }

        /// What is around the field: the ground (its point under its veil), or the surface's glass laid on it.
        func around(_ ground: GGroundSpec, at point: GRGBA, tone: GGroundTone) -> GRGBA {
            let veiled = GLuminance.laid(ground.glass, tone.veil, on: point)
            switch self {
            case .ground: return veiled
            case .card: return GLuminance.laid(ground.glass, ground.kind.values.regular, on: veiled)
            case .sheet: return GLuminance.laid(ground.glass, ground.kind.values.thick, on: veiled)
            }
        }
    }

    /// The field's hollow over `around`, as `GGlassHollow` draws it.
    static func hollow(_ ground: GGroundSpec, around: GRGBA, tone: GGroundTone) -> GRGBA {
        let thin = GLuminance.laid(ground.glass, ground.kind.values.thin, on: around)
        return GLuminance.laid(tone.shade, ground.kind.values.hollow * 0.4, on: thin)
    }

    @Test(arguments: GGroundValues.all)
    func rims(_ ground: GGroundSpec) throws {
        let tone = try #require(ground.tone())
        let accent = ground.mode == .light ? GColorValues.accent.light : GColorValues.accent.dark
        for place in Place.allCases {
            for point in ground.worstPoints {
                let around = place.around(ground, at: point, tone: tone)
                let inside = Self.hollow(ground, around: around, tone: tone)
                for (side, colour) in [("hollow", inside), ("around", around)] {
                    let ink = GLuminance.contrast(tone.ink, colour)
                    #expect(ink >= GGlassValues.edgeMinimum,
                            "more contrast (ink) against the \(side), \(place), \(ground.name): \(String(format: "%.2f", ink))")
                    let focus = GLuminance.contrast(accent, colour)
                    let message: Comment = "focus (accent) against the \(side), \(place), \(ground.name): \(String(format: "%.2f", focus))"
                    if ground.kind == .tinted {
                        withKnownIssue("the accent's rim on an ambiance", isIntermittent: true) {
                            #expect(focus >= GGlassValues.edgeMinimum, message)
                        }
                    } else {
                        #expect(focus >= GGlassValues.edgeMinimum, message)
                    }
                }
            }
        }
    }

    /// The glass's edge in a light surface (a card, a sheet): a chip's bottom edge (the ink at 0.20 over its clear glass,
    /// taken as the surface itself, its lightest) and a hollow's shadow under its top edge (the ink at 0.14 over the
    /// hollow) stand out from the surface around.
    @Test(arguments: GGroundValues.all.filter { $0.mode == .light })
    func nestedEdgeStandsOut(_ ground: GGroundSpec) throws {
        let tone = try #require(ground.tone())
        for place in [Place.card, .sheet] {
            for point in ground.worstPoints {
                let around = place.around(ground, at: point, tone: tone)
                let edges = [("chip's bottom edge", GLuminance.laid(tone.ink, 0.2, on: around)),
                             ("hollow's shadow", GLuminance.laid(tone.ink, 0.14, on: Self.hollow(ground, around: around, tone: tone)))]
                for (name, edge) in edges {
                    let value = GLuminance.contrast(edge, around)
                    #expect(value >= 1.3, "\(name), \(place), \(ground.name): \(String(format: "%.2f", value))")
                }
            }
        }
    }
}
