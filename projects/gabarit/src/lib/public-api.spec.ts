import * as api from '../public-api'

describe('public surface', () => {
  it('exports the base components and the icon registry', () => {
    for (const name of [
      'AppShell',
      'Button',
      'Card',
      'Checkbox',
      'Icon',
      'IconRegistry',
      'GbtInput',
      'Menu',
      'Modal',
      'SearchBar',
      'Select',
      'Tab',
      'Table',
      'Tabs',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exposes the version', () => {
    expect(api.GABARIT_VERSION).toBe('0.1.0')
  })

  it('exports the twelve dataviz primitives', () => {
    for (const name of [
      'linearScale',
      'timeScale',
      'bandScale',
      'niceTicks',
      'timeTicks',
      'formatNumber',
      'formatCompact',
      'formatDuration',
      'formatPercent',
      'linePath',
      'areaPath',
      'nearestIndex',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the chart base and its five building blocks', () => {
    for (const name of [
      'ChartFrame',
      'ChartAxis',
      'ChartTooltip',
      'ChartLegend',
      'ChartEmpty',
      'ChartTable',
      'CHART_CONTEXT',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it("exports PointValue, the type of pointValues' x-values", () => {
    const verified: import('../public-api').PointValue = 0
    expect(verified).toBe(0)
  })

  it("doesn't expose the mutable context class", () => {
    expect(api).not.toHaveProperty('ChartContext')
  })

  it('exports the three cartesian charts and their traces', () => {
    for (const name of [
      'LineChart',
      'BarChart',
      'TimelineChart',
      'LineSeries',
      'BarSeries',
      'TimelineSeries',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the four standalone charts', () => {
    for (const name of ['Sparkline', 'GaugeBar', 'DimensionCard', 'FunnelChart']) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the two rounded-domain calculations', () => {
    for (const name of ['niceXDomain', 'niceYDomain']) {
      expect(api).toHaveProperty(name)
    }
  })
})
