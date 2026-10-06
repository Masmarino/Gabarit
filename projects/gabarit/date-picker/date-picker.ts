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
import { CalendarPanel, type CalendarPanelView } from './calendar-panel'
import { CalendarDay, WeekStartsOn, isSameDay } from './date-picker-calendar'
import { followPageScroll } from '@masmarino/gabarit/floating-panel'

export type DatePickerVisibleMonths = 1 | 2

export type DatePickerMonthView = CalendarPanelView

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

  private readonly panel = new CalendarPanel({
    elementRef: this.elementRef,
    injector: this.injector,
    triggerSelector: '.gbt-date-picker__trigger',
    locale: () => this.locale(),
    weekStartsOn: () => this.weekStartsOn(),
    visibleMonths: () => this.visibleMonths(),
    minYear: () => this.minYear(),
    maxYear: () => this.maxYear(),
    onTouched: () => this.onTouched(),
  })

  protected readonly open = this.panel.open
  protected readonly selected = signal<Date | null>(null)
  protected readonly focusedDate = this.panel.focusedDate
  protected readonly anchorDate = this.panel.anchorDate
  protected readonly panelStyle = this.panel.panelStyle

  private readonly formDisabled = signal(false)
  private onChange: (value: Date | null) => void = () => {}
  private onTouched: () => void = () => {}

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())
  protected readonly showClear = computed(
    () => this.clearable() && this.selected() !== null && !this.isDisabled(),
  )

  protected readonly monthViews = this.panel.monthViews
  protected readonly panelLabel = this.panel.panelLabel
  protected readonly weekdayLabels = this.panel.weekdayLabels
  protected readonly monthOptions = this.panel.monthOptions
  protected readonly yearOptions = this.panel.yearOptions

  protected readonly triggerLabel = computed(() => {
    const value = this.selected()
    return value
      ? new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(value)
      : ''
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
    return this.panel.isFocused(date)
  }

  protected cellId(date: Date): string {
    return this.panel.cellId(date)
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) {
      return
    }
    this.panel.toggle(() => this.selected() ?? new Date())
  }

  protected close(returnFocus: boolean): void {
    this.panel.close(returnFocus)
  }

  protected clear(event: Event): void {
    event.stopPropagation()
    if (this.isDisabled()) {
      return
    }
    this.selected.set(null)
    this.onChange(null)
    this.onTouched()
    this.panel.close(false)
  }

  protected selectDay(day: CalendarDay): void {
    if (this.isDisabled()) {
      return
    }
    this.selected.set(day.date)
    this.focusedDate.set(day.date)
    this.panel.ensureVisible(day.date)
    this.onChange(day.date)
    this.panel.close(true)
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
      const current = this.focusedDate()
      this.selectDay({
        date: current,
        inCurrentMonth: true,
        isToday: isSameDay(current, new Date()),
      })
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
