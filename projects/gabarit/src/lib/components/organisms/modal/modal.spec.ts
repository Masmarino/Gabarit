import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
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

  it('presents no accessibility violation, open', async () => {
    const fixture = TestBed.createComponent(Modal)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Titre')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
