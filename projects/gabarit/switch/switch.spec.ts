import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
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

describe('Switch hint', () => {
  function setup(hint = '') {
    const fixture = TestBed.createComponent(Switch)
    fixture.componentRef.setInput('label', 'Notifications')
    if (hint) fixture.componentRef.setInput('hint', hint)
    fixture.detectChanges()
    return fixture
  }
  const input = (f: ReturnType<typeof setup>): HTMLInputElement =>
    f.nativeElement.querySelector('input')

  it("keeps today's rendering without a hint: no hint element, no describedby, no block host class", () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-switch__hint')).toBeNull()
    expect(input(fixture).hasAttribute('aria-describedby')).toBe(false)
    expect(fixture.nativeElement.classList.contains('gbt-switch-host--hint')).toBe(false)
  })

  it('renders the hint under the label and links it with aria-describedby', () => {
    const fixture = setup('Sent once a day.')
    const hint: HTMLElement = fixture.nativeElement.querySelector('.gbt-switch__hint')
    expect(hint.textContent?.trim()).toBe('Sent once a day.')
    expect(hint.id).toBeTruthy()
    expect(input(fixture).getAttribute('aria-describedby')).toBe(hint.id)
    expect(fixture.nativeElement.classList.contains('gbt-switch-host--hint')).toBe(true)
  })

  it('keeps the hint out of the accessible name (it is a description)', () => {
    const fixture = setup('Sent once a day.')
    const label: HTMLElement = fixture.nativeElement.querySelector('label')
    expect(label.contains(fixture.nativeElement.querySelector('.gbt-switch__hint'))).toBe(false)
  })

  it('derives the hint id from a custom id', () => {
    const fixture = TestBed.createComponent(Switch)
    fixture.componentRef.setInput('id', 'digest')
    fixture.componentRef.setInput('label', 'Digest')
    fixture.componentRef.setInput('hint', 'Daily.')
    fixture.detectChanges()
    expect(input(fixture).getAttribute('aria-describedby')).toBe('digest-hint')
    expect(fixture.nativeElement.querySelector('#digest-hint')).not.toBeNull()
  })

  it('removes the hint again when it is cleared', () => {
    const fixture = setup('Sent once a day.')
    fixture.componentRef.setInput('hint', '')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-switch__hint')).toBeNull()
    expect(input(fixture).hasAttribute('aria-describedby')).toBe(false)
  })

  it('has no a11y violations with a hint', async () => {
    const fixture = setup('Sent once a day.')
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
