import { nearestIndex } from './nearest'

describe('nearestIndex', () => {
  const values = [0, 10, 20, 30, 40]

  it.each([
    [0, 0],
    [4, 0],
    [6, 1],
    [10, 1],
    [24, 2],
    [26, 3],
    [40, 4],
  ])('nearestIndex(…, %d) returns index %d', (target, expected) => {
    expect(nearestIndex(values, target)).toBe(expected)
  })

  it('for an empty array, returns no index rather than zero', () => {
    expect(nearestIndex([], 5)).toBe(-1)
  })

  it('for a single element, always returns its index', () => {
    expect(nearestIndex([7], -100)).toBe(0)
    expect(nearestIndex([7], 100)).toBe(0)
  })

  it('clamps at the ends rather than extrapolating', () => {
    expect(nearestIndex(values, -999)).toBe(0)
    expect(nearestIndex(values, 999)).toBe(4)
  })

  it('exactly halfway between two values, keeps the smaller one', () => {
    expect(nearestIndex(values, 15)).toBe(1)
    expect(nearestIndex(values, 25)).toBe(2)
  })

  it('stays correct on a large array', () => {
    const big = Array.from({ length: 100000 }, (_, i) => i * 3)
    expect(nearestIndex(big, 149999)).toBe(50000)
  })
})
