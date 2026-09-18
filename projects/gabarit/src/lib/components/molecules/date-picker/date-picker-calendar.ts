export type WeekStartsOn = 0 | 1

export interface CalendarDay {
  date: Date
  inCurrentMonth: boolean
  isToday: boolean
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

/** Adds `delta` whole months, clamping an overflowing day to the target month's last day. */
export function addMonths(date: Date, delta: number): Date {
  const day = date.getDate()
  const firstOfTarget = new Date(date.getFullYear(), date.getMonth() + delta, 1)
  const daysInTarget = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate()
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(day, daysInTarget))
}

/** Adds `delta` whole years, clamping Feb 29 to Feb 28 on a non-leap target year. */
export function addYears(date: Date, delta: number): Date {
  return addMonths(date, delta * 12)
}

export function startOfWeek(date: Date, weekStartsOn: WeekStartsOn): Date {
  const weekday = date.getDay()
  const diff = (weekday - weekStartsOn + 7) % 7
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() - diff)
  return result
}

export function endOfWeek(date: Date, weekStartsOn: WeekStartsOn): Date {
  const start = startOfWeek(date, weekStartsOn)
  start.setDate(start.getDate() + 6)
  return start
}

/** Always 42 days (6 full weeks), starting on the week containing the 1st of `month`. */
export function buildCalendarGrid(year: number, month: number, weekStartsOn: WeekStartsOn): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = startOfWeek(firstOfMonth, weekStartsOn)
  const today = new Date()

  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    days.push({
      date,
      inCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
    })
  }
  return days
}

export function weekdayLabels(locale: string, weekStartsOn: WeekStartsOn): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // Any Sunday-anchored reference week: Jan 7 2024 is a Sunday.
  const reference = new Date(2024, 0, 7 + weekStartsOn)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + i)
    return formatter.format(date)
  })
}
