import { Component } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TestBed } from '@angular/core/testing'
import { DateRangePicker, type DateRangeValue } from './date-range-picker'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(DateRangePicker)
  fixture.componentRef.setInput('locale', 'en-US')
  fixture.detectChanges()
  return fixture
}

const trigger = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-date-range-picker__trigger')

const panel = (f: ReturnType<typeof setup>): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-date-range-picker__panel')

const dayCell = (f: ReturnType<typeof setup>, date: Date): HTMLButtonElement | null => {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
  return f.nativeElement.querySelector(`[data-date="${iso}"]`)
}

const focusedCell = (f: ReturnType<typeof setup>): HTMLButtonElement | null =>
  f.nativeElement.querySelector('.gbt-date-range-picker__day[tabindex="0"]')

const statusRegion = (f: ReturnType<typeof setup>): HTMLElement =>
  f.nativeElement.querySelector('[role="status"][aria-live="polite"]')

function open(f: ReturnType<typeof setup>): void {
  trigger(f).click()
  f.detectChanges()
}

/** Anchors the calendar on `date`'s month (and focuses `date`) via the public API, without leaving a value set. */
function seedAnchor(f: ReturnType<typeof setup>, date: Date): void {
  f.componentInstance.writeValue({ start: date, end: date })
  f.componentInstance.writeValue(null)
  f.detectChanges()
}

