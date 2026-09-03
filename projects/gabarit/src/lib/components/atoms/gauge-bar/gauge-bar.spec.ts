import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { GaugeBar } from './gauge-bar'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [GaugeBar],
  template: `
    <gbt-gauge-bar
      label="Stockage"
      [value]="value()"
      [max]="100"
      [formattedValue]="formattedValue()"
      warningLabel="Avertissement"
      criticalLabel="Critique"
    />
  `,
})
class HostComponent {
  value = signal(62)
  formattedValue = signal('62 Go / 100 Go')
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

function fill(fixture: ReturnType<typeof setup>): HTMLElement {
  return fixture.nativeElement.querySelector('.gbt-gauge-bar__fill')
}

function track(fixture: ReturnType<typeof setup>): HTMLElement {
  return fixture.nativeElement.querySelector('[role="progressbar"]')
}

describe('GaugeBar', () => {
  it('fills the bar to match the percentage', () => {
    expect(fill(setup()).style.width).toBe('62%')
  })

  it('clamps the fill between zero and one hundred, ARIA included', () => {
    const fixture = setup()
    fixture.componentInstance.value.set(140)
    fixture.detectChanges()
    expect(fill(fixture).style.width).toBe('100%')

    expect(track(fixture).getAttribute('aria-valuenow')).toBe('100')
    expect(track(fixture).getAttribute('aria-valuemax')).toBe('100')

    fixture.componentInstance.value.set(-10)
    fixture.detectChanges()
    expect(fill(fixture).style.width).toBe('0%')
    expect(track(fixture).getAttribute('aria-valuenow')).toBe('0')
    expect(track(fixture).getAttribute('aria-valuemax')).toBe('100')
  })

  it("displays the formatted percent it's given", () => {
    expect(setup().nativeElement.textContent).toContain('62 Go / 100 Go')
  })

  it('presents itself as a progress bar, carried by the track and not the root', () => {
    const fixture = setup()
    const gauge = track(fixture)
    expect(gauge).not.toBeNull()
    expect(gauge.classList.contains('gbt-gauge-bar__track')).toBe(true)
    expect(fixture.nativeElement.querySelector('.gbt-gauge-bar').getAttribute('role')).toBeNull()
    expect(gauge.getAttribute('aria-valuenow')).toBe('62')
    expect(gauge.getAttribute('aria-valuemin')).toBe('0')
    expect(gauge.getAttribute('aria-valuemax')).toBe('100')
    expect(gauge.getAttribute('aria-valuetext')).toBe('62 Go / 100 Go')
    expect(gauge.getAttribute('aria-label')).toBe('Stockage')
  })

  it('places the severity label outside the element that carries the progressbar role', () => {
    const fixture = setup()
    fixture.componentInstance.value.set(95)
    fixture.detectChanges()
    const severity = fixture.nativeElement.querySelector('.gbt-gauge-bar__tier')
    expect(severity).not.toBeNull()
    expect(track(fixture).contains(severity)).toBe(false)
  })

  it.each([
    [50, null],
    [70, 'Avertissement'],
    [89, 'Avertissement'],
    [90, 'Critique'],
    [100, 'Critique'],
  ])('at %d%%, announces severity "%s" spelled out', (percent, expected) => {
    const fixture = setup()
    fixture.componentInstance.value.set(percent)
    fixture.detectChanges()
    const severity = fixture.nativeElement.querySelector('.gbt-gauge-bar__tier')
    if (expected === null) {
      expect(severity).toBeNull()
    } else {
      expect(severity?.textContent?.trim()).toBe(expected)
    }
  })

  it('accepts thresholds different from the defaults', () => {
    @Component({
      standalone: true,
      imports: [GaugeBar],
      template: `
        <gbt-gauge-bar
          label="Connexions"
          [value]="30"
          [max]="100"
          formattedValue="30 / 100"
          warningLabel="Attention"
          criticalLabel="Saturé"
          [thresholds]="{ warning: 25, critical: 50 }"
        />
      `,
    })
    class ThresholdsHost {}
    const fixture = TestBed.createComponent(ThresholdsHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-gauge-bar__tier')?.textContent?.trim()).toBe(
      'Attention',
    )
  })

  it("for a zero maximum, doesn't divide by zero — in the visual fill as in the ARIA", () => {
    @Component({
      standalone: true,
      imports: [GaugeBar],
      template: `
        <gbt-gauge-bar
          label="Vide"
          [value]="5"
          [max]="0"
          formattedValue="5 / 0"
          warningLabel="Avertissement"
          criticalLabel="Critique"
        />
      `,
    })
    class ZeroMaxHost {}
    const fixture = TestBed.createComponent(ZeroMaxHost)
    fixture.detectChanges()
    const gauge = fixture.nativeElement.querySelector('[role="progressbar"]')
    expect(fixture.nativeElement.querySelector('.gbt-gauge-bar__fill').style.width).toBe('0%')
    expect(gauge.getAttribute('aria-valuenow')).toBe('0')
    expect(gauge.getAttribute('aria-valuemax')).toBe('100')
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
