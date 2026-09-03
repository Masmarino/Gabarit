import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const COMPONENTS_DIR = join(ROOT, 'projects/gabarit/src/lib/components')
const UTILITIES_FILE = join(ROOT, 'projects/gabarit/src/lib/tokens/_utilities.scss')

function collectScssFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...collectScssFiles(full))
    } else if (entry.endsWith('.scss')) {
      files.push(full)
    }
  }
  return files
}

const PALETTE_FILE = join(ROOT, 'projects/gabarit/src/lib/tokens/_palette.scss')
const RAW_PALETTE_PREFIXES = [
  ...new Set(
    [...readFileSync(PALETTE_FILE, 'utf8').matchAll(/--([a-z]+)-\d+\s*:/g)].map((m) => m[1]),
  ),
].sort()
const RAW_PALETTE_RE = new RegExp(`--(?:${RAW_PALETTE_PREFIXES.join('|')})-[a-z0-9]+`, 'g')

const COLOR_BEARING_PROPS = [
  'color',
  'background',
  'background-color',
  'border-color',
  'outline-color',
]
const COLOR_ON_BASE_RE = new RegExp(
  `(?<![\\w-])(${COLOR_BEARING_PROPS.join('|')})\\s*:\\s*[^;]*var\\(\\s*(--[\\w-]+-base)\\s*\\)`,
  'g',
)

const GRAPHIC_MARKER_RE =
  /(?:\/\/\s*token-graphique-sans-texte|\/\*\s*token-graphique-sans-texte\s*\*\/)\s*$/
const MARKER_ELIGIBLE_PROPS = new Set(['background', 'background-color'])

function enclosingSelectors(content: string, offset: number): string[] {
  const stack: string[] = []
  let tokenStart = 0
  for (let i = 0; i < offset; i++) {
    const ch = content[i]
    if (ch === '{') {
      stack.push(content.slice(tokenStart, i).trim())
      tokenStart = i + 1
    } else if (ch === '}') {
      stack.pop()
      tokenStart = i + 1
    } else if (ch === ';') {
      tokenStart = i + 1
    }
  }
  return stack
}

function enclosingBlockLineEnd(content: string, offset: number): number {
  let depth = 1
  for (let i = offset; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) {
        const eol = content.indexOf('\n', i)
        return eol === -1 ? content.length : eol
      }
    }
  }
  return content.length
}

function colorOnBaseMatches(content: string): { line: number; match: RegExpMatchArray }[] {
  const found: { line: number; match: RegExpMatchArray }[] = []
  let lineStart = 0
  content.split('\n').forEach((line, i) => {
    const matches = [...line.matchAll(COLOR_ON_BASE_RE)]
    const eligibles = matches.filter((m) => MARKER_ELIGIBLE_PROPS.has(m[1]))
    const onTextSelector = (m: RegExpMatchArray) =>
      enclosingSelectors(content, lineStart + (m.index ?? 0)).some((selector) =>
        TEXT_SELECTOR_RE.test(selector),
      )
    const isMarked = (m: RegExpMatchArray) => {
      const declOffset = lineStart + (m.index ?? 0)
      const blockEnd = enclosingBlockLineEnd(content, declOffset)
      return content
        .slice(lineStart, blockEnd)
        .split('\n')
        .some((l) => GRAPHIC_MARKER_RE.test(l.trimEnd()))
    }
    const exempted =
      eligibles.length === 1 && isMarked(eligibles[0]) && !onTextSelector(eligibles[0])
        ? eligibles[0]
        : null
    for (const match of matches) {
      if (match === exempted) continue
      found.push({ line: i + 1, match })
    }
    lineStart += line.length + 1
  })
  return found
}

const TEXT_SELECTOR_SOURCE = `(?:(?<![\\w-])text(?![\\w-])|[.&][\\w-]*(?<![a-z])(?:label|text|caption|title)(?![a-z]))`
const TEXT_SELECTOR_RE = new RegExp(TEXT_SELECTOR_SOURCE)
const TEXT_FILL_ON_BASE_RE = new RegExp(
  `${TEXT_SELECTOR_SOURCE}[^{}]*\\{[^{}]*(?<![\\w-])(?:fill|stroke)\\s*:\\s*[^;]*var\\(\\s*--[\\w-]+-base\\s*\\)`,
  'g',
)

function textFillOnBaseViolations(content: string): string[] {
  return [...content.matchAll(TEXT_FILL_ON_BASE_RE)].map((m) => m[0])
}

