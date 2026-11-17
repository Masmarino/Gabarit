#if canImport(SwiftUI)
import Synchronization
import SwiftUI

// The ground (4.0): one ambiance, a gradient or a picture, runs under the whole window, bars included. Over it, two
// glasses: the content glass for panels (`gGlass`), the liquid glass for what commands and floats (`gLiquidGlass`).
// Light is the edge of things: a panel is told from the ground by its glass, its light and its shadow, not by a line.
// The ink follows the ground's mode, not the system's appearance: `GGround` sets the colour scheme under it.

public extension EnvironmentValues {
    /// The ambiance under this view. Nil: Gabarit's own ground for the appearance (`GGroundValues.light`, `.dark`).
    @Entry var gGround: GGroundSpec?
}

public extension EnvironmentValues {
    /// The ground in force: the one set (`gGround`), or Gabarit's for the appearance.
    var gResolvedGround: GGroundSpec {
        gGround ?? (colorScheme == .dark ? GGroundValues.dark : GGroundValues.light)
    }

    /// The ground's tone (its veil, its ink's steps, the liquid glass's white), computed once per ground.
    var gGroundTone: GGroundTone { GGroundToneCache.tone(of: gResolvedGround) }
}

/// The tones, computed once per ground: Gabarit's from the generator, an app's own on first use.
enum GGroundToneCache {
    private static let known: [GGroundSpec: GGroundTone] = [
        GGroundValues.light: GGroundTones.light, GGroundValues.dark: GGroundTones.dark,
        GGroundValues.black: GGroundTones.black, GGroundValues.aurore: GGroundTones.aurore,
        GGroundValues.lagune: GGroundTones.lagune, GGroundValues.braise: GGroundTones.braise,
        GGroundValues.nuitPolaire: GGroundTones.nuitPolaire, GGroundValues.sousBois: GGroundTones.sousBois,
        GGroundValues.laiton: GGroundTones.laiton, GGroundValues.givre: GGroundTones.givre,
        GGroundValues.dore: GGroundTones.dore,
    ]
    private static let computed = Mutex<[GGroundSpec: GGroundTone]>([:])

    static func tone(of spec: GGroundSpec) -> GGroundTone {
        if let tone = known[spec] { return tone }
        return computed.withLock { cache in
            if let tone = cache[spec] { return tone }
            // No veil holds the ink at 4.5:1 (a ground too close to its ink): the glass's colour, opaque, as the veil.
            let tone = spec.tone() ?? GGroundTone(veil: 1, ink: spec.resolvedInk, ink2: 1, ink3: 1, liquid: 0, shade: spec.resolvedShade)
            cache[spec] = tone
            return tone
        }
    }
}

// MARK: The accent (4.2)

public extension EnvironmentValues {
    /// The accent in force and its roles (4.2): the ground's own (`GGroundSpec.accent`), else the app's
    /// (`GTheme.current.accent`), computed against the ground in force. Nil: Gabarit's accent, unchanged.
    var gAccentTone: GAccentTone? {
        let ground = gResolvedGround
        guard let accent = ground.accent ?? gThemeAccent ?? GTheme.current.accent else { return nil }
        return GAccentToneCache.tone(of: ground.withAccent(accent))
    }
}

extension EnvironmentValues {
    /// `GTheme.current.accent`, carried by `gGround` so that a change redraws what is under it.
    @Entry var gThemeAccent: GRGBA?
}

/// The accents' roles, computed once per ground and accent: Gabarit's ambiances' from the generator, an app's on first use.
enum GAccentToneCache {
    private static let known: [GGroundSpec: GAccentTone] = [GGroundValues.dore: GAccentTones.dore]
    private static let computed = Mutex<[GGroundSpec: GAccentTone]>([:])

    static func tone(of spec: GGroundSpec) -> GAccentTone? {
        guard spec.accent != nil else { return nil }
        if let tone = known[spec] { return tone }
        return computed.withLock { cache in
            if let tone = cache[spec] { return tone }
            // Under the tone the ground is drawn with (an opaque veil when none holds).
            let tone = spec.accentTone(under: GGroundToneCache.tone(of: spec))
            cache[spec] = tone
            return tone
        }
    }
}

/// The app's accent (4.2), for its whole window: what an ambiance with an accent of its own does, on every ground that
/// has none. Observed: a change redraws. A ground's own accent wins over it.
@Observable
final class GThemeAccent: @unchecked Sendable {
    static let shared = GThemeAccent()
    var accent: GRGBA?
}

