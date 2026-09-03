import { Component, signal } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ChartFrame } from './chart-frame'
import { ChartContext, type PointValue } from '../chart-context/chart-context'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function measuredSurface<T>(fixture: ComponentFixture<T>): HTMLElement {
  const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 300, right: 600, bottom: 300, x: 0, y: 0 }) as DOMRect
  return surface
}

@Component({
  standalone: true,
  imports: [ChartFrame],
  template: `
    <gbt-chart-frame
      label="Requêtes par heure"
      [heading]="heading()"
      [headingLevel]="headingLevel()"
      [headline]="headline()"
      [trend]="trend()"
      [x]="{ kind: 'linear', domain: [0, 100] }"
      [y]="{ kind: 'linear', domain: [0, 10] }"
      [size]="{ width: 600, height: 300 }"
      [pointValues]="pointValues()"
    >
      <svg:g gbtChartLayer><svg:rect data-mark width="10" height="10" /></svg:g>
    </gbt-chart-frame>
  `,
})
class HostComponent {
  readonly pointValues = signal<PointValue[]>([])
  readonly heading = signal('')
  readonly headingLevel = signal<1 | 2 | 3 | 4 | 5 | 6>(2)
  readonly headline = signal('')
  readonly trend = signal('')
}

@Component({
  standalone: true,
  imports: [ChartFrame],
  template: `
    <gbt-chart-frame
      label="Requêtes par heure"
      heading="Stockage des registres"
      headline="388 Gio"
      [x]="{ kind: 'linear', domain: [0, 100] }"
      [y]="{ kind: 'linear', domain: [0, 10] }"
    />
  `,
})
class MeasuredHostComponent {}

