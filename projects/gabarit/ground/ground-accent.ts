import { GROUND_AMBIANCES, GROUND_KINDS, GROUND_RULE } from './ground-tokens'
import type { GroundAmbiance } from './ground-types'

/** The name of one of Gabarit's ambiances (tokens/gabarit.json, ground.ambiances). */
export type GroundAmbianceName = keyof typeof GROUND_AMBIANCES

/**
 * The four CSS custom properties of an ambiance's own accent (4.2), as `ambiance-dore` poses them: the components
 * under them follow the accent (the main buttons, the chosen chips and tab, the links, the selection, the focus ring,
 * the tinted and prominent glass and the ink on it). Without them, Gabarit's own accent.
 */
export interface GroundAccentProperties {
  readonly '--gbt-ground-accent': string
  readonly '--gbt-ground-accent-text': string
  readonly '--gbt-ground-on-accent': string
  readonly '--gbt-ground-selected-fill': string
}

/** An ambiance's own accent and its roles, computed by the rule of tools/tokens.py (`accent_tone`). */
export interface GroundAccent {
  /** The accent as given, `#RRGGBB`: fills, the focus ring, the prominent glass. */
  readonly accent: string
  /** Text in the accent (links, the chosen tab's label): the accent, or mixed toward the ink until it holds 4.5:1. */
  readonly accentText: string
  /** Text and icons on the accent: white or the ink of Gabarit's slate900, the better at the worst fill. */
  readonly onAccent: string
  /** The opacity of the selection's fill (the accent at it). */
  readonly selected: number
  /** The accent's contrast with the veiled ground at its worst point: 3:1 at least for an edge or a focus ring. */
  readonly edge: number
  /** The contrast of `onAccent` on the accent and on the prominent glass at their worst: 4.5:1 at least. */
  readonly onAccentContrast: number
  /** Whether the accent holds on this ambiance: `edge` 3:1 and `onAccentContrast` 4.5:1. */
  readonly holds: boolean
  /** The custom properties to pose on the element that carries the ambiance (or any element above the components). */
  readonly properties: GroundAccentProperties
}

type Rgb = readonly [number, number, number]

const TEXT = GROUND_RULE.text
const EPSILON = 1e-9

function rgb(hexa: string): Rgb {
  const value = hexa.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`groundAccent: "${hexa}" is not a colour #RRGGBB`)
  }
  return [0, 2, 4].map(
    (index) => parseInt(value.slice(index, index + 2), 16) / 255,
  ) as unknown as Rgb
}

/** Python's round(): halves to the even neighbour, so that the hexadecimals are tools/tokens.py's to the bit. */
function roundEven(value: number): number {
  const floor = Math.floor(value)
  const rest = value - floor
  if (Math.abs(rest - 0.5) > 1e-12) return Math.round(value)
  return floor % 2 === 0 ? floor : floor + 1
}

function channels(colour: Rgb): number[] {
  return colour.map((c) => roundEven(c * 255))
}

function hexa(colour: Rgb): string {
  return (
    '#' +
    channels(colour)
      .map((c) => c.toString(16).toUpperCase().padStart(2, '0'))
      .join('')
  )
}

