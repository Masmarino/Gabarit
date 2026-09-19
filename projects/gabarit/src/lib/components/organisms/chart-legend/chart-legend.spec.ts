import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ChartLegend, type LegendEntry } from './chart-legend'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ChartLegend],
  template: `
    <gbt-chart-legend
      [entries]="[
        { label: 'Requêtes', pattern: 'solid' },
        { label: 'Erreurs', pattern: 'dashed' },
        { label: 'Latence', pattern: 'dotted' },
      ]"
    />
  `,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [ChartLegend],
  template: `<gbt-chart-legend [entries]="entries()" />`,
})
class SetupHost {
  entries = signal<LegendEntry[]>([])
}

describe('ChartLegend', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    return fixture
  }

  function setup(entries: LegendEntry[]) {
    const fixture = TestBed.createComponent(SetupHost)
    fixture.componentInstance.entries.set(entries)
    fixture.detectChanges()
    return fixture
  }

  it('renders one entry per series', () => {
    const items = render().nativeElement.querySelectorAll('.gbt-chart-legend__item')
    expect(items.length).toBe(3)
    expect([...items].map((i: HTMLElement) => i.textContent?.trim())).toEqual([
      'Requêtes',
      'Erreurs',
      'Latence',
    ])
  })

  it('renders three distinct dash patterns, one per series', () => {
    const lines = render().nativeElement.querySelectorAll('.gbt-chart-legend__line')
    expect(lines.length).toBe(3)
    const dashes = [...lines].map((l: SVGLineElement) => l.getAttribute('stroke-dasharray'))
    expect(dashes).toEqual(['none', '6 3', '1 3'])
    expect(new Set(dashes).size).toBe(3)
  })

  it('falls back to a solid line when no pattern is provided', () => {
    @Component({
      standalone: true,
      imports: [ChartLegend],
      template: `<gbt-chart-legend [entries]="[{ label: 'Seule' }]" />`,
    })
    class MinimalHost {}
    const fixture = TestBed.createComponent(MinimalHost)
    fixture.detectChanges()
    const line = fixture.nativeElement.querySelector('.gbt-chart-legend__line')
    expect(line.getAttribute('stroke-dasharray')).toBe('none')
  })

  it("shows an entry's value when it carries one", () => {
    const fixture = setup([
      { label: 'Docker', pattern: 'solid', value: '257 Gio' },
      { label: 'npm', pattern: 'dashed', value: '103 Gio' },
    ])
    const valeurs = [...fixture.nativeElement.querySelectorAll('.gbt-chart-legend__value')].map(
      (n: HTMLElement) => n.textContent?.trim(),
    )
    expect(valeurs).toEqual(['257 Gio', '103 Gio'])
  })

  it('adds nothing when the entry has no value', () => {
    const fixture = setup([{ label: 'Docker', pattern: 'solid' }])
    expect(fixture.nativeElement.querySelector('.gbt-chart-legend__value')).toBeNull()
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(render().nativeElement)
  })

  it('renders a filled swatch instead of a dashed line when the entry carries a color', () => {
    const fixture = setup([
      { label: 'A', color: 'var(--chart-series-1-base)' },
      { label: 'B', pattern: 'dashed' },
    ])
    const swatches = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')
    expect(swatches[0].querySelector('.gbt-chart-legend__line')).toBeNull()
    const fill = swatches[0].querySelector('.gbt-chart-legend__fill')
    expect(fill).not.toBeNull()
    expect(fill.getAttribute('fill')).toBe('var(--chart-series-1-base)')
    expect(swatches[1].querySelector('.gbt-chart-legend__fill')).toBeNull()
    expect(swatches[1].querySelector('.gbt-chart-legend__line')).not.toBeNull()
  })

  describe('interactive mode', () => {
    @Component({
      standalone: true,
      imports: [ChartLegend],
      template: `
        <gbt-chart-legend
          [entries]="entries()"
          interactive
          [activeIndex]="activeIndex()"
          (activeIndexChange)="activeIndex.set($event)"
        />
      `,
    })
    class InteractiveHost {
      entries = signal<LegendEntry[]>([{ label: 'A' }, { label: 'B' }])
      activeIndex = signal<number | null>(null)
    }

    function renderInteractive() {
      const fixture = TestBed.createComponent(InteractiveHost)
      fixture.detectChanges()
      return fixture
    }

    it('is not focusable by default (non-interactive)', () => {
      const item = render().nativeElement.querySelector('.gbt-chart-legend__item')
      expect(item.getAttribute('tabindex')).toBeNull()
    })

    it('makes each entry focusable when interactive', () => {
      const items = renderInteractive().nativeElement.querySelectorAll('.gbt-chart-legend__item')
      expect([...items].every((i: HTMLElement) => i.getAttribute('tabindex') === '0')).toBe(true)
    })

    it('emits the hovered index on mouseenter', () => {
      const fixture = renderInteractive()
      const item = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')[1]
      item.dispatchEvent(new MouseEvent('mouseenter'))
      fixture.detectChanges()
      expect(fixture.componentInstance.activeIndex()).toBe(1)
    })

    it('emits null on mouseleave when focus did not move into the item', () => {
      const fixture = renderInteractive()
      const item = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')[1]
      item.dispatchEvent(new MouseEvent('mouseenter'))
      item.dispatchEvent(new MouseEvent('mouseleave'))
      fixture.detectChanges()
      expect(fixture.componentInstance.activeIndex()).toBeNull()
    })

    it('emits the focused index on focus and null on blur', () => {
      const fixture = renderInteractive()
      const item = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')[0]
      item.dispatchEvent(new FocusEvent('focus'))
      fixture.detectChanges()
      expect(fixture.componentInstance.activeIndex()).toBe(0)
      item.dispatchEvent(new FocusEvent('blur'))
      fixture.detectChanges()
      expect(fixture.componentInstance.activeIndex()).toBeNull()
    })

    it('marks the entry matching activeIndex as active', () => {
      const fixture = renderInteractive()
      fixture.componentInstance.activeIndex.set(0)
      fixture.detectChanges()
      const items = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')
      expect(items[0].classList.contains('gbt-chart-legend__item--active')).toBe(true)
      expect(items[1].classList.contains('gbt-chart-legend__item--active')).toBe(false)
    })

    it('has no violation detected by axe', async () => {
      await expectNoA11yViolations(renderInteractive().nativeElement)
    })
  })
})