describe('DateRangePicker', () => {
  it('shows the placeholder when no range is selected', () => {
    const fixture = setup()
    fixture.componentRef.setInput('placeholder', 'Pick a range')
    fixture.detectChanges()
    expect(trigger(fixture).textContent).toContain('Pick a range')
  })

  it('shows the formatted range once written (writeValue)', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    fixture.detectChanges()
    expect(trigger(fixture).textContent).toContain('Jun 10, 2024')
    expect(trigger(fixture).textContent).toContain('Jun 20, 2024')
  })

  it('renders no panel by default, and shows two months by default once opened', () => {
    const fixture = setup()
    expect(panel(fixture)).toBeNull()

    open(fixture)

    expect(panel(fixture)).not.toBeNull()
    expect(fixture.nativeElement.querySelectorAll('.gbt-date-range-picker__month').length).toBe(2)
  })

  it('opens showing the month of the range start when a range is already set', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    fixture.detectChanges()

    open(fixture)

    const [monthSelect] = [
      ...fixture.nativeElement.querySelectorAll('.gbt-date-range-picker__select'),
    ] as HTMLSelectElement[]
    expect(monthSelect.options[monthSelect.selectedIndex].text).toBe('June')
  })

  it('picks a start on the first click, keeps the panel open, and does not commit yet', () => {
    const fixture = setup()
    let emitted: DateRangeValue | null | undefined = undefined
    fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
    open(fixture)

    dayCell(fixture, new Date())!.click()
    fixture.detectChanges()

    expect(panel(fixture)).not.toBeNull()
    expect(emitted).toBeUndefined()
  })

  it('moves the roving tabindex to the newly-picked start, so focus follows it', () => {
    // The actual `.focus()` call is scheduled via `afterNextRender`, which
    // doesn't reliably flush inside one synchronous `detectChanges()` here —
    // same convention `DatePicker`'s and `Tree`'s own keyboard tests use.
    // Verified for real in Storybook instead.
    const fixture = setup()
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 5))!.click()
    fixture.detectChanges()

    expect(dayCell(fixture, new Date(2024, 5, 5))!.getAttribute('tabindex')).toBe('0')
  })

  it('picks the end on the second click, commits, and closes the panel', () => {
    const fixture = setup()
    let emitted: DateRangeValue | null | undefined = undefined
    fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 10))!.click()
    fixture.detectChanges()
    dayCell(fixture, new Date(2024, 5, 20))!.click()
    fixture.detectChanges()

    expect(emitted).toEqual({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    expect(panel(fixture)).toBeNull()
    expect(trigger(fixture).textContent).toContain('Jun 10, 2024')
    expect(trigger(fixture).textContent).toContain('Jun 20, 2024')
  })

  it('swaps start and end when the second click lands before the first', () => {
    const fixture = setup()
    let emitted: DateRangeValue | null = null
    fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 20))!.click()
    fixture.detectChanges()
    dayCell(fixture, new Date(2024, 5, 10))!.click()
    fixture.detectChanges()

    expect(emitted).toEqual({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
  })

  it('starts a brand-new range when clicking again after a range is already complete', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    let emitted: DateRangeValue | null = null
    fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 5))!.click()
    fixture.detectChanges()

    // Still mid-selection: the click above only set a new start.
    expect(emitted).toBeNull()
    expect(panel(fixture)).not.toBeNull()

    dayCell(fixture, new Date(2024, 5, 15))!.click()
    fixture.detectChanges()

    expect(emitted).toEqual({ start: new Date(2024, 5, 5), end: new Date(2024, 5, 15) })
  })

  it('marks the range start and every day between start and hover as previewing', () => {
    const fixture = setup()
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 10))!.click()
    fixture.detectChanges()
    dayCell(fixture, new Date(2024, 5, 13))!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()

    expect(dayCell(fixture, new Date(2024, 5, 10))!.classList).toContain(
      'gbt-date-range-picker__day--start-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 11))!.classList).toContain(
      'gbt-date-range-picker__day--in-range',
    )
    expect(dayCell(fixture, new Date(2024, 5, 13))!.classList).toContain(
      'gbt-date-range-picker__day--end-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 14))!.classList).not.toContain(
      'gbt-date-range-picker__day--in-range',
    )
  })

  it('previews correctly when hovering before the start date', () => {
    const fixture = setup()
    open(fixture)
    seedAnchor(fixture, new Date(2024, 5, 1))
    fixture.detectChanges()

    dayCell(fixture, new Date(2024, 5, 10))!.click()
    fixture.detectChanges()
    dayCell(fixture, new Date(2024, 5, 5))!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    fixture.detectChanges()

    expect(dayCell(fixture, new Date(2024, 5, 5))!.classList).toContain(
      'gbt-date-range-picker__day--start-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 10))!.classList).toContain(
      'gbt-date-range-picker__day--end-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 7))!.classList).toContain(
      'gbt-date-range-picker__day--in-range',
    )
  })

  it('renders a completed range identically without a hover, minus the preview modifier', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 13) })
    open(fixture)
    fixture.detectChanges()

    expect(dayCell(fixture, new Date(2024, 5, 10))!.classList).toContain(
      'gbt-date-range-picker__day--start-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 13))!.classList).toContain(
      'gbt-date-range-picker__day--end-cap',
    )
    expect(dayCell(fixture, new Date(2024, 5, 11))!.classList).toContain(
      'gbt-date-range-picker__day--in-range',
    )
    expect(dayCell(fixture, new Date(2024, 5, 10))!.classList).not.toContain(
      'gbt-date-range-picker__day--preview',
    )
  })

  it('clears the range on clear', () => {
    const fixture = setup()
    fixture.componentRef.setInput('clearable', true)
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    let emitted: DateRangeValue | null | undefined = undefined
    fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-date-range-picker__clear').click()
    fixture.detectChanges()

    expect(emitted).toBeNull()
    expect(trigger(fixture).textContent).toContain('Select a date range')
  })

  describe('keyboard navigation', () => {
    it('moves focus with the arrow keys without changing the selection', () => {
      const fixture = setup()
      open(fixture)
      seedAnchor(fixture, new Date(2024, 5, 10))
      fixture.detectChanges()

      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 11)))
    })

    it('Enter on the focused day behaves exactly like a click', () => {
      const fixture = setup()
      let emitted: DateRangeValue | null = null
      fixture.componentInstance.registerOnChange((v: DateRangeValue | null) => (emitted = v))
      open(fixture)
      seedAnchor(fixture, new Date(2024, 5, 10))
      fixture.detectChanges()

      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      fixture.detectChanges()
      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()
      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      fixture.detectChanges()

      expect(emitted).toEqual({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 11) })
    })
  })

  describe('visibleMonths', () => {
    it('defaults to two months', () => {
      const fixture = setup()
      open(fixture)
      expect(fixture.nativeElement.querySelectorAll('.gbt-date-range-picker__month').length).toBe(2)
    })

    it('shows a single month when visibleMonths is 1', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 1)
      open(fixture)
      expect(fixture.nativeElement.querySelectorAll('.gbt-date-range-picker__month').length).toBe(1)
    })
  })

  it('disables the trigger when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(trigger(fixture).disabled).toBe(true)
  })

  it('disables via setDisabledState (form-driven)', () => {
    const fixture = setup()
    fixture.componentInstance.setDisabledState(true)
    fixture.detectChanges()
    expect(trigger(fixture).disabled).toBe(true)
  })

  it('closes the panel and returns focus to the trigger on Escape', () => {
    const fixture = setup()
    open(fixture)

    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
    expect(document.activeElement).toBe(trigger(fixture))
  })

  describe('status announcement', () => {
    it('pre-exists empty, before anything is selected', () => {
      const fixture = setup()
      open(fixture)
      expect(statusRegion(fixture).textContent?.trim()).toBe('')
    })

    it('announces the start once picked, prompting for an end date', () => {
      const fixture = setup()
      open(fixture)
      seedAnchor(fixture, new Date(2024, 5, 1))
      fixture.detectChanges()

      dayCell(fixture, new Date(2024, 5, 10))!.click()
      fixture.detectChanges()

      expect(statusRegion(fixture).textContent).toContain('Jun 10, 2024')
    })

    it('formats the full-range announcement once complete', () => {
      // Completing the range closes the panel in the same tick (by design —
      // see the README), which unmounts the status region along with the
      // rest of the panel. The trigger's own updated text is what a user
      // actually sees at that point (covered by its own test); this checks
      // the message the region *would* show up to that instant, straight
      // from its computed source.
      const fixture = setup()
      open(fixture)
      seedAnchor(fixture, new Date(2024, 5, 1))
      fixture.detectChanges()

      dayCell(fixture, new Date(2024, 5, 10))!.click()
      fixture.detectChanges()
      expect(statusRegion(fixture).textContent).toContain('Jun 10, 2024')

      dayCell(fixture, new Date(2024, 5, 20))!.click()
      fixture.detectChanges()

      const message = (
        fixture.componentInstance as unknown as { statusMessage(): string }
      ).statusMessage()
      expect(message).toContain('Jun 10, 2024')
      expect(message).toContain('Jun 20, 2024')
    })
  })

  it('has no a11y violations, closed', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, open with no selection', async () => {
    const fixture = setup()
    open(fixture)
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no a11y violations, open mid-selection', async () => {
    const fixture = setup()
    open(fixture)
    dayCell(fixture, new Date())!.click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no a11y violations, with a completed range', async () => {
    const fixture = setup()
    fixture.componentInstance.writeValue({ start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) })
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [DateRangePicker, FormsModule],
  template: `<gbt-date-range-picker [(ngModel)]="range" />`,
})
class NgModelHostComponent {
  range: DateRangeValue | null = null
}

