import { ElementRef, Injector, afterNextRender, computed, signal } from '@angular/core'
import { floatingPanelAnchor } from '@masmarino/gabarit/floating-panel'
import {
  CalendarDay,
  WeekStartsOn,
  addMonths,
  addYears,
  buildCalendarGrid,
  endOfWeek,
  isSameDay,
  shiftDays,
  startOfWeek,
  weekdayLabels as computeWeekdayLabels,
} from './date-picker-calendar'

export interface CalendarPanelView {
  year: number
  month: number
  label: string
  weeks: CalendarDay[][]
}

export interface CalendarPanelDeps {
  elementRef: ElementRef<HTMLElement>
  injector: Injector
  triggerSelector: string
  locale: () => string
  weekStartsOn: () => WeekStartsOn
  visibleMonths: () => number
  minYear: () => number
  maxYear: () => number
  onTouched: () => void
}

export type NavigationResult = 'month-changed' | 'day-changed' | 'unhandled'

/** Panel and calendar-grid mechanics shared by `DatePicker` and `DateRangePicker`; one instance per component. */
export class CalendarPanel {
  readonly open = signal(false)
  readonly anchorDate = signal<Date>(new Date())
  readonly focusedDate = signal<Date>(new Date())
  readonly panelStyle = signal<{ top: string; left: string } | null>(null)

  readonly monthViews = computed<CalendarPanelView[]>(() => {
    const anchor = this.anchorDate()
    const count = this.deps.visibleMonths()
    const formatter = new Intl.DateTimeFormat(this.deps.locale(), {
      month: 'long',
      year: 'numeric',
    })
    const views = Array.from({ length: count }, (_, i) => {
      const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1)
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()
      const days = buildCalendarGrid(year, month, this.deps.weekStartsOn())
      const weeks: CalendarDay[][] = []
      for (let d = 0; d < days.length; d += 7) {
        weeks.push(days.slice(d, d + 7))
      }
      return { year, month, label: formatter.format(monthDate), weeks }
    })
    const neededWeeks = views.map((view) => {
      let last = view.weeks.length
      while (last > 1 && view.weeks[last - 1].every((day) => !day.inCurrentMonth)) {
        last--
      }
      return last
    })
    const sharedWeeks = Math.max(...neededWeeks)
    return views.map((view) => ({ ...view, weeks: view.weeks.slice(0, sharedWeeks) }))
  })

  readonly panelLabel = computed(() => {
    const views = this.monthViews()
    return views.length === 1
      ? views[0].label
      : `${views[0].label} – ${views[views.length - 1].label}`
  })

  readonly weekdayLabels = computed(() =>
    computeWeekdayLabels(this.deps.locale(), this.deps.weekStartsOn()),
  )

  readonly monthOptions = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.deps.locale(), { month: 'long' })
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: formatter.format(new Date(2024, i, 1)),
    }))
  })

  readonly yearOptions = computed(() => {
    const min = this.deps.minYear()
    const max = this.deps.maxYear()
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  })

  constructor(private readonly deps: CalendarPanelDeps) {}

  cellId(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`
  }

  isFocused(date: Date): boolean {
    return isSameDay(this.focusedDate(), date)
  }

  toggle(onOpen: () => Date): void {
    this.open.update((value) => !value)
    if (this.open()) {
      const target = onOpen()
      this.focusedDate.set(target)
      this.anchorDate.set(new Date(target.getFullYear(), target.getMonth(), 1))
      this.updatePanelPosition()
      this.focusCellAfterRender()
    } else {
      this.deps.onTouched()
    }
  }

  close(returnFocus: boolean): void {
    if (!this.open()) {
      return
    }
    this.open.set(false)
    this.deps.onTouched()
    if (returnFocus) {
      this.trigger()?.focus()
    }
  }

  shiftMonth(delta: number): void {
    this.anchorDate.set(addMonths(this.anchorDate(), delta))
    this.focusedDate.set(addMonths(this.focusedDate(), delta))
    this.updatePanelPosition()
    this.focusCellAfterRender()
  }

  onMonthSelect(value: string): void {
    this.setAnchorMonth(this.anchorDate().getFullYear(), Number(value))
  }

  onYearSelect(value: string): void {
    this.setAnchorMonth(Number(value), this.anchorDate().getMonth())
  }

  private setAnchorMonth(year: number, month: number): void {
    const dayOfMonth = this.focusedDate().getDate()
    const daysInTarget = new Date(year, month + 1, 0).getDate()
    this.anchorDate.set(new Date(year, month, 1))
    this.focusedDate.set(new Date(year, month, Math.min(dayOfMonth, daysInTarget)))
    this.updatePanelPosition()
    this.focusCellAfterRender()
  }

  handleNavigationKeydown(event: KeyboardEvent): NavigationResult {
    const current = this.focusedDate()
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault()
      const delta = event.key === 'PageDown' ? 1 : -1
      if (event.shiftKey) {
        this.anchorDate.set(addYears(this.anchorDate(), delta))
        this.focusedDate.set(addYears(current, delta))
      } else {
        this.anchorDate.set(addMonths(this.anchorDate(), delta))
        this.focusedDate.set(addMonths(current, delta))
      }
      this.updatePanelPosition()
      this.focusCellAfterRender()
      return 'month-changed'
    }
    const next = this.nextFocusedDate(current, event)
    if (next === null) {
      return 'unhandled'
    }
    event.preventDefault()
    this.ensureVisible(next)
    this.focusedDate.set(next)
    this.focusCellAfterRender()
    return 'day-changed'
  }

  private nextFocusedDate(current: Date, event: KeyboardEvent): Date | null {
    switch (event.key) {
      case 'ArrowRight':
        return shiftDays(current, 1)
      case 'ArrowLeft':
        return shiftDays(current, -1)
      case 'ArrowDown':
        return shiftDays(current, 7)
      case 'ArrowUp':
        return shiftDays(current, -7)
      case 'Home':
        return startOfWeek(current, this.deps.weekStartsOn())
      case 'End':
        return endOfWeek(current, this.deps.weekStartsOn())
      default:
        return null
    }
  }

  ensureVisible(date: Date): void {
    const anchor = this.anchorDate()
    const visibleMonths = this.deps.visibleMonths()
    const monthsDiff =
      (date.getFullYear() - anchor.getFullYear()) * 12 + (date.getMonth() - anchor.getMonth())
    if (monthsDiff < 0) {
      this.anchorDate.set(new Date(date.getFullYear(), date.getMonth(), 1))
    } else if (monthsDiff >= visibleMonths) {
      this.anchorDate.set(addMonths(anchor, monthsDiff - visibleMonths + 1))
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault()
      event.stopPropagation()
      this.close(true)
    }
  }

  handleClickOutside(event: MouseEvent): void {
    if (this.open() && !this.deps.elementRef.nativeElement.contains(event.target as Node)) {
      this.close(false)
    }
  }

  updatePanelPosition(): void {
    const anchor = floatingPanelAnchor(this.open(), this.trigger())
    if (anchor) {
      this.panelStyle.set({ top: `${anchor.bottom}px`, left: `${anchor.left}px` })
    }
  }

  private trigger(): HTMLButtonElement | null {
    return this.deps.elementRef.nativeElement.querySelector(this.deps.triggerSelector)
  }

  focusCellAfterRender(): void {
    afterNextRender(
      () => {
        const id = this.cellId(this.focusedDate())
        const host = this.deps.elementRef.nativeElement
        host.querySelector<HTMLElement>(`[data-date="${id}"]`)?.focus()
      },
      { injector: this.deps.injector },
    )
  }
}
