import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ConfirmDangerModal } from './confirm-danger-modal'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ConfirmDangerModal],
  template: `
    <gbt-confirm-danger-modal
      [isOpen]="isOpen()"
      heading="Supprimer le dépôt"
      message="Cette action est irréversible."
      confirmText="widget"
      (confirmed)="confirmedCount = confirmedCount + 1"
      (closed)="closedCount = closedCount + 1"
    />
  `,
})
class HostComponent {
  // A signal, since zoneless change detection doesn't see a plain field change.
  isOpen = signal(true)
  confirmedCount = 0
  closedCount = 0
}

@Component({
  standalone: true,
  imports: [ConfirmDangerModal],
  template: `
    <gbt-confirm-danger-modal
      [isOpen]="true"
      heading="Supprimer le webhook"
      message="Le webhook cessera de recevoir des événements."
      [confirmText]="confirmText()"
      [busy]="busy()"
      busyLabel="Suppression en cours"
      [confirmIcon]="confirmIcon()"
      [tone]="tone()"
      (confirmed)="confirmedCount = confirmedCount + 1"
      (closed)="closedCount = closedCount + 1"
    />
  `,
})
class LightHostComponent {
  confirmText = signal<string | undefined>(undefined)
  busy = signal(false)
  confirmIcon = signal<string | null>(null)
  tone = signal<'danger' | 'warning' | 'neutral'>('danger')
  confirmedCount = 0
  closedCount = 0
}

function setupLight(configure: (host: LightHostComponent) => void = () => {}) {
  const fixture = TestBed.createComponent(LightHostComponent)
  configure(fixture.componentInstance)
  fixture.detectChanges()
  return fixture
}

const actionButtons = (fixture: ReturnType<typeof setupLight>): HTMLButtonElement[] => [
  ...fixture.nativeElement.querySelectorAll('.gbt-confirm-danger-modal__actions button'),
]

function setup(isOpen = true) {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.componentInstance.isOpen.set(isOpen)
  fixture.detectChanges()
  return fixture
}