describe('ChartFrame', () => {
  it('renders an SVG when the size is provided', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('[data-mark]')).not.toBeNull()
  })

  it('publishes the usable geometry, margins subtracted', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    expect(ctx.box().innerWidth).toBe(544)
    expect(ctx.box().innerHeight).toBe(252)
  })

  it('reserves enough top margin for the tallest axis label', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const frame = fixture.debugElement.query((n) => n.name === 'gbt-chart-frame')
    const marge = frame.injector.get(ChartContext).box().margin

    expect(marge.top).toBeGreaterThanOrEqual(12)
  })

  it('publishes the scales built from the specs', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)
    expect(ctx.xScale().map(100 as never)).toBe(544)
  })

  it('has no violation detected by axe', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('renders no header with no title', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-chart-frame__header')).toBeNull()
  })

  it('renders no header when only the current value is provided, with no title', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.headline.set('360 Gio')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-chart-frame__header')).toBeNull()
  })

  it('renders the title, the current value, and the trend when provided', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.componentInstance.headline.set('360 Gio')
    fixture.componentInstance.trend.set('+8,4 % sur 7 jours')
    fixture.detectChanges()
    const entete: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__header')
    expect(entete).not.toBeNull()
    expect(entete.textContent).toContain('Stockage des registres')
    expect(entete.textContent).toContain('360 Gio')
    expect(entete.textContent).toContain('+8,4 % sur 7 jours')
  })

  it('renders an h2 by default', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Stockage des registres',
    )
  })

  it('respects the requested heading level', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.componentInstance.headingLevel.set(3)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h3')?.textContent).toContain(
      'Stockage des registres',
    )
    expect(fixture.nativeElement.querySelector('h2')).toBeNull()
  })

  it('has no violation detected by axe with its header', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.heading.set('Stockage des registres')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('projects x-values to pixels within the usable box', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 25, 50, 75, 100])
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    expect(ctx.pointValues()).toEqual([0, 25, 50, 75, 100])
    expect(ctx.activePosition()).toBeNull()
  })

  it('publishes the pixel position of the active index', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 25, 50, 75, 100])
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)
    ctx.setActiveIndex(2)
    expect(ctx.activePosition()).toBe(272)
  })

  it('draws no marker while nothing is active', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 50, 100])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-chart-frame__guide')).toBeNull()
  })

  it("draws the marker at the active point's x-position", () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 25, 50, 75, 100])
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)
    ctx.setActiveIndex(2)
    fixture.detectChanges()

    const repere = fixture.nativeElement.querySelector('.gbt-chart-frame__guide')
    expect(repere).not.toBeNull()
    expect(repere.getAttribute('x1')).toBe('272')
    expect(repere.getAttribute('x2')).toBe('272')

    expect(repere.getAttribute('y2')).toBe('252')
  })

  it('infers the number of navigable points from the received values', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 50, 100])
    fixture.detectChanges()
    const surface: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    expect(surface.getAttribute('tabindex')).toBe('0')

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    fixture.detectChanges()
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)
    expect(ctx.activeIndex()).toBe(2)
  })

  it('is not a tab stop when there is no point to navigate', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const surface = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    expect(surface.hasAttribute('tabindex')).toBe(false)
  })

  it('builds no observer when the size is provided', () => {
    let instantiations = 0
    class FakeObserver {
      constructor() {
        instantiations++
      }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    const global = globalThis as { ResizeObserver?: unknown }
    const previous = global.ResizeObserver
    global.ResizeObserver = FakeObserver
    try {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      expect(instantiations).toBe(0)
    } finally {
      if (previous === undefined) delete global.ResizeObserver
      else global.ResizeObserver = previous
    }
  })

  it("measures the surface, not the host, whose header isn't part of the plotted area", () => {
    const observes: Element[] = []
    class FakeObserver {
      observe(target: Element): void {
        observes.push(target)
      }
      disconnect(): void {}
      unobserve(): void {}
    }
    const global = globalThis as { ResizeObserver?: unknown }
    const previous = global.ResizeObserver
    global.ResizeObserver = FakeObserver
    try {
      const fixture = TestBed.createComponent(MeasuredHostComponent)
      fixture.detectChanges()
      expect(observes.length).toBe(1)
      expect((observes[0] as HTMLElement).classList.contains('gbt-chart-frame__surface')).toBe(true)
    } finally {
      if (previous === undefined) delete global.ResizeObserver
      else global.ResizeObserver = previous
    }
  })

  it('renders its surface even before being measured, so there is something to observe', () => {
    const fixture = TestBed.createComponent(MeasuredHostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-chart-frame__surface')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('svg')).toBeNull()
  })

  it('activates the point nearest the cursor', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 25, 50, 75, 100])
    fixture.detectChanges()
    const surface = measuredSurface(fixture)
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    surface.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBe(2)
  })

  it('clears the active index when the cursor leaves', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 50, 100])
    fixture.detectChanges()
    const surface = measuredSurface(fixture)
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    surface.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).not.toBeNull()

    surface.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBeNull()
  })

  it("doesn't undo at the pointer what the keyboard established", () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.pointValues.set([0, 50, 100])
    fixture.detectChanges()
    const surface = measuredSurface(fixture)
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    surface.focus()
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBe(0)

    surface.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBe(0)
  })

  it('activates nothing when no point is published', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const surface = measuredSurface(fixture)
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)

    surface.dispatchEvent(new MouseEvent('pointermove', { clientX: 300, bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBeNull()
  })
})

@Component({
  standalone: true,
  imports: [ChartFrame],
  template: `
    <gbt-chart-frame
      label="Sans taille"
      [x]="{ kind: 'linear', domain: [0, 1] }"
      [y]="{ kind: 'linear', domain: [0, 1] }"
    >
      <svg:g gbtChartLayer><svg:rect data-mark /></svg:g>
    </gbt-chart-frame>
  `,
})
class UnmeasuredHostComponent {}

