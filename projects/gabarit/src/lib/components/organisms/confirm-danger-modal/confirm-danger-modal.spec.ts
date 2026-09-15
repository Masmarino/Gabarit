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
  // A signal (rather than a plain field) so that mutating it via `.set()` in
  // tests below correctly notifies Angular's zoneless change-detection
  // scheduler — a plain field write is invisible to it, and `fixture.detectChanges()`
  // is a no-op when nothing has marked the app dirty. Mirrors the pattern
  // already used by modal.spec.ts's `KeptMountedHostComponent` for the same reason.
  isOpen = signal(true)
  confirmedCount = 0
  closedCount = 0
}

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

    // NgModel writes the new value back into its ControlValueAccessor
    // (GbtInput) on a microtask (see `NgModel._updateValue`'s
    // `resolvedPromise.then(...)` in @angular/forms), so the rendered
    // <input>'s DOM value only catches up after that microtask flushes.
    await Promise.resolve()
    fixture.detectChanges()

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-input input')
    expect(input.value).toBe('')
  })

  it('has no violation detected by axe', async () => {
    const fixture = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
