import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { RadioGroup, type RadioOption } from './radio-group'

const OPTIONS: RadioOption[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
]

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RadioGroup],
  template: `
    <form [formGroup]="form">
      <gbt-radio-group label="Statut" [options]="options" formControlName="status" />
    </form>
  `,
})
class HostComponent {
  options = OPTIONS
  form = new FormGroup({ status: new FormControl<string | null>(null) })
}

describe('RadioGroup', () => {
  it('renders a label for each option', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Brouillon')
    expect(fixture.nativeElement.textContent).toContain('Publié')
    expect(fixture.nativeElement.textContent).toContain('Archivé')
  })

  it('reflects the form control value', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.status.setValue('published')
    fixture.detectChanges()

    const inputs: HTMLInputElement[] = [
      ...fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ]
    expect(inputs.map((i) => i.checked)).toEqual([false, true, false])
  })

  it('propagates a click back to the form control, keeping only one radio checked', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const inputs: HTMLInputElement[] = [
      ...fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ]
    inputs[2].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.status.value).toBe('archived')
    expect(inputs.map((i) => i.checked)).toEqual([false, false, true])
  })

  it('disables every native radio when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.status.disable()
    fixture.detectChanges()

    const inputs: HTMLInputElement[] = [
      ...fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ]
    expect(inputs.every((i) => i.disabled)).toBe(true)
  })

  it('disables only the option marked disabled', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, RadioGroup],
      template: `
        <form [formGroup]="form">
          <gbt-radio-group label="Statut" [options]="options" formControlName="status" />
        </form>
      `,
    })
    class PartiallyDisabledHostComponent {
      options: RadioOption[] = [
        { value: 'draft', label: 'Brouillon' },
        { value: 'published', label: 'Publié', disabled: true },
      ]
      form = new FormGroup({ status: new FormControl<string | null>(null) })
    }

    const fixture = TestBed.createComponent(PartiallyDisabledHostComponent)
    fixture.detectChanges()

    const inputs: HTMLInputElement[] = [
      ...fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ]
    expect(inputs.map((i) => i.disabled)).toEqual([false, true])
  })

  it('defaults to the vertical orientation', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-radio-group').getAttribute('data-orientation'),
    ).toBe('vertical')
  })

  it('applies the provided orientation', () => {
    const fixture = TestBed.createComponent(RadioGroup)
    fixture.componentRef.setInput('label', 'Statut')
    fixture.componentRef.setInput('options', OPTIONS)
    fixture.componentRef.setInput('orientation', 'horizontal')
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-radio-group').getAttribute('data-orientation'),
    ).toBe('horizontal')
  })

  it('renders the error message and wires aria-invalid/aria-describedby on the fieldset', () => {
    const fixture = TestBed.createComponent(RadioGroup)
    fixture.componentRef.setInput('label', 'Statut')
    fixture.componentRef.setInput('options', OPTIONS)
    fixture.componentRef.setInput('errorMessage', 'Choisissez un statut')
    fixture.detectChanges()

    const fieldset = fixture.nativeElement.querySelector('.gbt-radio-group')
    expect(fieldset.getAttribute('aria-invalid')).toBe('true')
    const errorId = fieldset.getAttribute('aria-describedby')
    expect(fixture.nativeElement.querySelector(`#${errorId}`).textContent).toContain(
      'Choisissez un statut',
    )
  })

  it('presents no accessibility violation, nothing selected', async () => {
    const fixture = TestBed.createComponent(RadioGroup)
    fixture.componentRef.setInput('label', 'Statut')
    fixture.componentRef.setInput('options', OPTIONS)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, an option selected and an error shown', async () => {
    const fixture = TestBed.createComponent(RadioGroup)
    fixture.componentRef.setInput('label', 'Statut')
    fixture.componentRef.setInput('options', OPTIONS)
    fixture.componentRef.setInput('errorMessage', 'Choisissez un statut')
    fixture.detectChanges()
    fixture.componentInstance.writeValue('draft')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
