import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Switch } from './switch'

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Switch],
  template: `
    <form [formGroup]="form">
      <gbt-switch label="Notifications" formControlName="notifications" />
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({ notifications: new FormControl(false) })
}

describe('Switch', () => {
  it('renders the label text', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Notifications')
  })

  it('reflects the form control value', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.notifications.setValue(true)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    expect(input.checked).toBe(true)
  })

  it('propagates a click back to the form control', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    input.click()

    expect(fixture.componentInstance.form.controls.notifications.value).toBe(true)
  })

  it('disables the native input when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.notifications.disable()
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    expect(input.disabled).toBe(true)
  })

  it('uses role="switch" rather than the default checkbox role', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]')
    expect(input.getAttribute('role')).toBe('switch')
  })

  it('presents no accessibility violation unchecked', async () => {
    const fixture = TestBed.createComponent(Switch)
    fixture.componentRef.setInput('label', 'Notifications')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation checked', async () => {
    const fixture = TestBed.createComponent(Switch)
    fixture.componentRef.setInput('label', 'Notifications')
    fixture.componentInstance.writeValue(true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
