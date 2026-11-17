import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'projects/gabarit/src/lib/tokens')
const palette = readFileSync(join(DIR, '_palette.scss'), 'utf8')
const semantic = readFileSync(join(DIR, '_semantic.scss'), 'utf8')
const themes = readFileSync(join(DIR, '_themes.scss'), 'utf8')

function resolve(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) return trimmed
  const ref = /var\(--([a-z0-9-]+)\)/.exec(trimmed)
  if (!ref) throw new Error(`unresolved value: ${value}`)
  const found = new RegExp(`--${ref[1]}:\\s*(#[0-9a-fA-F]{6})`).exec(palette)
  if (!found) throw new Error(`palette token not found: --${ref[1]}`)
  return found[1]
}

function mixin(name: string): string {
  const found = new RegExp(`@mixin ${name}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(themes)
  if (!found) throw new Error(`@mixin ${name} not found in _themes.scss`)
  return found[1]
}
// The light theme, plus what :root sets for both themes (the type stacks).
// The media queries aside: they are measured apart, or are the other theme.
const LIGHT_SCOPE = mixin('light-tokens') + semantic.split('@media')[0]
const DARK_SCOPE = mixin('dark-tokens')

// A translucent token (the status tints) is measured as painted on `ground`, the page by default.
function token(name: string, theme: 'light' | 'dark', ground?: string): string {
  const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
  const matches = [...scope.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))]
  if (matches.length === 0) {
    if (theme === 'dark') return token(name, 'light', ground)
    throw new Error(`token not found: --${name} (${theme})`)
  }
  const value = matches[matches.length - 1][1]
  const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(value.trim())
  if (!rgba) return resolve(value)
  const base = hexChannels(ground ?? token('bg-principal', theme))
  const alpha = Number(rgba[4])
  const mixed = [rgba[1], rgba[2], rgba[3]].map((c, i) =>
    Math.round(Number(c) * alpha + base[i] * (1 - alpha)),
  )
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function hexChannels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const LIGHT_BG = token('bg-principal', 'light')
const DARK_BG = token('bg-principal', 'dark')
const PANEL_BG_LIGHT = token('bg-panel', 'light')
const PANEL_BG_DARK = token('bg-panel', 'dark')

const CASES: [string, 'light' | 'dark', string, number, string][] = [
  ['text-primary', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['text-secondary', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['text-discret', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['primary', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['color-error-text', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['color-success-text', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['color-warning-text', 'light', LIGHT_BG, 7, '3.2 (AAA)'],
  ['border-color', 'light', LIGHT_BG, 3, '3.3'],
  ['color-error-base', 'light', LIGHT_BG, 3, '3.3'],
  ['color-success-base', 'light', LIGHT_BG, 3, '3.3'],
  ['color-warning-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-1-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-2-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-3-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-4-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-5-base', 'light', LIGHT_BG, 3, '3.3'],
  ['chart-series-6-base', 'light', LIGHT_BG, 3, '3.3'],
  ['text-primary', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — app-shell panel background'],
  ['text-secondary', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — app-shell panel background'],
  ['text-primary', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['text-secondary', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['text-discret', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['primary', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['color-error-text', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['color-success-text', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['color-warning-text', 'dark', DARK_BG, 7, '3.2 (AAA)'],
  ['border-color', 'dark', DARK_BG, 3, '3.3'],

  ['color-error-base', 'dark', DARK_BG, 3, '3.3'],
  ['color-success-base', 'dark', DARK_BG, 3, '3.3'],
  ['color-warning-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-1-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-2-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-3-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-4-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-5-base', 'dark', DARK_BG, 3, '3.3'],
  ['chart-series-6-base', 'dark', DARK_BG, 3, '3.3'],
  ['text-primary', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — app-shell panel background'],
  ['text-secondary', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — app-shell panel background'],
  ['primary', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — button link variant on a panel'],
  ['primary', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — button link variant on a panel'],
  ['primary-hover', 'light', LIGHT_BG, 7, '3.2 (AAA) — button link variant, hover'],
  ['primary-hover', 'dark', DARK_BG, 7, '3.2 (AAA) — button link variant, hover'],
  ['color-info-bg-text', 'light', LIGHT_BG, 7, '3.2 (AAA) — outline badge, info'],
  ['color-info-bg-text', 'dark', DARK_BG, 7, '3.2 (AAA) — outline badge, info'],
  ['color-success-text', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-warning-text', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-error-text', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-info-bg-text', 'light', PANEL_BG_LIGHT, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-success-text', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-warning-text', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-error-text', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — outline badge on a panel'],
  ['color-info-bg-text', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — outline badge on a panel'],
]

const PAIR_CASES: [string, string, 'light' | 'dark', number, string][] = [
  ['text-on-primary', 'primary', 'light', 7, '3.2 (AAA)'],
  ['text-on-primary', 'primary', 'dark', 7, '3.2 (AAA)'],
  ['text-on-error', 'color-error-fill', 'light', 7, '3.2 (AAA)'],
  ['text-on-error', 'color-error-fill', 'dark', 7, '3.2 (AAA)'],

  ['text-on-primary', 'primary-hover', 'light', 7, '3.2 (AAA) — hover'],
  ['text-on-primary', 'primary-hover', 'dark', 7, '3.2 (AAA) — hover'],
  ['text-on-error', 'color-error-hover', 'light', 7, '3.2 (AAA) — hover'],
  ['text-on-error', 'color-error-hover', 'dark', 7, '3.2 (AAA) — hover'],
  ['color-error-bg-text', 'color-error-bg', 'light', 7, '3.2 (AAA) — ghost-danger button, hover'],
  ['color-error-bg-text', 'color-error-bg', 'dark', 7, '3.2 (AAA) — ghost-danger button, hover'],
  [
    'color-error-bg-text',
    'color-error-bg',
    'light',
    7,
    '3.2 (AAA) — confirm modal, danger icon disc',
  ],
  [
    'color-error-bg-text',
    'color-error-bg',
    'dark',
    7,
    '3.2 (AAA) — confirm modal, danger icon disc',
  ],
  [
    'color-warning-bg-text',
    'color-warning-bg',
    'light',
    7,
    '3.2 (AAA) — confirm modal, warning disc',
  ],
  [
    'color-warning-bg-text',
    'color-warning-bg',
    'dark',
    7,
    '3.2 (AAA) — confirm modal, warning disc',
  ],
  ['color-info-bg-text', 'color-info-bg', 'light', 7, '3.2 (AAA) — confirm modal, neutral disc'],
  ['color-info-bg-text', 'color-info-bg', 'dark', 7, '3.2 (AAA) — confirm modal, neutral disc'],
  ['text-secondary', 'bg-track', 'light', 7, '3.2 (AAA) — segmented control, unselected option'],
  ['text-secondary', 'bg-track', 'dark', 7, '3.2 (AAA) — segmented control, unselected option'],
  ['text-primary', 'bg-track', 'light', 7, '3.2 (AAA) — segmented control, hovered option'],
  ['text-primary', 'bg-track', 'dark', 7, '3.2 (AAA) — segmented control, hovered option'],
  ['color-success-bg-text', 'color-success-bg', 'light', 7, '3.2 (AAA) — copy button, copied'],
  ['color-success-bg-text', 'color-success-bg', 'dark', 7, '3.2 (AAA) — copy button, copied'],
  ['color-error-bg-text', 'color-error-bg', 'light', 7, '3.2 (AAA) — copy button, copy failed'],
  ['color-error-bg-text', 'color-error-bg', 'dark', 7, '3.2 (AAA) — copy button, copy failed'],
]

describe('token contrast', () => {
  for (const [name, theme, bg, threshold, criterion] of CASES) {
    it(`--${name} (${theme}) reaches ${threshold}:1 — criterion ${criterion}`, () => {
      const measured = ratio(token(name, theme), bg)
      expect(measured).toBeGreaterThanOrEqual(threshold)
    })
  }

  for (const [fg, bg, theme, threshold, criterion] of PAIR_CASES) {
    it(`--${fg} on --${bg} (${theme}) reaches ${threshold}:1 — criterion ${criterion}`, () => {
      const measured = ratio(token(fg, theme), token(bg, theme))
      expect(measured).toBeGreaterThanOrEqual(threshold)
    })
  }

  it('ghost button text stays readable on the translucent --bg-hover fill, in both themes', () => {
    function overlay(theme: 'light' | 'dark', base: string): string {
      const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
      const match = [
        ...scope.matchAll(/--bg-hover:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g),
      ].pop()
      if (!match) throw new Error(`--bg-hover rgba not found (${theme})`)
      const alpha = Number(match[4])
      const channels = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
      const mixed = [match[1], match[2], match[3]].map((c, i) =>
        Math.round(Number(c) * alpha + channels[i] * (1 - alpha)),
      )
      return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
    }
    for (const [theme, page, panel] of [
      ['light', LIGHT_BG, PANEL_BG_LIGHT],
      ['dark', DARK_BG, PANEL_BG_DARK],
    ] as const) {
      for (const base of [page, panel]) {
        const fill = overlay(theme, base)
        for (const name of ['text-primary', 'text-secondary']) {
          expect(
            ratio(token(name, theme), fill),
            `--${name} on --bg-hover over ${base} (${theme})`,
          ).toBeGreaterThanOrEqual(7)
        }
      }
    }
  })

  it('alert, card and empty-state washes keep their text readable, in both themes', () => {
    function mix(top: string, percent: number, base: string): string {
      const a = [1, 3, 5].map((i) => parseInt(top.slice(i, i + 2), 16))
      const b = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
      const out = a.map((c, i) => Math.round((c * percent + b[i] * (100 - percent)) / 100))
      return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
    }
    for (const theme of ['light', 'dark'] as const) {
      const page = token('bg-principal', theme)

      for (const variant of ['info', 'success', 'warning', 'error']) {
        const wash = mix(token(`color-${variant}-bg`, theme), 55, page)
        expect(
          ratio(token(`color-${variant}-bg-text`, theme), wash),
          `--color-${variant}-bg-text on the subtle ${variant} alert (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }

      for (const bg of [token('bg-panel', theme), mix(token('bg-panel', theme), 55, page)]) {
        expect(
          ratio(token('text-primary', theme), bg),
          `neutral alert text (${theme})`,
        ).toBeGreaterThanOrEqual(7)
        expect(
          ratio(token('text-secondary', theme), bg),
          `neutral alert icon (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }

      const selected = mix(token('primary', theme), 4, page)
      for (const name of ['text-primary', 'text-secondary', 'primary']) {
        expect(
          ratio(token(name, theme), selected),
          `--${name} on a selected card (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }

      for (const tone of ['success', 'warning', 'error']) {
        expect(
          ratio(token(`color-${tone}-bg-text`, theme), token(`color-${tone}-bg`, theme)),
          `--color-${tone}-bg-text on --color-${tone}-bg (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('the card header (above the box, on the page) keeps its text readable, in both themes', () => {
    function mix(top: string, percent: number, base: string): string {
      const a = [1, 3, 5].map((i) => parseInt(top.slice(i, i + 2), 16))
      const b = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
      const out = a.map((c, i) => Math.round((c * percent + b[i] * (100 - percent)) / 100))
      return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
    }
    for (const theme of ['light', 'dark'] as const) {
      const edge = token('border-color', theme)
      const surfaces = {
        'the page': token('bg-principal', theme),
        'a panel': token('bg-panel', theme),
      }
      for (const [where, surface] of Object.entries(surfaces)) {
        for (const name of ['text-primary', 'text-secondary']) {
          expect(
            ratio(token(name, theme), surface),
            `--${name} in a card header on ${where} (${theme})`,
          ).toBeGreaterThanOrEqual(7)
        }
        expect(
          ratio(token('text-primary', theme), mix(edge, 8, surface)),
          `count pill on ${where} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
      for (const tone of ['success', 'warning', 'error']) {
        expect(
          ratio(token(`color-${tone}-text`, theme), surfaces['the page']),
          `${tone} card title on the page (${theme})`,
        ).toBeGreaterThanOrEqual(7)
        expect(
          ratio(token(`color-${tone}-text`, theme), surfaces['a panel']),
          `${tone} card title on a panel (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('the segmented track stays distinguishable from the page and from --bg-panel', () => {
    for (const [theme, page, panel] of [
      ['light', LIGHT_BG, PANEL_BG_LIGHT],
      ['dark', DARK_BG, PANEL_BG_DARK],
    ] as const) {
      const track = token('bg-track', theme)
      expect(ratio(track, page), `--bg-track vs page (${theme})`).toBeGreaterThanOrEqual(1.15)
      expect(ratio(track, panel), `--bg-track vs --bg-panel (${theme})`).toBeGreaterThanOrEqual(
        1.15,
      )
    }
  })

  it('status text stays readable on its translucent tint laid on a panel too, in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      const panel = token('bg-panel', theme)
      for (const tone of ['success', 'warning', 'error', 'info']) {
        expect(
          ratio(token(`color-${tone}-bg-text`, theme), token(`color-${tone}-bg`, theme, panel)),
          `--color-${tone}-bg-text on --color-${tone}-bg over a panel (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('text on colored banner backgrounds stays readable', () => {
    expect(
      ratio(token('color-error-bg-text', 'light'), token('color-error-bg', 'light')),
    ).toBeGreaterThanOrEqual(7)
    expect(
      ratio(token('color-success-bg-text', 'light'), token('color-success-bg', 'light')),
    ).toBeGreaterThanOrEqual(7)
    expect(
      ratio(token('color-warning-bg-text', 'light'), token('color-warning-bg', 'light')),
    ).toBeGreaterThanOrEqual(7)
    expect(
      ratio(token('color-info-bg-text', 'light'), token('color-info-bg', 'light')),
    ).toBeGreaterThanOrEqual(7)
  })

  it('every hover fill is clearly distinct from its resting state', () => {
    for (const [rest, hover] of [
      ['primary', 'primary-hover'],
      ['color-error-fill', 'color-error-hover'],
    ] as const) {
      for (const theme of ['light', 'dark'] as const) {
        const delta = Math.abs(luminance(token(rest, theme)) - luminance(token(hover, theme)))
        expect(delta, `--${rest} vs --${hover} (${theme})`).toBeGreaterThan(0.02)
      }
    }
  })

  it('the dark scope resolves different values than the light scope', () => {
    expect(token('text-primary', 'dark')).not.toBe(token('text-primary', 'light'))
    expect(token('bg-principal', 'dark')).not.toBe(token('bg-principal', 'light'))
    expect(token('border-color', 'dark')).not.toBe(token('border-color', 'light'))

    expect(token('text-primary', 'dark')).toBe(resolve('var(--graphite-100)'))
    expect(token('bg-principal', 'dark')).toBe(resolve('var(--graphite-850)'))
    expect(token('border-color', 'dark')).toBe(resolve('var(--graphite-500)'))
  })
})

describe('layout tokens (page header, panel, list card and rows)', () => {
  function hoverOver(theme: 'light' | 'dark', base: string): string {
    const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
    const match = [
      ...scope.matchAll(/--bg-hover:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g),
    ].pop()
    if (!match) throw new Error(`--bg-hover rgba not found (${theme})`)
    const alpha = Number(match[4])
    const channels = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
    const mixed = [match[1], match[2], match[3]].map((c, i) =>
      Math.round(Number(c) * alpha + channels[i] * (1 - alpha)),
    )
    return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  // A hairline is a hex colour, or a translucent one that takes the colour of what it sits on.
  function lineOver(name: string, theme: 'light' | 'dark', surface: string): string {
    const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
    const found = [...scope.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))].pop()
    if (!found) throw new Error(`--${name} not found (${theme})`)
    const rgba = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(found[1])
    if (!rgba) return token(name, theme)
    const alpha = Number(rgba[4])
    const base = [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16))
    const mixed = [rgba[1], rgba[2], rgba[3]].map((c, i) =>
      Math.round(Number(c) * alpha + base[i] * (1 - alpha)),
    )
    return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`the hairline and the card border stay visible on the page and on a panel (${theme})`, () => {
      const page = token('bg-principal', theme)
      const panel = token('bg-panel', theme)
      // Hairlines, not frames: a card also stands apart from a panel by its own ground.
      for (const name of ['gbt-hairline', 'gbt-card-border']) {
        for (const surface of [page, panel]) {
          expect(
            ratio(lineOver(name, theme, surface), surface),
            `--${name} on ${surface} (${theme})`,
          ).toBeGreaterThanOrEqual(1.3)
        }
      }
    })

    it(`the list row's status glyph tones stay perceivable on the row hover fill (${theme})`, () => {
      const page = token('bg-principal', theme)
      for (const base of [page, token('bg-panel', theme)]) {
        for (const surface of [base, hoverOver(theme, base)]) {
          for (const tone of [
            'text-secondary',
            'color-success-text',
            'color-warning-text',
            'color-error-text',
            'color-info-bg-text',
          ]) {
            expect(
              ratio(token(tone, theme), surface),
              `--${tone} on ${surface} (${theme})`,
            ).toBeGreaterThanOrEqual(4.5)
          }
        }
      }
    })
  }

  it('--gbt-font-mono is declared once and the mono input and textarea fall back to the same stack', () => {
    const declared = /--gbt-font-mono:\s*([^;]+);/.exec(LIGHT_SCOPE)
    if (!declared) throw new Error('--gbt-font-mono not found in _semantic.scss')
    const normalize = (stack: string) => stack.replace(/\s+/g, ' ').replace(/'/g, '"').trim()
    const components = join(process.cwd(), 'projects/gabarit')
    for (const file of ['input/input.scss', 'textarea/textarea.scss']) {
      const scss = readFileSync(join(components, file), 'utf8')
      const used = /var\(\s*--gbt-font-mono,\s*([^)]+)\)/.exec(scss)
      if (!used) throw new Error(`${file} does not read var(--gbt-font-mono, …)`)
      expect(normalize(used[1]), file).toBe(normalize(declared[1]))
    }
  })
})

describe('widgets (counter, code chip, icon marker, stat tile…)', () => {
  function mix(top: string, percent: number, base: string): string {
    const a = [1, 3, 5].map((i) => parseInt(top.slice(i, i + 2), 16))
    const b = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
    const out = a.map((c, i) => Math.round((c * percent + b[i] * (100 - percent)) / 100))
    return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  function hoverOver(theme: 'light' | 'dark', base: string): string {
    const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
    const match = [
      ...scope.matchAll(/--bg-hover:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g),
    ].pop()
    if (!match) throw new Error(`--bg-hover rgba not found (${theme})`)
    const alpha = Number(match[4])
    const channels = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
    const mixed = [match[1], match[2], match[3]].map((c, i) =>
      Math.round(Number(c) * alpha + channels[i] * (1 - alpha)),
    )
    return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  function surfaces(theme: 'light' | 'dark'): string[] {
    const page = token('bg-principal', theme)
    const panel = token('bg-panel', theme)
    return [page, panel, hoverOver(theme, page), hoverOver(theme, panel)]
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`gbt-counter (${theme}): --text-primary on the 14% border wash reaches 7:1 on every surface, primary text on --primary too`, () => {
      for (const surface of surfaces(theme)) {
        const wash = mix(token('border-color', theme), 14, surface)
        expect(
          ratio(token('text-primary', theme), wash),
          `neutral counter over ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
      expect(
        ratio(token('text-on-primary', theme), token('primary', theme)),
      ).toBeGreaterThanOrEqual(7)
    })

    it(`gbt-code-chip (${theme}): --text-primary on the --bg-hover chip reaches 7:1 on every surface, also under a hovered row`, () => {
      for (const surface of surfaces(theme)) {
        const chip = hoverOver(theme, surface)
        expect(
          ratio(token('text-primary', theme), chip),
          `chip text over ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
        for (const name of ['text-secondary', 'color-success-text', 'color-error-text']) {
          expect(
            ratio(token(name, theme), chip),
            `--${name} over the chip on ${surface} (${theme})`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    })

    it(`gbt-icon-marker (${theme}): every tone's glyph stays perceivable on its disc, on every surface`, () => {
      for (const tone of ['success', 'warning', 'error', 'info']) {
        expect(
          ratio(token(`color-${tone}-bg-text`, theme), token(`color-${tone}-bg`, theme)),
          `--color-${tone}-bg-text on --color-${tone}-bg (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
      for (const surface of surfaces(theme)) {
        expect(
          ratio(token('text-secondary', theme), mix(token('border-color', theme), 18, surface)),
          `neutral marker over ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          ratio(token('primary', theme), mix(token('primary', theme), 12, surface)),
          `primary marker over ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(4.5)
      }
      for (const surface of [token('bg-principal', theme), token('bg-panel', theme)]) {
        for (const name of [
          'text-secondary',
          'primary',
          'color-success-text',
          'color-warning-text',
          'color-error-text',
          'color-info-bg-text',
        ]) {
          expect(
            ratio(token(name, theme), surface),
            `outline marker --${name} on ${surface} (${theme})`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    })

    it(`gbt-stat-tile (${theme}): label, figure, hint and trend colours reach 7:1 on the tile background`, () => {
      for (const name of [
        'text-primary',
        'text-secondary',
        'color-success-text',
        'color-error-text',
      ]) {
        expect(
          ratio(token(name, theme), token('bg-principal', theme)),
          `--${name} on the stat tile (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
    })

    it(`gbt-disclosure (${theme}): text on the toggle hover fill and on the tinted panel reaches 7:1`, () => {
      for (const base of [token('bg-principal', theme), token('bg-panel', theme)]) {
        for (const name of ['text-primary', 'text-secondary']) {
          expect(
            ratio(token(name, theme), hoverOver(theme, base)),
            `--${name} on --bg-hover over ${base} (${theme})`,
          ).toBeGreaterThanOrEqual(7)
        }
      }
    })
  }
})

describe('navigation (nav tabs, app-shell nav group, compact search)', () => {
  function mix(top: string, percent: number, base: string): string {
    const a = [1, 3, 5].map((i) => parseInt(top.slice(i, i + 2), 16))
    const b = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
    const out = a.map((c, i) => Math.round((c * percent + b[i] * (100 - percent)) / 100))
    return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  function hoverOver(theme: 'light' | 'dark', base: string): string {
    const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
    const match = [
      ...scope.matchAll(/--bg-hover:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g),
    ].pop()
    if (!match) throw new Error(`--bg-hover rgba not found (${theme})`)
    const alpha = Number(match[4])
    const channels = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16))
    const mixed = [match[1], match[2], match[3]].map((c, i) =>
      Math.round(Number(c) * alpha + channels[i] * (1 - alpha)),
    )
    return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  function surfaces(theme: 'light' | 'dark'): string[] {
    const page = token('bg-principal', theme)
    const panel = token('bg-panel', theme)
    return [page, panel, hoverOver(theme, page), hoverOver(theme, panel)]
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`gbt-nav-tabs (${theme}): link text reaches 7:1 on every surface, also under hover, and the active pill keeps 7:1`, () => {
      for (const surface of surfaces(theme)) {
        for (const name of ['text-primary', 'text-secondary']) {
          expect(
            ratio(token(name, theme), surface),
            `--${name} on ${surface} (${theme})`,
          ).toBeGreaterThanOrEqual(7)
        }
      }
      for (const base of [token('bg-principal', theme), token('bg-panel', theme)]) {
        const pill = mix(token('primary', theme), 10, base)
        expect(
          ratio(token('text-primary', theme), pill),
          `active pill over ${base} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
        expect(
          ratio(token('primary', theme), pill),
          `active icon over ${base} (${theme})`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    })

    it(`gbt-nav-tabs (${theme}): the underline of the active tab and the badge meet their bars`, () => {
      for (const base of [token('bg-principal', theme), token('bg-panel', theme)]) {
        expect(
          ratio(token('primary', theme), base),
          `active underline on ${base} (${theme})`,
        ).toBeGreaterThanOrEqual(3)
      }
      for (const surface of surfaces(theme)) {
        const wash = mix(token('border-color', theme), 14, surface)
        expect(
          ratio(token('text-primary', theme), wash),
          `badge over ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
      expect(
        ratio(token('text-on-primary', theme), token('primary', theme)),
      ).toBeGreaterThanOrEqual(7)
    })

    it(`gbt-app-shell-nav-group (${theme}): the group's toggle and sub-links keep 7:1 on the shell's panel, hover included`, () => {
      const panel = token('bg-panel', theme)
      for (const surface of [panel, hoverOver(theme, panel)]) {
        for (const name of ['text-primary', 'text-secondary']) {
          expect(
            ratio(token(name, theme), surface),
            `--${name} on ${surface} (${theme})`,
          ).toBeGreaterThanOrEqual(7)
        }
      }
      expect(
        ratio(token('text-on-primary', theme), token('primary', theme)),
      ).toBeGreaterThanOrEqual(7)
      expect(
        ratio(token('text-primary', theme), token('bg-principal', theme)),
      ).toBeGreaterThanOrEqual(7)
    })

    it(`gbt-search-bar compact toggle (${theme}): the icon button reaches 7:1 on the header surfaces, hover included`, () => {
      for (const surface of surfaces(theme)) {
        expect(
          ratio(token('text-primary', theme), surface),
          `search icon on ${surface} (${theme})`,
        ).toBeGreaterThanOrEqual(7)
      }
    })
  }
})

describe('series palette', () => {
  const SERIES = [
    'chart-series-1-base',
    'chart-series-2-base',
    'chart-series-3-base',
    'chart-series-4-base',
    'chart-series-5-base',
    'chart-series-6-base',
  ]

  for (const theme of ['light', 'dark'] as const) {
    it(`the six series are pairwise distinct (${theme})`, () => {
      const hexes = SERIES.map((s) => token(s, theme))
      expect(new Set(hexes).size).toBe(SERIES.length)
    })
  }

  it('series 1 differs between light theme and dark theme', () => {
    expect(token('chart-series-1-base', 'light')).not.toBe(token('chart-series-1-base', 'dark'))
  })

  it('declares the seven dataviz tokens in the dark block', () => {
    for (const name of [...SERIES, 'chart-grid']) {
      expect(DARK_SCOPE, `--${name} absent du mixin sombre`).toContain(`--${name}:`)
    }
  })
})

// The ground and its glasses (4.0): the page is the ground, the panels glass laid on it. Measured at every colour of
// the ground (the stops of its gradient and its light), bare, under each density of the content glass and under the
// liquid glass, with the shades `_glass.scss` gives the text and the edges there (`on-ground`, `on-liquid`).
describe('the ground and its glasses', () => {
  const glassScss = readFileSync(join(DIR, '_glass.scss'), 'utf8')
  const mixinBody = (name: string) =>
    new RegExp(`@mixin ${name}(?:\\([^)]*\\))? \\{([\\s\\S]*?)\\n\\}`).exec(glassScss)![1]

  it('on-ground and on-liquid give the text and the edges their shades on the ground', () => {
    const onGround = mixinBody('on-ground')
    expect(onGround).toContain('--text-discret: var(--gbt-ground-text-discret);')
    expect(onGround).toContain('--border-color: var(--gbt-ground-border);')
    for (const tone of ['success', 'warning', 'error']) {
      expect(onGround).toContain(`--color-${tone}-text: var(--color-${tone}-bg-text);`)
    }
    const onLiquid = mixinBody('on-liquid')
    expect(onLiquid).toContain('@include on-ground;')
    expect(onLiquid).toContain('--text-secondary: var(--gbt-liquid-text);')
    expect(onLiquid).toContain('--text-discret: var(--gbt-liquid-text);')
    // The ground and both glasses take them.
    expect(mixinBody('ground')).toContain('@include on-ground;')
    expect(mixinBody('glass')).toContain('@include on-ground;')
    expect(mixinBody('liquid-glass')).toContain('@include on-liquid;')
  })

  for (const theme of ['light', 'dark'] as const) {
    const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
    const ground = /--gbt-ground:\s*([^;]+);/.exec(scope)![1]
    const stops = [...ground.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0])
    const glassOver = (density: string, stop: string) => token(`gbt-glass-${density}`, theme, stop)

    // The text on the ground and on the content glass: the discreet text takes its ground shade.
    const TEXT = ['text-primary', 'text-secondary', 'gbt-ground-text-discret', 'primary']
    const STATUS = ['color-success-bg-text', 'color-warning-bg-text', 'color-error-bg-text']

    it(`finds the ground's colours (${theme})`, () => {
      expect(stops.length).toBeGreaterThanOrEqual(3)
    })

    for (const name of [...TEXT, ...STATUS, 'color-info-bg-text']) {
      it(`--${name} reaches 7:1 on the bare ground and under thin, regular and thick glass (${theme})`, () => {
        for (const stop of stops) {
          const surfaces = [stop, ...['thin', 'regular', 'thick'].map((d) => glassOver(d, stop))]
          for (const surface of surfaces) {
            expect(
              ratio(token(name, theme), surface),
              `${name} on ${surface}`,
            ).toBeGreaterThanOrEqual(7)
          }
        }
      })
    }

    // What commands holds no status text; what floats and is read takes the thick fill, measured above.
    it(`the text on the liquid glass reaches 7:1 at every colour of the ground (${theme})`, () => {
      for (const stop of stops) {
        const liquid = glassOver('liquid', stop)
        for (const name of ['text-primary', 'gbt-liquid-text']) {
          expect(ratio(token(name, theme), liquid), `${name} on ${liquid}`).toBeGreaterThanOrEqual(
            7,
          )
        }
      }
    })

    // The controls on liquid glass (4.1), with the values `_glass.scss` poses: the prominent glass is its tint at 86 %
    // over the ground, the chosen one's tint the accent mixed half and half with the ink; held down, white at 14 % lights a
    // glass up at its edges.
    const over = (top: string, alpha: number, base: string) => {
      const a = hexChannels(top)
      const b = hexChannels(base)
      const out = a.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)))
      return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`
    }
    const glassScssValue = (name: string) =>
      Number(new RegExp(`\\$${name}: ([\\d.]+)`).exec(glassScss)![1])

    it(`the glass values of 4.1 are the tokens' (${theme})`, () => {
      expect(glassScssValue('press-scale')).toBe(1.04)
      expect(glassScssValue('press-light')).toBe(0.14)
      expect(glassScssValue('press-light-core')).toBeLessThan(0.14)
      expect(glassScssValue('prominent')).toBe(86)
      // Without an ambiance's own accent (4.2, `--gbt-ground-accent`), the accent deepened by the ink.
      expect(glassScss).toContain(
        '$chosen-tint: var(--gbt-ground-accent, color-mix(in srgb, var(--accent) 50%, var(--primary)));',
      )
    })

    it(`the text on the prominent and on the chosen glass reaches 7:1 at every colour of the ground (${theme})`, () => {
      const prominent = glassScssValue('prominent') / 100
      const chosen = over(token('accent', theme), 0.5, token('primary', theme))
      for (const stop of stops) {
        for (const [what, tint] of [
          ['prominent', token('primary', theme)],
          ['chosen', chosen],
        ]) {
          const glass = over(tint, prominent, stop)
          expect(
            ratio(token('text-on-primary', theme), glass),
            `${what} glass ${glass} over ${stop}`,
          ).toBeGreaterThanOrEqual(7)
        }
      }
    })

    it(`the text on a held liquid glass reaches 7:1 (${theme})`, () => {
      // Its middle, where the label sits: the light of its edges does not reach it.
      const light = glassScssValue('press-light-core')
      for (const stop of stops) {
        const held = over('#ffffff', light, glassOver('liquid', stop))
        for (const name of ['text-primary', 'gbt-liquid-text']) {
          expect(ratio(token(name, theme), held), `${name} on ${held}`).toBeGreaterThanOrEqual(7)
        }
      }
    })

    it(`the label on the lens of a segmented control or of a page's tabs reaches 7:1 (${theme})`, () => {
      expect(glassScss).toContain(
        '$lens-light: linear-gradient(var(--gbt-relief-highlight), var(--gbt-relief-highlight));',
      )
      for (const stop of stops) {
        const lens = token('gbt-relief-highlight', theme, glassOver('liquid', stop))
        expect(
          ratio(token('text-primary', theme), lens),
          `label on ${lens}`,
        ).toBeGreaterThanOrEqual(7)
      }
    })

    it(`a field's edge with the focus reaches 3:1 on its hollow of thin glass (${theme})`, () => {
      // The ink, or an ambiance's own accent (4.2): it holds 3:1 on its ground (tools/tokens.py checks it).
      expect(mixinBody('glass-hollow-focus')).toContain('border-color: $main;')
      expect(glassScss).toContain('$main: var(--gbt-ground-accent, var(--primary));')
      for (const stop of stops) {
        for (const surface of [
          stop,
          glassOver('thin', stop),
          glassOver('regular', stop),
          glassOver('thick', stop),
        ]) {
          expect(
            ratio(token('primary', theme), surface),
            `focused edge on ${surface}`,
          ).toBeGreaterThanOrEqual(3)
        }
      }
    })

    // Laid in a light glass (4.1.1, `holds-controls`): what floats keeps its rim of light and takes the ink at its
    // bottom edge, a field's hollow the ink's shade inside its top edge; their glass is unchanged. Over a card, a thick
    // glass or a sheet on its dimmed ground, the bottom of a chip's edge and the shade of a hollow stand out at 1.3:1
    // from the surface around them, and the text keeps 7:1.
    if (theme === 'light') {
      const backdrop = (stop: string) => over('#000000', 0.4, stop)
      const content = ['text-primary', 'text-secondary', 'gbt-ground-text-discret']
      const sheet = ['text-primary', 'gbt-liquid-text']
      const lightSurfaces = (): [string, string[]][] =>
        stops.flatMap((stop) => [
          [glassOver('regular', stop), content] as [string, string[]],
          [glassOver('thick', stop), content] as [string, string[]],
          [glassOver('thick', backdrop(stop)), sheet] as [string, string[]],
        ])
      const ink = (alpha: number, base: string) => over(token('text-primary', theme), alpha, base)

      it(`a light glass poses the light and the shade of the controls laid in it, light only (light)`, () => {
        const holds = mixinBody('holds-controls')
        for (const name of ['low', 'contact', 'hollow-shade', 'hollow-light', 'group-low']) {
          expect(holds).toMatch(
            new RegExp(`--gbt-nested-${name}: light-dark\\([^;]+, transparent\\);`),
          )
        }
        expect(mixinBody('glass')).toContain('@include holds-controls;')
        expect(mixinBody('floating-glass')).toContain('@include holds-controls;')
        expect(mixinBody('liquid-control')).toContain('$nested-float')
        expect(mixinBody('glass-hollow')).toContain('$nested-hollow,')
        // No line at rest, and the glass is the 4.1.0's.
        expect(mixinBody('glass-hollow')).toContain(
          'border: 1px solid var(--gbt-field-border, transparent);',
        )
        expect(mixinBody('glass-hollow')).toContain(
          'background: var(--gbt-field-ground, var(--gbt-glass-thin));',
        )
      })

      it(`the bottom of a chip's edge and a hollow's shade stand out at 1.3:1, the text keeps 7:1 (light)`, () => {
        for (const [surface, texts] of lightSurfaces()) {
          // A chip's bottom edge: the ink over its liquid glass, against the surface under it.
          const chip = token('gbt-glass-liquid', theme, surface)
          const low = ink(glassScssValue('nested-low'), chip)
          expect(ratio(low, surface), `chip's bottom ${low} on ${surface}`).toBeGreaterThanOrEqual(
            1.3,
          )
          // A hollow's top edge: the shade and the trace over its thin glass, against the surface around it.
          const hollow = token('gbt-glass-thin', theme, surface)
          const shade = ink(
            glassScssValue('nested-hollow-trace'),
            ink(glassScssValue('nested-hollow-shade'), hollow),
          )
          expect(
            ratio(shade, surface),
            `hollow's shade ${shade} on ${surface}`,
          ).toBeGreaterThanOrEqual(1.3)
          for (const inside of [surface, chip, hollow]) {
            for (const name of texts) {
              expect(
                ratio(token(name, theme), inside),
                `${name} on ${inside}`,
              ).toBeGreaterThanOrEqual(7)
            }
          }
        }
      })
    }

    it(`a field's edge on the ground reaches 3:1, bare and under the liquid glass (${theme})`, () => {
      for (const stop of stops) {
        for (const surface of [stop, glassOver('liquid', stop), glassOver('thin', stop)]) {
          expect(
            ratio(token('gbt-ground-border', theme), surface),
            `edge on ${surface}`,
          ).toBeGreaterThanOrEqual(3)
        }
      }
    })
  }
})