public extension GTheme {
    /// The app's own accent (4.2), nil for Gabarit's rust. Every colour derived from the accent follows it, computed
    /// against the ground in force (`EnvironmentValues.gAccentTone`): the accent's fills (a switch, a slider, the chosen
    /// tab's line, the focus ring), the text in the accent (links, the chosen tab), the selection, the prominent glass
    /// (the primary button, the chosen chip) and the ink on it (`.gOnAccent`: dark on a pale accent). A ground that
    /// brings its own (`GGroundSpec(accent:)`) wins over it. `GColor.accent` and its kin stay Gabarit's: read
    /// `.gAccent`, `.gAccentText`, `.gOnAccent`, `.gSelectedFill` instead.
    var accent: GRGBA? {
        get { GThemeAccent.shared.accent }
        set { GThemeAccent.shared.accent = newValue }
    }
}

/// A colour derived from the accent in force (4.2): the ground's own or the app's (`gAccentTone`), or Gabarit's.
public struct GAccentStyle: ShapeStyle {
    public enum Role: Sendable, Hashable {
        /// The accent as given: fills, a rim, the focus ring (3:1 on the ground). Gabarit's: `GColor.accent`.
        case accent
        /// Text in the accent: links, the chosen tab's name (4.5:1 on the ground and every glass). `GColor.accentText`.
        case text
        /// Text and icons on the accent and on its prominent glass (4.5:1). Gabarit's: `GColor.onPrimary`.
        case onAccent
        /// The selection: the accent at the mode's opacity. `GColor.selectedFill`.
        case selectedFill
    }

    let role: Role

    public init(_ role: Role) { self.role = role }

    public func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        Self.color(role, environment.gAccentTone).resolve(in: environment)
    }

    /// The colour of `role` under `tone` (nil: Gabarit's).
    static func color(_ role: Role, _ tone: GAccentTone?) -> Color {
        guard let tone else {
            return switch role {
            case .accent: GColor.accent
            case .text: GColor.accentText
            case .onAccent: GColor.onPrimary
            case .selectedFill: GColor.selectedFill
            }
        }
        return switch role {
        case .accent: Color(tone.accent)
        case .text: Color(tone.accentText)
        case .onAccent: Color(tone.onAccent)
        case .selectedFill: Color(tone.accent.opacity(tone.selected))
        }
    }
}

public extension ShapeStyle where Self == GAccentStyle {
    /// The accent in force (4.2): the ground's own, the app's, or Gabarit's rust.
    static var gAccent: GAccentStyle { GAccentStyle(.accent) }
    /// Text in the accent in force: links, the chosen tab.
    static var gAccentText: GAccentStyle { GAccentStyle(.text) }
    /// The ink on the accent in force (dark on a pale accent).
    static var gOnAccent: GAccentStyle { GAccentStyle(.onAccent) }
    /// The selection in the accent in force.
    static var gSelectedFill: GAccentStyle { GAccentStyle(.selectedFill) }
}

// MARK: Ink

/// The ground's ink: its main text (`.gInk`), its secondary step (`.gInk2`), its discreet one (`.gInk3`). It resolves
/// against the ground in force, so it holds 4.5:1 (3:1 for the discreet step) on every ambiance. "Increase contrast": the
/// discreet step takes the secondary's opacity, the secondary the main's.
public struct GInk: ShapeStyle {
    public enum Level: Sendable { case primary, secondary, discreet }
    let level: Level

    public init(_ level: Level) { self.level = level }

    public func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        let tone = environment.gGroundTone
        let more = environment.colorSchemeContrast == .increased
        let alpha = switch level {
        case .primary: 1.0
        case .secondary: more ? 1 : tone.ink2
        case .discreet: more ? tone.ink2 : tone.ink3
        }
        return Color(tone.ink.opacity(alpha)).resolve(in: environment)
    }
}

public extension ShapeStyle where Self == GInk {
    /// The ground's main ink.
    static var gInk: GInk { GInk(.primary) }
    /// The ground's secondary ink (a sentence under a title, an inactive tab).
    static var gInk2: GInk { GInk(.secondary) }
    /// The ground's discreet ink (a date, a placeholder, a section's sentence).
    static var gInk3: GInk { GInk(.discreet) }
}

// MARK: Controls

/// The ground of a control that holds or picks a value (a field, a picker, a chip, a stepper, a secondary button): a
/// white veil, light on a light ground (70 %), barely there on a dark one (7 %), a little more on an ambiance (12 %), so a
/// control reads as part of the glass it is on, not as a dark plate. Its rim stays (3:1).
public struct GControlGround: ShapeStyle {
    public init() {}

