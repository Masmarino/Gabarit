import { areaPath, linePath } from './path'

describe('linePath', () => {
  it('renders a path that connects the points', () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: 5, y: 20 },
        { x: 10, y: 0 },
      ]),
    ).toBe('M0,10L5,20L10,0')
  })

  it('for a single point, renders a move with no segment', () => {
    expect(linePath([{ x: 3, y: 4 }])).toBe('M3,4')
  })

  it('for no points, renders an empty string rather than an invalid path', () => {
    expect(linePath([])).toBe('')
  })

  it('rounds coordinates to avoid bloating the DOM', () => {
    expect(linePath([{ x: 0.123456, y: 9.87654 }])).toBe('M0.12,9.88')
  })
})

describe('areaPath', () => {
  it('closes the path on the baseline', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 10 },
          { x: 10, y: 0 },
        ],
        50,
      ),
    ).toBe('M0,10L10,0L10,50L0,50Z')
  })

  it('for no points, renders an empty string', () => {
    expect(areaPath([], 50)).toBe('')
  })
})
