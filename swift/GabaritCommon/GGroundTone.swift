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
/// its darkest stop deepened. `accent` (4.2): its own accent, nil for Gabarit's (the rust); with one, every colour
/// derived from the accent follows it under this ground (`accentTone()`: the text in the accent, the ink on it, the
/// selection).
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
    /// The ambiance's own accent (4.2); nil: Gabarit's.
    public let accent: GRGBA?

    public init(name: String, mode: GGroundMode, kind: GGlassKind, angle: Double, stops: [GRGBA], light: GGroundLight,
                glass: GRGBA, ink: GRGBA? = nil, shade: GRGBA? = nil, accent: GRGBA? = nil) {
        precondition((1...4).contains(stops.count), "a ground has 1 to 4 stops")
        (self.name, self.mode, self.kind, self.angle, self.stops) = (name, mode, kind, angle, stops)
        (self.light, self.glass, self.ink, self.shade, self.accent) = (light, glass, ink, shade, accent)
    }

    /// The same ground with `accent` as its own (nil: Gabarit's).
    public func withAccent(_ accent: GRGBA?) -> GGroundSpec {
        GGroundSpec(name: name, mode: mode, kind: kind, angle: angle, stops: stops, light: light, glass: glass, ink: ink,
                    shade: shade, accent: accent)
    }

    /// One colour, as a ground (a community's colour, a plain theme): the light is that colour.
    public static func plain(_ color: GRGBA, mode: GGroundMode, kind: GGlassKind, glass: GRGBA,
                             accent: GRGBA? = nil) -> GGroundSpec {
        GGroundSpec(name: "plain", mode: mode, kind: kind, angle: 180, stops: [color, color],
                    light: GGroundLight(color: color, x: 0.5, y: 0, radius: 1, strength: 0), glass: glass, accent: accent)
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

// MARK: The accent (4.2)

/// tokens/gabarit.json's `ground.accent`: the steps toward the ink, the selection's opacity by mode, the inks that may
/// lie on the accent (white, slate 900).
public enum GAccentRule {
    public static let step = 0.05
    public static func selected(_ mode: GGroundMode) -> Double { mode == .light ? 0.1 : 0.16 }
    public static let inks = [GRGBA(hex: 0xFFFFFF), GPaletteValues.slate900]
}

extension GGroundSpec {
    /// Where the accent's text may land: the veiled ground and every content glass over it, at each worst point.
    func accentSurfaces(veil: Double) -> [GRGBA] {
        let kind = kind.values
        return worstPoints.flatMap { point -> [GRGBA] in
            let veiled = GLuminance.laid(glass, veil, on: point)
            return [veiled] + [kind.thin, kind.regular, kind.thick].map { GLuminance.laid(glass, $0, on: veiled) }
        }
    }

    /// What the accent fills: the accent alone, and the prominent glass (the accent at `controlProminent`) over the
    /// veiled ground at each worst point.
    func accentFills(_ accent: GRGBA, veil: Double) -> [GRGBA] {
        [accent] + worstPoints.map {
            GLuminance.laid(accent, GGlassValues.controlProminent, on: GLuminance.laid(glass, veil, on: $0))
        }
    }

    /// The ground's own accent and its roles (4.2): tools/tokens.py's `accent_tone()`, step for step. The text in the
    /// accent (links, the chosen tab): the first of the accent moved toward the ink by steps of `GAccentRule.step` that
    /// holds 4.5:1 on the veiled ground and every content glass at every worst point. The ink on the accent: of
    /// `GAccentRule.inks`, the one whose worst contrast on the accent and on the prominent glass is the highest. The
    /// selection: the accent at `GAccentRule.selected(mode)`. Nil: no accent of its own, or no veil holds its ink.
    public func accentTone() -> GAccentTone? {
        guard accent != nil, let tone = tone() else { return nil }
        return accentTone(under: tone)
    }

    /// The same, with `tone` as the ground's (an app's ground no veil holds: `GGroundTone` with an opaque veil).
    public func accentTone(under tone: GGroundTone) -> GAccentTone? {
        guard let accent = accent?.opacity(1) else { return nil }
        let surfaces = accentSurfaces(veil: tone.veil)
        let count = Int((1 / GAccentRule.step).rounded())
        let amounts = (0...count).map { min(Double($0) * GAccentRule.step, 1) }
        func mixed(_ amount: Double) -> GRGBA {
            GRGBA(red: accent.red + (tone.ink.red - accent.red) * amount,
                  green: accent.green + (tone.ink.green - accent.green) * amount,
                  blue: accent.blue + (tone.ink.blue - accent.blue) * amount, alpha: 1)
        }
        let text = amounts.lazy.map(mixed).first { candidate in
            surfaces.allSatisfy { GLuminance.contrast(candidate, $0) >= GGlassValues.textMinimum - 1e-9 }
        } ?? mixed(1)
        let fills = accentFills(accent, veil: tone.veil)
        func worst(_ ink: GRGBA) -> Double { fills.map { GLuminance.contrast(ink, $0) }.min() ?? 0 }
        // The first of the best, as Python's max().
        var on = GAccentRule.inks[0]
        for ink in GAccentRule.inks.dropFirst() where worst(ink) > worst(on) { on = ink }
        return GAccentTone(accent: accent, accentText: text.byteRounded, onAccent: on,
                           selected: GAccentRule.selected(mode))
    }

    /// The accent against the veiled ground, at its worst point (its rim, the focus ring: 3:1 wanted).
    public func accentEdge(under tone: GGroundTone) -> Double? {
        guard let accent else { return nil }
        return worstPoints.map { GLuminance.contrast(accent, GLuminance.laid(glass, tone.veil, on: $0)) }.min()
    }

    /// The ink on the accent, at its worst (on the accent alone and on the prominent glass: 4.5:1 wanted).
    public func onAccentContrast(_ accentTone: GAccentTone, under tone: GGroundTone) -> Double {
        accentFills(accentTone.accent, veil: tone.veil).map { GLuminance.contrast(accentTone.onAccent, $0) }.min() ?? 0
    }
}

extension GRGBA {
    /// Rounded to a byte per channel, as the generator writes colours.
    var byteRounded: GRGBA {
        func byte(_ v: Double) -> Double { (v * 255).rounded(.toNearestOrEven) / 255 }
        return GRGBA(red: byte(red), green: byte(green), blue: byte(blue), alpha: alpha)
    }
}
