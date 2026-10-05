import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'projects/gabarit/src/lib/tokens')
const read = (name: string) => readFileSync(join(DIR, name), 'utf8')

describe('tokens', () => {
  it('the palette defines the raw scales', () => {
    const palette = read('_palette.scss')
    for (const token of [
      '--slate-0',
      '--slate-900',
      '--graphite-950',
      '--rust-500',
      '--patina-600',
      '--amber-600',
      '--red-600',
      '--indigo-600',
    ]) {
      expect(palette).toContain(token)
    }
  })

  it('the semantic layer defines the tokens consumed by components', () => {
    const semantic = read('_semantic.scss') + read('_themes.scss')
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
    const lib = join(process.cwd(), 'projects/gabarit')
    const scss = (readdirSync(lib, { recursive: true }) as string[])
      .filter((file) => file.endsWith('.scss') && !file.startsWith('fonts'))
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

  it('offers IBM Plex as an opt-in entry, every face it declares shipped beside it', () => {
    const fonts = join(process.cwd(), 'projects/gabarit/fonts')
    const index = readFileSync(join(fonts, 'index.scss'), 'utf8')
    const files = [...index.matchAll(/'(ibm-plex-[a-z0-9-]+)'\)/g)].map((m) => `${m[1]}.woff2`)
    expect(files).toHaveLength(6)
    const shipped = readdirSync(fonts)
    for (const file of files) {
      expect(shipped, file).toContain(file)
    }
    expect(shipped).toContain('OFL-ibm-plex.txt')
    expect(index).toContain('$path: ')
  })

  it('keeps sr-only, a visual-hiding utility offered to applications', () => {
    expect(read('_utilities.scss')).toContain('.sr-only')
  })
})
