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
} from './date-picker-calendar'

export type DatePickerVisibleMonths = 1 | 2

export interface DatePickerMonthView {
  year: number
  month: number
  label: string
  weeks: CalendarDay[][]
}

let nextDatePickerId = 0

const CURRENT_YEAR = new Date().getFullYear()

@Component({
  selector: 'gbt-date-picker',
  standalone: true,
  imports: [Icon],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.scss',
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
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
})
export class DatePicker implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef)
  private readonly injector = inject(Injector)

  id = input<string>(`gbt-date-picker-${++nextDatePickerId}`)
  label = input<string>('')
  placeholder = input<string>('Select a date…')
  locale = input<string>('en-US')
  weekStartsOn = input<WeekStartsOn>(1)
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  previousMonthLabel = input<string>('Previous month')
  nextMonthLabel = input<string>('Next month')
  clearable = input(false, { transform: booleanAttribute })
  clearLabel = input<string>('Clear date')
  visibleMonths = input<DatePickerVisibleMonths>(1)
  monthSelectLabel = input<string>('Month')
  yearSelectLabel = input<string>('Year')
  minYear = input<number>(CURRENT_YEAR - 100)
  maxYear = input<number>(CURRENT_YEAR + 10)

  protected readonly open = signal(false)
  protected readonly selected = signal<Date | null>(null)
  protected readonly focusedDate = signal<Date>(new Date())
  protected readonly anchorDate = signal<Date>(new Date())
  protected readonly panelStyle = signal<{ top: string; left: string } | null>(null)

  private readonly formDisabled = signal(false)
  private onChange: (value: Date | null) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())
  protected readonly showClear = computed(
    () => this.clearable() && this.selected() !== null && !this.isDisabled(),
  )

  protected readonly monthViews = computed<DatePickerMonthView[]>(() => {
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
    // Trim wholly-blank trailing weeks (pure next-month filler) — but by the
    // same amount across every visible month, so side-by-side calendars
    // (`visibleMonths="2"`) stay the same height even when only one of them
    // actually needs the extra week.
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

  protected readonly triggerLabel = computed(() => {
    const value = this.selected()
    return value ? new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(value) : ''
  })

  writeValue(value: Date | null): void {
    this.selected.set(value)
    if (value) {
      this.focusedDate.set(value)
      this.anchorDate.set(new Date(value.getFullYear(), value.getMonth(), 1))
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected isSelected(date: Date): boolean {
    const value = this.selected()
    return value !== null && isSameDay(value, date)
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
    this.open.update((value) => !value)
    if (this.open()) {
      const target = this.selected() ?? new Date()
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
    this.selected.set(null)
    this.onChange(null)
    this.onTouched()
    this.close(false)
  }

  protected selectDay(day: CalendarDay): void {
    if (this.isDisabled()) {
      return
    }
    this.selected.set(day.date)
    this.focusedDate.set(day.date)
    this.ensureVisible(day.date)
    this.onChange(day.date)
    this.close(true)
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
      this.selectDay({ date: current, inCurrentMonth: true, isToday: isSameDay(current, new Date()) })
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
    return this.elementRef.nativeElement.querySelector('.gbt-date-picker__trigger')
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
