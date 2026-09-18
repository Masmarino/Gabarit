import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, vi } from 'vitest'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Drawer } from './drawer'

const CLOSE_ANIMATION_MS = 200

@Component({
  standalone: true,
  imports: [Drawer],
  template: `
    <gbt-drawer [isOpen]="true" heading="Test">
      <button type="button" id="content-button">Action</button>
    </gbt-drawer>
  `,
})
class FocusTrapHostComponent {}

@Component({
  standalone: true,
  imports: [Drawer],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Ouvrir</button>
    <gbt-drawer [isOpen]="open()" heading="Test" (closed)="open.set(false)" />
  `,
})
class ToggledHostComponent {
  open = signal(false)
}

function panel(fixture: { nativeElement: HTMLElement }): HTMLElement | null {
  return fixture.nativeElement.querySelector('.gbt-drawer__panel')
}

describe('Drawer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when closed', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', false)
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('renders the panel with its title when open', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Filtres')
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Filtres')
  })

  it('defaults to the right edge', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    fixture.detectChanges()

    expect(panel(fixture)!.getAttribute('data-edge')).toBe('right')
  })

  it.each(['left', 'top', 'bottom'] as const)('reflects the %s edge', (edge) => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('edge', edge)
    fixture.detectChanges()

    expect(panel(fixture)!.getAttribute('data-edge')).toBe(edge)
  })

  it('emits closed when the close button is clicked', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-drawer__close').click()

    expect(closed).toBe(true)
  })

  it('emits closed when the Escape key is pressed while open', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(closed).toBe(true)
  })

  it('emits closed when the backdrop (not the panel) is clicked', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    let closed = false
    fixture.componentInstance.closed.subscribe(() => (closed = true))
    fixture.detectChanges()

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.gbt-drawer__backdrop')
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(closed).toBe(true)
  })

  it('wraps focus from the last focusable element back to the first on Tab', () => {
    const fixture = TestBed.createComponent(FocusTrapHostComponent)
    fixture.detectChanges()

    const panelEl: HTMLElement = fixture.nativeElement.querySelector('.gbt-drawer__panel')
    const closeButton: HTMLElement = fixture.nativeElement.querySelector('.gbt-drawer__close')
    const contentButton: HTMLElement = fixture.nativeElement.querySelector('#content-button')

    contentButton.focus()
    expect(document.activeElement).toBe(contentButton)

    panelEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(document.activeElement).toBe(closeButton)
  })

  it('wraps focus from the first focusable element back to the last on Shift+Tab', () => {
    const fixture = TestBed.createComponent(FocusTrapHostComponent)
    fixture.detectChanges()

    const panelEl: HTMLElement = fixture.nativeElement.querySelector('.gbt-drawer__panel')
    const closeButton: HTMLElement = fixture.nativeElement.querySelector('.gbt-drawer__close')
    const contentButton: HTMLElement = fixture.nativeElement.querySelector('#content-button')

    closeButton.focus()
    panelEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    )

    expect(document.activeElement).toBe(contentButton)
  })

  describe('close animation', () => {
    it('keeps the panel mounted with a closing class immediately after isOpen becomes false', () => {
      const fixture = TestBed.createComponent(ToggledHostComponent)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('#trigger').click()
      fixture.detectChanges()
      expect(panel(fixture)).not.toBeNull()

      fixture.nativeElement.querySelector('.gbt-drawer__close').click()
      fixture.detectChanges()

      expect(panel(fixture)).not.toBeNull()
      expect(panel(fixture)!.classList).toContain('gbt-drawer__panel--closing')
    })

    it('unmounts the panel and restores focus once the close animation finishes', () => {
      const fixture = TestBed.createComponent(ToggledHostComponent)
      fixture.detectChanges()
      const trigger: HTMLElement = fixture.nativeElement.querySelector('#trigger')
      trigger.focus()
      trigger.click()
      fixture.detectChanges()

      fixture.nativeElement.querySelector('.gbt-drawer__close').click()
      fixture.detectChanges()
      vi.advanceTimersByTime(CLOSE_ANIMATION_MS)
      fixture.detectChanges()

      expect(panel(fixture)).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })

    it('cancels a pending close and reopens cleanly if isOpen flips back to true mid-animation', () => {
      const fixture = TestBed.createComponent(ToggledHostComponent)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('#trigger').click()
      fixture.detectChanges()

      fixture.nativeElement.querySelector('.gbt-drawer__close').click()
      fixture.detectChanges()
      fixture.nativeElement.querySelector('#trigger').click()
      fixture.detectChanges()
      vi.advanceTimersByTime(CLOSE_ANIMATION_MS)
      fixture.detectChanges()

      expect(panel(fixture)).not.toBeNull()
      expect(panel(fixture)!.classList).not.toContain('gbt-drawer__panel--closing')
    })
  })

  it('uses an English default close label', () => {
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    fixture.detectChanges()
    expect(
      fixture.nativeElement.querySelector('.gbt-drawer__close').getAttribute('aria-label'),
    ).toBe('Close')
  })

  it('presents no accessibility violation, open', async () => {
    vi.useRealTimers()
    const fixture = TestBed.createComponent(Drawer)
    fixture.componentRef.setInput('isOpen', true)
    fixture.componentRef.setInput('heading', 'Titre')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
