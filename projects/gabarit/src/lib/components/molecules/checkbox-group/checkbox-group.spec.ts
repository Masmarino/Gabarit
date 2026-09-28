import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import {
  CheckboxGroup,
  type CheckboxGroupOption,
  type CheckboxGroupSection,
} from './checkbox-group'

const OPTIONS: CheckboxGroupOption[] = [
  { value: 'push', label: 'Push' },
  { value: 'issues', label: 'Issues' },
  { value: 'releases', label: 'Releases' },
]

const GROUPS: CheckboxGroupSection[] = [
  {
    label: 'Code',
    options: [
      { value: 'push', label: 'Push' },
      { value: 'tag', label: 'Tag' },
    ],
  },
  {
    label: 'Tracking',
    options: [
      { value: 'issue', label: 'Issue' },
      { value: 'comment', label: 'Comment' },
    ],
  },
]

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CheckboxGroup],
  template: `
    <form [formGroup]="form">
      <gbt-checkbox-group legend="Events" [options]="options" formControlName="events" />
    </form>
  `,
})
class ReactiveHost {
  options = OPTIONS
  form = new FormGroup({ events: new FormControl<string[]>(['issues']) })
}

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CheckboxGroup<string>)
  fixture.componentRef.setInput('legend', 'Events')
  fixture.componentRef.setInput('options', OPTIONS)
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value)
  fixture.detectChanges()
  return fixture
}

const boxes = (root: HTMLElement): HTMLInputElement[] => [
  ...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
]
const checkedOf = (root: HTMLElement): boolean[] => boxes(root).map((b) => b.checked)

