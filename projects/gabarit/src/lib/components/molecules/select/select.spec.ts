import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Select, SelectOption } from './select'

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'read', label: 'read', icon: 'eye' },
  { value: 'write', label: 'write' },
]

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Select],
  template: `
    <form [formGroup]="form">
      <gbt-select label="Rôle" [options]="options" formControlName="role" />
    </form>
  `,
})
class SingleSelectHost {
  options = ROLE_OPTIONS
  form = new FormGroup({ role: new FormControl<string | null>(null) })
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Select],
  template: `
    <form [formGroup]="form">
      <gbt-select
        label="Sévérités"
        [options]="options"
        [multiple]="true"
        formControlName="severities"
      />
    </form>
  `,
})
class MultiSelectHost {
  options = ROLE_OPTIONS
  form = new FormGroup({ severities: new FormControl<string[]>([]) })
}

@Component({
  standalone: true,
  imports: [Select],

  template: `
    <!-- Stands in for gbt-modal's document-level Escape listener — not a
    real interactive control, so the a11y lint rules about focusability
    don't apply here. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div (keydown.escape)="ancestorEscapeCount = ancestorEscapeCount + 1">
      <gbt-select label="Rôle" [options]="options" />
    </div>
  `,
})
class SelectInsideEscapeListenerHost {
  options = ROLE_OPTIONS
  ancestorEscapeCount = 0
}

describe('Select', () => {
  it('reflects the form control value as the trigger label', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.componentInstance.form.controls.role.setValue('write')
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.textContent).toContain('write')
  })

  it('shows the placeholder when nothing is selected', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.textContent).toContain('Select…')
  })

  it('shows an English placeholder by default', () => {
    const fixture = TestBed.createComponent(Select)
    fixture.componentRef.setInput('options', [])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Select…')
  })

  it('opens the panel on trigger click and lists every option', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()

    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    expect(options.length).toBe(2)
    expect(options[0].textContent).toContain('read')
    expect(options[1].textContent).toContain('write')
  })

  it('keeps options out of the tab order — navigation is aria-activedescendant, not real focus', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-select__trigger').click()
    fixture.detectChanges()

    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    for (const option of options) {
      expect(option.getAttribute('tabindex')).toBe('-1')
    }
  })

  it('selecting an option updates the form control and closes the panel', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()

    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    options[1].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.role.value).toBe('write')
    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).toBeNull()
  })

  it('closes the panel when clicking outside', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).not.toBeNull()

    document.body.click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).toBeNull()
  })

  it('in multiple mode, accumulates selections and keeps the panel open', () => {
    const fixture = TestBed.createComponent(MultiSelectHost)
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()

    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    options[0].click()
    fixture.detectChanges()
    options[1].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.severities.value).toEqual(['read', 'write'])
    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).not.toBeNull()
  })

  it('in multiple mode, clicking a selected option again deselects it', () => {
    const fixture = TestBed.createComponent(MultiSelectHost)
    fixture.componentInstance.form.controls.severities.setValue(['read', 'write'])
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()

    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    options[0].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.severities.value).toEqual(['write'])
  })

  it('shows a checkmark next to selected options', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.componentInstance.form.controls.role.setValue('read')
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()

    const selectedOption = fixture.nativeElement.querySelector('.gbt-select__option--selected')
    expect(selectedOption).not.toBeNull()
    expect(selectedOption.querySelector('.gbt-select__option-check')).not.toBeNull()
  })

  it('disables the trigger button when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.role.disable()
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.disabled).toBe(true)
  })

  it('exposes aria-required on the trigger when required is set', () => {
    const fixture = TestBed.createComponent(Select<string>)
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.componentRef.setInput('required', true)
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.getAttribute('aria-required')).toBe('true')
  })

  it('names the trigger via aria-labelledby, not the native label\'s `for` — a role="combobox" button ignores `for` under HTML-AAM', () => {
    const fixture = TestBed.createComponent(SingleSelectHost)
    fixture.detectChanges()

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('.gbt-select__label')
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')

    const labelledBy = trigger.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()

    const accessibleName = labelledBy!
      .split(' ')
      .map((id) => fixture.nativeElement.querySelector(`#${id}`)?.textContent ?? '')
      .join(' ')
      .trim()

    expect(accessibleName).toContain('Rôle')
    expect(label.getAttribute('id')).toBe(labelledBy!.split(' ')[0])
  })

  it('associates an error message with the trigger via aria-describedby/aria-invalid', () => {
    const fixture = TestBed.createComponent(Select<string>)
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.componentRef.setInput('errorMessage', 'Ce champ est requis.')
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
    const describedBy = trigger.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const error: HTMLElement = fixture.nativeElement.querySelector(`#${describedBy}`)
    expect(error.textContent).toBe('Ce champ est requis.')
    expect(error.getAttribute('role')).toBe('alert')
  })

  it('uses an English default label for multiple selection', () => {
    const fixture = TestBed.createComponent(MultiSelectHost)
    fixture.componentInstance.form.controls.severities.setValue(['read', 'write'])
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.textContent).toContain('2 selected')
  })

  it('allows customizing the multiple-selection label', () => {
    const fixture = TestBed.createComponent(Select<string>)
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.componentRef.setInput('multiple', true)
    fixture.componentRef.setInput('selectedCountLabel', (count: number) => `${count} choisis`)
    fixture.componentRef.setInput('label', 'Rôles')
    fixture.detectChanges()
    fixture.componentInstance.writeValue(['read', 'write'])
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.textContent).toContain('2 choisis')
  })

  it('presents no accessibility violation, menu closed', async () => {
    const fixture = TestBed.createComponent(Select)
    fixture.componentRef.setInput('label', 'Rôle')
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, menu open', async () => {
    const fixture = TestBed.createComponent(Select)
    fixture.componentRef.setInput('label', 'Rôle')
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.detectChanges()
    fixture.nativeElement.querySelector('button').click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('namespaces the trigger id per instance, so two gbt-select instances on the same page never collide', () => {
    const first = TestBed.createComponent(Select)
    first.componentRef.setInput('label', 'Rôle')
    first.componentRef.setInput('options', ROLE_OPTIONS)
    first.detectChanges()

    const second = TestBed.createComponent(Select)
    second.componentRef.setInput('label', 'Rôle')
    second.componentRef.setInput('options', ROLE_OPTIONS)
    second.detectChanges()

    const firstTriggerId = first.nativeElement.querySelector('button').id
    const secondTriggerId = second.nativeElement.querySelector('button').id

    expect(firstTriggerId).toBeTruthy()
    expect(secondTriggerId).toBeTruthy()
    expect(firstTriggerId).not.toBe(secondTriggerId)
  })

  it('Escape on an open panel closes only the panel — it does not reach an ancestor Escape listener (e.g. gbt-modal)', () => {
    const fixture = TestBed.createComponent(SelectInsideEscapeListenerHost)
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).not.toBeNull()

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).toBeNull()
    expect(fixture.componentInstance.ancestorEscapeCount).toBe(0)
  })

  it('Escape on a closed trigger is left alone — it still reaches an ancestor Escape listener (e.g. gbt-modal)', () => {
    const fixture = TestBed.createComponent(SelectInsideEscapeListenerHost)
    fixture.detectChanges()

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(fixture.nativeElement.querySelector('.gbt-select__panel')).toBeNull()

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(fixture.componentInstance.ancestorEscapeCount).toBe(1)
  })
})
