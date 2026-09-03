import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FunnelChart, type FunnelStep } from './funnel-chart'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [FunnelChart],
  template: `
    <gbt-funnel-chart
      [steps]="steps()"
      label="Parcours d'inscription"
      locale="fr-FR"
      emptyMessage="Aucun parcours."
      tableCaption="Parcours d'inscription"
      stepColumn="Étape"
      valueColumn="Visiteurs"
      conversionColumn="Conversion"
      [stepAnnouncement]="stepAnnouncement"
    />
  `,
})
class HostComponent {
  steps = signal<FunnelStep[]>([
    { label: 'Visite', value: 1000 },
    { label: 'Inscription', value: 400 },
    { label: 'Achat', value: 100 },
  ])
  stepAnnouncement = (label: string, conversion: string) =>
    `${label}, conversion depuis l'étape précédente : ${conversion}`
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('FunnelChart', () => {
  it('renders one band per step', () => {
    expect(setup().nativeElement.querySelectorAll('.gbt-funnel-chart__step').length).toBe(3)
  })

  it('gives each band a width proportional to the first step', () => {
    const widths = [...setup().nativeElement.querySelectorAll('.gbt-funnel-chart__bar')].map(
      (b: HTMLElement) => b.style.width,
    )
    expect(widths).toEqual(['100%', '40%', '10%'])
  })

  it("shows each step's label and value", () => {
    const text = setup().nativeElement.textContent
    expect(text).toContain('Visite')
    expect(text).toContain('400')
    expect(text).toContain('Achat')
  })

  it('exposes its steps as a visually-hidden table, conversion included', () => {
    const table = setup().nativeElement.querySelector('gbt-chart-table table')
    expect(table).not.toBeNull()
    const headers = [...table.querySelectorAll('thead th')].map((h: HTMLElement) =>
      h.textContent?.trim(),
    )
    expect(headers).toEqual(['Étape', 'Visiteurs', 'Conversion'])

    const normalize = (text: string | undefined) => (text ?? '').replace(/\s+/g, ' ')
    const rows = [...table.querySelectorAll('tbody tr')].map((tr: HTMLTableRowElement) =>
      [...tr.querySelectorAll('td')].map((td) => normalize(td.textContent?.trim())),
    )
    expect(rows).toEqual([
      ['Visite', '1 000', '100 %'],
      ['Inscription', '400', '40 %'],
      ['Achat', '100', '10 %'],
    ])
  })

  it('shows the empty state and no band when there is no step', () => {
    const fixture = setup()
    fixture.componentInstance.steps.set([])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Aucun parcours.')
    expect(fixture.nativeElement.querySelector('.gbt-funnel-chart__bar')).toBeNull()
  })

  it("for a zero first step, doesn't divide by zero", () => {
    const fixture = setup()
    fixture.componentInstance.steps.set([
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ])
    fixture.detectChanges()
    const widths = [...fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__bar')].map(
      (b: HTMLElement) => b.style.width,
    )
    expect(widths).toEqual(['0%', '0%'])
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it("locks the band's opacity at 0.14 — the browser-measured threshold, not a silently changeable magic number", () => {
    const scss = readFileSync(
      join(
        process.cwd(),
        'projects/gabarit/src/lib/components/molecules/funnel-chart/funnel-chart.scss',
      ),
      'utf8',
    )
    expect(scss).toContain('opacity: 0.14;')
  })

  it("doesn't accent any step at rest", () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('[data-active]')).toBeNull()
  })

  it('accents the hovered step and gives its conversion from the previous one', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    steps[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    expect(steps[1].hasAttribute('data-active')).toBe(true)

    const tip = fixture.nativeElement
      .querySelector('.gbt-funnel-chart__tip')
      .textContent.replace(/\s+/g, ' ')
    expect(tip).toContain('40 %')
  })

  it('reports the conversion against the previous step, not the first', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    steps[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const tip = fixture.nativeElement
      .querySelector('.gbt-funnel-chart__tip')
      .textContent.replace(/\s+/g, ' ')
    expect(tip).toContain('25 %')
    expect(tip).not.toContain('10 %')
  })

  it("doesn't undo at the pointer what the keyboard established", () => {
    const fixture = setup()
    const steps: HTMLElement[] = [
      ...fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step'),
    ]

    steps[1].focus()
    fixture.detectChanges()
    expect(steps[1].hasAttribute('data-active')).toBe(true)

    steps[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    steps[1].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    fixture.detectChanges()
    expect(steps[1].hasAttribute('data-active')).toBe(true)
  })

  it('reaches the same state via the keyboard', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    expect(steps[0].getAttribute('tabindex')).toBe('0')
    steps[2].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    fixture.detectChanges()
    expect(steps[2].hasAttribute('data-active')).toBe(true)
  })

  it('clears the state on cursor exit as on focus loss', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')

    steps[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    steps[1].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-active]')).toBeNull()

    steps[1].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    fixture.detectChanges()
    steps[1].dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-active]')).toBeNull()
  })

  it('keeps the announcement region in the DOM at rest, so it pre-exists its content', () => {
    const fixture = setup()
    const region = fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]')
    expect(region).not.toBeNull()
    expect(region.getAttribute('aria-atomic')).toBe('true')
    expect(region.textContent?.trim()).toBe('')
  })

  it('the announcement region carries the conversion from the previous step, not from the first', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    steps[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const region = fixture.nativeElement
      .querySelector('[role="status"][aria-live="polite"]')
      .textContent.replace(/\s+/g, ' ')
    expect(region).toContain('25 %')
    expect(region).not.toContain('10 %')
  })

  it('the announcement labels the percentage rather than speaking it bare', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    steps[2].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const region = fixture.nativeElement
      .querySelector('[role="status"][aria-live="polite"]')
      .textContent.replace(/\s+/g, ' ')
    expect(region).toContain('Achat')
    expect(region).toContain('25 %')
  })

  it('clears the announcement region on cursor exit as on focus loss', () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    const region = () =>
      fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]').textContent.trim()

    steps[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    expect(region()).not.toBe('')
    steps[1].dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    fixture.detectChanges()
    expect(region()).toBe('')

    steps[1].focus()
    fixture.detectChanges()
    expect(region()).not.toBe('')
    steps[1].dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    fixture.detectChanges()
    expect(region()).toBe('')
  })

  it("shows the visual hint inside the active step's <li>", () => {
    const fixture = setup()
    const steps = fixture.nativeElement.querySelectorAll('.gbt-funnel-chart__step')
    steps[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()
    const tip = steps[1].querySelector('.gbt-funnel-chart__tip')
    expect(tip).not.toBeNull()
    expect(tip.hasAttribute('aria-live')).toBe(false)
    expect(tip.getAttribute('aria-hidden')).toBe('true')
  })
})