describe('ChartFrame unmeasured', () => {
  it('renders no SVG while the width is zero', () => {
    const fixture = TestBed.createComponent(UnmeasuredHostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg')).toBeNull()
  })

  it("doesn't throw when ResizeObserver is absent", () => {
    expect(typeof ResizeObserver).toBe('undefined')
    expect(() => {
      const fixture = TestBed.createComponent(UnmeasuredHostComponent)
      fixture.detectChanges()
    }).not.toThrow()
  })
})

@Component({
  standalone: true,
  imports: [ChartFrame],
  template: `
    <gbt-chart-frame
      label="Requêtes par heure"
      [x]="{ kind: 'linear', domain: [0, 100] }"
      [y]="{ kind: 'linear', domain: [0, 10] }"
      [size]="{ width: 600, height: 300 }"
      [pointValues]="[0, 25, 50, 100]"
    >
      <svg:g gbtChartLayer><svg:rect data-mark /></svg:g>
    </gbt-chart-frame>
  `,
})
class NavigableHostComponent {}

describe('ChartFrame — keyboard navigation', () => {
  function setup() {
    const fixture = TestBed.createComponent(NavigableHostComponent)
    fixture.detectChanges()
    const frame = fixture.debugElement.query((n) => n.name === 'gbt-chart-frame')
    const target: HTMLElement = fixture.nativeElement.querySelector('.gbt-chart-frame__surface')
    const press = (key: string) => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      fixture.detectChanges()
    }
    return { fixture, context: frame.injector.get(ChartContext), target, press }
  }

  it('exposes a focusable surface — without it, the tooltip would be unreachable via keyboard', () => {
    const { target } = setup()
    expect(target).not.toBeNull()
    expect(target.getAttribute('tabindex')).toBe('0')
  })

  it('the right arrow from nothing activates the first point', () => {
    const { context, press } = setup()
    expect(context.activeIndex()).toBeNull()
    press('ArrowRight')
    expect(context.activeIndex()).toBe(0)
  })

  it('the left arrow from nothing activates the last point', () => {
    const { context, press } = setup()
    press('ArrowLeft')
    expect(context.activeIndex()).toBe(3)
  })

  it('arrow keys move through the series', () => {
    const { context, press } = setup()
    press('ArrowRight')
    press('ArrowRight')
    expect(context.activeIndex()).toBe(1)
    press('ArrowLeft')
    expect(context.activeIndex()).toBe(0)
  })

  it('clamps at the ends instead of wrapping', () => {
    const { context, press } = setup()
    press('Home')
    press('ArrowLeft')
    expect(context.activeIndex()).toBe(0)
    press('End')
    press('ArrowRight')
    expect(context.activeIndex()).toBe(3)
  })

  it('Home and End jump to the ends', () => {
    const { context, press } = setup()
    press('End')
    expect(context.activeIndex()).toBe(3)
    press('Home')
    expect(context.activeIndex()).toBe(0)
  })

  it('Escape closes the selection', () => {
    const { context, press } = setup()
    press('ArrowRight')
    press('Escape')
    expect(context.activeIndex()).toBeNull()
  })

  it('losing focus closes the selection', () => {
    const { context, target, fixture, press } = setup()
    press('ArrowRight')
    target.dispatchEvent(new FocusEvent('blur'))
    fixture.detectChanges()
    expect(context.activeIndex()).toBeNull()
  })

  it('has no violation detected by axe', async () => {
    const { fixture } = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [ChartFrame],
  template: `
    <gbt-chart-frame
      label="Ventes par catégorie"
      [x]="{ kind: 'band', domain: ['a', 'b', 'c', 'd'] }"
      [y]="{ kind: 'linear', domain: [0, 10] }"
      [size]="{ width: 600, height: 300 }"
      [pointValues]="['a', 'b', 'c', 'd']"
    >
      <svg:g gbtChartLayer><svg:rect data-mark /></svg:g>
    </gbt-chart-frame>
  `,
})
class BandHostComponent {}

describe('ChartFrame — hover on a category domain', () => {
  function setup() {
    const fixture = TestBed.createComponent(BandHostComponent)
    fixture.detectChanges()
    const surface = measuredSurface(fixture)
    const ctx = fixture.debugElement
      .query((n) => n.name === 'gbt-chart-frame')
      .injector.get(ChartContext)
    return { fixture, surface, ctx }
  }

  it('a cursor placed near the center of a band activates that band', () => {
    const { fixture, surface, ctx } = setup()

    surface.dispatchEvent(new MouseEvent('pointermove', { clientX: 398, bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBe(2)
  })

  it("a cursor placed near a band's left edge activates the previous band if that edge is closer to it", () => {
    const { fixture, surface, ctx } = setup()

    surface.dispatchEvent(new MouseEvent('pointermove', { clientX: 298, bubbles: true }))
    fixture.detectChanges()
    expect(ctx.activeIndex()).toBe(1)
  })
})
