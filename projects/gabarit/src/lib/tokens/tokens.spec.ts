import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'projects/gabarit/src/lib/tokens')
const read = (name: string) => readFileSync(join(DIR, name), 'utf8')

describe('tokens', () => {
  it('the palette defines the raw scales', () => {
    const palette = read('_palette.scss')
    for (const token of [
      '--brand-500',
      '--emerald-400',
      '--grey-900',
      '--red-500',
      '--amber-500',
      '--green-500',
    ]) {
      expect(palette).toContain(token)
    }
  })

  it('the semantic layer defines the tokens consumed by components', () => {
    const semantic = read('_semantic.scss')
    for (const token of [
      '--primary',
      '--bg-panel',
      '--border-color',
      '--text-primary',
      '--site-border-radius',
      '--site-shadow-md',
      '--font-family',
    ]) {
      expect(semantic).toContain(token)
    }
  })

  it('the semantic layer redefines dark mode via system preference', () => {
    expect(read('_semantic.scss')).toContain('@media (prefers-color-scheme: dark)')
  })

  it("ships no @font-face — that's the application's responsibility", () => {
    for (const file of ['_palette.scss', '_semantic.scss', '_utilities.scss']) {
      expect(read(file)).not.toContain('@font-face')
    }
  })

  it('ships no unprefixed global layout classes', () => {
    const utilities = read('_utilities.scss')
    expect(utilities).not.toContain('.d-flex')
    expect(utilities).not.toContain('.container')
  })

  it('prefixes every global utility class with gbt-', () => {
    const utilities = read('_utilities.scss')
    for (const cls of [
      '.gbt-form-error',
      '.gbt-form-success',
      '.gbt-form-required-note',
      '.gbt-tooltip-trigger',
    ]) {
      expect(utilities).toContain(cls)
    }

    expect(utilities).not.toContain('hg-')
  })

  it('reads every theming hook with its fallback, so an app that leaves them unset looks the same', () => {
    const lib = join(process.cwd(), 'projects/gabarit/src/lib')
    const scss = (readdirSync(lib, { recursive: true }) as string[])
      .filter((file) => file.endsWith('.scss'))
      .map((file) => readFileSync(join(lib, file), 'utf8'))
      .join('\n')
      // A long fallback is wrapped by Prettier after the opening parenthesis.
      .replace(/var\(\s+/g, 'var(')
    const hooks = [
      '--gbt-focus-ring',
      '--gbt-font-display',
      '--gbt-radius-badge',
      '--gbt-radius-chip',
      '--gbt-radius-menu',
      '--gbt-radius-tile',
      '--gbt-radius-search',
      '--gbt-nav-active-bg',
      '--gbt-nav-active-text',
      '--gbt-nav-active-mark',
      '--gbt-shell-border',
      '--gbt-shell-header-bg',
      '--gbt-shell-content-padding',
      '--gbt-auth-panel-backdrop',
      '--gbt-auth-panel-radius',
    ]
    for (const hook of hooks) {
      expect(scss, hook).toContain(`var(${hook},`)
      expect(scss, hook).not.toMatch(new RegExp(`var\\(${hook}\\)`))
      expect(read('_semantic.scss'), hook).not.toContain(`${hook}:`)
    }
    expect(scss).not.toContain('outline: 2px solid var(--primary)')
  })

  it('keeps sr-only, a visual-hiding utility offered to applications', () => {
    expect(read('_utilities.scss')).toContain('.sr-only')
  })
})
