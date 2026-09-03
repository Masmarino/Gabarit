import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BarChart } from './bar-chart'
import type { ChartSeries } from '../chart-data/chart-data'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [BarChart],
  template: `
    <gbt-bar-chart
      label="Dépôts par format"
      locale="fr-FR"
      [size]="{ width: 600, height: 300 }"
      [series]="series()"
      emptyMessage="Aucun dépôt."
      tableCaption="Dépôts par format"
      xColumn="Format"
      [heading]="heading()"
      [headingLevel]="headingLevel()"
      [headline]="headline()"
      [trend]="trend()"
    />
  `,
})
class HostComponent {
  series = signal<ChartSeries<string>>({
    label: 'Dépôts',
    points: [
      { x: 'maven', y: 12 },
      { x: 'npm', y: 30 },
      { x: 'docker', y: 7 },
    ],
  })
  heading = signal('')
  headingLevel = signal<1 | 2 | 3 | 4 | 5 | 6>(2)
  headline = signal('')
  trend = signal('')
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('BarChart', () => {
  it('draws one bar per category', () => {
    expect(setup().nativeElement.querySelectorAll('.gbt-bar-series__bar').length).toBe(3)
  })

  it('gives each bar a height proportional to its value', () => {
    const bars = [...setup().nativeElement.querySelectorAll('.gbt-bar-series__bar')]
    const heights = bars.map((b: SVGRectElement) => Number(b.getAttribute('height')))

    expect(heights[0]).toBeCloseTo(100.8, 1)
    expect(heights[1]).toBeCloseTo(252, 1)
    expect(heights[2]).toBeCloseTo(58.8, 1)
  })

  it("distributes the bars across the base's usable width", () => {
    const bars = [...setup().nativeElement.querySelectorAll('.gbt-bar-series__bar')]
    const width = Number(bars[0].getAttribute('width'))

    expect(width).toBeCloseTo((544 / 3) * 0.8, 1)
  })

  it('shows no legend', () => {
    expect(setup().nativeElement.querySelector('gbt-chart-legend')).toBeNull()
  })

  it('exposes its data as a visually-hidden table', () => {
    const table = setup().nativeElement.querySelector('gbt-chart-table table')
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Format', 'Dépôts'])
    expect(table.querySelectorAll('tbody tr').length).toBe(3)
    const rows = [...table.querySelectorAll('tbody tr')].map((tr: HTMLTableRowElement) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    )
    expect(rows).toEqual([
      ['maven', '12'],
      ['npm', '30'],
      ['docker', '7'],
    ])
  })

  it('shows the empty state and no bar when there is no data', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({ label: 'Dépôts', points: [] })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucun dépôt.')
    expect(fixture.nativeElement.querySelector('.gbt-bar-series__bar')).toBeNull()
  })

  it('drops a negative bar below the zero line', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({
      label: 'Écart',
      points: [
        { x: 'perte', y: -10 },
        { x: 'gain', y: 30 },
        { x: 'faible', y: 7 },
      ],
    })
    fixture.detectChanges()
    const bars = [...fixture.nativeElement.querySelectorAll('.gbt-bar-series__bar')]
    const readValues = bars.map((b: SVGRectElement) => ({
      y: Number(b.getAttribute('y')),
      height: Number(b.getAttribute('height')),
    }))

    expect(readValues[0].y).toBeCloseTo(189, 1)
    expect(readValues[0].height).toBeCloseTo(63, 1)
    expect(readValues[1].y).toBeCloseTo(0, 1)
    expect(readValues[1].height).toBeCloseTo(189, 1)
    for (const bar of readValues) {
      expect(bar.height).toBeGreaterThanOrEqual(0)
    }
  })

  it('always starts bars from zero', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({
      label: 'Dépôts',
      points: [
        { x: 'a', y: 12 },
        { x: 'b', y: 30 },
        { x: 'c', y: 7 },
      ],
    })
    fixture.detectChanges()
    const bars = [...fixture.nativeElement.querySelectorAll('.gbt-bar-series__bar')]
    const bottoms = bars.map(
      (b: SVGRectElement) => Number(b.getAttribute('y')) + Number(b.getAttribute('height')),
    )

    expect(new Set(bottoms.map((v) => Math.round(v))).size).toBe(1)
    expect(bottoms[0]).toBeCloseTo(252, 1)
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('relays the heading to the base', () => {
    const fixture = setup()
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.componentInstance.headline.set('388 Gio')
    fixture.componentInstance.trend.set('+8,4 % sur 7 jours')
    fixture.detectChanges()

    const header: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__header')
    expect(header).not.toBeNull()
    expect(header.textContent).toContain('Stockage des registres')
    expect(header.textContent).toContain('388 Gio')
    expect(header.textContent).toContain('+8,4 % sur 7 jours')
  })

  it('renders no header when no title is relayed', () => {
    const fixture = setup()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-chart-frame__header')).toBeNull()
  })

  it('relays the requested heading level', () => {
    const fixture = setup()
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.componentInstance.headingLevel.set(3)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h3.gbt-chart-frame__title')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('h2.gbt-chart-frame__title')).toBeNull()
  })
})