describe('CheckboxGroup', () => {
  describe('structure', () => {
    it('renders a fieldset named by its legend, one checkbox per option', () => {
      const fixture = setup()
      const fieldset: HTMLFieldSetElement = fixture.nativeElement.querySelector('fieldset')
      expect(fieldset).not.toBeNull()
      expect(fieldset.querySelector('legend')?.textContent?.trim()).toBe('Events')
      expect(boxes(fixture.nativeElement).length).toBe(3)
      expect(
        [...fixture.nativeElement.querySelectorAll('label')].map((l: HTMLElement) =>
          l.textContent?.trim(),
        ),
      ).toEqual(['Push', 'Issues', 'Releases'])
    })

    it('gives every checkbox a unique id derived from the group id', () => {
      const fixture = setup({ id: 'events' })
      expect(boxes(fixture.nativeElement).map((b) => b.id)).toEqual([
        'events-0',
        'events-1',
        'events-2',
      ])
    })

    it('renders named sections as labelled role="group" blocks after the flat options', () => {
      const fixture = setup({ options: [], groups: GROUPS, id: 'ev' })
      const groups: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('[role="group"]')]
      expect(groups.length).toBe(2)
      const names = groups.map((g) => {
        const label = fixture.nativeElement.querySelector(`#${g.getAttribute('aria-labelledby')}`)
        return label?.textContent?.trim()
      })
      expect(names).toEqual(['Code', 'Tracking'])
      expect(groups.map((g) => boxes(g).length)).toEqual([2, 2])
    })

    it('renders flat options and sections together', () => {
      const fixture = setup({ groups: GROUPS })
      expect(boxes(fixture.nativeElement).length).toBe(3 + 4)
    })

    it('adds no role="group" wrapper for a flat list', () => {
      const fixture = setup()
      expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull()
    })

    it('renders an option hint through the checkbox hint', () => {
      const fixture = setup({
        options: [{ value: 'a', label: 'A', hint: 'Fires on every push.' }],
      })
      const box = boxes(fixture.nativeElement)[0]
      const hint = fixture.nativeElement.querySelector('.gbt-checkbox__hint')
      expect(hint.textContent.trim()).toBe('Fires on every push.')
      expect(box.getAttribute('aria-describedby')).toBe(hint.id)
    })

    it('marks the legend as required with an asterisk', () => {
      const fixture = setup({ required: true })
      expect(fixture.nativeElement.querySelector('legend').textContent.trim()).toBe('Events *')
    })

    it('keeps a hidden legend in the DOM for assistive technology', () => {
      const fixture = setup({ hideLegend: true })
      const legend: HTMLElement = fixture.nativeElement.querySelector('legend')
      expect(legend.textContent?.trim()).toBe('Events')
      expect(legend.classList.contains('gbt-checkbox-group__legend--hidden')).toBe(true)
    })
  })

  describe('columns', () => {
    it('defaults to one column and sets nothing inline', () => {
      const fixture = setup()
      const list: HTMLElement = fixture.nativeElement.querySelector('.gbt-checkbox-group__list')
      expect(list.style.gridTemplateColumns).toBe('')
    })

    it('applies a fixed column count to the flat list', () => {
      const fixture = setup({ columns: 2 })
      const list: HTMLElement = fixture.nativeElement.querySelector('.gbt-checkbox-group__list')
      expect(list.style.gridTemplateColumns).toContain('repeat(2')
    })

    it('applies the columns to the sections when there are groups, not to their lists', () => {
      const fixture = setup({ options: [], groups: GROUPS, columns: 'auto' })
      const sections: HTMLElement = fixture.nativeElement.querySelector(
        '.gbt-checkbox-group__sections',
      )
      const list: HTMLElement = fixture.nativeElement.querySelector('.gbt-checkbox-group__list')
      expect(sections.style.gridTemplateColumns).toContain('auto-fill')
      expect(list.style.gridTemplateColumns).toBe('')
    })
  })

  describe('value model (no Angular forms)', () => {
    it('checks the boxes whose value is in [value]', () => {
      const fixture = setup({ value: ['push', 'releases'] })
      expect(checkedOf(fixture.nativeElement)).toEqual([true, false, true])
    })

    it('updates the model when a box is toggled', () => {
      const fixture = setup()
      boxes(fixture.nativeElement)[1].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual(['issues'])
      expect(checkedOf(fixture.nativeElement)).toEqual([false, true, false])

      boxes(fixture.nativeElement)[1].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual([])
    })

    it('emits the values in option order, whatever the click order', () => {
      const fixture = setup()
      boxes(fixture.nativeElement)[2].click()
      fixture.detectChanges()
      boxes(fixture.nativeElement)[0].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual(['push', 'releases'])
    })

    it('keeps values that match no option', () => {
      const fixture = setup({ value: ['legacy'] })
      boxes(fixture.nativeElement)[0].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual(['push', 'legacy'])
    })

    it('supports [(value)] two-way binding', () => {
      @Component({
        standalone: true,
        imports: [CheckboxGroup],
        template: `<gbt-checkbox-group legend="Events" [options]="options" [(value)]="events" />`,
      })
      class TwoWayHost {
        options = OPTIONS
        events = signal(['push'])
      }
      const fixture = TestBed.createComponent(TwoWayHost)
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([true, false, false])

      boxes(fixture.nativeElement)[1].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.events()).toEqual(['push', 'issues'])

      fixture.componentInstance.events.set([])
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([false, false, false])
    })

    it('compares by identity, so it works with object values too', () => {
      const a = { id: 1 }
      const b = { id: 2 }
      const fixture = TestBed.createComponent(CheckboxGroup<{ id: number }>)
      fixture.componentRef.setInput('legend', 'Objects')
      fixture.componentRef.setInput('options', [
        { value: a, label: 'A' },
        { value: b, label: 'B' },
      ])
      fixture.componentRef.setInput('value', [b])
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([false, true])
      boxes(fixture.nativeElement)[0].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual([a, b])
    })
  })

  describe('reactive forms', () => {
    it('reflects the form control value', () => {
      const fixture = TestBed.createComponent(ReactiveHost)
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([false, true, false])

      fixture.componentInstance.form.controls.events.setValue(['push', 'releases'])
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([true, false, true])
    })

    it('writes the toggled values back to the form control and marks it touched', () => {
      const fixture = TestBed.createComponent(ReactiveHost)
      fixture.detectChanges()
      const control = fixture.componentInstance.form.controls.events

      boxes(fixture.nativeElement)[0].click()
      fixture.detectChanges()

      expect(control.value).toEqual(['push', 'issues'])
      expect(control.touched).toBe(true)
      expect(control.dirty).toBe(true)
    })

    it('treats null as an empty selection', () => {
      const fixture = TestBed.createComponent(ReactiveHost)
      fixture.detectChanges()
      fixture.componentInstance.form.controls.events.setValue(null)
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([false, false, false])
    })

    it('disables every checkbox when the control is disabled', () => {
      const fixture = TestBed.createComponent(ReactiveHost)
      fixture.detectChanges()
      fixture.componentInstance.form.controls.events.disable()
      fixture.detectChanges()
      expect(boxes(fixture.nativeElement).every((b) => b.disabled)).toBe(true)
    })
  })

  describe('ngModel', () => {
    @Component({
      standalone: true,
      imports: [FormsModule, CheckboxGroup],
      template: `<gbt-checkbox-group legend="Events" [options]="options" [(ngModel)]="events" />`,
    })
    class NgModelHost {
      options = OPTIONS
      events = signal<string[]>(['issues'])
    }

    it('round-trips through [(ngModel)]', async () => {
      const fixture = TestBed.createComponent(NgModelHost)
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      expect(checkedOf(fixture.nativeElement)).toEqual([false, true, false])

      boxes(fixture.nativeElement)[2].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.events()).toEqual(['issues', 'releases'])
    })
  })

  describe('disabled', () => {
    it('disables the whole group', () => {
      const fixture = setup({ disabled: true })
      expect(boxes(fixture.nativeElement).every((b) => b.disabled)).toBe(true)
    })

    it('disables a single option only', () => {
      const fixture = setup({
        options: [OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]],
      })
      expect(boxes(fixture.nativeElement).map((b) => b.disabled)).toEqual([false, true, false])
    })
  })

  describe('hint and error', () => {
    it('adds no description by default', () => {
      const fixture = setup()
      const fieldset: HTMLElement = fixture.nativeElement.querySelector('fieldset')
      expect(fieldset.hasAttribute('aria-describedby')).toBe(false)
      expect(fieldset.hasAttribute('aria-invalid')).toBe(false)
      expect(fixture.nativeElement.querySelector('.gbt-checkbox-group__hint')).toBeNull()
    })

    it('links the hint to the fieldset with aria-describedby', () => {
      const fixture = setup({ hint: 'Pick at least one.' })
      const fieldset: HTMLElement = fixture.nativeElement.querySelector('fieldset')
      const hint = fixture.nativeElement.querySelector('.gbt-checkbox-group__hint')
      expect(hint.textContent.trim()).toBe('Pick at least one.')
      expect(fieldset.getAttribute('aria-describedby')).toBe(hint.id)
    })

    it('replaces the hint with the error and flags the group invalid', () => {
      const fixture = setup({ hint: 'Pick at least one.', errorMessage: 'Select an event.' })
      const fieldset: HTMLElement = fixture.nativeElement.querySelector('fieldset')
      const error = fixture.nativeElement.querySelector('.gbt-checkbox-group__error')
      expect(error.getAttribute('role')).toBe('alert')
      expect(error.textContent.trim()).toBe('Select an event.')
      expect(fixture.nativeElement.querySelector('.gbt-checkbox-group__hint')).toBeNull()
      expect(fieldset.getAttribute('aria-describedby')).toBe(error.id)
      expect(fieldset.getAttribute('aria-invalid')).toBe('true')
    })
  })

  describe('keyboard', () => {
    it('leaves every checkbox in the natural tab order (Space toggles natively)', () => {
      const fixture = setup({ groups: GROUPS })
      expect(boxes(fixture.nativeElement).every((b) => b.tabIndex === 0)).toBe(true)
    })

    it('does not swallow Space or Enter key events', () => {
      const fixture = setup()
      const box = boxes(fixture.nativeElement)[0]
      const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      box.dispatchEvent(space)
      expect(space.defaultPrevented).toBe(false)
    })

    it('reports a label click like a box click', () => {
      const fixture = setup()
      fixture.nativeElement.querySelector('label').click()
      fixture.detectChanges()
      expect(fixture.componentInstance.value()).toEqual(['push'])
    })
  })

  describe('accessibility', () => {
    it('has no a11y violations, flat', async () => {
      await expectNoA11yViolations(setup().nativeElement)
    })

    it('has no a11y violations with sections, hint, checked boxes and a disabled option', async () => {
      const fixture = setup({
        options: [],
        groups: [
          GROUPS[0],
          { label: 'Tracking', options: [{ value: 'issue', label: 'Issue', disabled: true }] },
        ],
        hint: 'Pick at least one.',
        value: ['push'],
        required: true,
      })
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('has no a11y violations with an error and a hidden legend', async () => {
      const fixture = setup({ errorMessage: 'Select an event.', hideLegend: true })
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
