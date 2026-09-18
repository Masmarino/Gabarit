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

  it('defaults to the md size, opting into sm via a host class', () => {
    const fixture = TestBed.createComponent(Select)
    fixture.componentRef.setInput('label', 'Rôle')
    fixture.componentRef.setInput('options', ROLE_OPTIONS)
    fixture.detectChanges()
    expect(fixture.nativeElement.classList).not.toContain('gbt-select--sm')

    fixture.componentRef.setInput('size', 'sm')
    fixture.detectChanges()
    expect(fixture.nativeElement.classList).toContain('gbt-select--sm')
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

  describe('chips mode', () => {
    const colorOptions: SelectOption[] = [
      { value: 'bug', label: 'Bug', color: '#dc2626' },
      { value: 'feature', label: 'Feature', color: '#16a34a' },
    ]

    function setupChips(selection: string[] = []) {
      const fixture = TestBed.createComponent(Select<string>)
      fixture.componentRef.setInput('options', colorOptions)
      fixture.componentRef.setInput('multiple', true)
      fixture.componentRef.setInput('chips', true)
      fixture.detectChanges()
      if (selection.length > 0) {
        fixture.componentInstance.writeValue(selection)
        fixture.detectChanges()
      }
      return fixture
    }

    function removeButtons(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll<HTMLButtonElement>(
          '.gbt-select__chips gbt-tag .gbt-tag__remove',
        ),
      )
    }

    /**
     * jsdom has no layout: every `getBoundingClientRect()` is all zeros, so
     * panel positioning can only be exercised by giving the two anchors a
     * real geometry.
     */
    function stubRect(element: HTMLElement, box: { bottom: number; left: number; width: number }) {
      element.getBoundingClientRect = () =>
        ({
          x: box.left,
          y: 0,
          top: 0,
          bottom: box.bottom,
          left: box.left,
          right: box.left + box.width,
          width: box.width,
          height: box.bottom,
          toJSON: () => ({}),
        }) as DOMRect
    }

    it('renders no chip row when chips is false', () => {
      const fixture = TestBed.createComponent(Select)
      fixture.componentRef.setInput('options', colorOptions)
      fixture.componentRef.setInput('multiple', true)
      fixture.componentRef.setInput('chips', false)
      fixture.detectChanges()
      fixture.componentInstance.writeValue(['bug'])
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-select__chips')).toBeNull()
    })

    it('renders a removable Tag per selected option when chips and multiple are both true', () => {
      const fixture = setupChips(['bug', 'feature'])
      const tags = fixture.nativeElement.querySelectorAll('.gbt-select__chips gbt-tag')
      expect(tags.length).toBe(2)
      expect(fixture.nativeElement.textContent).toContain('Bug')
      expect(fixture.nativeElement.textContent).toContain('Feature')
    })

    it('deselects an option when its chip is removed, without opening the dropdown', () => {
      const fixture = setupChips()
      let changed: unknown = null
      fixture.componentInstance.registerOnChange((value) => (changed = value))
      fixture.componentInstance.writeValue(['bug', 'feature'])
      fixture.detectChanges()

      removeButtons(fixture)[0].click()
      fixture.detectChanges()

      expect(changed).toEqual(['feature'])
      expect(fixture.nativeElement.querySelectorAll('.gbt-select__chips gbt-tag').length).toBe(1)
      expect(fixture.nativeElement.querySelector('.gbt-select__panel')).toBeNull()
    })

    it('shows the placeholder in the trigger, not a selected count, when chips mode is active', () => {
      const fixture = TestBed.createComponent(Select<string>)
      fixture.componentRef.setInput('options', colorOptions)
      fixture.componentRef.setInput('multiple', true)
      fixture.componentRef.setInput('chips', true)
      fixture.componentRef.setInput('placeholder', 'Filtrer par label')
      fixture.detectChanges()
      fixture.componentInstance.writeValue(['bug', 'feature'])
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger-label')
      expect(trigger.textContent?.trim()).toBe('Filtrer par label')
    })

    it('renders chips read-only when disabled: no remove control, and no way to mutate the value', () => {
      const fixture = setupChips()
      let changed: unknown = null
      fixture.componentInstance.registerOnChange((value) => (changed = value))
      fixture.componentInstance.writeValue(['bug', 'feature'])
      fixture.detectChanges()
      expect(removeButtons(fixture).length).toBe(2)

      fixture.componentRef.setInput('disabled', true)
      fixture.detectChanges()

      // The chips stay visible — they are still the field's value — but carry
      // no clickable, tabbable remove control any more.
      expect(fixture.nativeElement.querySelectorAll('.gbt-select__chips gbt-tag').length).toBe(2)
      expect(removeButtons(fixture).length).toBe(0)

      // And the removal path itself refuses to run while disabled, so no
      // programmatic caller can bypass the disabled state either.
      const select = fixture.componentInstance as unknown as {
        removeChip(value: string, index: number): void
      }
      select.removeChip('bug', 0)
      fixture.detectChanges()

      expect(changed).toBeNull()
      expect(fixture.nativeElement.querySelectorAll('.gbt-select__chips gbt-tag').length).toBe(2)
    })

    it('renders chips read-only when the form control is disabled programmatically', () => {
      const fixture = setupChips(['bug'])
      expect(removeButtons(fixture).length).toBe(1)

      fixture.componentInstance.setDisabledState(true)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelectorAll('.gbt-select__chips gbt-tag').length).toBe(1)
      expect(removeButtons(fixture).length).toBe(0)
    })

    it('opens the panel below the chip row, never on top of its focusable remove buttons', () => {
      const fixture = setupChips(['bug', 'feature'])
      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      const chipRow: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__chips')
      stubRect(trigger, { bottom: 40, left: 12, width: 180 })
      stubRect(chipRow, { bottom: 78, left: 12, width: 180 })

      trigger.click()
      fixture.detectChanges()

      const panel: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__panel')
      // 78 (chip row bottom) + 6, not 40 (trigger bottom) + 6.
      expect(panel.style.top).toBe('84px')
      expect(panel.style.left).toBe('12px')
      expect(panel.style.width).toBe('180px')
    })

    it('still anchors the panel to the trigger when no chip row is rendered', () => {
      const fixture = TestBed.createComponent(Select<string>)
      fixture.componentRef.setInput('options', colorOptions)
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      stubRect(trigger, { bottom: 40, left: 12, width: 180 })

      trigger.click()
      fixture.detectChanges()

      const panel: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__panel')
      expect(panel.style.top).toBe('46px')
    })

    it('announces the selection count in a polite status region as chips are added and removed', () => {
      const fixture = setupChips()
      const region = (): HTMLElement =>
        fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]')

      // Present from the start, so later changes are announced as changes.
      expect(region()).not.toBeNull()
      expect(region().getAttribute('aria-atomic')).toBe('true')
      expect(region().textContent?.trim()).toBe('0 selected')

      fixture.componentInstance.writeValue(['bug', 'feature'])
      fixture.detectChanges()
      expect(region().textContent?.trim()).toBe('2 selected')

      removeButtons(fixture)[0].click()
      fixture.detectChanges()
      expect(region().textContent?.trim()).toBe('1 selected')
    })

    it('renders no status region outside chips mode', () => {
      const fixture = TestBed.createComponent(Select<string>)
      fixture.componentRef.setInput('options', colorOptions)
      fixture.componentRef.setInput('multiple', true)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull()
    })

    it('moves focus to a remaining chip after a removal, never to the body', () => {
      const fixture = setupChips(['bug', 'feature'])
      const buttons = removeButtons(fixture)
      buttons[0].focus()
      expect(document.activeElement).toBe(buttons[0])

      buttons[0].click()
      fixture.detectChanges()

      expect(document.activeElement).not.toBe(document.body)
      expect(document.activeElement).toBe(buttons[1])
      expect(buttons[1].isConnected).toBe(true)
    })

    it('moves focus back to the trigger when the last chip is removed', () => {
      const fixture = setupChips(['bug'])
      const button = removeButtons(fixture)[0]
      button.focus()

      button.click()
      fixture.detectChanges()

      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      expect(fixture.nativeElement.querySelector('.gbt-select__chips')).toBeNull()
      expect(document.activeElement).not.toBe(document.body)
      expect(document.activeElement).toBe(trigger)
    })

    it('marks the control as touched when a chip is removed without ever opening the panel', () => {
      const fixture = setupChips(['bug', 'feature'])
      let touched = false
      fixture.componentInstance.registerOnTouched(() => (touched = true))

      removeButtons(fixture)[0].click()
      fixture.detectChanges()

      expect(touched).toBe(true)
    })

    it('labels each chip remove button in English by default', () => {
      const fixture = setupChips(['bug', 'feature'])
      const labels = removeButtons(fixture).map((button) => button.getAttribute('aria-label'))
      expect(labels).toEqual(['Remove Bug', 'Remove Feature'])
    })

    it('allows overriding the chip remove label, like every other user-facing string', () => {
      const fixture = setupChips()
      fixture.componentRef.setInput('chipRemoveLabel', (label: string) => `Retirer ${label}`)
      fixture.componentInstance.writeValue(['bug'])
      fixture.detectChanges()
      expect(removeButtons(fixture)[0].getAttribute('aria-label')).toBe('Retirer Bug')
    })

    it('describes the trigger with the chip row, so the selection stays announced', () => {
      const fixture = setupChips(['bug', 'feature'])
      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      const chipRow: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__chips')

      const describedBy = trigger.getAttribute('aria-describedby')
      expect(describedBy).toBe(chipRow.id)
      expect(chipRow.id).toBeTruthy()

      const description: HTMLElement = fixture.nativeElement.querySelector(`#${describedBy}`)
      expect(description.textContent).toContain('Bug')
      expect(description.textContent).toContain('Feature')
    })

    it('drops the chip row from aria-describedby when nothing is selected', () => {
      const fixture = setupChips()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      expect(trigger.getAttribute('aria-describedby')).toBeNull()
    })

    it('keeps the error message in aria-describedby alongside the chip row', () => {
      const fixture = setupChips(['bug'])
      fixture.componentRef.setInput('errorMessage', 'Ce champ est requis.')
      fixture.detectChanges()

      const trigger: HTMLElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
      const ids = trigger.getAttribute('aria-describedby')?.split(' ') ?? []
      expect(ids.length).toBe(2)
      for (const id of ids) {
        expect(fixture.nativeElement.querySelector(`#${id}`)).not.toBeNull()
      }
      const errorId = ids[1]
      expect(fixture.nativeElement.querySelector(`#${errorId}`).textContent).toBe(
        'Ce champ est requis.',
      )
    })

    it('presents no accessibility violation in chips mode, panel closed', async () => {
      const fixture = setupChips(['bug', 'feature'])
      fixture.componentRef.setInput('label', 'Labels')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
