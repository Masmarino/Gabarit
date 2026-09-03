import { CHART_CONTEXT, ChartContext } from './chart-context'
import type { BandScale, Scale } from '../../../primitives'

describe('CHART_CONTEXT', () => {
  it('is the token building blocks use to read the context', () => {
    expect(CHART_CONTEXT.toString()).toContain('gbt-chart-context')
  })
})

describe('ChartContext', () => {
  const box = {
    width: 600,
    height: 300,
    margin: { top: 8, right: 8, bottom: 32, left: 48 },
    innerWidth: 544,
    innerHeight: 260,
  }

  it('builds a linear scale from a linear spec', () => {
    const ctx = new ChartContext()
    ctx.setSpecs({ kind: 'linear', domain: [0, 100] }, { kind: 'linear', domain: [0, 10] })
    ctx.setGeometry(box)
    const x = ctx.xScale() as Scale<number>
    expect(x.map(0)).toBe(0)
    expect(x.map(100)).toBe(544)
  })

  it('builds a time scale from a time spec', () => {
    const ctx = new ChartContext()
    const start = new Date('2026-01-01T00:00:00Z')
    const end = new Date('2026-01-02T00:00:00Z')
    ctx.setSpecs({ kind: 'time', domain: [start, end] }, { kind: 'linear', domain: [0, 1] })
    ctx.setGeometry(box)
    const x = ctx.xScale() as Scale<Date>
    expect(x.map(start)).toBe(0)
    expect(x.map(end)).toBe(544)
  })

  it('builds a band scale from a category spec', () => {
    const ctx = new ChartContext()
    ctx.setSpecs(
      { kind: 'band', domain: ['a', 'b'], padding: 0.2 },
      { kind: 'linear', domain: [0, 1] },
    )
    ctx.setGeometry(box)
    const x = ctx.xScale() as BandScale
    expect(x.map('a')).toBe(0)
    expect(x.bandwidth).toBeCloseTo((544 / 2) * 0.8, 5)
  })

  it('inverts the y-axis', () => {
    const ctx = new ChartContext()
    ctx.setSpecs({ kind: 'linear', domain: [0, 100] }, { kind: 'linear', domain: [0, 100] })
    ctx.setGeometry(box)
    expect(ctx.yScale().map(100)).toBe(0)
    expect(ctx.yScale().map(0)).toBe(260)
  })

  it('recomputes its scales when the geometry changes', () => {
    const ctx = new ChartContext()
    ctx.setSpecs({ kind: 'linear', domain: [0, 100] }, { kind: 'linear', domain: [0, 1] })
    ctx.setGeometry(box)
    ctx.setGeometry({ ...box, innerWidth: 1000 })
    expect((ctx.xScale() as Scale<number>).map(100)).toBe(1000)
  })

  it('publishes and clears the active index', () => {
    const ctx = new ChartContext()
    expect(ctx.activeIndex()).toBeNull()
    ctx.setActiveIndex(3)
    expect(ctx.activeIndex()).toBe(3)
    ctx.setActiveIndex(null)
    expect(ctx.activeIndex()).toBeNull()
  })
})
