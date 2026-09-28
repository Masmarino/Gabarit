import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, ErrorHandler, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Textarea } from './textarea'

const SCSS_DIR = join(process.cwd(), 'projects/gabarit/src/lib/components/atoms/textarea')

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Textarea],
  template: `
    <form [formGroup]="form">
      <gbt-textarea label="Description" formControlName="description" />
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({ description: new FormControl('') })
}

@Component({
  standalone: true,
  imports: [FormsModule, Textarea],
  template: `<gbt-textarea label="Notes" [(ngModel)]="notes" name="notes" />`,
})
class NgModelHost {
  notes = signal('valeur initiale')
}

describe('Textarea', () => {
  it('writes the form control value into the rendered textarea', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.description.setValue('florian')
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.value).toBe('florian')
  })

  it('propagates typed input back to the form control', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    textarea.value = 'new-value'
    textarea.dispatchEvent(new Event('input'))

    expect(fixture.componentInstance.form.controls.description.value).toBe('new-value')
  })

  it('disables the native textarea when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.description.disable()
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.disabled).toBe(true)
  })

  describe('value binding', () => {
    function typeInto(textarea: HTMLTextAreaElement, text: string): void {
      textarea.value = text
      textarea.dispatchEvent(new Event('input'))
    }

    it('clears the typed text when the form control is reset to an empty string', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')

      typeInto(textarea, 'brouillon')
      fixture.detectChanges()
      expect(textarea.value).toBe('brouillon')

      fixture.componentInstance.form.controls.description.setValue('')
      fixture.detectChanges()

      expect(textarea.value).toBe('')
    })

    it("clears the typed text on writeValue('') and on reset()", () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')

      typeInto(textarea, 'brouillon')
      fixture.detectChanges()
      fixture.componentInstance.form.controls.description.reset()
      fixture.detectChanges()

      expect(textarea.value).toBe('')
    })

    it('replaces the typed text when a new value is written afterwards', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')

      typeInto(textarea, 'brouillon')
      fixture.componentInstance.form.controls.description.setValue('remplacé')
      fixture.detectChanges()

      expect(textarea.value).toBe('remplacé')
    })

    it('does not write the value as text content (the default value of the native element)', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.componentInstance.form.controls.description.setValue('florian')
      fixture.detectChanges()

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(textarea.value).toBe('florian')
      expect(textarea.textContent).toBe('')
    })

    it('round-trips through [(ngModel)]: initial value in, typed text out, reset clears', async () => {
      const fixture = TestBed.createComponent(NgModelHost)
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(textarea.value).toBe('valeur initiale')

      typeInto(textarea, 'saisie')
      fixture.detectChanges()
      await fixture.whenStable()
      expect(fixture.componentInstance.notes()).toBe('saisie')

      fixture.componentInstance.notes.set('')
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      expect(textarea.value).toBe('')
    })
  })

  it('applies the provided rows', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('rows', 6)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.rows).toBe(6)
  })

  it('defaults to 3 rows', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.rows).toBe(3)
  })

  it('emits committed on blur, with the value the user settled on', () => {
    const fixture = TestBed.createComponent(Textarea)
    const committed: string[] = []
    fixture.componentInstance.committed.subscribe((value) => committed.push(value))
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    textarea.value = 'a'
    textarea.dispatchEvent(new Event('input'))
    textarea.value = 'ab'
    textarea.dispatchEvent(new Event('input'))
    expect(committed).toEqual([])

    textarea.dispatchEvent(new Event('blur'))
    expect(committed).toEqual(['ab'])
  })

  it('renders the error message and wires aria-invalid/aria-describedby', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('errorMessage', 'Ce champ est obligatoire')
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    const errorId = textarea.getAttribute('aria-describedby')
    expect(fixture.nativeElement.querySelector(`#${errorId}`).textContent).toContain(
      'Ce champ est obligatoire',
    )
  })

  it('presents no accessibility violation with a label', async () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('label', 'Description')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation in error state', async () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('label', 'Description')
    fixture.componentRef.setInput('errorMessage', 'Ce champ est obligatoire')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  describe("defaults keep today's rendering", () => {
    it('renders a visible label, a vertically resizable 3-row textarea and no extra markup', () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('label', 'Description')
      fixture.detectChanges()
      const host: HTMLElement = fixture.nativeElement
      const root = host.querySelector('.gbt-textarea')!
      const textarea = host.querySelector('textarea')!

      expect(host.querySelector('label')!.className).not.toContain('gbt-textarea__label--hidden')
      expect(host.querySelector('.gbt-textarea__hint')).toBeNull()
      expect(root.classList.contains('gbt-textarea--mono')).toBe(false)
      expect(root.classList.contains('gbt-textarea--autosize')).toBe(false)
      expect(textarea.rows).toBe(3)
      expect(textarea.style.height).toBe('')
      expect(textarea.getAttribute('data-resize')).toBe('vertical')
      expect(textarea.hasAttribute('aria-describedby')).toBe(false)
    })

    it('resizes vertically by default, as before', () => {
      const scss = readFileSync(join(SCSS_DIR, 'textarea.scss'), 'utf8')
      expect(scss).toMatch(/resize:\s*vertical/)
    })
  })

  describe('hint', () => {
    it('renders the hint and links it with aria-describedby', () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('label', 'Description')
      fixture.componentRef.setInput('hint', 'Markdown accepté.')
      fixture.detectChanges()

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      const hint: HTMLElement = fixture.nativeElement.querySelector('.gbt-textarea__hint')
      expect(hint.textContent).toContain('Markdown accepté.')
      expect(textarea.getAttribute('aria-describedby')).toBe(hint.id)
    })

    it('hides the hint, and drops it from aria-describedby, while an error shows', () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('hint', 'Markdown accepté.')
      fixture.componentRef.setInput('errorMessage', 'Trop long')
      fixture.detectChanges()

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(fixture.nativeElement.querySelector('.gbt-textarea__hint')).toBeNull()
      const error: HTMLElement = fixture.nativeElement.querySelector('.gbt-textarea__error')
      expect(textarea.getAttribute('aria-describedby')).toBe(error.id)
    })

    it('presents no accessibility violation with a hint, with and without an error', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('label', 'Description')
      fixture.componentRef.setInput('hint', 'Markdown accepté.')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)

      fixture.componentRef.setInput('errorMessage', 'Trop long')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('hideLabel', () => {
    it('keeps the label associated with the textarea but visually hidden', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('label', 'Commentaire')
      fixture.componentRef.setInput('hideLabel', true)
      fixture.detectChanges()

      const label: HTMLLabelElement = fixture.nativeElement.querySelector('label')
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(label.htmlFor).toBe(textarea.id)
      expect(label.classList.contains('gbt-textarea__label--hidden')).toBe(true)
      expect(getComputedStyle(label).position).toBe('absolute')
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('mono and resize', () => {
    it('adds the mono modifier and a monospace font stack', () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('mono', true)
      fixture.detectChanges()
      expect(
        fixture.nativeElement
          .querySelector('.gbt-textarea')
          .classList.contains('gbt-textarea--mono'),
      ).toBe(true)
      const scss = readFileSync(join(SCSS_DIR, 'textarea.scss'), 'utf8')
      expect(scss).toMatch(/--gbt-font-mono,\s*ui-monospace/)
    })

    it.each(['none', 'both', 'horizontal', 'vertical'] as const)(
      'exposes resize=%s on the textarea',
      (resize) => {
        const fixture = TestBed.createComponent(Textarea)
        fixture.componentRef.setInput('resize', resize)
        fixture.detectChanges()
        const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
        expect(textarea.getAttribute('data-resize')).toBe(resize)
        expect(getComputedStyle(textarea).resize).toBe(resize)
      },
    )
  })

  describe('autosize', () => {
    /** jsdom has no layout: give the textarea a scrollHeight and let the component read it. */
    function mockScrollHeight(textarea: HTMLTextAreaElement, height: number): void {
      Object.defineProperty(textarea, 'scrollHeight', { configurable: true, get: () => height })
    }

    async function render(inputs: Record<string, unknown> = {}) {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('label', 'Commentaire')
      fixture.componentRef.setInput('autosize', true)
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      await fixture.whenStable()
      return {
        fixture,
        textarea: fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement,
      }
    }

    it('adds the autosize modifier and switches the drag handle off', async () => {
      const { fixture, textarea } = await render()
      expect(
        fixture.nativeElement
          .querySelector('.gbt-textarea')
          .classList.contains('gbt-textarea--autosize'),
      ).toBe(true)
      expect(textarea.getAttribute('data-resize')).toBe('none')
    })

    it('sizes the textarea to its content when the value changes', async () => {
      const { fixture, textarea } = await render()
      mockScrollHeight(textarea, 120)

      textarea.value = 'ligne 1\nligne 2\nligne 3\nligne 4'
      textarea.dispatchEvent(new Event('input'))
      fixture.detectChanges()
      await fixture.whenStable()

      expect(textarea.style.height).toBe('120px')
    })

    it('follows a value written by the form, growing and shrinking back', async () => {
      const { fixture, textarea } = await render()
      mockScrollHeight(textarea, 90)
      fixture.componentInstance.writeValue('a\nb\nc')
      fixture.detectChanges()
      await fixture.whenStable()
      expect(textarea.style.height).toBe('90px')

      mockScrollHeight(textarea, 40)
      fixture.componentInstance.writeValue('')
      fixture.detectChanges()
      await fixture.whenStable()
      expect(textarea.style.height).toBe('40px')
    })

    it('adds the border height that scrollHeight leaves out (border-box)', async () => {
      const { fixture, textarea } = await render()
      mockScrollHeight(textarea, 100)
      Object.defineProperty(textarea, 'offsetHeight', { configurable: true, get: () => 104 })
      Object.defineProperty(textarea, 'clientHeight', { configurable: true, get: () => 102 })

      textarea.value = 'a\nb\nc'
      textarea.dispatchEvent(new Event('input'))
      fixture.detectChanges()
      await fixture.whenStable()

      expect(textarea.style.height).toBe('102px')
    })

    it('caps the height with maxRows through a custom property, so the CSS scrolls beyond it', async () => {
      const { textarea } = await render({ maxRows: 8 })
      expect(textarea.style.getPropertyValue('--gbt-textarea-max-rows')).toBe('8')
      const scss = readFileSync(join(SCSS_DIR, 'textarea.scss'), 'utf8')
      expect(scss).toMatch(/max-height:\s*calc\(var\(--gbt-textarea-max-rows\)\s*\*\s*1lh/)
    })

    it('sets no maxRows property when maxRows is not given', async () => {
      const { textarea } = await render()
      expect(textarea.style.getPropertyValue('--gbt-textarea-max-rows')).toBe('')
    })

    it('does nothing without autosize (no inline height, no property)', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('maxRows', 5)
      fixture.detectChanges()
      await fixture.whenStable()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(textarea.style.height).toBe('')
      expect(textarea.style.getPropertyValue('--gbt-textarea-max-rows')).toBe('')
    })

    it('presents no accessibility violation', async () => {
      const { fixture } = await render({ maxRows: 6, mono: true, hint: 'Aide' })
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('resize observation and inline height', () => {
    class FakeResizeObserver {
      static instances: FakeResizeObserver[] = []
      observed: Element[] = []
      disconnected = false
      constructor(public callback: ResizeObserverCallback) {
        FakeResizeObserver.instances.push(this)
      }
      observe(target: Element): void {
        this.observed.push(target)
      }
      unobserve(): void {}
      disconnect(): void {
        this.disconnected = true
      }
    }

    const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    let reported: unknown[]

    beforeEach(() => {
      FakeResizeObserver.instances = []
      reported = []
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver
      TestBed.configureTestingModule({
        providers: [
          { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } },
        ],
      })
    })

    afterEach(() => {
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = original
    })

    it('raises no error and observes nothing for a default textarea in a browser with ResizeObserver', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.destroy()

      expect(reported).toEqual([])
      expect(FakeResizeObserver.instances).toEqual([])
    })

    it('observes the host only while autosize is on, without error, and disconnects on destroy', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('autosize', true)
      fixture.detectChanges()
      await fixture.whenStable()

      expect(reported).toEqual([])
      expect(FakeResizeObserver.instances.length).toBe(1)
      expect(FakeResizeObserver.instances[0].observed).toEqual([fixture.nativeElement])
      expect(FakeResizeObserver.instances[0].disconnected).toBe(false)

      fixture.destroy()
      expect(FakeResizeObserver.instances[0].disconnected).toBe(true)
      expect(reported).toEqual([])
    })

    it('disconnects the observer when autosize is switched off', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('autosize', true)
      fixture.detectChanges()
      await fixture.whenStable()

      fixture.componentRef.setInput('autosize', false)
      fixture.detectChanges()
      await fixture.whenStable()

      expect(FakeResizeObserver.instances.every((o) => o.disconnected)).toBe(true)
    })

    it('keeps a height set by the drag handle while typing, with autosize off', async () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      await fixture.whenStable()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      textarea.style.height = '240px'

      textarea.value = 'a'
      textarea.dispatchEvent(new Event('input'))
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.componentInstance.form.controls.description.setValue('remplacé')
      fixture.detectChanges()
      await fixture.whenStable()

      expect(textarea.style.height).toBe('240px')
    })

    it('clears the inline height it had set once autosize is switched off', async () => {
      const fixture = TestBed.createComponent(Textarea)
      fixture.componentRef.setInput('autosize', true)
      fixture.detectChanges()
      await fixture.whenStable()
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
      expect(textarea.style.height).not.toBe('')

      fixture.componentRef.setInput('autosize', false)
      fixture.detectChanges()
      await fixture.whenStable()
      expect(textarea.style.height).toBe('')
    })
  })
})
