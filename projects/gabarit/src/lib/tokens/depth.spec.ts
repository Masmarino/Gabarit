import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

// The style of volume and light: every control answers the pointer, under it and held down, and nothing moves when the
// system asks for less motion. What the apps check with tools/states_check.py, for the web's stylesheets.

const LIB = join(process.cwd(), 'projects/gabarit')
const TOKENS = join(LIB, 'src/lib/tokens')

const STYLESHEETS = (readdirSync(LIB, { recursive: true }) as string[])
  .filter((file) => file.endsWith('.scss') && !/^(fonts|\.storybook)/.test(file))
  .filter((file) => !file.endsWith('_themes.scss') && !file.endsWith('_semantic.scss'))
  .map((file) => join(LIB, file))

const source = (file: string) => readFileSync(file, 'utf8').replace(/\/\/.*$/gm, '')

describe('depth', () => {
  it('every clickable selector has its hover and press, and keeps still under reduced motion', () => {
    // On the compiled CSS, selector by selector; `npm run states` says which.
    expect(() =>
      execFileSync(process.execPath, [join(process.cwd(), 'tools/web_states.mjs')], {
        stdio: 'pipe',
      }),
    ).not.toThrow()
  }, 60_000)

  it('the sink keeps still when less motion is asked for', () => {
    const depth = readFileSync(join(TOKENS, '_depth.scss'), 'utf8')
    expect(depth).toMatch(/prefers-reduced-motion: no-preference\) \{\s+transform: translateY/)
  })

  it('text keeps 7:1 on a button held down, at the darkest of its shade (the top edge)', () => {
    const themes = readFileSync(join(TOKENS, '_themes.scss'), 'utf8')
    const palette = readFileSync(join(TOKENS, '_palette.scss'), 'utf8')
    const hex = (body: string, name: string): number[] => {
      const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(body)![1].trim()
      const ref = /var\(--([\w-]+)\)/.exec(value)
      const code = ref
        ? new RegExp(`--${ref[1]}:\\s*#([0-9a-f]{6})`).exec(palette)![1]
        : value.slice(1)
      return [0, 2, 4].map((i) => parseInt(code.slice(i, i + 2), 16))
    }
    const luminance = (rgb: number[]) => {
      const [r, g, b] = rgb.map((c) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    for (const mixin of ['light-tokens', 'dark-tokens']) {
      const body = new RegExp(`@mixin ${mixin} \\{([\\s\\S]*?)\\n\\}`).exec(themes)![1]
      const shade = Number(
        /--gbt-sunk-ink: linear-gradient\(rgb\(0 0 0 \/ ([\d.]+)\)/.exec(body)![1],
      )
      // The text sits on the middle of the button, the shade has faded there: a third of it is the most that reaches it.
      const under = (fill: number[]) => fill.map((c) => c * (1 - shade / 3))
      expect(
        ratio(hex(body, 'text-on-primary'), under(hex(body, 'primary-hover'))),
        mixin,
      ).toBeGreaterThanOrEqual(7)
      expect(
        ratio(hex(body, 'text-on-error'), under(hex(body, 'color-error-hover'))),
        mixin,
      ).toBeGreaterThanOrEqual(7)
      // A ghost danger button held down: its text, on 12% of itself over the page.
      const ink = hex(body, 'color-error-bg-text')
      const page = hex(body, 'bg-principal')
      const veil = ink.map((c, i) => c * 0.12 + page[i] * 0.88)
      expect(ratio(ink, veil), mixin).toBeGreaterThanOrEqual(7)
    }
  })

  it('the corners are those of the apps, from the common scale', () => {
    const json = JSON.parse(readFileSync(join(process.cwd(), 'tokens/gabarit.json'), 'utf8'))
    const themes = readFileSync(join(TOKENS, '_themes.scss'), 'utf8')
    const { xs, sm, md, lg } = json.radius
    expect(themes).toContain(`--site-border-radius-xs: ${xs}px;`)
    expect(themes).toContain(`--site-border-radius-sm: ${sm}px;`)
    expect(themes).toContain(`--site-border-radius: ${md}px;`)
    expect(themes).toContain(`--site-border-radius-lg: ${lg}px;`)
    expect(readFileSync(join(TOKENS, '_semantic.scss'), 'utf8')).not.toMatch(
      /border-radius[\w-]*:\s*\d/,
    )
  })

  it('the recipes are generated, in both themes and on the frame', () => {
    const themes = readFileSync(join(TOKENS, '_themes.scss'), 'utf8')
    for (const mixin of ['light-tokens', 'dark-tokens']) {
      const body = new RegExp(`@mixin ${mixin} \\{([\\s\\S]*?)\\n\\}`).exec(themes)![1]
      for (const token of [
        '--bg-press',
        '--gbt-depth-card',
        '--gbt-depth-raised',
        '--gbt-depth-ink',
        '--gbt-depth-hollow',
        '--gbt-depth-bar',
        '--gbt-sheen',
        '--gbt-sunk',
        '--gbt-page-ground',
        '--gbt-glow',
      ]) {
        expect(body, `${mixin} ${token}`).toContain(`${token}:`)
      }
    }
  })

  it('every depth token a stylesheet reads exists', () => {
    const themes = readFileSync(join(TOKENS, '_themes.scss'), 'utf8')
    for (const file of STYLESHEETS) {
      for (const [, token] of source(file).matchAll(
        /var\(\s*(--gbt-(?:depth|sheen|sunk|glow|knob|page-ground|page-light|frame-sheen|bar-shade|relief)[\w-]*)/g,
      )) {
        expect(themes, `${relative(LIB, file)} ${token}`).toContain(`${token}:`)
      }
    }
  })

  it('a form card takes its fields out of their frame, through hooks with fallbacks', () => {
    const card = readFileSync(join(LIB, 'card/card.scss'), 'utf8')
    for (const hook of ['--gbt-field-border:', '--gbt-field-ground:', '--gbt-field-hollow:']) {
      expect(card).toContain(hook)
    }
    for (const field of [
      'input/input.scss',
      'textarea/textarea.scss',
      'tag-input/tag-input.scss',
    ]) {
      const css = readFileSync(join(LIB, field), 'utf8')
      expect(css, field).toContain('var(--gbt-field-border, var(--border-color))')
      expect(css, field).toContain('var(--gbt-field-ground, var(--bg-principal))')
    }
  })
})