function collectInlineStyles(dir: string): { file: string; content: string }[] {
  const found: { file: string; content: string }[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      found.push(...collectInlineStyles(full))
    } else if (
      entry.endsWith('.ts') &&
      !entry.endsWith('.spec.ts') &&
      !entry.endsWith('.stories.ts')
    ) {
      const src = readFileSync(full, 'utf8')
      for (const match of src.matchAll(/styles:\s*`([\s\S]*?)`/g)) {
        found.push({ file: full, content: match[1] })
      }
    }
  }
  return found
}

const FILES_TO_CHECK = [...collectScssFiles(COMPONENTS_DIR), UTILITIES_FILE].sort()
const INLINE_STYLES = collectInlineStyles(COMPONENTS_DIR)

describe('token usage in component stylesheets', () => {
  it('derives palette families from the palette file itself', () => {
    expect(RAW_PALETTE_PREFIXES.length).toBeGreaterThan(0)
    expect(RAW_PALETTE_PREFIXES).toContain('grey')
  })

  for (const { file, content } of INLINE_STYLES) {
    const rel = relative(ROOT, file)
    it(`${rel} — inline styles: no raw palette token`, () => {
      const violations = [...content.matchAll(RAW_PALETTE_RE)].map(
        (m) => `${rel} (inline styles) — raw palette token "${m[0]}"`,
      )
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })

    it(`${rel} — inline styles: no text painted with a *-base token`, () => {
      const violations = colorOnBaseMatches(content).map(
        ({ match }) =>
          `${rel} (inline styles) — "${match[1]}: var(${match[2]})" tied to a graphic-only token`,
      )
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })

    it(`${rel} — inline styles: no SVG <text> filled or stroked with a *-base token`, () => {
      const violations = textFillOnBaseViolations(content)
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })
  }

  for (const file of FILES_TO_CHECK) {
    const rel = relative(ROOT, file)

    it(`${rel} references no raw palette token`, () => {
      const lines = readFileSync(file, 'utf8').split('\n')
      const violations: string[] = []
      lines.forEach((line, i) => {
        for (const match of line.matchAll(RAW_PALETTE_RE)) {
          violations.push(`${rel}:${i + 1} — raw palette token "${match[0]}" referenced directly`)
        }
      })
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })

    it(`${rel} paints no text or text-bearing fill with a *-base token`, () => {
      const violations = colorOnBaseMatches(readFileSync(file, 'utf8')).map(
        ({ line, match }) =>
          `${rel}:${line} — "${match[1]}: var(${match[2]})" tied to a graphic-only token (3:1 threshold), not a text token`,
      )
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })

    it(`${rel} fills no SVG <text> with a *-base token`, () => {
      const violations = textFillOnBaseViolations(readFileSync(file, 'utf8'))
      expect(violations, `\n${violations.join('\n')}`).toEqual([])
    })
  }
})

const SEMANTIC_FILE = join(ROOT, 'projects/gabarit/src/lib/tokens/_semantic.scss')
const semanticSrc = readFileSync(SEMANTIC_FILE, 'utf8')
const paletteSrc = readFileSync(PALETTE_FILE, 'utf8')
const darkStart = semanticSrc.indexOf('@mixin dark-tokens')
const darkBody = semanticSrc.slice(darkStart)
const lightBody = semanticSrc.slice(0, darkStart)

function flatten(rgba: string, over: string): string {
  const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number)
  const base = [1, 3, 5].map((i) => parseInt(over.slice(i, i + 2), 16))
  const mix = [r, g, b].map((c, i) => Math.round(c * a + base[i] * (1 - a)))
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

function resolveToken(name: string, theme: 'light' | 'dark', over?: string): string | null {
  const scopes = theme === 'dark' ? [darkBody, lightBody, paletteSrc] : [lightBody, paletteSrc]
  for (const scope of scopes) {
    const found = [...scope.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))]
    if (found.length === 0) continue
    const value = found[found.length - 1][1].split('//')[0].trim()
    if (value.startsWith('#')) return value.slice(0, 7)

    if (value.startsWith('rgba(')) return over ? flatten(value, over) : null
    const ref = /var\(--([a-z0-9-]+)\)/.exec(value)
    return ref ? resolveToken(ref[1], theme, over) : null
  }
  return null
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function ownDeclarations(body: string): string {
  let own = ''
  let depth = 0
  let flushFrom = 0
  for (let i = 0; i < body.length; i++) {
    const char = body[i]
    if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--

      if (depth === 0) flushFrom = i + 1
    } else if (char === ';' && depth === 0) {
      own += body.slice(flushFrom, i + 1)
      flushFrom = i + 1
    }
  }

  own += body.slice(flushFrom)
  return own
}

