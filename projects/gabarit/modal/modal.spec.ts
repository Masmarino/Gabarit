import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Modal } from './modal'

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <gbt-modal [isOpen]="true" heading="Test">
      <button type="button" id="content-button">Action</button>
    </gbt-modal>
  `,
})
class FocusTrapHostComponent {}

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Ouvrir</button>
    @if (open()) {
      <gbt-modal [isOpen]="true" heading="Test" (closed)="open.set(false)" />
    }
  `,
})
class ToggledHostComponent {
  open = signal(false)
}

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Ouvrir</button>
    <gbt-modal [isOpen]="open()" heading="Test" (closed)="open.set(false)" />
  `,
})
class KeptMountedHostComponent {
  open = signal(false)
}

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Ouvrir</button>
    <gbt-modal
      [isOpen]="open()"
      [busy]="busy()"
      [returnFocus]="returnFocus()"
      busyLabel="Saving"
      heading="Test"
      (closed)="closedCount = closedCount + 1; open.set(false)"
    >
      <button type="button" id="content-button">Action</button>
      <div modal-footer id="footer">
        <button type="button" id="footer-button">Save</button>
      </div>
    </gbt-modal>
  `,
})
class ToggleableHostComponent {
  open = signal(true)
  busy = signal(false)
  returnFocus = signal(true)
  closedCount = 0
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', false)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).toBeNull()
  })

  it('renders the dialog with its title when open', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Nouveau dépôt')
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Nouveau dépôt')
  })

  it('emits closed when the close button is clicked', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-modal__close').click()

    expect(closed).toBe(true)
  })

  it('emits closed when the Escape key is pressed while open', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(closed).toBe(true)
  })

  it('emits closed when the backdrop (not the dialog) is clicked', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__backdrop')
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(closed).toBe(true)
  })

  it('wraps focus from the last focusable element back to the first on Tab', () => {
    const fixture = TestBed.createComponent(FocusTrapHostComponent)
    fixture.detectChanges()

    const dialog: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__dialog')
    const closeButton: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__close')
    const contentButton: HTMLElement = fixture.nativeElement.querySelector('#content-button')

    contentButton.focus()
    expect(document.activeElement).toBe(contentButton)

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(document.activeElement).toBe(closeButton)
  })

  it('wraps focus from the first focusable element back to the last on Shift+Tab', () => {
    const fixture = TestBed.createComponent(FocusTrapHostComponent)
    fixture.detectChanges()

    const dialog: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__dialog')
    const closeButton: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__close')
    const contentButton: HTMLElement = fixture.nativeElement.querySelector('#content-button')

    closeButton.focus()
    expect(document.activeElement).toBe(closeButton)

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    )

    expect(document.activeElement).toBe(contentButton)
  })

  it('restores focus to the element that opened it once closed and destroyed', () => {
    const fixture = TestBed.createComponent(ToggledHostComponent)
    fixture.detectChanges()

    const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
    trigger.focus()
    trigger.click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).not.toBeNull()

    fixture.nativeElement.querySelector('.gbt-modal__close').click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('also restores focus when the component stays mounted and `isOpen` merely toggles to false — not only on destruction', () => {
    const fixture = TestBed.createComponent(KeptMountedHostComponent)
    fixture.detectChanges()

    const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
    trigger.focus()
    trigger.click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).not.toBeNull()

    fixture.nativeElement.querySelector('.gbt-modal__close').click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('uses the provided close label', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Titre')
    fixture.componentRef.setInput('closeLabel', 'Dismiss')
    fixture.detectChanges()
    const close = fixture.nativeElement.querySelector('.gbt-modal__close')
    expect(close.getAttribute('aria-label')).toBe('Dismiss')
  })

  it('uses an English default close label', () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Titre')
    fixture.detectChanges()
    expect(
      fixture.nativeElement.querySelector('.gbt-modal__close').getAttribute('aria-label'),
    ).toBe('Close')
  })

  describe('busy', () => {
    function setup() {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      fixture.componentInstance.busy.set(true)
      fixture.detectChanges()
      return fixture
    }

    it('ignores Escape, the backdrop and the close button while busy', () => {
      const fixture = setup()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      fixture.nativeElement
        .querySelector('.gbt-modal__backdrop')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.nativeElement.querySelector('.gbt-modal__close').click()
      fixture.detectChanges()

      expect(fixture.componentInstance.closedCount).toBe(0)
      expect(fixture.nativeElement.querySelector('.gbt-modal__dialog')).not.toBeNull()
    })

    it('closes again once the request is done', () => {
      const fixture = setup()
      fixture.componentInstance.busy.set(false)
      fixture.detectChanges()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(fixture.componentInstance.closedCount).toBe(1)
    })

    it('announces the busy state: aria-busy on the body only, the label in a live region OUTSIDE any busy element, aria-disabled on the close button', () => {
      const fixture = setup()
      const el: HTMLElement = fixture.nativeElement
      const dialog = el.querySelector('.gbt-modal__dialog')!
      const status = el.querySelector('.gbt-modal__status')!

      const body = el.querySelector('.gbt-modal__body')!
      expect(body.getAttribute('aria-busy')).toBe('true')
      expect(dialog.hasAttribute('aria-busy')).toBe(false)
      expect(dialog.getAttribute('data-busy')).toBe('')
      // A busy ancestor suppresses live-region announcements: nothing that contains the status
      // region (the dialog, the header, the backdrop, the host) may carry aria-busy.
      expect(status.closest('[aria-busy="true"]')).toBeNull()
      expect(body.contains(status)).toBe(false)
      expect(status.getAttribute('role')).toBe('status')
      expect(status.textContent).toBe('Saving')
      expect(el.querySelector('.gbt-modal__close')!.getAttribute('aria-disabled')).toBe('true')

      fixture.componentInstance.busy.set(false)
      fixture.detectChanges()

      expect(body.hasAttribute('aria-busy')).toBe(false)
      expect(dialog.hasAttribute('data-busy')).toBe(false)
      expect(status.textContent).toBe('')
      expect(el.querySelector('.gbt-modal__close')!.hasAttribute('aria-disabled')).toBe(false)
    })

    it('is not busy by default (no busy attribute, silent live region, close still works)', () => {
      const fixture = TestBed.createComponent(Modal)
      fixture.componentRef.setInput('isOpen', true)
      let closed = 0
      fixture.componentInstance.closed.subscribe(() => closed++)
      fixture.detectChanges()
      const el: HTMLElement = fixture.nativeElement

      expect(el.querySelector('[aria-busy]')).toBeNull()
      expect(el.querySelector('.gbt-modal__status')!.textContent).toBe('')
      ;(el.querySelector('.gbt-modal__close') as HTMLElement).click()
      expect(closed).toBe(1)
    })

    it('keeps focus inside the dialog when the focused control gets disabled', async () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#content-button')
      button.focus()

      // What a busy confirm button does: it is disabled and the browser drops the focus.
      button.disabled = true
      button.blur()
      fixture.componentInstance.busy.set(true)
      fixture.detectChanges()
      await new Promise((resolve) => setTimeout(resolve, 80))

      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.gbt-modal__dialog'))
    })

    it('falls back to a timer where requestAnimationFrame does not exist, and cleans up on destroy', async () => {
      const original = globalThis.requestAnimationFrame
      // @ts-expect-error simulate an environment without requestAnimationFrame
      delete globalThis.requestAnimationFrame
      try {
        const fixture = TestBed.createComponent(ToggleableHostComponent)
        fixture.detectChanges()
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('#content-button')
        button.focus()
        button.blur()
        fixture.componentInstance.busy.set(true)
        fixture.detectChanges()
        await new Promise((resolve) => setTimeout(resolve, 80))
        expect(document.activeElement).toBe(
          fixture.nativeElement.querySelector('.gbt-modal__dialog'),
        )

        // A pending check is cancelled when the dialog goes away: the timer is cleared and focus
        // is not stolen back afterwards.
        const clear = vi.spyOn(globalThis, 'clearTimeout')
        fixture.componentInstance.busy.set(false)
        fixture.detectChanges()
        fixture.componentInstance.busy.set(true)
        fixture.detectChanges()
        const outside = document.createElement('button')
        document.body.appendChild(outside)
        fixture.destroy()
        expect(clear).toHaveBeenCalled()
        outside.focus()
        await new Promise((resolve) => setTimeout(resolve, 80))
        expect(document.activeElement).toBe(outside)
        outside.remove()
        clear.mockRestore()
      } finally {
        globalThis.requestAnimationFrame = original
      }
    })

    it('never moves focus when not busy', async () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      await Promise.resolve() // the dialog takes focus on a microtask
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#content-button')
      button.focus()
      fixture.componentInstance.returnFocus.set(true)
      fixture.detectChanges()
      await new Promise((resolve) => setTimeout(resolve, 80))

      expect(document.activeElement).toBe(button)
    })
  })

  describe('focus parked on the dialog (busy)', () => {
    it('Shift+Tab from the dialog itself wraps to the last focusable element instead of leaving', () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      const dialog: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__dialog')
      const footerButton: HTMLElement = fixture.nativeElement.querySelector('#footer-button')
      dialog.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      dialog.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(footerButton)
    })

    it('Tab from the dialog itself is left to the browser (it enters the dialog)', () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      const dialog: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__dialog')
      dialog.focus()

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      dialog.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('footer slot', () => {
    it('renders [modal-footer] content under the body, inside the dialog', () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      const footer: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__footer')

      expect(footer.querySelector('#footer-button')).not.toBeNull()
      expect(footer.closest('.gbt-modal__dialog')).not.toBeNull()
      expect(fixture.nativeElement.querySelector('.gbt-modal__body #footer')).toBeNull()
      expect(fixture.nativeElement.querySelector('.gbt-modal__body #content-button')).not.toBeNull()
    })

    it('leaves the footer container empty when nothing is projected', () => {
      const fixture = TestBed.createComponent(Modal)
      fixture.componentRef.setInput('isOpen', true)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('.gbt-modal__footer').childElementCount).toBe(0)
      expect(fixture.nativeElement.querySelector('.gbt-modal__footer').textContent).toBe('')
    })

    it('keeps the footer buttons inside the focus trap', () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.detectChanges()
      const dialog: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__dialog')
      const closeButton: HTMLElement = fixture.nativeElement.querySelector('.gbt-modal__close')
      const footerButton: HTMLElement = fixture.nativeElement.querySelector('#footer-button')

      footerButton.focus()
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

      expect(document.activeElement).toBe(closeButton)
    })
  })

  describe('returnFocus', () => {
    it('restores focus to the opener by default', async () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.componentInstance.open.set(false)
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
      trigger.focus()
      trigger.click()
      fixture.detectChanges()
      await Promise.resolve() // the dialog takes focus on a microtask
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.gbt-modal__dialog'))
      fixture.nativeElement.querySelector('.gbt-modal__close').click()
      fixture.detectChanges()

      expect(document.activeElement).toBe(trigger)
    })

    it('leaves focus alone when returnFocus is off', async () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.componentInstance.open.set(false)
      fixture.componentInstance.returnFocus.set(false)
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
      trigger.focus()
      trigger.click()
      fixture.detectChanges()
      await Promise.resolve() // the dialog takes focus on a microtask
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.gbt-modal__dialog'))
      fixture.nativeElement.querySelector('.gbt-modal__close').click()
      fixture.detectChanges()

      expect(document.activeElement).not.toBe(trigger)
    })

    it('toggling returnFocus while open does not disturb the remembered opener', async () => {
      const fixture = TestBed.createComponent(ToggleableHostComponent)
      fixture.componentInstance.open.set(false)
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
      trigger.focus()
      trigger.click()
      fixture.detectChanges()
      await Promise.resolve() // the dialog takes focus on a microtask
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.gbt-modal__dialog'))

      fixture.componentInstance.returnFocus.set(false)
      fixture.detectChanges()
      fixture.componentInstance.returnFocus.set(true)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('.gbt-modal__close').click()
      fixture.detectChanges()

      expect(document.activeElement).toBe(trigger)
    })
  })

  it('presents no accessibility violation, busy with a footer', async () => {
    const fixture = TestBed.createComponent(ToggleableHostComponent)
    fixture.componentInstance.busy.set(true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, open', async () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Titre')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
