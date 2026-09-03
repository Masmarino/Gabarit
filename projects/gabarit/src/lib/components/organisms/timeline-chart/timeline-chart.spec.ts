import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TimelineChart } from './timeline-chart'
import type { ChartInterval, ChartSeries } from '../chart-data/chart-data'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

const at = (iso: string) => new Date(iso)

@Component({
  standalone: true,
  imports: [TimelineChart],
  template: `
    <gbt-timeline-chart
      label="Activité et incidents"
      locale="fr-FR"
      [size]="{ width: 900, height: 300 }"
      [series]="series()"
      [intervals]="intervals()"
      emptyMessage="Aucune activité."
      tableCaption="Activité par heure"
      intervalsCaption="Incidents"
      xColumn="Heure"
      [heading]="heading()"
      [headingLevel]="headingLevel()"
      [headline]="headline()"
      [trend]="trend()"
    />
  `,
})
class HostComponent {
  series = signal<ChartSeries<Date>>({
    label: 'Requêtes',
    points: [
      { x: at('2026-03-01T00:00:00Z'), y: 10 },
      { x: at('2026-03-01T12:00:00Z'), y: 30 },
      { x: at('2026-03-02T00:00:00Z'), y: 20 },
    ],
  })
  intervals = signal<ChartInterval[]>([
    { start: at('2026-03-01T06:00:00Z'), end: at('2026-03-01T08:00:00Z'), label: 'Panne base' },
  ])
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

describe('TimelineChart', () => {
  it('draws the activity line', () => {
    const path = setup().nativeElement.querySelector('.gbt-timeline-series__line')
    expect(path).not.toBeNull()
    expect(path.getAttribute('d')).toMatch(/^M[\d.]+,[\d.]+L/)
  })

  it('paints one band per interval', () => {
    expect(setup().nativeElement.querySelectorAll('.gbt-timeline-series__band').length).toBe(1)
  })

  it('positions the band according to the time scale', () => {
    const band = setup().nativeElement.querySelector('.gbt-timeline-series__band')

    expect(Number(band.getAttribute('x'))).toBeCloseTo(844 / 4, 0)
    expect(Number(band.getAttribute('width'))).toBeCloseTo(844 / 12, 0)
  })

  it('gives every band an outline, and a label only to bands wide enough', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      { start: at('2026-03-01T06:00:00Z'), end: at('2026-03-01T08:00:00Z'), label: 'Panne base' },
      { start: at('2026-03-01T15:00:00Z'), end: at('2026-03-01T15:30:00Z'), label: 'Pic 5xx' },
    ])
    fixture.detectChanges()

    const bands = [...fixture.nativeElement.querySelectorAll('.gbt-timeline-series__band')]
    const edges = [...fixture.nativeElement.querySelectorAll('.gbt-timeline-series__band-edge')]
    expect(bands.length).toBe(2)
    expect(edges.length).toBe(2)
    expect(Number(bands[0].getAttribute('width'))).toBeCloseTo(70.33, 1)
    expect(Number(bands[1].getAttribute('width'))).toBeCloseTo(17.58, 1)

    const labels = [
      ...fixture.nativeElement.querySelectorAll('.gbt-timeline-series__band-label'),
    ].map((t: SVGTextElement) => t.textContent?.trim())
    expect(labels).toEqual(['Panne base'])
  })

  it('hides a label longer than its band, however wide the band is', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      {
        start: at('2026-03-01T06:00:00Z'),
        end: at('2026-03-01T08:00:00Z'),
        label: 'Rétention npm — dépôts inactifs depuis plus de 90 jours',
      },
    ])
    fixture.detectChanges()

    const band = fixture.nativeElement.querySelector('.gbt-timeline-series__band')
    expect(Number(band.getAttribute('width'))).toBeGreaterThan(48)
    expect(fixture.nativeElement.querySelector('.gbt-timeline-series__band-label')).toBeNull()
  })

  it('accents only the band that contains the active point', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      { start: at('2026-03-01T10:00:00Z'), end: at('2026-03-01T14:00:00Z'), label: 'A' },

      { start: at('2026-03-01T20:00:00Z'), end: at('2026-03-01T22:00:00Z'), label: 'B' },
    ])
    fixture.detectChanges()

    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')

    const bands = () => [
      ...fixture.nativeElement.querySelectorAll('.gbt-timeline-series__band-edge'),
    ]
    const activeBands = () => bands().filter((b: SVGElement) => b.hasAttribute('data-active'))

    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    expect(activeBands().length).toBe(0)

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    fixture.detectChanges()
    expect(activeBands().length).toBe(1)
    expect(bands().indexOf(activeBands()[0])).toBe(0)

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()
    expect(activeBands().length).toBe(0)
  })

  it('places a dot on the active point, even outside any interval', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      { start: at('2026-03-01T10:00:00Z'), end: at('2026-03-01T14:00:00Z'), label: 'A' },
      { start: at('2026-03-01T20:00:00Z'), end: at('2026-03-01T22:00:00Z'), label: 'B' },
    ])
    fixture.detectChanges()

    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')

    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-timeline-series__dot').length).toBe(1)

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-timeline-series__dot').length).toBe(1)

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-timeline-series__dot')).toBeNull()
  })

  it('carries in the table the interval whose band is too narrow to be labeled', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      { start: at('2026-03-01T15:00:00Z'), end: at('2026-03-01T15:30:00Z'), label: 'Pic 5xx' },
    ])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-timeline-series__band-label')).toBeNull()
    const tables = fixture.nativeElement.querySelectorAll('gbt-chart-table table')
    expect(tables[1].textContent).toContain('Pic 5xx')
  })

  it('exposes intervals in a second non-visual table', () => {
    const tables = setup().nativeElement.querySelectorAll('gbt-chart-table table')
    expect(tables.length).toBe(2)
    const legends = [...tables].map((t: HTMLTableElement) =>
      t.querySelector('caption')?.textContent?.trim(),
    )
    expect(legends).toEqual(['Activité par heure', 'Incidents'])
    expect(tables[1].querySelectorAll('tbody tr').length).toBe(1)
    expect(tables[1].textContent).toContain('Panne base')
  })

  it('exposes the series in the first table', () => {
    const table = setup().nativeElement.querySelector('gbt-chart-table table')
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Heure', 'Requêtes'])
    expect(table.querySelectorAll('tbody tr').length).toBe(3)
  })

  it('shows the pre-formatted value in the tooltip when it exists', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({
      label: 'Durée',
      points: [
        { x: at('2026-03-01T00:00:00Z'), y: 1.5, display: '1 h 30' },
        { x: at('2026-03-01T12:00:00Z'), y: 2, display: '2 h' },
      ],
    })
    fixture.detectChanges()
    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    const tooltip = fixture.nativeElement.querySelector('.gbt-chart-tooltip__panel')
    expect(tooltip.textContent).toContain('1 h 30')
    expect(tooltip.textContent).not.toContain('1,5')
  })

  it('uses the same string in the non-visual table', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({
      label: 'Durée',
      points: [{ x: at('2026-03-01T00:00:00Z'), y: 1.5, display: '1 h 30' }],
    })
    fixture.detectChanges()
    const cells = [...fixture.nativeElement.querySelectorAll('gbt-chart-table tbody td')].map(
      (c: HTMLElement) => c.textContent?.trim(),
    )
    expect(cells).toContain('1 h 30')
    expect(cells).not.toContain('1,5')
  })

  it('shows no intervals table when there are none', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('gbt-chart-table table').length).toBe(1)
    expect(fixture.nativeElement.querySelector('.gbt-timeline-series__band')).toBeNull()
  })

  it('shows the empty state and no line when there is no data', () => {
    const fixture = setup()
    fixture.componentInstance.series.set({ label: 'Requêtes', points: [] })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucune activité.')
    expect(fixture.nativeElement.querySelector('.gbt-timeline-series__line')).toBeNull()
  })

  it('accepts two intervals carrying the same label', () => {
    const fixture = setup()
    fixture.componentInstance.intervals.set([
      { start: at('2026-03-01T06:00:00Z'), end: at('2026-03-01T08:00:00Z'), label: 'Erreur 500' },
      { start: at('2026-03-01T14:00:00Z'), end: at('2026-03-01T16:00:00Z'), label: 'Erreur 500' },
    ])
    fixture.detectChanges()
    const bands = [...fixture.nativeElement.querySelectorAll('.gbt-timeline-series__band')]
    expect(bands.length).toBe(2)

    expect(Number(bands[0].getAttribute('x'))).toBeCloseTo(844 / 4, 0)
    expect(Number(bands[1].getAttribute('x'))).toBeCloseTo((844 * 14) / 24, 0)
    const tables = fixture.nativeElement.querySelectorAll('gbt-chart-table table')
    expect(tables[1].querySelectorAll('tbody tr').length).toBe(2)
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