const confirmButton = (fixture: ReturnType<typeof setup>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('.gbt-button--danger')

const cancelButton = (fixture: ReturnType<typeof setup>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('.gbt-button--secondary')

function typeInto(fixture: ReturnType<typeof setup>, value: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-input input')
  input.value = value
  input.dispatchEvent(new Event('input'))
  fixture.detectChanges()
}

describe('ConfirmDangerModal', () => {
  it('renders nothing when isOpen is false', () => {
    const fixture = setup(false)
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders the heading and message, with the confirm button disabled until the text matches', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-modal__title').textContent).toBe(
      'Supprimer le dépôt',
    )
    expect(fixture.nativeElement.textContent).toContain('Cette action est irréversible.')
    expect(confirmButton(fixture).disabled).toBe(true)
  })

  it('renders default copy when no copy inputs are passed by the host', () => {
    const fixture = setup()
    expect(cancelButton(fixture).textContent).toBe('Cancel')
    expect(confirmButton(fixture).textContent).toBe('Confirm')
  })

  it('keeps the confirm button disabled while the typed text does not exactly match confirmText', () => {
    const fixture = setup()
    typeInto(fixture, 'widge')
    expect(confirmButton(fixture).disabled).toBe(true)
    typeInto(fixture, 'widget2')
    expect(confirmButton(fixture).disabled).toBe(true)
  })

  it('enables the confirm button once the typed text exactly matches confirmText, and emits confirmed on click', () => {
    const fixture = setup()
    typeInto(fixture, 'widget')
    expect(confirmButton(fixture).disabled).toBe(false)

    confirmButton(fixture).click()
    fixture.detectChanges()

    expect(fixture.componentInstance.confirmedCount).toBe(1)
    expect(fixture.componentInstance.closedCount).toBe(0)
  })

  it('emits closed, never confirmed, when Cancel is clicked — even with a matching typed value', () => {
    const fixture = setup()
    typeInto(fixture, 'widget')

    cancelButton(fixture).click()
    fixture.detectChanges()

    expect(fixture.componentInstance.closedCount).toBe(1)
    expect(fixture.componentInstance.confirmedCount).toBe(0)
  })

  it('emits closed when the underlying modal is dismissed (e.g. Escape)', () => {
    const fixture = setup()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    fixture.detectChanges()

    expect(fixture.componentInstance.closedCount).toBe(1)
  })

  it('clears the typed text once closed, so a later reopen starts blank', async () => {
    const fixture = setup()
    typeInto(fixture, 'widget')
    expect(confirmButton(fixture).disabled).toBe(false)

    fixture.componentInstance.isOpen.set(false)
    fixture.detectChanges()
    fixture.componentInstance.isOpen.set(true)
    fixture.detectChanges()

    expect(confirmButton(fixture).disabled).toBe(true)

    // NgModel writes back on a microtask, so the <input> only catches up after it.
    await Promise.resolve()
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-input input')
    expect(input.value).toBe('')
  })

  it('keeps the typed confirmation exactly as before by default (no icon disc, danger button, not busy)', () => {
    const fixture = setup()
    const el: HTMLElement = fixture.nativeElement
    expect(el.querySelector('.gbt-confirm-danger-modal__icon')).toBeNull()
    expect(el.querySelector('.gbt-input input')).not.toBeNull()
    expect(confirmButton(fixture).hasAttribute('aria-busy')).toBe(false)
    expect(confirmButton(fixture).querySelector('gbt-icon')).toBeNull()
    expect(el.querySelector('.gbt-modal__body')!.hasAttribute('aria-busy')).toBe(false)
  })

  describe('light confirmation (no confirmText)', () => {
    it('has no typing field and a normal, enabled confirm button', () => {
      const fixture = setupLight()
      const el: HTMLElement = fixture.nativeElement

      expect(el.querySelector('.gbt-input')).toBeNull()
      expect(el.querySelector('input')).toBeNull()
      const [cancel, confirm] = actionButtons(fixture)
      expect(cancel.textContent).toBe('Cancel')
      expect(confirm.textContent).toBe('Confirm')
      expect(confirm.disabled).toBe(false)
      expect(el.textContent).toContain('Le webhook cessera')
    })

    it('emits confirmed on click and closed on Cancel', () => {
      const fixture = setupLight()
      const [cancel, confirm] = actionButtons(fixture)

      confirm.click()
      expect(fixture.componentInstance.confirmedCount).toBe(1)
      cancel.click()
      expect(fixture.componentInstance.closedCount).toBe(1)
      expect(fixture.componentInstance.confirmedCount).toBe(1)
    })

    it('still emits closed on Escape', () => {
      const fixture = setupLight()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(fixture.componentInstance.closedCount).toBe(1)
    })

    it('an empty confirmText is still typed-and-fail-closed, not a light confirmation', () => {
      const fixture = setupLight((host) => host.confirmText.set(''))
      expect(fixture.nativeElement.querySelector('.gbt-input')).not.toBeNull()
      expect(actionButtons(fixture)[1].disabled).toBe(true)
    })

    it('has no violation detected by axe', async () => {
      await expectNoA11yViolations(setupLight().nativeElement)
    })
  })

  describe('tone and confirmIcon', () => {
    it('danger (default): a danger button and a warning glyph in a danger disc', () => {
      const fixture = setupLight()
      const el: HTMLElement = fixture.nativeElement
      expect(actionButtons(fixture)[1].classList).toContain('gbt-button--danger')
      expect(
        el.querySelector('.gbt-confirm-danger-modal__summary')!.getAttribute('data-tone'),
      ).toBe('danger')
      expect(el.querySelector('.gbt-confirm-danger-modal__icon gbt-icon')).not.toBeNull()
    })

    it('warning and neutral: a primary confirm button and their own disc tone', () => {
      for (const tone of ['warning', 'neutral'] as const) {
        const fixture = setupLight((host) => host.tone.set(tone))
        expect(actionButtons(fixture)[1].classList).toContain('gbt-button--primary')
        expect(
          fixture.nativeElement
            .querySelector('.gbt-confirm-danger-modal__summary')
            .getAttribute('data-tone'),
        ).toBe(tone)
      }
    })

    it('confirmIcon renders an icon in the confirm button', () => {
      const fixture = setupLight((host) => host.confirmIcon.set('check'))
      expect(actionButtons(fixture)[1].querySelector('gbt-icon')).not.toBeNull()
      expect(actionButtons(fixture)[0].querySelector('gbt-icon')).toBeNull()
    })

    it('the tone also colours the confirm button of the typed confirmation', () => {
      const fixture = setupLight((host) => {
        host.confirmText.set('x')
        host.tone.set('warning')
      })
      expect(actionButtons(fixture)[1].classList).toContain('gbt-button--primary')
      expect(fixture.nativeElement.querySelector('.gbt-confirm-danger-modal__icon')).toBeNull()
    })
  })

  describe('busy', () => {
    it('shows a spinner and the busy label on the confirm button, and disables Cancel', () => {
      const fixture = setupLight((host) => host.busy.set(true))
      const [cancel, confirm] = actionButtons(fixture)

      expect(confirm.getAttribute('aria-busy')).toBe('true')
      expect(confirm.querySelector('.gbt-button__spinner')).not.toBeNull()
      expect(confirm.textContent).toContain('Suppression en cours')
      expect(confirm.disabled).toBe(true)
      expect(cancel.disabled).toBe(true)
      const el: HTMLElement = fixture.nativeElement
      expect(el.querySelector('.gbt-modal__body')!.getAttribute('aria-busy')).toBe('true')
      expect(el.querySelector('.gbt-modal__dialog')!.hasAttribute('aria-busy')).toBe(false)
      expect(el.querySelector('.gbt-modal__status')!.textContent).toBe('Suppression en cours')
    })

    it('ignores Escape, the backdrop and the close button, so nothing is emitted', () => {
      const fixture = setupLight((host) => host.busy.set(true))
      const el: HTMLElement = fixture.nativeElement

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      el.querySelector('.gbt-modal__backdrop')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      ;(el.querySelector('.gbt-modal__close') as HTMLElement).click()
      const [cancel, confirm] = actionButtons(fixture)
      cancel.click()
      confirm.click()

      expect(fixture.componentInstance.closedCount).toBe(0)
      expect(fixture.componentInstance.confirmedCount).toBe(0)
    })

    it('locks the typing field of a typed confirmation while busy', () => {
      const fixture = setupLight((host) => {
        host.confirmText.set('x')
        host.busy.set(true)
      })
      const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-input input')
      expect(input.disabled).toBe(true)
    })

    it('lets the dialog be dismissed again once busy ends', () => {
      const fixture = setupLight((host) => host.busy.set(true))
      fixture.componentInstance.busy.set(false)
      fixture.detectChanges()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(fixture.componentInstance.closedCount).toBe(1)
    })

    it('has no violation detected by axe while busy', async () => {
      await expectNoA11yViolations(setupLight((host) => host.busy.set(true)).nativeElement)
    })
  })

  it('has no violation detected by axe', async () => {
    const fixture = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
