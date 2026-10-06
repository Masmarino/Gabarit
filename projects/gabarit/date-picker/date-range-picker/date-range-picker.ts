import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Icon } from '@masmarino/gabarit/icon'
import { CalendarPanel, type CalendarPanelView } from '../calendar-panel'
import { WeekStartsOn, isSameDay } from '../date-picker-calendar'
import { followPageScroll } from '@masmarino/gabarit/floating-panel'

export type DateRangeVisibleMonths = 1 | 2

export interface DateRangeValue {
  start: Date
  end: Date | null
}

export type DateRangePickerMonthView = CalendarPanelView

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

  private readonly panel = new CalendarPanel({
    elementRef: this.elementRef,
    injector: this.injector,
    triggerSelector: '.gbt-date-range-picker__trigger',
    locale: () => this.locale(),
    weekStartsOn: () => this.weekStartsOn(),
    visibleMonths: () => this.visibleMonths(),
    minYear: () => this.minYear(),
    maxYear: () => this.maxYear(),
    onTouched: () => this.onTouched(),
  })

  protected readonly open = this.panel.open
  protected readonly value = signal<DateRangeValue | null>(null)
  protected readonly draftStart = signal<Date | null>(null)
  protected readonly draftEnd = signal<Date | null>(null)
  protected readonly hoveredDate = signal<Date | null>(null)
  protected readonly focusedDate = this.panel.focusedDate
  protected readonly anchorDate = this.panel.anchorDate
  protected readonly panelStyle = this.panel.panelStyle

  private readonly formDisabled = signal(false)
  private onChange: (value: DateRangeValue | null) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())
  protected readonly showClear = computed(
    () => this.clearable() && this.value() !== null && !this.isDisabled(),
  )

  protected readonly monthViews = this.panel.monthViews
  protected readonly panelLabel = this.panel.panelLabel
  protected readonly weekdayLabels = this.panel.weekdayLabels
  protected readonly monthOptions = this.panel.monthOptions
  protected readonly yearOptions = this.panel.yearOptions

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

  private readonly previewBounds = computed<{ lower: Date; upper: Date } | null>(() => {
    const start = this.draftStart()
    if (!start) return null
    const other = this.draftEnd() ?? this.hoveredDate()
    if (!other) return null
    return start.getTime() <= other.getTime()
      ? { lower: start, upper: other }
      : { lower: other, upper: start }
  })

  protected readonly isPreviewing = computed(
    () => this.draftStart() !== null && this.draftEnd() === null,
  )

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
    return (
      bounds !== null &&
      date.getTime() > bounds.lower.getTime() &&
      date.getTime() < bounds.upper.getTime()
    )
  }

  protected isFocused(date: Date): boolean {
    return this.panel.isFocused(date)
  }

  protected cellId(date: Date): string {
    return this.panel.cellId(date)
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) {
      return
    }
    this.panel.toggle(() => {
      const value = this.value()
      this.draftStart.set(value?.start ?? null)
      this.draftEnd.set(value?.end ?? null)
      this.hoveredDate.set(null)
      return value?.start ?? new Date()
    })
  }

  protected close(returnFocus: boolean): void {
    this.panel.close(returnFocus)
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
    this.panel.close(false)
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
      this.panel.ensureVisible(date)
      this.panel.focusCellAfterRender()
      return
    }
    const [rangeStart, rangeEnd] = start.getTime() <= date.getTime() ? [start, date] : [date, start]
    this.draftStart.set(rangeStart)
    this.draftEnd.set(rangeEnd)
    this.focusedDate.set(date)
    this.panel.ensureVisible(date)
    const next: DateRangeValue = { start: rangeStart, end: rangeEnd }
    this.value.set(next)
    this.onChange(next)
    this.onTouched()
    this.panel.close(true)
  }

  protected onDayMouseEnter(date: Date): void {
    this.hoveredDate.set(date)
  }

  protected onDayMouseLeave(): void {
    this.hoveredDate.set(null)
  }

  protected shiftMonth(delta: number): void {
    this.panel.shiftMonth(delta)
  }

  protected onMonthSelect(value: string): void {
    this.panel.onMonthSelect(value)
  }

  protected onYearSelect(value: string): void {
    this.panel.onYearSelect(value)
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.selectDay(this.focusedDate())
      return
    }
    this.panel.handleNavigationKeydown(event)
  }

  protected onEscape(event: KeyboardEvent): void {
    this.panel.onEscape(event)
  }

  protected handleClickOutside(event: MouseEvent): void {
    this.panel.handleClickOutside(event)
  }

  constructor() {
    followPageScroll(() => this.updatePanelPosition())
  }

  protected updatePanelPosition(): void {
    this.panel.updatePanelPosition()
  }
}
