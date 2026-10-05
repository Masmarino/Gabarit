import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Checkbox } from './checkbox'

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Checkbox],
  template: `
    <form [formGroup]="form">
      <gbt-checkbox label="Super-administrateur" formControlName="isSuperAdmin" />
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({ isSuperAdmin: new FormControl(false) })
}

describe('Checkbox', () => {
  it('reflects the form control value', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.isSuperAdmin.setValue(true)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    expect(input.checked).toBe(true)
  })

  it('propagates a click back to the form control', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    input.click()

    expect(fixture.componentInstance.form.controls.isSuperAdmin.value).toBe(true)
  })

  it('disables the native input when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.isSuperAdmin.disable()
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    expect(input.disabled).toBe(true)
  })

  it('presents no accessibility violation unchecked', async () => {
    const fixture = TestBed.createComponent(Checkbox)
    fixture.componentRef.setInput('label', 'Super-administrateur')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation checked', async () => {
    const fixture = TestBed.createComponent(Checkbox)
    fixture.componentRef.setInput('label', 'Super-administrateur')
    fixture.componentInstance.writeValue(true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Checkbox hint', () => {
  function setup(hint = '') {
    const fixture = TestBed.createComponent(Checkbox)
    fixture.componentRef.setInput('label', 'Remember me')
    if (hint) fixture.componentRef.setInput('hint', hint)
    fixture.detectChanges()
    return fixture
  }
  const input = (f: ReturnType<typeof setup>): HTMLInputElement =>
    f.nativeElement.querySelector('input')

  it("keeps today's rendering without a hint: no hint element, no describedby, no block host class", () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-checkbox__hint')).toBeNull()
    expect(input(fixture).hasAttribute('aria-describedby')).toBe(false)
    expect(fixture.nativeElement.classList.contains('gbt-checkbox-host--hint')).toBe(false)
  })

  it('renders the hint under the label and links it with aria-describedby', () => {
    const fixture = setup('Only on this device.')
    const hint: HTMLElement = fixture.nativeElement.querySelector('.gbt-checkbox__hint')
    expect(hint.textContent?.trim()).toBe('Only on this device.')
    expect(input(fixture).getAttribute('aria-describedby')).toBe(hint.id)
    expect(fixture.nativeElement.classList.contains('gbt-checkbox-host--hint')).toBe(true)
  })

  it('keeps the hint outside the label element', () => {
    const fixture = setup('Only on this device.')
    const label: HTMLElement = fixture.nativeElement.querySelector('label')
    expect(label.contains(fixture.nativeElement.querySelector('.gbt-checkbox__hint'))).toBe(false)
  })

  it('has no a11y violations with a hint', async () => {
    await expectNoA11yViolations(setup('Only on this device.').nativeElement)
  })
})

describe('Checkbox checked model (no Angular forms)', () => {
  @Component({
    standalone: true,
    imports: [Checkbox],
    template: `<gbt-checkbox
      label="Push"
      [checked]="on()"
      (checkedChange)="changes.push($event); on.set($event)"
    />`,
  })
  class ControlledHost {
    on = signal(false)
    changes: boolean[] = []
  }

  const native = (f: { nativeElement: HTMLElement }): HTMLInputElement =>
    f.nativeElement.querySelector('input') as HTMLInputElement

  it('defaults to unchecked', () => {
    const fixture = TestBed.createComponent(Checkbox)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(false)
    expect(fixture.componentInstance.checked()).toBe(false)
  })

  it('reflects [checked] on the native input', () => {
    const fixture = TestBed.createComponent(ControlledHost)
    fixture.componentInstance.on.set(true)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(true)
  })

  it('emits checkedChange with the new value when toggled by the user', () => {
    const fixture = TestBed.createComponent(ControlledHost)
    fixture.detectChanges()

    native(fixture).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.changes).toEqual([true])
    expect(fixture.componentInstance.on()).toBe(true)

    native(fixture).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.changes).toEqual([true, false])
  })

  it('follows the parent when it changes the bound value afterwards', () => {
    const fixture = TestBed.createComponent(ControlledHost)
    fixture.detectChanges()
    fixture.componentInstance.on.set(true)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(true)
    fixture.componentInstance.on.set(false)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(false)
  })

  it('supports [(checked)] two-way binding', () => {
    @Component({
      standalone: true,
      imports: [Checkbox],
      template: `<gbt-checkbox label="Push" [(checked)]="on" />`,
    })
    class TwoWayHost {
      on = signal(true)
    }
    const fixture = TestBed.createComponent(TwoWayHost)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(true)
    native(fixture).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.on()).toBe(false)
  })

  it('still works as a ControlValueAccessor next to the model', () => {
    const fixture = TestBed.createComponent(Checkbox)
    fixture.componentInstance.writeValue(true)
    fixture.detectChanges()
    expect(native(fixture).checked).toBe(true)
    expect(fixture.componentInstance.checked()).toBe(true)
  })

  it('has no a11y violations when driven by [checked]', async () => {
    const fixture = TestBed.createComponent(ControlledHost)
    fixture.componentInstance.on.set(true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
