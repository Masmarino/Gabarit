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
})
