import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TestBed } from '@angular/core/testing'
import { DatePicker } from './date-picker'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(DatePicker)
  fixture.componentRef.setInput('locale', 'en-US')
  fixture.detectChanges()
  return fixture
}

const trigger = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-date-picker__trigger')

const panel = (f: ReturnType<typeof setup>): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-date-picker__panel')

const selects = (f: ReturnType<typeof setup>): HTMLSelectElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-date-picker__select'),
]

const monthLabel = (f: ReturnType<typeof setup>): string => {
  const [monthSelect, yearSelect] = selects(f)
  const monthText = monthSelect.options[monthSelect.selectedIndex].text
  return `${monthText} ${yearSelect.value}`
}

const secondMonthLabel = (f: ReturnType<typeof setup>): string | null =>
  f.nativeElement.querySelector('.gbt-date-picker__month-label')?.textContent?.trim() ?? null

const dayCell = (f: ReturnType<typeof setup>, date: Date): HTMLButtonElement | null => {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
  return f.nativeElement.querySelector(`[data-date="${iso}"]`)
}

const clearButton = (f: ReturnType<typeof setup>): HTMLButtonElement | null =>
  f.nativeElement.querySelector('.gbt-date-picker__clear')

const focusedCell = (f: ReturnType<typeof setup>): HTMLButtonElement | null =>
  f.nativeElement.querySelector('.gbt-date-picker__day[tabindex="0"]')

function open(f: ReturnType<typeof setup>): void {
  trigger(f).click()
  f.detectChanges()
}

