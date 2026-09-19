import { arcPath, areaPath, linePath } from './path'

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

describe('arcPath', () => {
  it('renders a pie slice (no inner radius) as a wedge from the center', () => {
    expect(
      arcPath({ startAngle: 0, endAngle: Math.PI / 2, innerRadius: 0, outerRadius: 10 }),
    ).toBe('M0,0L0,-10A10,10 0 0,1 10,0Z')
  })

  it('renders a donut slice (inner radius > 0) as an annular sector', () => {
    expect(
      arcPath({ startAngle: 0, endAngle: Math.PI / 2, innerRadius: 5, outerRadius: 10 }),
    ).toBe('M0,-10A10,10 0 0,1 10,0L5,0A5,5 0 0,0 0,-5Z')
  })

  it('sets the large-arc flag once the slice spans more than a half-circle', () => {
    const smallArc = arcPath({
      startAngle: 0,
      endAngle: Math.PI,
      innerRadius: 0,
      outerRadius: 10,
    })
    const largeArc = arcPath({
      startAngle: 0,
      endAngle: (Math.PI * 3) / 2,
      innerRadius: 0,
      outerRadius: 10,
    })
    expect(smallArc).toContain('0 0,1')
    expect(largeArc).toContain('0 1,1')
  })

  it('splits a full circle into two halves rather than a degenerate zero-length arc', () => {
    const path = arcPath({ startAngle: 0, endAngle: Math.PI * 2, innerRadius: 0, outerRadius: 10 })
    expect(path.split('M').length - 1).toBe(2)
    expect(path).toBe(
      arcPath({ startAngle: 0, endAngle: Math.PI, innerRadius: 0, outerRadius: 10 }) +
        arcPath({ startAngle: Math.PI, endAngle: Math.PI * 2, innerRadius: 0, outerRadius: 10 }),
    )
  })

  it('renders an empty string for a zero-span arc', () => {
    expect(arcPath({ startAngle: 0.5, endAngle: 0.5, innerRadius: 0, outerRadius: 10 })).toBe('')
  })

  it('rounds coordinates to avoid bloating the DOM', () => {
    const path = arcPath({
      startAngle: 0,
      endAngle: Math.PI / 3,
      innerRadius: 0,
      outerRadius: 10,
    })
    expect(path).not.toMatch(/\.\d{3,}/)
  })
})
