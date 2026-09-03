import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { LineChart } from './line-chart'
import type { ChartSeries } from '../chart-data/chart-data'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [LineChart],
  template: `
    <gbt-line-chart
      label="Requêtes par heure"
      locale="fr-FR"
      xKind="linear"
      [size]="{ width: 600, height: 300 }"
      [series]="series()"
      [area]="area()"
      [yZero]="yZero()"
      emptyMessage="Aucune donnée."
      tableCaption="Requêtes par heure"
      xColumn="Heure"
      [heading]="heading()"
      [headingLevel]="headingLevel()"
      [headline]="headline()"
      [trend]="trend()"
    />
  `,
})
class HostComponent {
  series = signal<ChartSeries<number>[]>([
    {
      label: 'Requêtes',
      points: [
        { x: 0, y: 10 },
        { x: 1, y: 30 },
        { x: 2, y: 20 },
      ],
    },
  ])

  area = signal(false)
  yZero = signal(true)
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

describe('LineChart', () => {
  it('draws one line per series', () => {
    const paths = setup().nativeElement.querySelectorAll('.gbt-line-series__line')
    expect(paths.length).toBe(1)
    expect(paths[0].getAttribute('d')).toMatch(/^M[\d.]+,[\d.]+L/)
  })

  it('draws as many lines as series, with distinct dash patterns', () => {
    const fixture = setup()

    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        pattern: 'dotted',
      },
      {
        label: 'B',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 1 },
        ],
        pattern: 'solid',
      },
    ])
    fixture.detectChanges()
    const dashes = [...fixture.nativeElement.querySelectorAll('.gbt-line-series__line')].map(
      (p: SVGPathElement) => p.getAttribute('stroke-dasharray'),
    )
    expect(dashes).toEqual(['1 3', 'none'])
  })

  it("projects points within the base's usable box", () => {
    const d = setup().nativeElement.querySelector('.gbt-line-series__line').getAttribute('d')

    expect(d).toContain('M0,')
    expect(d).toContain('L544,')
  })

  it('sets a distinct series color per index', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      { label: 'A', points: [{ x: 0, y: 1 }] },
      { label: 'B', points: [{ x: 0, y: 2 }] },
    ])
    fixture.detectChanges()
    const indices = [...fixture.nativeElement.querySelectorAll('.gbt-line-series__line')].map(
      (p: SVGPathElement) => p.getAttribute('data-series'),
    )
    expect(indices).toEqual(['1', '2'])
  })

  it('shows no legend for a single series', () => {
    expect(setup().nativeElement.querySelector('gbt-chart-legend')).toBeNull()
  })

  it('shows a legend as soon as there is more than one series', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      { label: 'A', points: [{ x: 0, y: 1 }] },
      { label: 'B', points: [{ x: 0, y: 2 }] },
    ])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('gbt-chart-legend')).not.toBeNull()
  })

  it("the legend carries the last value at rest, and the active point's value on hover", () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 30 },
        ],
      },
      {
        label: 'B',
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
        ],
      },
    ])
    fixture.detectChanges()

    const valeursLegende = () =>
      [...fixture.nativeElement.querySelectorAll('.gbt-chart-legend__value')].map(
        (n: HTMLElement) => n.textContent?.trim(),
      )

    expect(valeursLegende()).toEqual(['30', '3'])

    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()

    expect(valeursLegende()).toEqual(['10', '1'])
    expect(valeursLegende()).not.toEqual(['30', '3'])

    fixture.componentInstance.series.set([
      { label: 'A', points: [{ x: 0, y: 10, display: '10 Gio' }] },
      { label: 'B', points: [{ x: 0, y: 1, display: '1 Gio' }] },
    ])
    fixture.detectChanges()
    expect(valeursLegende()).toEqual(['10 Gio', '1 Gio'])
  })

  it('exposes its data as a visually-hidden table', () => {
    const table = setup().nativeElement.querySelector('gbt-chart-table table')
    expect(table).not.toBeNull()
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Heure', 'Requêtes'])
    expect(table.querySelectorAll('tbody tr').length).toBe(3)
  })

  it('shows the empty state and no line when there is no data', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucune donnée.')
    expect(fixture.nativeElement.querySelector('.gbt-line-series__line')).toBeNull()
  })

  it('draws no area until requested', () => {
    expect(setup().nativeElement.querySelector('.gbt-line-series__area')).toBeNull()
  })

  it('keeps non-round x-axis labels within the frame', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'Requêtes',
        points: [3, 17, 29, 44, 58, 71, 97].map((x, i) => ({
          x,
          y: [12, 40, 28, 63, 51, 90, 74][i],
        })),
      },
    ])
    fixture.detectChanges()
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const positions = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      Number(t.getAttribute('x')),
    )

    expect(positions.length).toBeGreaterThan(1)
    for (const x of positions) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(544)
    }

    expect(Math.min(...positions)).toBeCloseTo(0, 6)
    expect(Math.max(...positions)).toBeCloseTo(544, 6)
  })

  it('distinguishes series even when no pattern is declared', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
      },
      {
        label: 'B',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 1 },
        ],
      },
      {
        label: 'C',
        points: [
          { x: 0, y: 3 },
          { x: 1, y: 3 },
        ],
      },
    ])
    fixture.detectChanges()
    const strokes = [...fixture.nativeElement.querySelectorAll('.gbt-line-series__line')].map(
      (p: SVGPathElement) => p.getAttribute('stroke-dasharray'),
    )
    expect(strokes.length).toBe(3)
    expect(new Set(strokes).size).toBe(3)
  })

  it('gives the legend the same patterns as the lines', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
      },
      {
        label: 'B',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 1 },
        ],
      },
      {
        label: 'C',
        points: [
          { x: 0, y: 3 },
          { x: 1, y: 3 },
        ],
      },
    ])
    fixture.detectChanges()
    const lines = [...fixture.nativeElement.querySelectorAll('.gbt-line-series__line')].map(
      (p: SVGPathElement) => p.getAttribute('stroke-dasharray'),
    )
    const legend = [...fixture.nativeElement.querySelectorAll('.gbt-chart-legend__line')].map(
      (l: SVGLineElement) => l.getAttribute('stroke-dasharray'),
    )
    expect(legend).toEqual(lines)
  })

  it('aligns series on their actual x-values, not their rank', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 2, y: 30 },
        ],
      },
      { label: 'B', points: [{ x: 1, y: 99 }] },
    ])
    fixture.detectChanges()
    const rows = [...fixture.nativeElement.querySelectorAll('gbt-chart-table tbody tr')].map(
      (tr: HTMLTableRowElement) =>
        [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    )

    expect(rows.length).toBe(3)
    expect(rows.map((l) => l[0])).toEqual(['0', '1', '2'])
    expect(rows.map((l) => l[1])).toEqual(['10', '—', '30'])
    expect(rows[1][2]).toBe('99')
    expect(rows[0][2]).toBe('—')
    expect(rows[2][2]).toBe('—')
  })

  it('makes one position per x-value navigable, across all series', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 2, y: 30 },
        ],
      },
      { label: 'B', points: [{ x: 1, y: 99 }] },
    ])
    fixture.detectChanges()
    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    surface.focus()

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    fixture.detectChanges()

    const tooltip = fixture.nativeElement.querySelector('.gbt-chart-tooltip__panel')
    expect(tooltip).not.toBeNull()
    expect(tooltip.textContent).toContain('99')
    expect(tooltip.textContent).not.toContain('30')
  })

  it('closes the area on the zero line, not the bottom of the box', () => {
    @Component({
      standalone: true,
      imports: [LineChart],
      template: `
        <gbt-line-chart
          label="Écart"
          locale="fr-FR"
          xKind="linear"
          [area]="true"
          [size]="{ width: 600, height: 300 }"
          [series]="[
            {
              label: 'Écart',
              points: [
                { x: 0, y: -10 },
                { x: 1, y: 30 },
              ],
            },
          ]"
          emptyMessage="Aucune donnée."
          tableCaption="Écart"
          xColumn="Heure"
        />
      `,
    })
    class AreaHost {}

    const fixture = TestBed.createComponent(AreaHost)
    fixture.detectChanges()
    const d = fixture.nativeElement.querySelector('.gbt-line-series__area').getAttribute('d')

    const closingYCoordinates = [...d.matchAll(/L[\d.-]+,([\d.-]+)/g)]
      .map((m: RegExpMatchArray) => Number(m[1]))
      .slice(-2)

    expect(closingYCoordinates).toEqual([189, 189])
  })

  it("closes the area within the box, even when the domain doesn't contain zero", () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 1, y: 30 },
          { x: 2, y: 20 },
        ],
      },
    ])
    fixture.componentInstance.area.set(true)
    fixture.componentInstance.yZero.set(false)
    fixture.detectChanges()
    const d = fixture.nativeElement.querySelector('.gbt-line-series__area').getAttribute('d')
    const yCoordinates = [...d.matchAll(/,(-?[\d.]+)/g)].map((m: RegExpMatchArray) => Number(m[1]))
    const hauteurUtile = 300 - 16 - 32
    expect(yCoordinates.length).toBeGreaterThan(3)
    for (const y of yCoordinates) {
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(hauteurUtile)
    }
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('shows the pre-formatted value in the tooltip when it exists', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      {
        label: 'Docker',
        points: [
          { x: 0, y: 276_048_855_040, display: '257 Gio' },
          { x: 1, y: 289_910_292_480, display: '270 Gio' },
        ],
      },
    ])
    fixture.detectChanges()
    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    const tooltip = fixture.nativeElement.querySelector('.gbt-chart-tooltip__panel')
    expect(tooltip.textContent).toContain('257 Gio')
    expect(tooltip.textContent).not.toContain('276')
  })

  it('uses the same string in the non-visual table', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([
      { label: 'Docker', points: [{ x: 0, y: 276_048_855_040, display: '257 Gio' }] },
    ])
    fixture.detectChanges()
    const cells = [...fixture.nativeElement.querySelectorAll('gbt-chart-table tbody td')].map(
      (c: HTMLElement) => c.textContent?.trim(),
    )
    expect(cells).toContain('257 Gio')
  })

  it('falls back to locale formatting when nothing is provided', () => {
    const fixture = setup()
    fixture.componentInstance.series.set([{ label: 'A', points: [{ x: 0, y: 1234 }] }])
    fixture.detectChanges()
    const cells = [...fixture.nativeElement.querySelectorAll('gbt-chart-table tbody td')].map(
      (c: HTMLElement) => c.textContent?.replace(/\s/g, ' ').trim(),
    )
    expect(cells).toContain('1 234')
  })

  it('relays the heading to the base', () => {
    const fixture = setup()
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.componentInstance.headline.set('388 Gio')
    fixture.componentInstance.trend.set('+8,4 % sur 7 jours')
    fixture.detectChanges()

    const entete: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__header')
    expect(entete).not.toBeNull()
    expect(entete.textContent).toContain('Stockage des registres')
    expect(entete.textContent).toContain('388 Gio')
    expect(entete.textContent).toContain('+8,4 % sur 7 jours')
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