describe('DatePicker', () => {
  it('shows the placeholder when no date is selected', () => {
    const fixture = setup()
    fixture.componentRef.setInput('placeholder', 'Pick a date')
    fixture.detectChanges()
    expect(trigger(fixture).textContent).toContain('Pick a date')
  })

  it('shows the formatted date once written (writeValue)', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(new Date(2024, 2, 15))
    fixture.detectChanges()
    expect(trigger(fixture).textContent).toContain('Mar 15, 2024')
  })

  it('renders no panel by default, and a grid of day cells once opened', () => {
    const fixture = setup()
    expect(panel(fixture)).toBeNull()

    open(fixture)

    expect(panel(fixture)).not.toBeNull()
    expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__day').length).toBeGreaterThan(0)
  })

  it('renders a full 6-week grid (42 cells) for a month that genuinely needs one', () => {
    const fixture = setup()
    // December 2024 starts on a Sunday (Monday-start week): 6 leading blanks + 31 days spill into a 6th week.
    fixture.componentInstance.writeValue(new Date(2024, 11, 10))
    fixture.detectChanges()
    open(fixture)

    expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__day').length).toBe(42)
  })

  it("doesn't render a wholly-blank trailing week for a month that fits in fewer", () => {
    const fixture = setup()
    // June 2024 needs exactly 5 weeks (5 leading blanks + 30 days = 35 cells) — a 6th week would be pure filler.
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()
    open(fixture)

    expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__day').length).toBe(35)
  })

  it("doesn't show a day number for leading/trailing days outside the current month", () => {
    const fixture = setup()
    // June 2024 starts on a Saturday, so the grid's leading days are late May.
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()
    open(fixture)

    const cells = [...fixture.nativeElement.querySelectorAll('.gbt-date-picker__day')]
    const outside = cells.filter((el: HTMLElement) => !el.hasAttribute('data-date'))
    expect(outside.length).toBeGreaterThan(0)
    expect(outside.every((el: HTMLElement) => el.textContent?.trim() === '')).toBe(true)
    expect(outside.every((el: HTMLElement) => el.tagName !== 'BUTTON')).toBe(true)
    expect(outside.every((el: HTMLElement) => el.getAttribute('role') === 'gridcell')).toBe(true)
  })

  it('opens showing the month of the selected date', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()

    open(fixture)

    expect(monthLabel(fixture)).toBe('June 2024')
  })

  it('opens showing the current month when no date is selected', () => {
    const fixture = setup()
    open(fixture)
    const now = new Date()
    const expected = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now)
    expect(monthLabel(fixture)).toBe(expected)
  })

  it('selects a day on click, emits it, and closes the panel', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()
    let emitted: Date | null = null
    fixture.componentInstance.registerOnChange((v: Date | null) => (emitted = v))
    open(fixture)

    dayCell(fixture, new Date(2024, 5, 20))!.click()
    fixture.detectChanges()

    expect(emitted).toEqual(new Date(2024, 5, 20))
    expect(panel(fixture)).toBeNull()
    expect(trigger(fixture).textContent).toContain('Jun 20, 2024')
  })

  it("doesn't render a clickable cell for a day outside the current month", () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()
    open(fixture)

    // The June 2024 grid starts in late May — there is no cell for it anymore.
    expect(dayCell(fixture, new Date(2024, 4, 27))).toBeNull()
  })

  it('closes the panel and returns focus to the trigger on Escape', () => {
    const fixture = setup()
    open(fixture)

    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
    expect(document.activeElement).toBe(trigger(fixture))
  })

  it('closes the panel on an outside click', () => {
    const fixture = setup()
    open(fixture)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('puts the month heading(s) on the same row as the previous/next buttons', () => {
    const fixture = setup()
    fixture.componentRef.setInput('visibleMonths', 2)
    fixture.componentInstance.writeValue(new Date(2024, 5, 10))
    fixture.detectChanges()
    open(fixture)

    const nav = fixture.nativeElement.querySelector('.gbt-date-picker__nav')
    expect(nav.querySelectorAll('.gbt-date-picker__month-heading').length).toBe(2)
    expect(fixture.nativeElement.querySelector('.gbt-date-picker__month .gbt-date-picker__month-heading')).toBeNull()
  })

  describe('grid keyboard navigation', () => {
    function openOn(fixture: ReturnType<typeof setup>, date: Date) {
      fixture.componentInstance.writeValue(date)
      fixture.detectChanges()
      open(fixture)
    }

    function pressOnFocused(fixture: ReturnType<typeof setup>, key: string, shiftKey = false) {
      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }))
      fixture.detectChanges()
    }

    it('starts with the selected day focused', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 10)))
    })

    it('ArrowRight moves focus one day forward, rolling into the next month', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 30))

      pressOnFocused(fixture, 'ArrowRight')

      expect(monthLabel(fixture)).toBe('July 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 6, 1)))
    })

    it('ArrowLeft moves focus one day back, rolling into the previous month', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 1))

      pressOnFocused(fixture, 'ArrowLeft')

      expect(monthLabel(fixture)).toBe('May 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 4, 31)))
    })

    it('ArrowDown moves focus one week forward', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'ArrowDown')

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 17)))
    })

    it('ArrowUp moves focus one week back', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'ArrowUp')

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 3)))
    })

    it('Home moves focus to the start of the current week', () => {
      const fixture = setup()
      // June 13 2024 is a Thursday; the week (Monday-start) begins June 10.
      openOn(fixture, new Date(2024, 5, 13))

      pressOnFocused(fixture, 'Home')

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 10)))
    })

    it('End moves focus to the end of the current week', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 13))

      pressOnFocused(fixture, 'End')

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 5, 16)))
    })

    it('PageDown moves the view forward a month, keeping the same day of month', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'PageDown')

      expect(monthLabel(fixture)).toBe('July 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 6, 10)))
    })

    it('PageUp moves the view back a month', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'PageUp')

      expect(monthLabel(fixture)).toBe('May 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 4, 10)))
    })

    it('Shift+PageDown moves the view forward a year', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'PageDown', true)

      expect(monthLabel(fixture)).toBe('June 2025')
    })

    it('Shift+PageUp moves the view back a year', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))

      pressOnFocused(fixture, 'PageUp', true)

      expect(monthLabel(fixture)).toBe('June 2023')
    })

    it('Enter selects the focused day and closes the panel', () => {
      const fixture = setup()
      openOn(fixture, new Date(2024, 5, 10))
      let emitted: Date | null = null
      fixture.componentInstance.registerOnChange((v: Date | null) => (emitted = v))

      pressOnFocused(fixture, 'ArrowRight')
      pressOnFocused(fixture, 'Enter')

      expect(emitted).toEqual(new Date(2024, 5, 11))
      expect(panel(fixture)).toBeNull()
    })
  })

  it('disables the trigger when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(trigger(fixture).disabled).toBe(true)
  })

  it('does not open when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    trigger(fixture).click()
    fixture.detectChanges()
    expect(panel(fixture)).toBeNull()
  })

  it('disables via setDisabledState (form-driven)', () => {
    const fixture = setup()
    fixture.componentInstance.setDisabledState(true)
    fixture.detectChanges()
    expect(trigger(fixture).disabled).toBe(true)
  })

  describe('clearable', () => {
    it('renders no clear button by default, even with a value', () => {
      const fixture = setup()
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      expect(clearButton(fixture)).toBeNull()
    })

    it('renders no clear button when clearable but no value is selected', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.detectChanges()
      expect(clearButton(fixture)).toBeNull()
    })

    it('renders a clear button once clearable and a value is selected', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      expect(clearButton(fixture)).not.toBeNull()
    })

    it('clears the value, emits null, and hides itself when clicked', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      let emitted: Date | null | undefined
      fixture.componentInstance.registerOnChange((v: Date | null) => (emitted = v))

      clearButton(fixture)!.click()
      fixture.detectChanges()

      expect(emitted).toBeNull()
      expect(trigger(fixture).textContent).toContain('Select a date…')
      expect(clearButton(fixture)).toBeNull()
    })

    it('does not open the panel when the clear button is clicked', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()

      clearButton(fixture)!.click()
      fixture.detectChanges()

      expect(panel(fixture)).toBeNull()
    })

    it('hides the clear button when disabled, even with a value', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentRef.setInput('disabled', true)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      expect(clearButton(fixture)).toBeNull()
    })

    it('uses the provided clear label', () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentRef.setInput('clearLabel', 'Effacer')
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      expect(clearButton(fixture)!.getAttribute('aria-label')).toBe('Effacer')
    })

    it('has no a11y violations with the clear button visible', async () => {
      const fixture = setup()
      fixture.componentRef.setInput('clearable', true)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('visibleMonths', () => {
    it('shows a single month by default', () => {
      const fixture = setup()
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)

      expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__month').length).toBe(1)
      // June 2024 needs exactly 5 weeks (5 leading blanks + 30 days).
      expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__day').length).toBe(35)
    })

    it('shows two consecutive months when visibleMonths is 2', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)

      expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__month').length).toBe(2)
      // Both June and July 2024 need exactly 5 weeks, so both grids share that height.
      expect(fixture.nativeElement.querySelectorAll('.gbt-date-picker__day').length).toBe(70)
      expect(monthLabel(fixture)).toBe('June 2024')
      expect(secondMonthLabel(fixture)).toBe('July 2024')
    })

    it('keeps both visible months the same height, even if only one needs the extra week', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      // November 2024 needs 5 weeks, but December 2024 (the second visible month) needs 6.
      fixture.componentInstance.writeValue(new Date(2024, 10, 10))
      fixture.detectChanges()
      open(fixture)

      const grids = [...fixture.nativeElement.querySelectorAll('.gbt-date-picker__grid')]
      const rowCounts = grids.map(
        (g: HTMLElement) => g.querySelectorAll('.gbt-date-picker__row:not(.gbt-date-picker__row--head)').length,
      )
      expect(rowCounts).toEqual([6, 6])
    })

    it('shifts both visible months together via the next/previous buttons', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)

      fixture.nativeElement.querySelector('.gbt-date-picker__nav-button[aria-label="Next month"]').click()
      fixture.detectChanges()

      expect(monthLabel(fixture)).toBe('July 2024')
      expect(secondMonthLabel(fixture)).toBe('August 2024')
    })

    it('moves focus into the second visible month without shifting the view', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      // June 30 2024 is the last day of the first visible month.
      fixture.componentInstance.writeValue(new Date(2024, 5, 30))
      fixture.detectChanges()
      open(fixture)

      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()

      expect(monthLabel(fixture)).toBe('June 2024')
      expect(secondMonthLabel(fixture)).toBe('July 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 6, 1)))
    })

    it('slides the view forward by one month when focus moves past the last visible month', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      // July 31 2024 is the last day of the second (last) visible month.
      fixture.componentInstance.writeValue(new Date(2024, 6, 31))
      fixture.detectChanges()
      open(fixture)

      focusedCell(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()

      expect(monthLabel(fixture)).toBe('July 2024')
      expect(secondMonthLabel(fixture)).toBe('August 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 7, 1)))
    })

    it('selects a day clicked in the second visible month', () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      let emitted: Date | null = null
      fixture.componentInstance.registerOnChange((v: Date | null) => (emitted = v))
      open(fixture)

      dayCell(fixture, new Date(2024, 6, 15))!.click()
      fixture.detectChanges()

      expect(emitted).toEqual(new Date(2024, 6, 15))
      expect(panel(fixture)).toBeNull()
    })

    it('has no a11y violations with two visible months', async () => {
      const fixture = setup()
      fixture.componentRef.setInput('visibleMonths', 2)
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('month/year select navigation', () => {
    it('jumps to the chosen month without changing the year', () => {
      const fixture = setup()
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)

      const [monthSelect] = selects(fixture)
      monthSelect.value = '0' // January
      monthSelect.dispatchEvent(new Event('change'))
      fixture.detectChanges()

      expect(monthLabel(fixture)).toBe('January 2024')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 0, 10)))
    })

    it('jumps to the chosen year without changing the month', () => {
      const fixture = setup()
      fixture.componentInstance.writeValue(new Date(2024, 5, 10))
      fixture.detectChanges()
      open(fixture)

      const [, yearSelect] = selects(fixture)
      yearSelect.value = '2030'
      yearSelect.dispatchEvent(new Event('change'))
      fixture.detectChanges()

      expect(monthLabel(fixture)).toBe('June 2030')
      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2030, 5, 10)))
    })

    it('clamps the focused day when jumping to a shorter month', () => {
      const fixture = setup()
      fixture.componentInstance.writeValue(new Date(2024, 0, 31)) // Jan 31
      fixture.detectChanges()
      open(fixture)

      const [monthSelect] = selects(fixture)
      monthSelect.value = '1' // February (29 days in 2024)
      monthSelect.dispatchEvent(new Event('change'))
      fixture.detectChanges()

      expect(focusedCell(fixture)).toBe(dayCell(fixture, new Date(2024, 1, 29)))
    })

    it('bounds the year options to minYear/maxYear', () => {
      const fixture = setup()
      fixture.componentRef.setInput('minYear', 2020)
      fixture.componentRef.setInput('maxYear', 2022)
      fixture.componentInstance.writeValue(new Date(2021, 5, 10))
      fixture.detectChanges()
      open(fixture)

      const [, yearSelect] = selects(fixture)
      const years = [...yearSelect.options].map((o) => o.value)
      expect(years).toEqual(['2020', '2021', '2022'])
    })
  })

  it('uses Monday-start weekdays by default', () => {
    const fixture = setup()
    open(fixture)
    const labels = [...fixture.nativeElement.querySelectorAll('.gbt-date-picker__weekday')].map(
      (el: HTMLElement) => el.textContent?.trim(),
    )
    expect(labels[0]).toBe('Mon')
    expect(labels[6]).toBe('Sun')
  })

  it('supports Sunday-start weeks via weekStartsOn', () => {
    const fixture = setup()
    fixture.componentRef.setInput('weekStartsOn', 0)
    fixture.detectChanges()
    open(fixture)
    const labels = [...fixture.nativeElement.querySelectorAll('.gbt-date-picker__weekday')].map(
      (el: HTMLElement) => el.textContent?.trim(),
    )
    expect(labels[0]).toBe('Sun')
    expect(labels[6]).toBe('Sat')
  })

  it('has no a11y violations, closed', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, open', async () => {
    const fixture = setup()
    open(fixture)
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [DatePicker, FormsModule],
  template: `<gbt-date-picker [(ngModel)]="date" />`,
})
class NgModelHostComponent {
  date: Date | null = null
}

describe('DatePicker — ngModel integration', () => {
  it('updates the bound model when a day is selected', () => {
    const fixture = TestBed.createComponent(NgModelHostComponent)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-date-picker__trigger').click()
    fixture.detectChanges()

    const cell = [...fixture.nativeElement.querySelectorAll('.gbt-date-picker__day')].find(
      (el: HTMLElement) => el.textContent?.trim() === '15',
    ) as HTMLElement
    cell.click()
    fixture.detectChanges()

    expect(fixture.componentInstance.date?.getDate()).toBe(15)
  })
})
