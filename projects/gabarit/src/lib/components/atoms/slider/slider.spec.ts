import { TestBed } from '@angular/core/testing'
import { Slider } from './slider'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(Slider)
  fixture.componentRef.setInput('label', 'Volume')
  fixture.detectChanges()
  return fixture
}

const input = (f: ReturnType<typeof setup>): HTMLInputElement =>
  f.nativeElement.querySelector('input[type="range"]')

describe('Slider', () => {
  it('defaults to min 0, max 100, step 1, value 0', () => {
    const fixture = setup()
    const el = input(fixture)
    expect(el.min).toBe('0')
    expect(el.max).toBe('100')
    expect(el.step).toBe('1')
    expect(el.value).toBe('0')
  })

  it('shows the written value (writeValue)', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(42)
    fixture.detectChanges()
    expect(input(fixture).value).toBe('42')
  })

  it('shows the formatted value by default', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(42)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-slider__value').textContent.trim()).toBe('42')
  })

  it('uses a custom formatValue function', () => {
    const fixture = setup()
    fixture.componentRef.setInput('formatValue', (v: number) => `${v}%`)
    fixture.componentInstance.writeValue(42)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-slider__value').textContent.trim()).toBe('42%')
  })

  it('hides the value readout when showValue is false', () => {
    const fixture = setup()
    fixture.componentRef.setInput('showValue', false)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-slider__value')).toBeNull()
  })

  it('emits the new value on input and calls onChange', () => {
    const fixture = setup()
    let emitted: number | null = null
    fixture.componentInstance.registerOnChange((v: number) => (emitted = v))

    const el = input(fixture)
    el.value = '30'
    el.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(emitted).toBe(30)
    expect(fixture.nativeElement.querySelector('.gbt-slider__value').textContent.trim()).toBe('30')
  })

  it('respects min/max/step inputs', () => {
    const fixture = setup()
    fixture.componentRef.setInput('min', 10)
    fixture.componentRef.setInput('max', 50)
    fixture.componentRef.setInput('step', 5)
    fixture.detectChanges()
    const el = input(fixture)
    expect(el.min).toBe('10')
    expect(el.max).toBe('50')
    expect(el.step).toBe('5')
  })

  it('disables the input when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(input(fixture).disabled).toBe(true)
  })

  it('disables via setDisabledState (form-driven)', () => {
    const fixture = setup()
    fixture.componentInstance.setDisabledState(true)
    fixture.detectChanges()
    expect(input(fixture).disabled).toBe(true)
  })

  it('renders the label', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('label').textContent).toContain('Volume')
  })

  it('renders the error message with role alert and links it via aria-describedby', () => {
    const fixture = setup()
    fixture.componentRef.setInput('errorMessage', 'Valeur invalide')
    fixture.detectChanges()
    const error = fixture.nativeElement.querySelector('[role="alert"]')
    expect(error.textContent.trim()).toBe('Valeur invalide')
    expect(input(fixture).getAttribute('aria-describedby')).toBe(error.id)
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with an error', async () => {
    const fixture = setup()
    fixture.componentRef.setInput('errorMessage', 'Valeur invalide')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