const PAIR_RE_BG = /(?<![\w-])background(?:-color)?\s*:\s*var\(\s*(--[\w-]+)\s*\)/
const PAIR_RE_FG = /(?<![\w-])color\s*:\s*var\(\s*(--[\w-]+)\s*\)/

function extractRules(
  source: string,
  inheritedColor?: string,
): { line: number; body: string; effectiveColor?: string }[] {
  const blocks: { line: number; full: string }[] = []
  let depth = 0
  let start = 0
  let startLine = 1
  let line = 1
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') line++
    else if (source[i] === '{') {
      if (depth === 0) {
        start = i + 1
        startLine = line
      }
      depth++
    } else if (source[i] === '}') {
      depth--
      if (depth === 0) blocks.push({ line: startLine, full: source.slice(start, i) })
    }
  }
  const rules = blocks.map((b) => {
    const body = ownDeclarations(b.full)
    const ownColor = PAIR_RE_FG.exec(body)?.[1]
    return { line: b.line, body, effectiveColor: ownColor ?? inheritedColor }
  })

  const nested = blocks.flatMap((b, i) =>
    b.full.includes('{')
      ? extractRules(b.full, rules[i].effectiveColor).map((n) => ({ ...n, line: b.line }))
      : [],
  )
  return [...rules, ...nested]
}

