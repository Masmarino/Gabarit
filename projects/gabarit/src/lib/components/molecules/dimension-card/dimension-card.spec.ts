import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DimensionCard, type DimensionRow } from './dimension-card'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [DimensionCard],
  template: `
    <gbt-dimension-card
      [rows]="rows()"
      caption="Navigateurs"
      labelColumn="Navigateur"
      valueColumn="Sessions"
      emptyMessage="Aucune session."
      locale="fr-FR"
    />
  `,
})
class HostComponent {
  rows = signal<DimensionRow[]>([
    { label: 'Firefox', value: 420 },
    { label: 'Chrome', value: 210 },
    { label: 'Safari', value: 105 },
  ])
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('DimensionCard', () => {
  it('renders a real table, not a list', () => {
    const table = setup().nativeElement.querySelector('table')
    expect(table).not.toBeNull()
    expect(table.querySelector('caption')?.textContent?.trim()).toBe('Navigateurs')
  })

  it('associates each header with its column', () => {
    const headers = setup().nativeElement.querySelectorAll('thead th')
    expect(headers.length).toBe(2)
    for (const th of headers) expect(th.getAttribute('scope')).toBe('col')
  })

  it('associates each row header with its row', () => {
    const headers = setup().nativeElement.querySelectorAll('tbody th')
    expect(headers.length).toBe(3)
    for (const th of headers) expect(th.getAttribute('scope')).toBe('row')
  })

  it('shows one row per entry, formatted values', () => {
    const renderedRows = [...setup().nativeElement.querySelectorAll('tbody tr')].map(
      (tr: HTMLTableRowElement) =>
        [...tr.querySelectorAll('th, td')].map((c) => c.textContent?.trim()),
    )
    expect(renderedRows).toEqual([
      ['Firefox', '420'],
      ['Chrome', '210'],
      ['Safari', '105'],
    ])
  })

  it('sizes the background bar against the largest value', () => {
    const bars = [...setup().nativeElement.querySelectorAll('.gbt-dimension-card__bar')].map(
      (b: HTMLElement) => b.style.width,
    )
    expect(bars).toEqual(['100%', '50%', '25%'])
  })

  it('hides the bar from screen readers', () => {
    const bar = setup().nativeElement.querySelector('.gbt-dimension-card__bar')
    expect(bar.getAttribute('aria-hidden')).toBe('true')
  })

  it("doesn't add any hidden table to the one that's already visible", () => {
    expect(setup().nativeElement.querySelectorAll('table').length).toBe(1)
    expect(setup().nativeElement.querySelector('.gbt-sr-only')).toBeNull()
  })

  it('shows the empty state and no table when there is no row', () => {
    const fixture = setup()
    fixture.componentInstance.rows.set([])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucune session.')
    expect(fixture.nativeElement.querySelector('table')).toBeNull()
  })

  it("for a zero largest value, doesn't divide by zero", () => {
    const fixture = setup()
    fixture.componentInstance.rows.set([
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ])
    fixture.detectChanges()
    const bars = [...fixture.nativeElement.querySelectorAll('.gbt-dimension-card__bar')].map(
      (b: HTMLElement) => b.style.width,
    )
    expect(bars).toEqual(['0%', '0%'])
  })

  it("doesn't accent any row at rest", () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('tbody tr[data-active]')).toBeNull()
  })

  it('accents the hovered row, and only that one', () => {
    const fixture = setup()
    const renderedRows = fixture.nativeElement.querySelectorAll('tbody tr')
    renderedRows[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('tbody tr[data-active]').length).toBe(1)
    expect(renderedRows[1].hasAttribute('data-active')).toBe(true)
  })

  it('makes no row keyboard-focusable', () => {
    const fixture = setup()
    const renderedRows = fixture.nativeElement.querySelectorAll('tbody tr')
    for (const row of renderedRows) expect(row.hasAttribute('tabindex')).toBe(false)
  })

  it("prefers a row's display over the formatted value, and keeps its bar on value", () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.rows.set([
      { label: 'Archives', value: 2_147_483_648, display: '2 Gio' },
      { label: 'Miroirs', value: 1_073_741_824, display: '1 Gio' },
    ])
    fixture.detectChanges()

    const values = [...fixture.nativeElement.querySelectorAll('.gbt-dimension-card__value')].map(
      (cell: HTMLElement) => cell.textContent?.trim(),
    )
    expect(values).toEqual(['2 Gio', '1 Gio'])

    const bars = [...fixture.nativeElement.querySelectorAll('.gbt-dimension-card__bar')].map(
      (bar: HTMLElement) => bar.style.width,
    )
    expect(bars).toEqual(['100%', '50%'])
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