    public func resolve(in environment: EnvironmentValues) -> Color.Resolved {
        let alpha = switch environment.gResolvedGround.kind {
        case .light: 0.7
        case .dark: 0.07
        case .tinted: 0.12
        }
        return Color.white.opacity(alpha).resolve(in: environment)
    }
}

public extension ShapeStyle where Self == GControlGround {
    /// The ground of a control that holds or picks a value (4.0).
    static var gControlGround: GControlGround { GControlGround() }
}

// MARK: The ground

/// The ground: the ambiance's gradient (2 to 4 stops at its CSS angle), its light (a radial wash), its tone's veil over
/// all, from edge to edge of the window. Its colour scheme is the ground's mode (dark ink on a light ground). `spec` nil:
/// the ground in force (`gGround`, or Gabarit's for the appearance).
public struct GGround: View {
    var spec: GGroundSpec?
    @Environment(\.gGround) private var current
    @Environment(\.colorScheme) private var scheme

    public init(_ spec: GGroundSpec? = nil) {
        self.spec = spec
    }

    public var body: some View {
        let ground = spec ?? current ?? (scheme == .dark ? GGroundValues.dark : GGroundValues.light)
        GGroundPaint(spec: ground)
            .ignoresSafeArea()
            .allowsHitTesting(false)
            .accessibilityHidden(true)
    }
}

/// The ground's paint, in the frame it is given.
struct GGroundPaint: View {
    let spec: GGroundSpec

    var body: some View {
        let tone = GGroundToneCache.tone(of: spec)
        GeometryReader { geometry in
            let size = geometry.size
            ZStack {
                LinearGradient(stops: stops, startPoint: line(in: size).start, endPoint: line(in: size).end)
                let light = spec.light
                if light.strength > 0 {
                    RadialGradient(stops: [.init(color: Color(light.color.opacity(light.strength)), location: 0),
                                           .init(color: Color(light.color.opacity(light.strength * 0.45)), location: 0.45),
                                           .init(color: Color(light.color.opacity(0)), location: 1)],
                                   center: UnitPoint(x: light.x, y: light.y), startRadius: 0,
                                   endRadius: max(1, light.radius * max(size.width, size.height)))
                }
                if tone.veil > 0 { Color(spec.glass.opacity(tone.veil)) }
            }
        }
    }

    private var stops: [Gradient.Stop] {
        let colors = spec.stops.count == 1 ? [spec.stops[0], spec.stops[0]] : spec.stops
        return colors.enumerated().map { index, color in
            .init(color: Color(color), location: Double(index) / Double(colors.count - 1))
        }
    }

    /// CSS's gradient line: through the centre at `angle` (0 upwards, clockwise), long enough that the corners take the
    /// first and last stops.
    private func line(in size: CGSize) -> (start: UnitPoint, end: UnitPoint) {
        guard size.width > 0, size.height > 0 else { return (.top, .bottom) }
        let angle = spec.angle * .pi / 180
        let (dx, dy) = (sin(angle), -cos(angle))
        let half = (abs(size.width * dx) + abs(size.height * dy)) / 2
        let (ux, uy) = (dx * half / size.width, dy * half / size.height)
        return (UnitPoint(x: 0.5 - ux, y: 0.5 - uy), UnitPoint(x: 0.5 + ux, y: 0.5 + uy))
    }
}

public extension View {
    /// Lays the ground under this view, from edge to edge of the window, and makes it the ground in force for what is
    /// in it: its ink, its glass, its colour scheme (the ground's mode). `spec` nil: Gabarit's for the appearance. A
    /// change of ground fades over 450 ms (`GAnimation.ground`), at once when motion is reduced.
    func gGround(_ spec: GGroundSpec? = nil) -> some View {
        modifier(GGroundModifier(spec: spec))
    }
}

private struct GGroundModifier: ViewModifier {
    let spec: GGroundSpec?
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        let ground = spec ?? (scheme == .dark ? GGroundValues.dark : GGroundValues.light)
        content
            .environment(\.gGround, ground)
            // Read here, in a body: a change of the app's accent redraws what is under the ground. The system's tint is
            // left alone (`.tint(nil)` would undo an app's): Gabarit's controls take `.gAccent` themselves.
            .environment(\.gThemeAccent, GTheme.current.accent)
            .environment(\.gGroundPainted, true)
            .background {
                GGroundPaint(spec: ground)
                    .id(ground)
                    .transition(.opacity)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
            .animation(reduceMotion ? nil : GAnimation.ground, value: ground)
            .environment(\.colorScheme, ground.mode == .dark ? .dark : .light)
            #if os(iOS)
            .toolbarColorScheme(ground.mode == .dark ? .dark : .light, for: .navigationBar, .tabBar)
            #endif
    }
}

#endif
