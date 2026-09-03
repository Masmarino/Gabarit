import { niceTicks, timeTicks } from './ticks'

describe('niceTicks', () => {
  it.each([
    [0, 97, 5, [0, 20, 40, 60, 80, 100]],
    [0, 1, 5, [0, 0.2, 0.4, 0.6, 0.8, 1]],
    [3, 7, 4, [3, 4, 5, 6, 7]],
    [-50, 30, 4, [-60, -40, -20, 0, 20, 40]],
    [0, 0.05, 4, [0, 0.02, 0.04, 0.06]],
    [0, 1000, 1, [0, 1000]],
    [-8, -2, 3, [-8, -6, -4, -2]],
  ])('niceTicks(%d, %d, %d) donne %j', (min, max, count, expected) => {
    expect(niceTicks(min, max, count)).toEqual(expected)
  })

  it('for a flat domain, renders a single tick', () => {
    expect(niceTicks(5, 5, 5)).toEqual([5])
  })

  it('never produces accumulated floating-point drift', () => {
    const ticks = niceTicks(0, 1, 5)
    expect(ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    for (const tick of ticks) {
      expect(String(tick).length).toBeLessThanOrEqual(3)
    }
  })

  it('always encloses the requested domain', () => {
    for (const [min, max] of [
      [3, 97],
      [-13, 41],
      [0.03, 0.71],
    ] as const) {
      const ticks = niceTicks(min, max, 5)
      expect(ticks[0]).toBeLessThanOrEqual(min)
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max)
    }
  })

  it('renders evenly spaced ticks', () => {
    const ticks = niceTicks(0, 97, 5)
    const gaps = ticks.slice(1).map((t, i) => t - ticks[i])
    expect(new Set(gaps).size).toBe(1)
  })

  it('reorders inverted bounds rather than rendering an empty axis', () => {
    expect(niceTicks(10, 5, 5)).toEqual(niceTicks(5, 10, 5))
    expect(niceTicks(10, 5, 5).length).toBeGreaterThan(0)
  })
})

describe('timeTicks', () => {
  const at = (iso: string) => new Date(iso)

  it('picks hours over a wide day', () => {
    const result = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-01-02T00:00:00Z'), 800)
    expect(result.unit).toBe('hour')
    expect(result.values.length).toBeLessThanOrEqual(Math.floor(800 / 60))
  })

  it('picks days over a month', () => {
    const result = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-02-01T00:00:00Z'), 600)
    expect(result.unit).toBe('day')
  })

  it('picks months over two years', () => {
    const result = timeTicks(at('2026-01-01T00:00:00Z'), at('2028-01-01T00:00:00Z'), 600)
    expect(result.unit).toBe('month')
  })

  it('on a narrow width, widens the granularity rather than crowding ticks', () => {
    const large = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-01-02T00:00:00Z'), 800)
    const etroit = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-01-02T00:00:00Z'), 200)
    expect(etroit.values.length).toBeLessThan(large.values.length)
  })

  it('never renders more ticks than the width can hold', () => {
    for (const width of [120, 300, 600, 1200]) {
      const result = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-06-01T00:00:00Z'), width)
      expect(result.values.length).toBeLessThanOrEqual(Math.max(2, Math.floor(width / 60)))
    }
  })

  it('respects the budget even when both bounds fall on a tick', () => {
    for (const width of [120, 200, 400, 900]) {
      const result = timeTicks(at('2026-03-01T00:00:00Z'), at('2026-03-04T00:00:00Z'), width)
      expect(result.values.length, `width ${width}, unit ${result.unit}`).toBeLessThanOrEqual(
        Math.max(2, Math.floor(width / 60)),
      )
    }
  })

  it('never produces two identical consecutive labels, across every granularity', () => {
    for (const days of [0.01, 0.5, 3, 40, 150, 900, 5000]) {
      for (const width of [120, 200, 400, 600, 900, 1200]) {
        for (const offset of [0, 17, 43, 71]) {
          const start = new Date(Date.UTC(2021, 0, 1 + offset))
          const end = new Date(start.getTime() + days * 86400000)
          const result = timeTicks(start, end, width)
          const labels = result.values.map((v) => result.format(v, 'fr-FR'))
          for (let i = 1; i < labels.length; i++) {
            expect(
              labels[i],
              `${days} d, ${width} px, offset ${offset}, unit ${result.unit}`,
            ).not.toBe(labels[i - 1])
          }
        }
      }
    }
  })

  it('respects the budget across every granularity, fallback included', () => {
    for (const days of [0.01, 0.5, 3, 40, 150, 900, 5000, 70000]) {
      for (const width of [120, 200, 400, 600, 900, 1200]) {
        const start = new Date(Date.UTC(2021, 0, 1))
        const end = new Date(start.getTime() + days * 86400000)
        const result = timeTicks(start, end, width)
        expect(
          result.values.length,
          `${days} d, ${width} px, unit ${result.unit}`,
        ).toBeLessThanOrEqual(Math.max(2, Math.floor(width / 60)))
      }
    }
  })

  it('places monthly ticks on the first of the month', () => {
    const result = timeTicks(at('2021-04-03T00:00:00Z'), at('2021-08-31T00:00:00Z'), 600)
    expect(result.unit).toBe('month')
    for (const value of result.values) {
      expect(value.getUTCDate()).toBe(1)
      expect(value.getUTCHours()).toBe(0)
    }
  })

  it('formats according to the received granularity and locale', () => {
    const jour = timeTicks(at('2026-01-01T00:00:00Z'), at('2026-02-01T00:00:00Z'), 600)
    expect(jour.format(at('2026-01-15T00:00:00Z'), 'fr-FR')).toMatch(/15/)
  })

  it('for a zero interval, renders a single tick', () => {
    const meme = at('2026-01-01T00:00:00Z')
    expect(timeTicks(meme, meme, 600).values).toHaveLength(1)
  })
})
