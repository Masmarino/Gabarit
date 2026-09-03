import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'projects/gabarit/src/lib/tokens')
const palette = readFileSync(join(DIR, '_palette.scss'), 'utf8')
const semantic = readFileSync(join(DIR, '_semantic.scss'), 'utf8')

function resolve(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) return trimmed
  const ref = /var\(--([a-z0-9-]+)\)/.exec(trimmed)
  if (!ref) throw new Error(`unresolved value: ${value}`)
  const found = new RegExp(`--${ref[1]}:\\s*(#[0-9a-fA-F]{6})`).exec(palette)
  if (!found) throw new Error(`palette token not found: --${ref[1]}`)
  return found[1]
}

const DARK_MIXIN = /@mixin dark-tokens\s*\{([\s\S]*?)\n\}/.exec(semantic)
if (!DARK_MIXIN) throw new Error('@mixin dark-tokens not found in _semantic.scss')
const DARK_SCOPE = DARK_MIXIN[1]
const LIGHT_SCOPE = semantic.slice(0, semantic.indexOf('@mixin dark-tokens'))

function token(name: string, theme: 'light' | 'dark'): string {
  const scope = theme === 'light' ? LIGHT_SCOPE : DARK_SCOPE
  const matches = [...scope.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))]
  if (matches.length === 0) {
    if (theme === 'dark') return token(name, 'light')
    throw new Error(`token not found: --${name} (${theme})`)
  }
  return resolve(matches[matches.length - 1][1])
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

const LIGHT_BG = '#ffffff'
const DARK_BG = '#0d1b24'
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
  ['text-primary', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — app-shell panel background'],
  ['text-secondary', 'dark', PANEL_BG_DARK, 7, '3.2 (AAA) — app-shell panel background'],
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

    expect(token('text-primary', 'dark')).toBe(resolve('var(--grey-50)'))
    expect(token('bg-principal', 'dark')).toBe(resolve('var(--grey-900)'))
    expect(token('border-color', 'dark')).toBe('#436a80')
  })
})

describe('series palette', () => {
  const SERIES = ['chart-series-1-base', 'chart-series-2-base', 'chart-series-3-base']

  for (const theme of ['light', 'dark'] as const) {
    it(`the three series are pairwise distinct (${theme})`, () => {
      const hexes = SERIES.map((s) => token(s, theme))
      expect(new Set(hexes).size).toBe(3)
    })
  }

  it('series 1 differs between light theme and dark theme', () => {
    expect(token('chart-series-1-base', 'light')).not.toBe(token('chart-series-1-base', 'dark'))
  })

  it('declares the four dataviz tokens in the dark block', () => {
    for (const name of [
      'chart-series-1-base',
      'chart-series-2-base',
      'chart-series-3-base',
      'chart-grid',
    ]) {
      expect(DARK_SCOPE, `--${name} absent du mixin sombre`).toContain(`--${name}:`)
    }
  })
})
