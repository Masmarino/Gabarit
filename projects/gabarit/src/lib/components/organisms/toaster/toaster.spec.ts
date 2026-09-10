import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, vi } from 'vitest'
import { Icon } from '../../atoms/icon/icon'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Toaster, type ToastItem } from './toaster'

describe('Toaster', () => {
  it('renders a message for each toast', () => {
    const fixture = TestBed.createComponent(Toaster)
    const toasts: ToastItem[] = [
      { id: '1', variant: 'success', message: 'Enregistré' },
      { id: '2', variant: 'error', message: 'Échec de la requête' },
    ]
    fixture.componentRef.setInput('toasts', toasts)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Enregistré')
    expect(fixture.nativeElement.textContent).toContain('Échec de la requête')
  })

  it('defaults to the bottom-right position', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [])
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-toaster').getAttribute('data-position')).toBe(
      'bottom-right',
    )
  })

  it('applies the provided position', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [])
    fixture.componentRef.setInput('position', 'top-left')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-toaster').getAttribute('data-position')).toBe(
      'top-left',
    )
  })

  it('emits dismissed with the toast id when its close button is clicked', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: 'a', variant: 'info', message: 'Info' },
      { id: 'b', variant: 'success', message: 'Succès' },
    ] satisfies ToastItem[])
    const dismissedIds: string[] = []
    fixture.componentInstance.dismissed.subscribe((id) => dismissedIds.push(id))
    fixture.detectChanges()

    const items = fixture.nativeElement.querySelectorAll('.gbt-toaster__item')
    items[1].querySelector('.gbt-toaster__close').click()

    expect(dismissedIds).toEqual(['b'])
  })

  it('uses role="status" for success and info toasts', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'success', message: 'Succès' },
      { id: '2', variant: 'info', message: 'Info' },
    ] satisfies ToastItem[])
    fixture.detectChanges()

    const items: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(
      '.gbt-toaster__item',
    )
    expect(items[0].getAttribute('role')).toBe('status')
    expect(items[1].getAttribute('role')).toBe('status')
  })

  it('uses role="alert" for warning and error toasts', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'warning', message: 'Attention' },
      { id: '2', variant: 'error', message: 'Erreur' },
    ] satisfies ToastItem[])
    fixture.detectChanges()

    const items: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(
      '.gbt-toaster__item',
    )
    expect(items[0].getAttribute('role')).toBe('alert')
    expect(items[1].getAttribute('role')).toBe('alert')
  })

  it('uses the provided close label', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'info', message: 'Info' },
    ] satisfies ToastItem[])
    fixture.componentRef.setInput('closeLabel', 'Fermer')
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-toaster__close').getAttribute('aria-label'),
    ).toBe('Fermer')
  })

  it('uses an English default close label', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'info', message: 'Info' },
    ] satisfies ToastItem[])
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-toaster__close').getAttribute('aria-label'),
    ).toBe('Close')
  })

  describe('auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('auto-dismisses a toast after the default 5s delay', () => {
      const fixture = TestBed.createComponent(Toaster)
      fixture.componentRef.setInput('toasts', [
        { id: '1', variant: 'info', message: 'Info' },
      ] satisfies ToastItem[])
      const dismissedIds: string[] = []
      fixture.componentInstance.dismissed.subscribe((id) => dismissedIds.push(id))
      fixture.detectChanges()

      vi.advanceTimersByTime(4999)
      expect(dismissedIds).toEqual([])

      vi.advanceTimersByTime(1)
      expect(dismissedIds).toEqual(['1'])
    })

    it('auto-dismisses a toast after its own duration', () => {
      const fixture = TestBed.createComponent(Toaster)
      fixture.componentRef.setInput('toasts', [
        { id: '1', variant: 'info', message: 'Info', duration: 1000 },
      ] satisfies ToastItem[])
      const dismissedIds: string[] = []
      fixture.componentInstance.dismissed.subscribe((id) => dismissedIds.push(id))
      fixture.detectChanges()

      vi.advanceTimersByTime(1000)
      expect(dismissedIds).toEqual(['1'])
    })

    it('does not auto-dismiss a toast with duration 0', () => {
      const fixture = TestBed.createComponent(Toaster)
      fixture.componentRef.setInput('toasts', [
        { id: '1', variant: 'error', message: 'Erreur bloquante', duration: 0 },
      ] satisfies ToastItem[])
      const dismissedIds: string[] = []
      fixture.componentInstance.dismissed.subscribe((id) => dismissedIds.push(id))
      fixture.detectChanges()

      vi.advanceTimersByTime(60_000)
      expect(dismissedIds).toEqual([])
    })

    it('clears the timer of a toast destroyed with the component', () => {
      const fixture = TestBed.createComponent(Toaster)
      fixture.componentRef.setInput('toasts', [
        { id: '1', variant: 'info', message: 'Info' },
      ] satisfies ToastItem[])
      const dismissedIds: string[] = []
      fixture.componentInstance.dismissed.subscribe((id) => dismissedIds.push(id))
      fixture.detectChanges()

      fixture.destroy()
      vi.advanceTimersByTime(5000)

      expect(dismissedIds).toEqual([])
    })
  })

  it('shows a variant-specific icon for each toast', () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'success', message: 'Enregistré' },
      { id: '2', variant: 'error', message: 'Échec' },
      { id: '3', variant: 'warning', message: 'Attention' },
      { id: '4', variant: 'info', message: 'Info' },
    ] satisfies ToastItem[])
    fixture.detectChanges()

    const icons = fixture.debugElement
      .queryAll(By.css('.gbt-toaster__icon'))
      .map((debugElement) => debugElement.query(By.directive(Icon)).componentInstance.name())

    expect(icons).toEqual(['check-circle', 'alert-circle', 'alert-triangle', 'info'])
  })

  it('presents no accessibility violation', async () => {
    const fixture = TestBed.createComponent(Toaster)
    fixture.componentRef.setInput('toasts', [
      { id: '1', variant: 'success', message: 'Enregistré' },
      { id: '2', variant: 'error', message: 'Échec de la requête' },
      { id: '3', variant: 'warning', message: 'Attention' },
      { id: '4', variant: 'info', message: 'Info' },
    ] satisfies ToastItem[])
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