/** WCAG's relative luminance. */
function luminance(colour: Rgb): number {
  const [r, g, b] = colour.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** `top` at `opacity` on the opaque `under`. */
function laid(top: Rgb, opacity: number, under: Rgb): Rgb {
  return top.map((t, index) => t * opacity + under[index] * (1 - opacity)) as unknown as Rgb
}

/** `a` moved toward `b` by `amount` (0: `a`, 1: `b`). */
function mixed(a: Rgb, b: Rgb, amount: number): Rgb {
  return a.map((x, index) => x + (b[index] - x) * amount) as unknown as Rgb
}

/** The stop under the light's centre: its place projected on the gradient's line, rounded to the nearest stop. */
function lightStop(ambiance: GroundAmbiance): number {
  const angle = (ambiance.angle * Math.PI) / 180
  const [dx, dy] = [Math.sin(angle), -Math.cos(angle)]
  const reach = (Math.abs(dx) + Math.abs(dy)) / 2
  const along = ((ambiance.light.x - 0.5) * dx + (ambiance.light.y - 0.5) * dy) / reach / 2 + 0.5
  return roundEven(Math.min(Math.max(along, 0), 1) * (ambiance.stops.length - 1))
}

/** Where the ink may land: every stop, and the light at its centre over the stop under it. */
function points(ambiance: GroundAmbiance): Rgb[] {
  const stops = ambiance.stops.map(rgb)
  return [
    ...stops,
    laid(rgb(ambiance.light.color), ambiance.light.strength, stops[lightStop(ambiance)]),
  ]
}

/** The veil over the ground (tools/tokens.py's tone()): the least, by hundredths, that lets the ink hold. */
function veil(ambiance: GroundAmbiance, at: Rgb[]): number | null {
  const [ink, glass] = [rgb(ambiance.ink), rgb(ambiance.glass)]
  const holds = (v: number, alpha: number, minimum: number) =>
    at.every((point) => {
      const under = laid(glass, v, point)
      return contrast(laid(ink, alpha, under), under) >= minimum
    })
  for (let step = 0; step <= 100; step++) {
    const v = step / 100
    if (
      holds(v, 1, TEXT) &&
      holds(v, GROUND_RULE.secondaryMax, TEXT) &&
      holds(v, GROUND_RULE.discretMax, GROUND_RULE.edge)
    ) {
      return v
    }
  }
  return null
}

/** A colour at an opacity, as the generated CSS writes it. */
function cssColour(colour: string, opacity = 1): string {
  if (opacity === 1) return colour.toLowerCase()
  return `rgba(${channels(rgb(colour)).join(', ')}, ${Number(opacity.toFixed(4))})`
}

/**
 * An ambiance's own accent and its roles (4.2), by the rule every platform shares (tokens/gabarit.json's
 * `ground.accent`, tools/tokens.py's `accent_tone`), and the custom properties that make the components follow it.
 *
 * ```ts
 * const tone = groundAccent('#B8862B', 'givre')
 * for (const [name, value] of Object.entries(tone?.properties ?? {})) element.style.setProperty(name, value)
 * ```
 *
 * `ambiance`: the name of one of Gabarit's ambiances, or one of the application's own. Returns `null` when the
 * ambiance has no veil that lets its ink hold (tools/tokens.py refuses it). The accent is not refused here: check
 * `holds` (an accent too close to its ground fails its 3:1 edge).
 */
export function groundAccent(
  accent: string,
  ambiance: GroundAmbianceName | GroundAmbiance,
): GroundAccent | null {
  const spec: GroundAmbiance = typeof ambiance === 'string' ? GROUND_AMBIANCES[ambiance] : ambiance
  if (!spec) throw new Error(`groundAccent: no ambiance "${String(ambiance)}"`)
  const at = points(spec)
  const v = veil(spec, at)
  if (v === null) return null
  const kind = GROUND_KINDS[spec.kind]
  const [colour, ink, glass] = [rgb(accent), rgb(spec.ink), rgb(spec.glass)]
  const veiled = at.map((point) => laid(glass, v, point))
  const surfaces = veiled.flatMap((under) => [
    under,
    ...[kind.thin, kind.regular, kind.thick].map((opacity) => laid(glass, opacity, under)),
  ])

  const count = Math.round(1 / GROUND_RULE.step)
  let text = ink
  for (let index = 0; index <= count; index++) {
    const candidate = mixed(colour, ink, Math.min(index * GROUND_RULE.step, 1))
    if (surfaces.every((under) => contrast(candidate, under) >= TEXT - EPSILON)) {
      text = candidate
      break
    }
  }

  const fills = [colour, ...veiled.map((under) => laid(colour, GROUND_RULE.prominent, under))]
  const worst = (candidate: Rgb) => Math.min(...fills.map((fill) => contrast(candidate, fill)))
  const inks = GROUND_RULE.inks.map(rgb)
  const on = inks.reduce((best, candidate) => (worst(candidate) > worst(best) ? candidate : best))
  const edge = Math.min(...veiled.map((under) => contrast(colour, under)))
  const onAccentContrast = worst(on)
  const selected = GROUND_RULE.selected[spec.mode]
  const [accentHexa, textHexa, onHexa] = [hexa(colour), hexa(text), hexa(on)]
  return {
    accent: accentHexa,
    accentText: textHexa,
    onAccent: onHexa,
    selected,
    edge,
    onAccentContrast,
    holds: edge >= GROUND_RULE.edge - EPSILON && onAccentContrast >= TEXT - EPSILON,
    properties: {
      '--gbt-ground-accent': cssColour(accentHexa),
      '--gbt-ground-accent-text': cssColour(textHexa),
      '--gbt-ground-on-accent': cssColour(onHexa),
      '--gbt-ground-selected-fill': cssColour(accentHexa, selected),
    },
  }
}
