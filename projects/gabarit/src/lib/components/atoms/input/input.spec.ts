import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { GbtInput } from './input'

const SCSS_DIR = join(process.cwd(), 'projects/gabarit/src/lib/components/atoms/input')

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
  type: 'text' | 'password' | 'email' = 'text'
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

  it('renders the email type on the native input', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.type = 'email'
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    expect(input.getAttribute('type')).toBe('email')
  })

  it('emits committed on blur, with the value the user settled on', () => {
    const fixture = TestBed.createComponent(GbtInput)
    const committed: string[] = []
    fixture.componentInstance.committed.subscribe((value) => committed.push(value))
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input')
    input.value = '2'
    input.dispatchEvent(new Event('input'))
    input.value = '24'
    input.dispatchEvent(new Event('input'))
    expect(committed).toEqual([])

    input.dispatchEvent(new Event('blur'))
    expect(committed).toEqual(['24'])
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

  describe("defaults keep today's rendering", () => {
    function render(inputs: Record<string, unknown> = { label: 'Nom' }) {
      const fixture = TestBed.createComponent(GbtInput)
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      const host: HTMLElement = fixture.nativeElement
      return { fixture, host, field: host.querySelector('input')! }
    }

    it('renders a visible label, a text input and nothing else', () => {
      const { host, field } = render()
      expect(field.getAttribute('type')).toBe('text')
      expect(host.querySelector('label')!.className).not.toContain('gbt-input__label--hidden')
      expect(host.querySelector('.gbt-input__hint')).toBeNull()
      expect(host.querySelector('.gbt-input__leading')).toBeNull()
      expect(host.querySelector('.gbt-input__error')).toBeNull()
    })

    it('leaves every new native attribute off the input', () => {
      const { field } = render()
      for (const attribute of [
        'inputmode',
        'spellcheck',
        'autocapitalize',
        'enterkeyhint',
        'maxlength',
        'min',
        'max',
        'aria-describedby',
        'aria-invalid',
        'role',
        'aria-autocomplete',
        'aria-expanded',
        'aria-controls',
        'aria-activedescendant',
      ]) {
        expect(field.hasAttribute(attribute), attribute).toBe(false)
      }
      expect(field.getAttribute('autocomplete')).toBe('off')
    })

    it('has no size or mono modifier on the root', () => {
      const { host } = render()
      const root = host.querySelector('.gbt-input')!
      expect(root.classList.contains('gbt-input--sm')).toBe(false)
      expect(root.classList.contains('gbt-input--mono')).toBe(false)
      expect(root.classList.contains('gbt-input--leading')).toBe(false)
    })
  })

  describe('hint', () => {
    it('renders the hint under the field and links it with aria-describedby', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Nom du dépôt')
      fixture.componentRef.setInput('hint', 'Lettres, chiffres, - et _ uniquement.')
      fixture.detectChanges()

      const field: HTMLInputElement = fixture.nativeElement.querySelector('input')
      const hint: HTMLElement = fixture.nativeElement.querySelector('.gbt-input__hint')
      expect(hint.textContent).toContain('Lettres, chiffres')
      expect(field.getAttribute('aria-describedby')).toBe(hint.id)
      expect(field.hasAttribute('aria-invalid')).toBe(false)
    })

    it('hides the hint, and drops it from aria-describedby, while an error shows', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Nom du dépôt')
      fixture.componentRef.setInput('hint', 'Lettres, chiffres, - et _ uniquement.')
      fixture.componentRef.setInput('errorMessage', 'Ce nom est déjà pris')
      fixture.detectChanges()

      const field: HTMLInputElement = fixture.nativeElement.querySelector('input')
      expect(fixture.nativeElement.querySelector('.gbt-input__hint')).toBeNull()
      const error: HTMLElement = fixture.nativeElement.querySelector('.gbt-input__error')
      expect(field.getAttribute('aria-describedby')).toBe(error.id)
      expect(field.getAttribute('aria-invalid')).toBe('true')
    })

    it('brings the hint back once the error clears', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('hint', 'Aide')
      fixture.componentRef.setInput('errorMessage', 'Erreur')
      fixture.detectChanges()
      fixture.componentRef.setInput('errorMessage', null)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('.gbt-input__hint')).not.toBeNull()
      expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
        fixture.nativeElement.querySelector('.gbt-input__hint').id,
      )
    })

    it('namespaces the hint id per instance', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('id', 'repo-name')
      fixture.componentRef.setInput('hint', 'Aide')
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-input__hint').id).toBe('repo-name-hint')
    })

    it('does not use role=alert for a hint — it is not an announcement', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('hint', 'Aide')
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-input__hint').hasAttribute('role')).toBe(
        false,
      )
    })

    it('presents no accessibility violation with a hint, with and without an error', async () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Nom')
      fixture.componentRef.setInput('hint', 'Aide')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)

      fixture.componentRef.setInput('errorMessage', 'Erreur')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('hideLabel', () => {
    it('keeps the label in the DOM, associated with the field, but visually hidden', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Rechercher un dépôt')
      fixture.componentRef.setInput('hideLabel', true)
      fixture.detectChanges()

      const label: HTMLLabelElement = fixture.nativeElement.querySelector('label')
      const field: HTMLInputElement = fixture.nativeElement.querySelector('input')
      expect(label.textContent).toContain('Rechercher un dépôt')
      expect(label.htmlFor).toBe(field.id)
      expect(label.classList.contains('gbt-input__label--hidden')).toBe(true)
      const style = getComputedStyle(label)
      expect(style.position).toBe('absolute')
      expect(style.width).toBe('1px')
    })

    it('shows the label again when hideLabel is off', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Nom')
      fixture.detectChanges()
      const label: HTMLLabelElement = fixture.nativeElement.querySelector('label')
      expect(label.classList.contains('gbt-input__label--hidden')).toBe(false)
      expect(getComputedStyle(label).position).not.toBe('absolute')
    })

    it('names the field for assistive technology with a hidden label', async () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Rechercher')
      fixture.componentRef.setInput('hideLabel', true)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('size, mono and leading icon', () => {
    it('adds the sm modifier for size sm only', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Nom')
      fixture.detectChanges()
      const root: HTMLElement = fixture.nativeElement.querySelector('.gbt-input')
      expect(root.classList.contains('gbt-input--sm')).toBe(false)

      fixture.componentRef.setInput('size', 'sm')
      fixture.detectChanges()
      expect(root.classList.contains('gbt-input--sm')).toBe(true)

      fixture.componentRef.setInput('size', 'md')
      fixture.detectChanges()
      expect(root.classList.contains('gbt-input--sm')).toBe(false)
    })

    it('makes the sm input shorter than the md one', () => {
      const scss = readFileSync(join(SCSS_DIR, 'input.scss'), 'utf8')
      expect(scss).toMatch(/&--sm[\s\S]*?padding:/)
    })

    it('adds the mono modifier and a monospace font stack', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('mono', true)
      fixture.detectChanges()
      const root: HTMLElement = fixture.nativeElement.querySelector('.gbt-input')
      expect(root.classList.contains('gbt-input--mono')).toBe(true)
      const scss = readFileSync(join(SCSS_DIR, 'input.scss'), 'utf8')
      expect(scss).toMatch(/--gbt-font-mono,\s*'IBM Plex Mono',\s*ui-monospace/)
    })

    it('renders a decorative leading icon and makes room for it', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Rechercher')
      fixture.componentRef.setInput('leadingIcon', 'search')
      fixture.detectChanges()

      const icon: HTMLElement = fixture.nativeElement.querySelector('.gbt-input__leading')
      expect(icon).not.toBeNull()
      expect(icon.querySelector('gbt-icon')).not.toBeNull()
      expect(icon.getAttribute('aria-hidden')).toBe('true')
      const root: HTMLElement = fixture.nativeElement.querySelector('.gbt-input')
      expect(root.classList.contains('gbt-input--leading')).toBe(true)
    })

    it('leaves no leading icon when none is given', () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-input__leading')).toBeNull()
    })

    it('presents no accessibility violation with sm, mono and a leading icon', async () => {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Rechercher')
      fixture.componentRef.setInput('size', 'sm')
      fixture.componentRef.setInput('mono', true)
      fixture.componentRef.setInput('leadingIcon', 'search')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('native attributes', () => {
    function render(inputs: Record<string, unknown>) {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Champ')
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      return { fixture, field: fixture.nativeElement.querySelector('input') as HTMLInputElement }
    }

    it.each(['number', 'search', 'url'] as const)('supports type=%s', (type) => {
      const { field } = render({ type })
      expect(field.getAttribute('type')).toBe(type)
    })

    it('does not show the password toggle for the new types', () => {
      const { fixture } = render({ type: 'search' })
      expect(fixture.nativeElement.querySelector('.gbt-input__toggle')).toBeNull()
    })

    it('renders inputmode, spellcheck, autocapitalize and enterkeyhint', () => {
      const { field } = render({
        inputmode: 'numeric',
        spellcheck: false,
        autocapitalize: 'off',
        enterkeyhint: 'go',
      })
      expect(field.getAttribute('inputmode')).toBe('numeric')
      expect(field.getAttribute('spellcheck')).toBe('false')
      expect(field.getAttribute('autocapitalize')).toBe('off')
      expect(field.getAttribute('enterkeyhint')).toBe('go')
    })

    it('renders spellcheck=true when asked to force it on', () => {
      const { field } = render({ spellcheck: true })
      expect(field.getAttribute('spellcheck')).toBe('true')
    })

    it('renders maxlength, min and max', () => {
      const { field } = render({ type: 'number', maxlength: 6, min: 0, max: 100 })
      expect(field.getAttribute('maxlength')).toBe('6')
      expect(field.getAttribute('min')).toBe('0')
      expect(field.getAttribute('max')).toBe('100')
    })

    it('accepts a string bound for min and max (dates)', () => {
      const { field } = render({ type: 'text', min: '2026-01-01', max: '2026-12-31' })
      expect(field.getAttribute('min')).toBe('2026-01-01')
      expect(field.getAttribute('max')).toBe('2026-12-31')
    })

    it('renders a min of 0, not as an absent attribute', () => {
      const { field } = render({ type: 'number', min: 0 })
      expect(field.getAttribute('min')).toBe('0')
    })

    it('presents no accessibility violation for a numeric one-time-code style field', async () => {
      const { fixture } = render({
        type: 'text',
        inputmode: 'numeric',
        autocomplete: 'one-time-code',
        spellcheck: false,
        autocapitalize: 'off',
        enterkeyhint: 'go',
        maxlength: 6,
      })
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('combobox', () => {
    function render(combobox: unknown) {
      const fixture = TestBed.createComponent(GbtInput)
      fixture.componentRef.setInput('label', 'Rechercher un paquet')
      fixture.componentRef.setInput('type', 'search')
      fixture.componentRef.setInput('combobox', combobox)
      fixture.detectChanges()
      return { fixture, field: fixture.nativeElement.querySelector('input') as HTMLInputElement }
    }

    it('announces a closed list of suggestions', () => {
      const { field } = render({ expanded: false, controls: 'suggestions', activeDescendant: null })

      expect(field.getAttribute('role')).toBe('combobox')
      expect(field.getAttribute('aria-autocomplete')).toBe('list')
      expect(field.getAttribute('aria-expanded')).toBe('false')
      expect(field.getAttribute('aria-controls')).toBe('suggestions')
      expect(field.hasAttribute('aria-activedescendant')).toBe(false)
    })

    it('follows the list as it opens and an option is highlighted', () => {
      const { fixture, field } = render({
        expanded: false,
        controls: 'suggestions',
        activeDescendant: null,
      })

      fixture.componentRef.setInput('combobox', {
        expanded: true,
        controls: 'suggestions',
        activeDescendant: 'suggestion-2',
      })
      fixture.detectChanges()

      expect(field.getAttribute('aria-expanded')).toBe('true')
      expect(field.getAttribute('aria-activedescendant')).toBe('suggestion-2')
    })

    it('lets the keys typed in the field reach the host', () => {
      const { fixture, field } = render({
        expanded: false,
        controls: 'suggestions',
        activeDescendant: null,
      })
      const keys: string[] = []
      ;(fixture.nativeElement as HTMLElement).addEventListener('keydown', (event) =>
        keys.push(event.key),
      )

      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

      expect(keys).toEqual(['ArrowDown'])
    })

    it('presents no accessibility violation with its listbox', async () => {
      const { fixture } = render({
        expanded: true,
        controls: 'suggestions',
        activeDescendant: 'suggestion-0',
      })
      const listbox = document.createElement('ul')
      listbox.id = 'suggestions'
      listbox.setAttribute('role', 'listbox')
      listbox.setAttribute('aria-label', 'Suggestions')
      listbox.innerHTML = '<li id="suggestion-0" role="option" aria-selected="true">left-pad</li>'
      ;(fixture.nativeElement as HTMLElement).append(listbox)

      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
