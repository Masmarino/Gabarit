import { niceTicks } from '../../../primitives'
import {
  longestSeriesLength,
  niceXDomain,
  niceYDomain,
  numericXDomain,
  timeXDomain,
  yDomain,
  type ChartSeries,
} from './chart-data'

const serie = (label: string, ys: number[]): ChartSeries<number> => ({
  label,
  points: ys.map((y, i) => ({ x: i, y })),
})

describe('yDomain', () => {
  it('covers every series, not just the first', () => {
    expect(yDomain([serie('a', [1, 5]), serie('b', [-3, 9])], false)).toEqual([-3, 9])
  })

  it('extends down to zero when requested', () => {
    expect(yDomain([serie('a', [10, 20])], true)).toEqual([0, 20])
  })

  it('extends downward when values are negative', () => {
    expect(yDomain([serie('a', [-10, -2])], true)).toEqual([-10, 0])
  })

  it("doesn't clamp when not requested", () => {
    expect(yDomain([serie('a', [10, 20])], false)).toEqual([10, 20])
  })

  it('for no series, returns a unit interval rather than an empty domain', () => {
    expect(yDomain([], true)).toEqual([0, 1])
    expect(yDomain([{ label: 'vide', points: [] }], true)).toEqual([0, 1])
  })

  it('for a single value, returns a non-flat domain', () => {
    const [min, max] = yDomain([serie('a', [7])], false)
    expect(max).toBeGreaterThan(min)
  })
})

describe('numericXDomain', () => {
  it('covers the x-values of every series', () => {
    const a: ChartSeries<number> = {
      label: 'a',
      points: [
        { x: 5, y: 0 },
        { x: 9, y: 0 },
      ],
    }
    const b: ChartSeries<number> = { label: 'b', points: [{ x: 1, y: 0 }] }
    expect(numericXDomain([a, b])).toEqual([1, 9])
  })

  it('for no points, returns a unit interval', () => {
    expect(numericXDomain([])).toEqual([0, 1])
  })
})

describe('timeXDomain', () => {
  it('covers the instants of every series', () => {
    const a: ChartSeries<Date> = {
      label: 'a',
      points: [
        { x: new Date('2026-03-02T00:00:00Z'), y: 0 },
        { x: new Date('2026-03-05T00:00:00Z'), y: 0 },
      ],
    }
    const [debut, fin] = timeXDomain([a])
    expect(debut.toISOString()).toBe('2026-03-02T00:00:00.000Z')
    expect(fin.toISOString()).toBe('2026-03-05T00:00:00.000Z')
  })

  it('for no points, returns a one-day interval ending at the epoch', () => {
    const [debut, fin] = timeXDomain([])
    expect(fin.getTime()).toBe(0)
    expect(debut.getTime()).toBe(-86400000)
  })
})

describe('longestSeriesLength', () => {
  it('returns the length of the longest series', () => {
    expect(longestSeriesLength([serie('a', [1, 2]), serie('b', [1, 2, 3, 4])])).toBe(4)
  })

  it('for no series, returns zero', () => {
    expect(longestSeriesLength([])).toBe(0)
  })
})

describe('niceYDomain', () => {
  const numberSeries = (ys: number[]): ChartSeries<number> => ({
    label: 'a',
    points: ys.map((y, i) => ({ x: i, y })),
  })

  it.each([
    [
      [0, 90],
      [0, 100],
    ],
    [
      [0, 63],
      [0, 80],
    ],
    [
      [0, 342],
      [0, 400],
    ],
  ])('rounds a data domain %j to %j', (data, expected) => {
    expect(niceYDomain([numberSeries(data)], true, 5)).toEqual(expected)
  })

  it('returns a domain whose upper bound is a tick', () => {
    const [, high] = niceYDomain([numberSeries([0, 90])], true, 5)
    const ticks = niceTicks(0, high, 5)
    expect(ticks[ticks.length - 1]).toBe(high)
  })

  it('leaves an already-round domain untouched', () => {
    expect(niceYDomain([numberSeries([12, 30, 7])], true, 5)).toEqual([0, 30])
  })
})

describe('niceXDomain', () => {
  const xValueSeries = (xs: number[]): ChartSeries<number> => ({
    label: 'a',
    points: xs.map((x) => ({ x, y: 0 })),
  })

  it.each([
    [
      [0, 63],
      [0, 80],
    ],
    [
      [3, 97],
      [0, 100],
    ],
  ])('rounds an x-value domain %j to %j', (data, expected) => {
    expect(niceXDomain([xValueSeries(data)], 5)).toEqual(expected)
  })

  it('leaves an already-round domain untouched', () => {
    expect(niceXDomain([xValueSeries([0, 6])], 5)).toEqual([0, 6])
  })

  it('returns a domain whose two bounds are both ticks', () => {
    const [low, high] = niceXDomain([xValueSeries([3, 97])], 5)
    const ticks = niceTicks(low, high, 5)
    expect(ticks[0]).toBe(low)
    expect(ticks[ticks.length - 1]).toBe(high)
  })

  it("doesn't extend the x-axis down to zero, unlike the y-axis", () => {
    expect(niceXDomain([xValueSeries([50, 60])], 5)[0]).toBeGreaterThan(0)
  })
})
