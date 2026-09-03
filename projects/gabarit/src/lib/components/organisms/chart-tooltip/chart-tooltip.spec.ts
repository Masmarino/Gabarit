import { Component, ViewChild, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ChartTooltip, type TooltipPoint } from './chart-tooltip'
import { ChartFrame } from '../chart-frame/chart-frame'
import { ChartContext } from '../chart-context/chart-context'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ChartFrame, ChartTooltip],
  template: `
    <gbt-chart-frame
      label="Test"
      [x]="{ kind: 'linear', domain: [0, 100] }"
      [y]="{ kind: 'linear', domain: [0, 10] }"
      [size]="{ width: 600, height: 300 }"
      [pointValues]="points().map((p) => p.x)"
    >
      <svg:g gbtChartLayer><svg:rect /></svg:g>
      <gbt-chart-tooltip [points]="points()" />
    </gbt-chart-frame>
  `,
})
class HostComponent {
  readonly points = signal<TooltipPoint<number>[]>([
    { x: 0, header: '0 h', rows: [{ label: 'Requêtes', value: '12' }] },
    { x: 50, header: '1 h', rows: [{ label: 'Requêtes', value: '42' }] },
    { x: 100, header: '2 h', rows: [{ label: 'Requêtes', value: '7' }] },
  ])

  @ViewChild(ChartFrame, { read: ChartContext }) ctx!: ChartContext
}

describe('ChartTooltip', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    return fixture
  }

  function panel(fixture: ReturnType<typeof setup>): HTMLElement | null {
    return fixture.nativeElement.querySelector('.gbt-chart-tooltip__panel')
  }

  it('stays absent while no point is active', () => {
    const fixture = setup()
    expect(panel(fixture)).toBeNull()
  })

  it("shows the active point's header and rows", () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()
    const text = panel(fixture)?.textContent ?? ''
    expect(text).toContain('1 h')
    expect(text).toContain('Requêtes')
    expect(text).toContain('42')
  })

  it('follows the active index from point to point', () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(0)
    fixture.detectChanges()
    expect(panel(fixture)?.textContent).toContain('12')
    fixture.componentInstance.ctx.setActiveIndex(2)
    fixture.detectChanges()
    expect(panel(fixture)?.textContent).toContain('7')
  })

  it('positions itself from the scale, margin included', () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()

    expect(panel(fixture)?.style.left).toBe('320px')
  })

  it('disappears when the selection is closed', () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()
    fixture.componentInstance.ctx.setActiveIndex(null)
    fixture.detectChanges()
    expect(panel(fixture)).toBeNull()
  })

  it("doesn't show for an index outside the points array", () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(99)
    fixture.detectChanges()
    expect(panel(fixture)).toBeNull()
  })

  it('the live region pre-exists the content it announces', () => {
    const fixture = setup()
    const region = fixture.nativeElement.querySelector('[role="status"]')
    expect(region).not.toBeNull()
    expect(region.querySelector('.gbt-chart-tooltip__panel')).toBeNull()
  })

  it('announces its content without taking focus', () => {
    const fixture = setup()

    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    surface.focus()
    expect(document.activeElement).toBe(surface)

    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()

    expect(panel(fixture)).not.toBeNull()

    expect(document.activeElement).toBe(surface)
    const region = fixture.nativeElement.querySelector('[role="status"]')
    expect(region).not.toBeNull()
    expect(region.hasAttribute('tabindex')).toBe(false)
    expect(panel(fixture)?.hasAttribute('tabindex')).toBe(false)
  })

  it('has no violation detected by axe', async () => {
    const fixture = setup()
    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('renders one series dot per row, pattern included', () => {
    const fixture = setup()
    fixture.componentInstance.points.set([
      {
        x: 1,
        header: '26 août',
        rows: [
          { label: 'Docker', value: '257 Gio', series: 1, pattern: 'solid' },
          { label: 'npm', value: '103 Gio', series: 2, pattern: 'dashed' },
        ],
      },
    ])
    fixture.componentInstance.ctx.setActiveIndex(0)
    fixture.detectChanges()

    const pastilles = [...fixture.nativeElement.querySelectorAll('.gbt-chart-tooltip__swatch')]
    expect(pastilles.length).toBe(2)
    expect(pastilles.map((p: HTMLElement) => p.getAttribute('data-series'))).toEqual(['1', '2'])
    expect(pastilles.map((p: HTMLElement) => p.getAttribute('data-pattern'))).toEqual([
      'solid',
      'dashed',
    ])
  })

  it('anchors the panel inward at the first and last point', () => {
    const fixture = setup()
    fixture.componentInstance.points.set([
      { x: 0, header: 'début', rows: [{ label: 'A', value: '1' }] },
      { x: 50, header: 'milieu', rows: [{ label: 'A', value: '2' }] },
      { x: 100, header: 'fin', rows: [{ label: 'A', value: '3' }] },
    ])

    fixture.componentInstance.ctx.setActiveIndex(0)
    fixture.detectChanges()
    expect(panel(fixture)?.getAttribute('data-anchor')).toBe('start')

    fixture.componentInstance.ctx.setActiveIndex(1)
    fixture.detectChanges()
    expect(panel(fixture)?.getAttribute('data-anchor')).toBe('middle')

    fixture.componentInstance.ctx.setActiveIndex(2)
    fixture.detectChanges()
    expect(panel(fixture)?.getAttribute('data-anchor')).toBe('end')
  })

  it('anchors a single point to the left', () => {
    const fixture = setup()
    fixture.componentInstance.points.set([
      { x: 100, header: 'seul', rows: [{ label: 'A', value: '1' }] },
    ])
    fixture.componentInstance.ctx.setActiveIndex(0)
    fixture.detectChanges()
    expect(panel(fixture)?.getAttribute('data-anchor')).toBe('start')
  })
})
