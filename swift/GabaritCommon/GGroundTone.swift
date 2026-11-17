import Foundation

// The ground and its tone (4.0). The values come from tokens/gabarit.json (GTokens.swift); the computation is
// tools/tokens.py's `tone()`, step for step, for the grounds an app brings at run time (an ambiance of its own, a
// colour drawn from a picture). GGroundTests compares it with the tones the generator wrote.

/// Whether a ground takes dark ink (light) or light ink (dark).
public enum GGroundMode: String, Sendable, Hashable {
    case light, dark
}

/// A ground's light: a radial wash of `color` at (`x`, `y`), fractions of the window, its radius a fraction of the
/// window's longer side, `strength` the colour's opacity at its centre.
public struct GGroundLight: Sendable, Hashable {
    public let color: GRGBA
    public let x: Double, y: Double, radius: Double, strength: Double

    public init(color: GRGBA, x: Double, y: Double, radius: Double, strength: Double) {
        (self.color, self.x, self.y, self.radius, self.strength) = (color, x, y, radius, strength)
    }
}

/// An ambiance: a linear gradient of 2 to 4 stops at `angle` (CSS degrees: 180 runs from the top down), plus a light.
/// `glass` is the colour of its content glass and of its veil; `ink` and `shade` its own, or the mode's main text and
/// its darkest stop deepened.
public struct GGroundSpec: Sendable, Hashable {
    public let name: String
    public let mode: GGroundMode
    public let kind: GGlassKind
    public let angle: Double
    public let stops: [GRGBA]
    public let light: GGroundLight
    public let glass: GRGBA
    public let ink: GRGBA?
    public let shade: GRGBA?

    public init(name: String, mode: GGroundMode, kind: GGlassKind, angle: Double, stops: [GRGBA], light: GGroundLight,
                glass: GRGBA, ink: GRGBA? = nil, shade: GRGBA? = nil) {
        precondition((1...4).contains(stops.count), "a ground has 1 to 4 stops")
        (self.name, self.mode, self.kind, self.angle, self.stops) = (name, mode, kind, angle, stops)
        (self.light, self.glass, self.ink, self.shade) = (light, glass, ink, shade)
    }

    /// One colour, as a ground (a community's colour, a plain theme): the light is that colour.
    public static func plain(_ color: GRGBA, mode: GGroundMode, kind: GGlassKind, glass: GRGBA) -> GGroundSpec {
        GGroundSpec(name: "plain", mode: mode, kind: kind, angle: 180, stops: [color, color],
                    light: GGroundLight(color: color, x: 0.5, y: 0, radius: 1, strength: 0), glass: glass)
    }
}

/// A ground's tone: the veil laid over the whole ground (the glass's colour at `veil`), the ink and the opacities of
/// its secondary (`ink2`) and discreet (`ink3`) steps, the liquid glass's white, the colour of the shadows.
public struct GGroundTone: Sendable, Hashable {
    public let veil: Double
    public let ink: GRGBA
    public let ink2: Double
    public let ink3: Double
    public let liquid: Double
    public let shade: GRGBA

    public init(veil: Double, ink: GRGBA, ink2: Double, ink3: Double, liquid: Double, shade: GRGBA) {
        (self.veil, self.ink, self.ink2, self.ink3, self.liquid, self.shade) = (veil, ink, ink2, ink3, liquid, shade)
    }
}

public enum GLuminance {
    /// WCAG's relative luminance.
    public static func of(_ c: GRGBA) -> Double {
        func channel(_ v: Double) -> Double { v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * channel(c.red) + 0.7152 * channel(c.green) + 0.0722 * channel(c.blue)
    }

    public static func contrast(_ a: GRGBA, _ b: GRGBA) -> Double {
        let (la, lb) = (of(a), of(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /// `top` at `opacity` on the opaque `under`.
    public static func laid(_ top: GRGBA, _ opacity: Double, on under: GRGBA) -> GRGBA {
        GRGBA(red: top.red * opacity + under.red * (1 - opacity), green: top.green * opacity + under.green * (1 - opacity),
              blue: top.blue * opacity + under.blue * (1 - opacity), alpha: 1)
    }
}

extension GGroundSpec {
    /// The ink: the ambiance's own, or the apps' main text in its mode.
    public var resolvedInk: GRGBA { ink ?? (mode == .light ? GColorValues.textPrimary.light : GColorValues.textPrimary.dark) }

    /// The shadows' colour: the ambiance's own, or its darkest stop, 70 % of the way to black (rounded to a byte).
    public var resolvedShade: GRGBA {
        if let shade { return shade }
        let darkest = stops.min { GLuminance.of($0) < GLuminance.of($1) }!
        func byte(_ v: Double) -> Double { ((v * 255).rounded() * 0.3).rounded(.toNearestOrEven) / 255 }
        return GRGBA(red: byte(darkest.red), green: byte(darkest.green), blue: byte(darkest.blue), alpha: 1)
    }

    /// The stop under the light's centre: its place projected on the gradient's line, rounded to the nearest stop.
    public var lightStop: Int {
        let angle = angle * .pi / 180
        let (dx, dy) = (sin(angle), -cos(angle))
        let reach = (abs(dx) + abs(dy)) / 2
        let along = min(max(((light.x - 0.5) * dx + (light.y - 0.5) * dy) / reach / 2 + 0.5, 0), 1)
        return Int((along * Double(stops.count - 1)).rounded(.toNearestOrEven))
    }

    /// Where the ink may land: every stop, and the light at its centre over the stop under it.
    public var worstPoints: [GRGBA] {
        stops + [GLuminance.laid(light.color, light.strength, on: stops[lightStop])]
    }

    /// The tone: the least veil that lets the ink hold 4.5:1 (and its secondary step at `inkSecondaryMax`, its
    /// discreet one 3:1 at `inkDiscretMax`) at every worst point, then the least opacities of the ink's steps from
    /// their nominal ones, then the most white for the liquid glass, by steps of a hundredth. Nil: no veil holds.
    public func tone() -> GGroundTone? {
        let (ink, points) = (resolvedInk, worstPoints)
        func holds(_ veil: Double, _ alpha: Double, _ minimum: Double, white: Double = 0) -> Bool {
            points.allSatisfy { point in
                let under = GLuminance.laid(GRGBA(hex: 0xFFFFFF), white, on: GLuminance.laid(glass, veil, on: point))
                return GLuminance.contrast(GLuminance.laid(ink, alpha, on: under), under) >= minimum
            }
        }
        let steps = (0...100).map { Double($0) / 100 }
        let (text, edge) = (GGlassValues.textMinimum, GGlassValues.edgeMinimum)
        guard let veil = steps.first(where: {
            holds($0, 1, text) && holds($0, GGlassValues.inkSecondaryMax, text) && holds($0, GGlassValues.inkDiscretMax, edge)
        }) else { return nil }
        let ink2 = steps.first { $0 >= GGlassValues.inkSecondary - 1e-9 && holds(veil, $0, text) } ?? 1
        let ink3 = steps.first { $0 >= GGlassValues.inkDiscret - 1e-9 && holds(veil, $0, edge) } ?? 1
        let liquid = steps.reversed().first { $0 <= kind.values.liquid + 1e-9 && holds(veil, 1, text, white: $0) } ?? 0
        return GGroundTone(veil: veil, ink: ink, ink2: ink2, ink3: ink3, liquid: liquid, shade: resolvedShade)
    }
}
