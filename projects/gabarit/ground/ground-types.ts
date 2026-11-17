/** The three kinds of ambiance: their glasses' opacities (tokens/gabarit.json, glass.kinds). */
export type GroundKind = 'light' | 'dark' | 'tinted'

/**
 * An ambiance, as tokens/gabarit.json writes one (ground.ambiances): a gradient of 2 to 4 stops at an angle, a light
 * over it, the colour of its glass and its ink. Gabarit's own are in `GROUND_AMBIANCES`; an application may bring
 * its own.
 */
export interface GroundAmbiance {
  readonly mode: 'light' | 'dark'
  readonly kind: GroundKind
  /** The gradient's angle, in degrees, as CSS writes it (0 runs upwards, 90 to the right). */
  readonly angle: number
  /** Its colours, `#RRGGBB`, 2 to 4. */
  readonly stops: readonly string[]
  /** The light: its colour, its centre in the window (0 to 1, beyond for a light from outside) and its strength. */
  readonly light: {
    readonly color: string
    readonly x: number
    readonly y: number
    readonly strength: number
  }
  /** The colour of its glass, `#RRGGBB`. */
  readonly glass: string
  /** Its ink, `#RRGGBB`. */
  readonly ink: string
  /** Its own accent (4.2), if it brings one. */
  readonly accent?: string
}
