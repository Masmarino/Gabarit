import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Sparkline } from './sparkline'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Sparkline],
  template: `
    <gbt-sparkline
      [values]="values()"
      tableCaption="Requêtes des sept derniers jours"
      xColumn="Jour"
      yColumn="Requêtes"
      locale="fr-FR"
      emptyMessage="Aucune mesure"
    />
  `,
})
class HostComponent {
  values = signal<number[]>([10, 30, 20, 50, 40])
}

function setup(values: number[]) {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.componentInstance.values.set(values)
  fixture.detectChanges()
  return fixture
}

describe('Sparkline', () => {
  it('draws a line passing through every value', () => {
    const d = setup([10, 30, 20, 50, 40])
      .nativeElement.querySelector('.gbt-sparkline__line')
      .getAttribute('d')

    expect(d).toMatch(/^M4,/)
    expect(d.match(/L/g)?.length).toBe(4)
    expect(d).toContain('L76,')
  })

  it('respects the requested dimensions', () => {
    const svg = setup([10, 30, 20, 50, 40]).nativeElement.querySelector('svg')
    expect(svg.getAttribute('viewBox')).toBe('0 0 80 24')
  })

  it('exposes its values as a visually-hidden table', () => {
    const table = setup([10, 30, 20, 50, 40]).nativeElement.querySelector('gbt-chart-table table')
    expect(table).not.toBeNull()
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Jour', 'Requêtes'])
    const rows = [...table.querySelectorAll('tbody tr')].map((tr: HTMLTableRowElement) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    )
    expect(rows).toEqual([
      ['1', '10'],
      ['2', '30'],
      ['3', '20'],
      ['4', '50'],
      ['5', '40'],
    ])
  })

  it('for a single value, draws a point without dividing by zero', () => {
    const d = setup([7]).nativeElement.querySelector('.gbt-sparkline__line').getAttribute('d')

    expect(d).toBe('M4,20')
  })

  it('reserves enough vertical margin for the line and the dot', () => {
    const fixture = setup([10, 90])
    const d = fixture.nativeElement.querySelector('.gbt-sparkline__line').getAttribute('d')
    const yCoordinates = [...d.matchAll(/[ML]\d+(?:\.\d+)?,(\d+(?:\.\d+)?)/g)].map((m) =>
      Number.parseFloat(m[1]),
    )
    expect(Math.min(...yCoordinates)).toBeGreaterThanOrEqual(4)
    expect(Math.max(...yCoordinates)).toBeLessThanOrEqual(20)
  })

  it('reserves the same horizontal margin, without which the end dots get clipped', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const svg: HTMLElement = fixture.nativeElement.querySelector('.gbt-sparkline__svg')
    const cx = () =>
      Number(fixture.nativeElement.querySelector('.gbt-sparkline__dot').getAttribute('cx'))

    svg.focus()
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    fixture.detectChanges()
    expect(cx()).toBe(4)

    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    fixture.detectChanges()
    expect(cx()).toBe(76)
  })

  it('shows a message when there is no value', () => {
    const fixture = setup([])
    expect(fixture.nativeElement.textContent).toContain('Aucune mesure')
    expect(fixture.nativeElement.querySelector('.gbt-sparkline__svg')).toBeNull()
  })

  it('activates the point nearest the cursor', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const svg: SVGElement = fixture.nativeElement.querySelector('.gbt-sparkline__svg')
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 80, height: 24, right: 80, bottom: 24, x: 0, y: 0 }) as DOMRect

    svg.dispatchEvent(new MouseEvent('pointermove', { clientX: 42, bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-sparkline__dot').length).toBe(1)
    expect(fixture.nativeElement.querySelector('.gbt-sparkline__tooltip').textContent).toContain(
      '30',
    )
  })

  it('titles the tooltip with xColumn and yColumn rather than two bare numbers', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const svg: SVGElement = fixture.nativeElement.querySelector('.gbt-sparkline__svg')
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 80, height: 24, right: 80, bottom: 24, x: 0, y: 0 }) as DOMRect
    svg.dispatchEvent(new MouseEvent('pointermove', { clientX: 42, bubbles: true }))
    fixture.detectChanges()
    const text = fixture.nativeElement.querySelector('.gbt-sparkline__tooltip').textContent
    expect(text).toContain('Jour')
    expect(text).toContain('Requêtes')
    expect(text).not.toContain('·')
  })

  it('reaches the same state via the keyboard', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const svg: HTMLElement = fixture.nativeElement.querySelector('.gbt-sparkline__svg')
    svg.focus()
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-sparkline__tooltip').textContent).toContain(
      '50',
    )
  })

  it('carries the live region before any activation, not only once a point is active', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const region = fixture.nativeElement.querySelector('[aria-live="polite"]')
    expect(region).not.toBeNull()
    expect(region.getAttribute('role')).toBe('status')
    expect(fixture.nativeElement.querySelector('.gbt-sparkline__tooltip')).toBeNull()
  })

  it('clears the dot and the tooltip when focus leaves the component', () => {
    const fixture = setup([10, 20, 30, 40, 50])
    const svg: HTMLElement = fixture.nativeElement.querySelector('.gbt-sparkline__svg')
    svg.focus()
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-sparkline__dot').length).toBe(1)

    svg.dispatchEvent(new FocusEvent('blur'))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-sparkline__dot').length).toBe(0)
    expect(fixture.nativeElement.querySelector('.gbt-sparkline__tooltip')).toBeNull()
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup([10, 20, 30]).nativeElement)
  })
})
