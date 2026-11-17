import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { groundAccent } from './ground-accent'
import { GROUND_AMBIANCES, GROUND_KINDS, GROUND_RULE } from './ground-tokens'

const ROOT = process.cwd()
const TOKENS = JSON.parse(readFileSync(join(ROOT, 'tokens/gabarit.json'), 'utf8'))
const GROUNDS = readFileSync(join(ROOT, 'projects/gabarit/src/lib/tokens/_grounds.scss'), 'utf8')

function channels(hexa: string): number[] {
  return [1, 3, 5].map((index) => parseInt(hexa.slice(index, index + 2), 16))
}

/** Within 1/255 on every channel. */
function near(actual: string, expected: string): void {
  const [a, e] = [channels(actual), channels(expected)]
  for (let index = 0; index < 3; index++) {
    expect(Math.abs(a[index] - e[index])).toBeLessThanOrEqual(1)
  }
}

describe('groundAccent (4.2, the rule of tools/tokens.py)', () => {
  it('finds the reference values of the shared brief, within 1/255', () => {
    const dore = groundAccent('#E9C979', 'dore')!
    near(dore.accentText, '#E9C979')
    near(dore.onAccent, '#10151C')
    expect(dore.selected).toBe(0.16)
    expect(dore.holds).toBe(true)

    const deep = groundAccent('#7A5A20', 'dore')!
    near(deep.accentText, '#D7CEBC')
    near(deep.onAccent, '#FFFFFF')
    expect(deep.edge).toBeCloseTo(1.18, 2)
    expect(deep.holds).toBe(false)

    const givre = groundAccent('#B8862B', 'givre')!
    near(givre.accentText, '#7D5E26')
    near(givre.onAccent, '#10151C')
    expect(givre.selected).toBe(0.1)

    const aurore = groundAccent('#E9C979', 'aurore')!
    near(aurore.accentText, '#F2DFAF')
    near(aurore.onAccent, '#10151C')

    const light = groundAccent('#2F6FDB', 'light')!
    near(light.accentText, '#2A62BE')
    near(light.onAccent, '#10151C')
    expect(light.onAccentContrast).toBeCloseTo(3.85, 2)
    expect(light.holds).toBe(false)
  })

  it('holds on every ambiance that brings its own accent: 3:1 for its edge, 4.5:1 for its ink', () => {
    const own = Object.entries(GROUND_AMBIANCES).filter(([, ambiance]) => 'accent' in ambiance)
    expect(own.length).toBeGreaterThan(0)
    for (const [name, ambiance] of own) {
      const tone = groundAccent((ambiance as { accent: string }).accent, ambiance)!
      expect(tone.edge, name).toBeGreaterThanOrEqual(3)
      expect(tone.onAccentContrast, name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('gives the properties that the generated ambiance-dore poses, to the character', () => {
    const block = GROUNDS.slice(GROUNDS.indexOf('@mixin ambiance-dore'))
    const tone = groundAccent(GROUND_AMBIANCES.dore.accent, 'dore')!
    for (const [name, value] of Object.entries(tone.properties)) {
      expect(block).toContain(`${name}: ${value};`)
    }
  })

  it('poses the accent the components read: its roles, a colour each', () => {
    expect(Object.keys(groundAccent('#2F6FDB', 'dark')!.properties)).toEqual([
      '--gbt-ground-accent',
      '--gbt-ground-accent-text',
      '--gbt-ground-on-accent',
      '--gbt-ground-selected-fill',
    ])
    expect(groundAccent('#2f6fdb', 'dark')!.properties['--gbt-ground-selected-fill']).toBe(
      'rgba(47, 111, 219, 0.16)',
    )
  })

  it("takes an application's own ambiance, and the same values as by Gabarit's name", () => {
    const own = { ...GROUND_AMBIANCES.givre }
    expect(groundAccent('#B8862B', own)).toEqual(groundAccent('#B8862B', 'givre'))
  })

  it('refuses what is not a colour #RRGGBB, and an ambiance it does not know', () => {
    expect(() => groundAccent('gold', 'dore')).toThrow(/#RRGGBB/)
    expect(() => groundAccent('#E9C979', 'nowhere' as never)).toThrow(/no ambiance/)
  })

  it('has no veil to offer an ambiance whose ink cannot hold', () => {
    const blank = { ...GROUND_AMBIANCES.light, stops: ['#10151C', '#10151C'], glass: '#10151C' }
    expect(groundAccent('#2F6FDB', blank)).toBeNull()
  })

  it('reads the values of tokens/gabarit.json (ground-tokens.ts is generated from it)', () => {
    expect(Object.keys(GROUND_AMBIANCES)).toEqual(Object.keys(TOKENS.ground.ambiances))
    expect(GROUND_RULE.step).toBe(TOKENS.ground.accent.step)
    expect(GROUND_RULE.prominent).toBe(TOKENS.glass.control.prominent)
    expect(GROUND_KINDS.tinted.thick).toBe(TOKENS.glass.kinds.tinted.thick)
  })
})
