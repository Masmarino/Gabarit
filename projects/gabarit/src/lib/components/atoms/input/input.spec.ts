import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { GbtInput } from './input'

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, GbtInput],
  template: `
    <form [formGroup]="form">
      <gbt-input label="Nom" formControlName="name" [type]="type" />
    </form>
  `,
})
class HostComponent {
  type: 'text' | 'password' = 'text'
  form = new FormGroup({ name: new FormControl('') })
}

describe('GbtInput', () => {
  it('writes the form control value into the rendered input', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.name.setValue('florian')
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.value).toBe('florian')
  })

  it('propagates typed input back to the form control', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    input.value = 'new-value'
    input.dispatchEvent(new Event('input'))

    expect(fixture.componentInstance.form.controls.name.value).toBe('new-value')
  })

  it('masks a password-type input until the visibility toggle is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.type = 'password'
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.type).toBe('password')

    fixture.nativeElement.querySelector('.gbt-input__toggle').click()
    fixture.detectChanges()

    expect(input.type).toBe('text')
  })

  it('uses the English defaults for the password-visibility toggle labels', () => {
    const fixture = TestBed.createComponent(GbtInput)
    fixture.componentRef.setInput('type', 'password')
    fixture.detectChanges()

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-input__toggle')
    expect(toggle.getAttribute('aria-label')).toBe('Show password')

    toggle.click()
    fixture.detectChanges()

    expect(toggle.getAttribute('aria-label')).toBe('Hide password')
  })

  it('renders overridden password-visibility toggle labels', () => {
    const fixture = TestBed.createComponent(GbtInput)
    fixture.componentRef.setInput('type', 'password')
    fixture.componentRef.setInput('showPasswordLabel', 'Afficher le mot de passe')
    fixture.componentRef.setInput('hidePasswordLabel', 'Masquer le mot de passe')
    fixture.detectChanges()

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-input__toggle')
    expect(toggle.getAttribute('aria-label')).toBe('Afficher le mot de passe')

    toggle.click()
    fixture.detectChanges()

    expect(toggle.getAttribute('aria-label')).toBe('Masquer le mot de passe')
  })

  it('disables the native input when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.name.disable()
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.disabled).toBe(true)
  })

  it('presents no accessibility violation with a label', async () => {
    const fixture = TestBed.createComponent(GbtInput)
    fixture.componentRef.setInput('label', 'Nom')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation in error state', async () => {
    const fixture = TestBed.createComponent(GbtInput)
    fixture.componentRef.setInput('label', 'Nom')
    fixture.componentRef.setInput('errorMessage', 'Ce champ est obligatoire')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
