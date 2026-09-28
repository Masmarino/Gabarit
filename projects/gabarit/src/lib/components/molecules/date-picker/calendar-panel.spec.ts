import { Component, ElementRef, Injector, inject } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { CalendarPanel, type CalendarPanelDeps } from './calendar-panel'

@Component({
  standalone: true,
  template: `
    <button class="trigger">Open</button>
    <div class="cells"></div>
  `,
})
class Host {
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef)
  readonly injector = inject(Injector)
}

describe('CalendarPanel', () => {
  function setup(overrides: Partial<CalendarPanelDeps> = {}) {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const { elementRef, injector } = fixture.componentInstance
    const trigger = elementRef.nativeElement.querySelector<HTMLElement>('.trigger')!
    trigger.getBoundingClientRect = () =>
      ({ top: 40, bottom: 60, left: 10, right: 210, width: 200, height: 20 }) as DOMRect
    const onTouched = vi.fn()
    const panel = new CalendarPanel({
      elementRef,
      injector,
      triggerSelector: '.trigger',
      locale: () => 'en-US',
      weekStartsOn: () => 1,
      visibleMonths: () => 1,
      minYear: () => 2000,
      maxYear: () => 2030,
      onTouched,
      ...overrides,
    })
    return { fixture, elementRef, panel, onTouched }
  }

  it('builds one month view per visibleMonths, anchored on anchorDate', () => {
    const { panel } = setup({ visibleMonths: () => 2 })
    panel.anchorDate.set(new Date(2024, 0, 1))
    const views = panel.monthViews()
    expect(views.map((v) => `${v.year}-${v.month}`)).toEqual(['2024-0', '2024-1'])
    expect(views[0].weeks.length).toBeGreaterThan(0)
  })

  it('labels a single month view with its own label, and a multi-month view as a range', () => {
    const single = setup({ visibleMonths: () => 1 }).panel
    single.anchorDate.set(new Date(2024, 0, 1))
    expect(single.panelLabel()).toBe('January 2024')

    const range = setup({ visibleMonths: () => 2 }).panel
    range.anchorDate.set(new Date(2024, 0, 1))
    expect(range.panelLabel()).toBe('January 2024 – February 2024')
  })

  it('formats cellId as a stable, zero-padded ISO-like date key', () => {
    const { panel } = setup()
    expect(panel.cellId(new Date(2024, 0, 5))).toBe('2024-01-05')
  })

  it('toggles open, anchoring on the date onOpen returns, and closed calls onTouched', () => {
    const { panel, onTouched } = setup()
    panel.toggle(() => new Date(2024, 5, 15))
    expect(panel.open()).toBe(true)
    expect(panel.focusedDate()).toEqual(new Date(2024, 5, 15))
    expect(panel.anchorDate()).toEqual(new Date(2024, 5, 1))
    expect(onTouched).not.toHaveBeenCalled()

    panel.toggle(() => new Date())
    expect(panel.open()).toBe(false)
    expect(onTouched).toHaveBeenCalledTimes(1)
  })

  it('close() is a no-op while already closed, and calls onTouched exactly once while open', () => {
    const { panel, onTouched } = setup()
    panel.close(false)
    expect(onTouched).not.toHaveBeenCalled()

    panel.toggle(() => new Date())
    panel.close(false)
    expect(onTouched).toHaveBeenCalledTimes(1)
  })

  it('close(true) returns focus to the trigger', () => {
    const { panel, fixture } = setup()
    panel.toggle(() => new Date())
    panel.close(true)
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.trigger'))
  })

  it('shiftMonth moves both the anchor and the focused date by whole months', () => {
    const { panel } = setup()
    panel.anchorDate.set(new Date(2024, 0, 15))
    panel.focusedDate.set(new Date(2024, 0, 15))
    panel.shiftMonth(1)
    expect(panel.anchorDate()).toEqual(new Date(2024, 1, 15))
    expect(panel.focusedDate()).toEqual(new Date(2024, 1, 15))
  })

  it('onMonthSelect/onYearSelect move the anchor, clamping the day to the target month', () => {
    const { panel } = setup()
    panel.anchorDate.set(new Date(2024, 0, 31))
    panel.focusedDate.set(new Date(2024, 0, 31))
    panel.onMonthSelect('1') // February 2024 has 29 days
    expect(panel.focusedDate()).toEqual(new Date(2024, 1, 29))

    panel.onYearSelect('2025') // February 2025 has 28 days
    expect(panel.focusedDate()).toEqual(new Date(2025, 1, 28))
  })

  describe('handleNavigationKeydown', () => {
    it('moves the focused date by a day on arrow keys, reporting day-changed', () => {
      const { panel } = setup()
      panel.focusedDate.set(new Date(2024, 5, 15))
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
      expect(panel.handleNavigationKeydown(event)).toBe('day-changed')
      expect(panel.focusedDate()).toEqual(new Date(2024, 5, 16))
      expect(event.defaultPrevented).toBe(true)
    })

    it('jumps a month on PageDown/PageUp, and a year with Shift, reporting month-changed', () => {
      const { panel } = setup()
      panel.anchorDate.set(new Date(2024, 5, 15))
      panel.focusedDate.set(new Date(2024, 5, 15))
      expect(panel.handleNavigationKeydown(new KeyboardEvent('keydown', { key: 'PageDown' }))).toBe(
        'month-changed',
      )
      expect(panel.focusedDate()).toEqual(new Date(2024, 6, 15))

      expect(
        panel.handleNavigationKeydown(
          new KeyboardEvent('keydown', { key: 'PageUp', shiftKey: true }),
        ),
      ).toBe('month-changed')
      expect(panel.focusedDate()).toEqual(new Date(2023, 6, 15))
    })

    it('reports unhandled, and touches nothing, for a key it does not own', () => {
      const { panel } = setup()
      panel.focusedDate.set(new Date(2024, 5, 15))
      expect(panel.handleNavigationKeydown(new KeyboardEvent('keydown', { key: 'a' }))).toBe(
        'unhandled',
      )
      expect(panel.focusedDate()).toEqual(new Date(2024, 5, 15))
    })
  })

  it('onEscape closes and returns focus only while open, on the Escape key', () => {
    const { panel, fixture } = setup()
    panel.onEscape(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(panel.open()).toBe(false)

    panel.toggle(() => new Date())
    panel.onEscape(new KeyboardEvent('keydown', { key: 'a' }))
    expect(panel.open()).toBe(true)

    panel.onEscape(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    expect(panel.open()).toBe(false)
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.trigger'))
  })

  it('handleClickOutside closes when the click lands outside the host', () => {
    const { panel } = setup()
    panel.toggle(() => new Date())
    document.addEventListener('click', (event) => panel.handleClickOutside(event), { once: true })
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(panel.open()).toBe(false)
  })

  it('handleClickOutside does nothing when the click lands inside the host', () => {
    const { panel, fixture } = setup()
    panel.toggle(() => new Date())
    document.addEventListener('click', (event) => panel.handleClickOutside(event), { once: true })
    fixture.nativeElement
      .querySelector('.trigger')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(panel.open()).toBe(true)
  })

  it('updatePanelPosition anchors the panel below the trigger while open, and does nothing while closed', () => {
    const { panel } = setup()
    panel.updatePanelPosition()
    expect(panel.panelStyle()).toBeNull()

    panel.toggle(() => new Date())
    expect(panel.panelStyle()).toEqual({ top: '66px', left: '10px' })
  })

  it('focuses the cell matching focusedDate once the view has flushed', async () => {
    const { panel, fixture } = setup()
    const cell = document.createElement('button')
    cell.setAttribute('data-date', '2024-06-15')
    fixture.nativeElement.querySelector('.cells').appendChild(cell)
    panel.focusedDate.set(new Date(2024, 5, 15))

    panel.focusCellAfterRender()
    expect(document.activeElement).not.toBe(cell)
    await fixture.whenStable()
    expect(document.activeElement).toBe(cell)
  })
})
