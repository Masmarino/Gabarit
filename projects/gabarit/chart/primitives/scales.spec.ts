import { linearScale, timeScale, bandScale } from './scales'

describe('linearScale', () => {
  it('projects the domain onto the range', () => {
    const scale = linearScale([0, 100], [0, 500])
    expect(scale.map(0)).toBe(0)
    expect(scale.map(50)).toBe(250)
    expect(scale.map(100)).toBe(500)
  })

  it('projects an inverted range — a y-axis grows upward, i.e. toward decreasing y', () => {
    const scale = linearScale([0, 10], [200, 0])
    expect(scale.map(0)).toBe(200)
    expect(scale.map(10)).toBe(0)
    expect(scale.map(5)).toBe(100)
  })

  it('extrapolates outside the domain rather than clamping', () => {
    const scale = linearScale([0, 10], [0, 100])
    expect(scale.map(15)).toBe(150)
    expect(scale.map(-5)).toBe(-50)
  })

  it('inverts the projection', () => {
    const scale = linearScale([0, 100], [0, 500])
    expect(scale.invert(250)).toBe(50)
    expect(scale.invert(0)).toBe(0)
  })

  it('for a flat domain, projects to the start of the range without dividing by zero', () => {
    const scale = linearScale([7, 7], [0, 300])
    expect(scale.map(7)).toBe(0)
    expect(Number.isFinite(scale.map(7))).toBe(true)
  })

  it('exposes its domain and range', () => {
    const scale = linearScale([1, 2], [3, 4])
    expect(scale.domain).toEqual([1, 2])
    expect(scale.range).toEqual([3, 4])
  })
})

describe('timeScale', () => {
  const start = new Date('2026-01-01T00:00:00Z')
  const end = new Date('2026-01-02T00:00:00Z')

  it('projects a date onto the range', () => {
    const scale = timeScale([start, end], [0, 240])
    expect(scale.map(start)).toBe(0)
    expect(scale.map(end)).toBe(240)
    expect(scale.map(new Date('2026-01-01T12:00:00Z'))).toBe(120)
  })

  it('inverts back to a Date', () => {
    const scale = timeScale([start, end], [0, 240])
    expect(scale.invert(120).toISOString()).toBe('2026-01-01T12:00:00.000Z')
  })
})

describe('bandScale', () => {
  it('distributes bands across the range', () => {
    const scale = bandScale(['a', 'b', 'c'], [0, 300])
    expect(scale.bandwidth).toBe(100)
    expect(scale.map('a')).toBe(0)
    expect(scale.map('b')).toBe(100)
    expect(scale.map('c')).toBe(200)
  })

  it('reserves padding between bands', () => {
    const scale = bandScale(['a', 'b'], [0, 200], 0.2)

    expect(scale.bandwidth).toBe(80)
    expect(scale.map('a')).toBe(0)
    expect(scale.map('b')).toBe(100)
  })

  it('inverts a pixel back to its category', () => {
    const scale = bandScale(['a', 'b', 'c'], [0, 300])
    expect(scale.invert(50)).toBe('a')
    expect(scale.invert(150)).toBe('b')
    expect(scale.invert(299)).toBe('c')
  })

  it('returns no category outside the range', () => {
    const scale = bandScale(['a', 'b'], [0, 200])
    expect(scale.invert(-1)).toBeNull()
    expect(scale.invert(999)).toBeNull()
  })

  it("for an empty domain, doesn't divide by zero", () => {
    const scale = bandScale([], [0, 300])
    expect(scale.bandwidth).toBe(0)
    expect(scale.invert(10)).toBeNull()
  })

  it('for an unknown category, projects nowhere rather than onto the first band', () => {
    const scale = bandScale(['a', 'b'], [0, 100])
    expect(scale.map('inexistante')).toBeNaN()

    expect(scale.map('a')).toBe(0)
  })

  it('clamps padding rather than producing a negative width', () => {
    expect(bandScale(['a', 'b'], [0, 200], 1.5).bandwidth).toBe(0)
    expect(bandScale(['a', 'b'], [0, 200], -1).bandwidth).toBe(100)
  })
})