describe('text/fill pairing in components', () => {
  for (const file of FILES_TO_CHECK) {
    const rel = relative(ROOT, file)
    const rules = extractRules(readFileSync(file, 'utf8'))
    const pairs = rules
      .map((r) => ({ line: r.line, bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p): p is { line: number; bg: string; fg: string } => Boolean(p.bg && p.fg))

    for (const { line, bg, fg } of pairs) {
      for (const theme of ['light', 'dark'] as const) {
        it(`${rel}:${line} — ${fg} on ${bg} (${theme}) reaches 7:1`, () => {
          const page = resolveToken('bg-principal', theme)!
          const bgHex = resolveToken(bg.slice(2), theme, page)
          const fgHex = resolveToken(fg.slice(2), theme, bgHex ?? page)

          expect(fgHex, `${fg} not resolvable to an opaque color`).not.toBeNull()
          expect(bgHex, `${bg} not resolvable to an opaque color`).not.toBeNull()
          expect(contrast(fgHex!, bgHex!)).toBeGreaterThanOrEqual(7)
        })
      }
    }
  }
})

describe('extractRules: own scope and effective color inheritance', () => {
  it('two sibling nested selectors form no pair', () => {
    const source = [
      '.gbt-x {',
      '  caption { color: var(--text-primary); }',
      '  &__bar { background: var(--chart-series-3-base); }',
      '}',
    ].join('\n')
    const pairs = extractRules(source)
      .map((r) => ({ bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p) => p.bg && p.fg)
    expect(pairs).toEqual([])
  })

  it('a single rule setting both forms a pair', () => {
    const source =
      '.gbt-x { &--danger { background: var(--color-error-fill); color: var(--text-on-error); } }'
    const pairs = extractRules(source)
      .map((r) => ({ bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p) => p.bg && p.fg)
    expect(pairs).toEqual([{ bg: '--color-error-fill', fg: '--text-on-error' }])
  })

  it("a nested rule that sets a background inherits its ancestor's color", () => {
    const source = '.gbt-x { color: var(--text-primary); &:hover { background: var(--bg-hover); } }'
    const pairs = extractRules(source)
      .map((r) => ({ bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p) => p.bg && p.fg)
    expect(pairs).toEqual([{ bg: '--bg-hover', fg: '--text-primary' }])
  })

  it('a closer ancestor that redefines the color masks a farther one', () => {
    const source =
      '.gbt-x { color: var(--text-secondary); &__action { color: var(--primary); &:hover { background: var(--bg-hover); } } }'
    const pairs = extractRules(source)
      .map((r) => ({ bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p) => p.bg && p.fg)
    expect(pairs).toEqual([{ bg: '--bg-hover', fg: '--primary' }])
  })

  it('a declaration of its own on the head rule still gets measured despite a nested child', () => {
    const source =
      '.gbt-x { background: var(--bg-principal); color: var(--text-primary); &__child { color: var(--primary); } }'
    const pairs = extractRules(source)
      .map((r) => ({ bg: PAIR_RE_BG.exec(r.body)?.[1], fg: r.effectiveColor }))
      .filter((p) => p.bg && p.fg)
    expect(pairs).toEqual([{ bg: '--bg-principal', fg: '--text-primary' }])
  })
})

describe('*-base rule: graphic allowed, text forbidden', () => {
  it('allows a stroke painted with a *-base token', () => {
    const allowed = '.gbt-line__path { stroke: var(--chart-series-1-base); }'
    expect([...allowed.matchAll(COLOR_ON_BASE_RE)]).toEqual([])
  })

  it('allows a bar fill painted with a *-base token', () => {
    const allowed = '.gbt-bar__rect { fill: var(--chart-series-2-base); }'
    expect([...allowed.matchAll(COLOR_ON_BASE_RE)]).toEqual([])
  })

  it('always forbids text painted with a *-base token', () => {
    const violating = '.gbt-legend__label { color: var(--chart-series-1-base); }'
    expect([...violating.matchAll(COLOR_ON_BASE_RE)]).toHaveLength(1)
  })

  it('forbids a text-bearing fill painted with a *-base token', () => {
    const violating = '.gbt-banner { background: var(--color-error-base); }'
    expect([...violating.matchAll(COLOR_ON_BASE_RE)]).toHaveLength(1)
  })

  it('allows a graphic-only fill marked "token-graphique-sans-texte", even with a *-base token', () => {
    const allowed = [
      '.gbt-gauge-bar__fill {',
      '  background: var(--color-warning-base); // token-graphique-sans-texte',
      '}',
    ].join('\n')
    expect(colorOnBaseMatches(allowed)).toEqual([])
  })

  it("forbids the same fill without the marker — the exemption doesn't become the rule", () => {
    const violating = [
      '.gbt-gauge-bar__fill {',
      '  background: var(--color-warning-base);',
      '}',
    ].join('\n')
    expect(colorOnBaseMatches(violating)).toHaveLength(1)
  })

  it.each(['color', 'border-color', 'outline-color'])(
    'the marker never exempts `%s` from a *-base token',
    (prop) => {
      const violating = [
        '.gbt-legend__label {',
        `  ${prop}: var(--chart-series-1-base); // token-graphique-sans-texte`,
        '}',
      ].join('\n')
      expect(colorOnBaseMatches(violating)).toHaveLength(1)
    },
  )

  it('refuses the marker when the enclosing selector names text', () => {
    const violating = [
      '.gbt-funnel-chart {',
      '  &__label {',
      '    background: var(--chart-series-2-base); // token-graphique-sans-texte',
      '  }',
      '}',
    ].join('\n')
    expect(colorOnBaseMatches(violating)).toHaveLength(1)
  })

  it('a marker exempts only one eligible match per line', () => {
    const violating =
      '.a { background: var(--color-success-base); } .b { background: var(--color-error-base); } // token-graphique-sans-texte'
    expect(colorOnBaseMatches(violating)).toHaveLength(2)
  })

  it('forbids an SVG <text> filled with a *-base token', () => {
    const violating = '.gbt-axis text { fill: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(violating)).toHaveLength(1)
  })

  it('doesn\'t mistake a selector containing "text" for a text element', () => {
    const allowed = '.gbt-chart__context { fill: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(allowed)).toEqual([])
  })

  it('forbids an SVG <text> stroked with a *-base token', () => {
    const violating = '.gbt-axis text { stroke: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(violating)).toHaveLength(1)
  })

  it('forbids a label class painted with a *-base token', () => {
    const violating = '.gbt-chart-axis__label { fill: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(violating)).toHaveLength(1)
  })

  it('allows a label class painted with a text token', () => {
    const allowed = '.gbt-chart-axis__label { fill: var(--text-discret); }'
    expect(textFillOnBaseViolations(allowed)).toEqual([])
  })

  it("doesn't mistake a graphic class for a label", () => {
    const allowed = '.gbt-chart-legend__line { stroke: var(--chart-series-2-base); }'
    expect(textFillOnBaseViolations(allowed)).toEqual([])
  })

  it('doesn\'t mistake "context" for "text"', () => {
    const allowed = '.gbt-chart__context { fill: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(allowed)).toEqual([])
  })

  it('detects a text-legend class, regardless of the word used', () => {
    const violating = '.gbt-table__caption { fill: var(--chart-series-1-base); }'
    expect(textFillOnBaseViolations(violating)).toHaveLength(1)
  })
})