describe('DateRangePicker — ngModel integration', () => {
  it('updates the bound model once a range is completed', () => {
    const fixture = TestBed.createComponent(NgModelHostComponent)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-date-range-picker__trigger').click()
    fixture.detectChanges()

    const grid = fixture.nativeElement.querySelector('.gbt-date-range-picker__grid')
    const first: HTMLButtonElement = grid.querySelector('.gbt-date-range-picker__day[data-date]')
    first.click()
    fixture.detectChanges()

    const days: HTMLButtonElement[] = [
      ...fixture.nativeElement.querySelectorAll('.gbt-date-range-picker__day[data-date]'),
    ]
    days[days.length - 1].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.range).not.toBeNull()
    expect(fixture.componentInstance.range!.end).not.toBeNull()
  })
})

@Component({
  standalone: true,
  imports: [DateRangePicker, ReactiveFormsModule],
  template: `<gbt-date-range-picker [formControl]="control" />`,
})
class FormControlHostComponent {
  control = new FormControl<DateRangeValue | null>({ value: null, disabled: true })
}

describe('DateRangePicker — reactive forms integration', () => {
  it('starts disabled when bound to a FormControl created already disabled', () => {
    const fixture = TestBed.createComponent(FormControlHostComponent)
    fixture.detectChanges()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.gbt-date-range-picker__trigger',
    )
    expect(trigger.disabled).toBe(true)
  })
})
