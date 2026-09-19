import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PieChart, type PieSlice } from './pie-chart'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [PieChart],
  template: `
    <gbt-pie-chart
      [slices]="slices()"
      label="Répartition du trafic"
      locale="fr-FR"
      emptyMessage="Aucune donnée."
      tableCaption="Répartition du trafic"
      categoryColumn="Source"
      valueColumn="Visites"
      shareColumn="Part"
      [sliceAnnouncement]="sliceAnnouncement"
      [innerRadiusRatio]="innerRadiusRatio()"
    />
  `,
})
class HostComponent {
  slices = signal<PieSlice[]>([
    { label: 'Direct', value: 60 },
    { label: 'Recherche', value: 30 },
    { label: 'Réseaux sociaux', value: 10 },
  ])
  innerRadiusRatio = signal(0)
  sliceAnnouncement = (label: string, value: string, share: string) =>
    `${label}, ${value}, ${share} du total`
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('PieChart', () => {
  it('renders one slice path per input slice', () => {
    expect(setup().nativeElement.querySelectorAll('.gbt-pie-chart__slice').length).toBe(3)
  })

  it('starts each pie slice path from the center', () => {
    const paths = setup().nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    expect([...paths].every((p: SVGPathElement) => p.getAttribute('d')?.startsWith('M0,0'))).toBe(
      true,
    )
  })

  it("doesn't touch the center for a donut (inner radius > 0)", () => {
    const fixture = setup()
    fixture.componentInstance.innerRadiusRatio.set(0.6)
    fixture.detectChanges()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    expect([...paths].some((p: SVGPathElement) => p.getAttribute('d')?.startsWith('M0,0'))).toBe(
      false,
    )
  })

  it('exposes its slices as a visually-hidden table, share included', () => {
    const table = setup().nativeElement.querySelector('gbt-chart-table table')
    expect(table).not.toBeNull()
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Source', 'Visites', 'Part'])

    const normalize = (text: string | undefined) => (text ?? '').replace(/\s+/g, ' ')
    const rows = [...table.querySelectorAll('tbody tr')].map((tr: HTMLTableRowElement) =>
      [...tr.querySelectorAll('td')].map((td) => normalize(td.textContent?.trim())),
    )
    expect(rows).toEqual([
      ['Direct', '60', '60 %'],
      ['Recherche', '30', '30 %'],
      ['Réseaux sociaux', '10', '10 %'],
    ])
  })

  it('feeds the legend one entry per slice, with its own color and formatted value', () => {
    const items = setup().nativeElement.querySelectorAll('.gbt-chart-legend__item')
    expect(items.length).toBe(3)
    expect([...items].map((i: HTMLElement) => i.textContent?.replace(/\s+/g, ' ').trim())).toEqual(
      ['Direct 60', 'Recherche 30', 'Réseaux sociaux 10'],
    )
    const fills = [...items].map((i: HTMLElement) =>
      i.querySelector('.gbt-chart-legend__fill')?.getAttribute('fill'),
    )
    expect(new Set(fills).size).toBe(3)
  })

  it('shows the empty state and no slice when there is no data', () => {
    const fixture = setup()
    fixture.componentInstance.slices.set([])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucune donnée.')
    expect(fixture.nativeElement.querySelector('.gbt-pie-chart__slice')).toBeNull()
  })

  it("for an all-zero total, doesn't divide by zero", () => {
    const fixture = setup()
    fixture.componentInstance.slices.set([
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ])
    fixture.detectChanges()
    const table = fixture.nativeElement.querySelector('gbt-chart-table table')
    const rows = [...table.querySelectorAll('tbody tr')].map((tr: HTMLTableRowElement) =>
      [...tr.querySelectorAll('td')][2].textContent?.replace(/\s+/g, ' ').trim(),
    )
    expect(rows).toEqual(['0 %', '0 %'])
  })

  it('shows a direct on-slice label only for slices above the small-slice threshold', () => {
    const fixture = setup()
    fixture.componentInstance.slices.set([
      { label: 'Grande part', value: 90 },
      { label: 'Petite part', value: 10 },
    ])
    fixture.detectChanges()
    const labels = [...fixture.nativeElement.querySelectorAll('.gbt-pie-chart__label')].map(
      (l: SVGTextElement) => l.textContent?.replace(/\s+/g, ' '),
    )
    expect(labels).toEqual(['90 %'])
  })

  it('gives each slice a role and an accessible name, and makes it focusable', () => {
    const paths = setup().nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    expect(paths[0].getAttribute('role')).toBe('img')
    expect(paths[0].getAttribute('aria-label')).toContain('Direct')
    expect(paths[0].getAttribute('aria-label')).toContain('60')
    expect(paths[0].getAttribute('tabindex')).toBe('0')
  })

  it("doesn't accent any slice at rest", () => {
    expect(setup().nativeElement.querySelector('[data-active]')).toBeNull()
  })

  it('accents the hovered slice and its matching legend entry together', () => {
    const fixture = setup()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    paths[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    expect(paths[1].hasAttribute('data-active')).toBe(true)
    const items = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')
    expect(items[1].classList.contains('gbt-chart-legend__item--active')).toBe(true)
    expect(items[0].classList.contains('gbt-chart-legend__item--active')).toBe(false)
  })

  it('accents the slice when its legend entry is hovered', () => {
    const fixture = setup()
    const items = fixture.nativeElement.querySelectorAll('.gbt-chart-legend__item')
    items[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    expect(paths[2].hasAttribute('data-active')).toBe(true)
  })

  it('reaches the same state via the keyboard', () => {
    const fixture = setup()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    paths[2].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    fixture.detectChanges()
    expect(paths[2].hasAttribute('data-active')).toBe(true)
  })

  it("doesn't undo at the pointer what the keyboard established", () => {
    const fixture = setup()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    paths[1].focus()
    fixture.detectChanges()
    paths[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    paths[1].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    fixture.detectChanges()
    expect(paths[1].hasAttribute('data-active')).toBe(true)
  })

  it('keeps the announcement region in the DOM at rest, so it pre-exists its content', () => {
    const region = setup().nativeElement.querySelector('[role="status"][aria-live="polite"]')
    expect(region).not.toBeNull()
    expect(region.getAttribute('aria-atomic')).toBe('true')
    expect(region.textContent?.trim()).toBe('')
  })

  it('the announcement region carries the label, value and share of the active slice', () => {
    const fixture = setup()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    paths[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const region = fixture.nativeElement
      .querySelector('[role="status"][aria-live="polite"]')
      .textContent.replace(/\s+/g, ' ')
      .trim()
    expect(region).toBe('Recherche, 30, 30 % du total')
  })

  it('clears the announcement region on cursor exit as on focus loss', () => {
    const fixture = setup()
    const paths = fixture.nativeElement.querySelectorAll('.gbt-pie-chart__slice')
    const region = () =>
      fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]').textContent.trim()

    paths[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    expect(region()).not.toBe('')
    paths[0].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    fixture.detectChanges()
    expect(region()).toBe('')
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no violation detected by axe on the empty state', async () => {
    const fixture = setup()
    fixture.componentInstance.slices.set([])
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
