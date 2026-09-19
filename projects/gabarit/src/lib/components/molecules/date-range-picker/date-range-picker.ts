import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Icon } from '../../atoms/icon/icon'
import {
  CalendarDay,
  WeekStartsOn,
  addMonths,
  addYears,
  buildCalendarGrid,
  endOfWeek,
  isSameDay,
  startOfWeek,
  weekdayLabels,
} from '../date-picker/date-picker-calendar'

export type DateRangeVisibleMonths = 1 | 2

export interface DateRangeValue {
  start: Date
  end: Date | null
}

export interface DateRangePickerMonthView {
  year: number
  month: number
  label: string
  weeks: CalendarDay[][]
}

let nextId = 0

const CURRENT_YEAR = new Date().getFullYear()

@Component({
  selector: 'gbt-date-range-picker',
  standalone: true,
  imports: [Icon],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'handleClickOutside($event)',
    '(keydown)': 'onEscape($event)',
    '(window:scroll)': 'updatePanelPosition()',
    '(window:resize)': 'updatePanelPosition()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePicker),
      multi: true,
    },
  ],
})
export class DateRangePicker implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef)
  private readonly injector = inject(Injector)

  id = input<string>(`gbt-date-range-picker-${++nextId}`)
  label = input<string>('')
  placeholder = input<string>('Select a date range…')
  locale = input<string>('en-US')
  weekStartsOn = input<WeekStartsOn>(1)
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  previousMonthLabel = input<string>('Previous month')
  nextMonthLabel = input<string>('Next month')
  clearable = input(false, { transform: booleanAttribute })
  clearLabel = input<string>('Clear date range')
  visibleMonths = input<DateRangeVisibleMonths>(2)
  monthSelectLabel = input<string>('Month')
  yearSelectLabel = input<string>('Year')
  minYear = input<number>(CURRENT_YEAR - 100)
  maxYear = input<number>(CURRENT_YEAR + 10)
  rangeStatus = input<(start: string | null, end: string | null) => string>((start, end) => {
    if (!start) return ''
    if (!end) return `${start} selected as the start date. Choose an end date.`
    return `Date range: ${start} to ${end}.`
  })

  protected readonly open = signal(false)
  protected readonly value = signal<DateRangeValue | null>(null)
  protected readonly draftStart = signal<Date | null>(null)
  protected readonly draftEnd = signal<Date | null>(null)
  protected readonly hoveredDate = signal<Date | null>(null)
  protected readonly focusedDate = signal<Date>(new Date())
  protected readonly anchorDate = signal<Date>(new Date())
  protected readonly panelStyle = signal<{ top: string; left: string } | null>(null)

  private readonly formDisabled = signal(false)
  private onChange: (value: DateRangeValue | null) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())
  protected readonly showClear = computed(
    () => this.clearable() && this.value() !== null && !this.isDisabled(),
  )

  protected readonly monthViews = computed<DateRangePickerMonthView[]>(() => {
    const anchor = this.anchorDate()
    const count = this.visibleMonths()
    const formatter = new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' })
    const views = Array.from({ length: count }, (_, i) => {
      const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1)
      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()
      const days = buildCalendarGrid(year, month, this.weekStartsOn())
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

  protected readonly panelLabel = computed(() => {
    const views = this.monthViews()
    return views.length === 1 ? views[0].label : `${views[0].label} – ${views[views.length - 1].label}`
  })

  protected readonly weekdayLabels = computed(() => weekdayLabels(this.locale(), this.weekStartsOn()))

  protected readonly monthOptions = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.locale(), { month: 'long' })
    return Array.from({ length: 12 }, (_, i) => ({ value: i, label: formatter.format(new Date(2024, i, 1)) }))
  })

  protected readonly yearOptions = computed(() => {
    const min = this.minYear()
    const max = this.maxYear()
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  })

  private readonly dateFormatter = computed(
    () => new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }),
  )

  protected readonly triggerLabel = computed(() => {
    const v = this.value()
    if (!v) return ''
    const formatter = this.dateFormatter()
    if (!v.end) return formatter.format(v.start)
    return `${formatter.format(v.start)} – ${formatter.format(v.end)}`
  })

  /** The visual [lower, upper] bounds to paint — the confirmed range once `draftEnd` is set, else a live preview against `hoveredDate`. */
  private readonly previewBounds = computed<{ lower: Date; upper: Date } | null>(() => {
    const start = this.draftStart()
    if (!start) return null
    const other = this.draftEnd() ?? this.hoveredDate()
    if (!other) return null
    return start.getTime() <= other.getTime() ? { lower: start, upper: other } : { lower: other, upper: start }
  })

  protected readonly isPreviewing = computed(() => this.draftStart() !== null && this.draftEnd() === null)

  protected readonly statusMessage = computed(() => {
    const start = this.draftStart()
    if (!start) return ''
    const formatter = this.dateFormatter()
    const end = this.draftEnd()
    return this.rangeStatus()(formatter.format(start), end ? formatter.format(end) : null)
  })

  writeValue(value: DateRangeValue | null): void {
    this.value.set(value)
    if (value) {
      this.focusedDate.set(value.start)
      this.anchorDate.set(new Date(value.start.getFullYear(), value.start.getMonth(), 1))
    }
  }

  registerOnChange(fn: (value: DateRangeValue | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected isRangeStartCap(date: Date): boolean {
    const bounds = this.previewBounds()
    return bounds !== null && isSameDay(date, bounds.lower)
  }

  protected isRangeEndCap(date: Date): boolean {
    const bounds = this.previewBounds()
    return bounds !== null && isSameDay(date, bounds.upper)
  }

  protected isInRange(date: Date): boolean {
    const bounds = this.previewBounds()
    return bounds !== null && date.getTime() > bounds.lower.getTime() && date.getTime() < bounds.upper.getTime()
  }

  protected isFocused(date: Date): boolean {
    return isSameDay(this.focusedDate(), date)
  }

  protected cellId(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) {
      return
    }
    this.open.update((v) => !v)
    if (this.open()) {
      const value = this.value()
      const target = value?.start ?? new Date()
      this.draftStart.set(value?.start ?? null)
      this.draftEnd.set(value?.end ?? null)
      this.hoveredDate.set(null)
      this.focusedDate.set(target)
      this.anchorDate.set(new Date(target.getFullYear(), target.getMonth(), 1))
      this.updatePanelPosition()
      this.focusCellAfterRender()
    } else {
      this.onTouched()
    }
  }

  protected close(returnFocus: boolean): void {
    if (!this.open()) {
      return
    }
    this.open.set(false)
    this.onTouched()
    if (returnFocus) {
      this.trigger()?.focus()
    }
  }

  protected clear(event: Event): void {
    event.stopPropagation()
    if (this.isDisabled()) {
      return
    }
    this.value.set(null)
    this.draftStart.set(null)
    this.draftEnd.set(null)
    this.onChange(null)
    this.onTouched()
    this.close(false)
  }

  protected selectDay(date: Date): void {
    if (this.isDisabled()) {
      return
    }
    const start = this.draftStart()
    const complete = start !== null && this.draftEnd() !== null
    if (!start || complete) {
      this.draftStart.set(date)
      this.draftEnd.set(null)
      this.focusedDate.set(date)
      this.ensureVisible(date)
      this.focusCellAfterRender()
      return
    }
    const [rangeStart, rangeEnd] = start.getTime() <= date.getTime() ? [start, date] : [date, start]
    this.draftStart.set(rangeStart)
    this.draftEnd.set(rangeEnd)
    this.focusedDate.set(date)
    this.ensureVisible(date)
    const next: DateRangeValue = { start: rangeStart, end: rangeEnd }
    this.value.set(next)
    this.onChange(next)
    this.onTouched()
    this.close(true)
  }

  protected onDayMouseEnter(date: Date): void {
    this.hoveredDate.set(date)
  }

  protected onDayMouseLeave(): void {
    this.hoveredDate.set(null)
  }

  protected shiftMonth(delta: number): void {
    this.anchorDate.set(addMonths(this.anchorDate(), delta))
    this.focusedDate.set(addMonths(this.focusedDate(), delta))
    this.updatePanelPosition()
    this.focusCellAfterRender()
  }

  protected onMonthSelect(value: string): void {
    this.setAnchorMonth(this.anchorDate().getFullYear(), Number(value))
  }

  protected onYearSelect(value: string): void {
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

  protected onGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedDate()
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.selectDay(current)
      return
    }
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
      return
    }
    const next = this.nextFocusedDate(current, event)
    if (next === null) {
      return
    }
    event.preventDefault()
    this.ensureVisible(next)
    this.focusedDate.set(next)
    this.focusCellAfterRender()
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
        return startOfWeek(current, this.weekStartsOn())
      case 'End':
        return endOfWeek(current, this.weekStartsOn())
      default:
        return null
    }
  }

  /** Shifts the anchor by the minimum amount needed so `date`'s month becomes visible. */
  private ensureVisible(date: Date): void {
    const anchor = this.anchorDate()
    const visibleMonths = this.visibleMonths()
    const monthsDiff =
      (date.getFullYear() - anchor.getFullYear()) * 12 + (date.getMonth() - anchor.getMonth())
    if (monthsDiff < 0) {
      this.anchorDate.set(new Date(date.getFullYear(), date.getMonth(), 1))
    } else if (monthsDiff >= visibleMonths) {
      this.anchorDate.set(addMonths(anchor, monthsDiff - visibleMonths + 1))
    }
  }

  protected onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault()
      event.stopPropagation()
      this.close(true)
    }
  }

  protected handleClickOutside(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close(false)
    }
  }

  protected updatePanelPosition(): void {
    if (!this.open()) {
      return
    }
    const trigger = this.trigger()
    if (!trigger) {
      return
    }
    const rect = trigger.getBoundingClientRect()
    this.panelStyle.set({ top: `${rect.bottom + 6}px`, left: `${rect.left}px` })
  }

  private trigger(): HTMLButtonElement | null {
    return this.elementRef.nativeElement.querySelector('.gbt-date-range-picker__trigger')
  }

  private focusCellAfterRender(): void {
    afterNextRender(
      () => {
        const id = this.cellId(this.focusedDate())
        const host = this.elementRef.nativeElement as HTMLElement
        host.querySelector<HTMLElement>(`[data-date="${id}"]`)?.focus()
      },
      { injector: this.injector },
    )
  }
}

function shiftDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta)
}
