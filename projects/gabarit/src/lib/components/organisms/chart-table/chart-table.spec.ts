import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ChartTable } from './chart-table'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ChartTable],
  template: `
    <gbt-chart-table
      caption="Requêtes par jour"
      [columns]="['Jour', 'Requêtes']"
      [rows]="[
        ['Lundi', 120],
        ['Mardi', 340],
      ]"
    />
  `,
})
class HostComponent {}

describe('ChartTable', () => {
  function render() {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('renders a real table, not a grid of divs', () => {
    const table = render().querySelector('table')
    expect(table).not.toBeNull()
    expect(table!.querySelector('caption')?.textContent?.trim()).toBe('Requêtes par jour')
  })

  it('associates each header with its column', () => {
    const headers = render().querySelectorAll('thead th')
    expect(headers.length).toBe(2)
    for (const th of headers) expect(th.getAttribute('scope')).toBe('col')
  })

  it('renders one row per entry', () => {
    const rows = render().querySelectorAll('tbody tr')
    expect(rows.length).toBe(2)
    expect([...rows[1].querySelectorAll('td')].map((c) => c.textContent?.trim())).toEqual([
      'Mardi',
      '340',
    ])
  })

  it('is visually hidden without leaving the accessibility tree', () => {
    const table = render().querySelector('table')!
    expect(table.hasAttribute('hidden')).toBe(false)
    expect(table.getAttribute('aria-hidden')).toBeNull()
    expect(render().querySelector('.gbt-sr-only')).not.toBeNull()
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(render())
  })
})
