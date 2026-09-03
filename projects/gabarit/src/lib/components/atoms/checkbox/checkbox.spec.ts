import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
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
