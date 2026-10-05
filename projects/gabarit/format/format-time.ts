import { cachedIntl } from './intl-cache'
import { NO_VALUE } from './no-value'

export type DateInput = Date | string | number

export interface FormatRelativeTimeOptions {
  style?: 'long' | 'short' | 'narrow'
  numeric?: 'auto' | 'always'
  maxUnit?: 'hour' | 'day' | 'week' | 'month'
  absoluteAfterDays?: number
  timeZone?: string
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const RANKS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ['second', SECOND, MINUTE],
  ['minute', MINUTE, HOUR],
  ['hour', HOUR, DAY],
  ['day', DAY, WEEK],
  ['week', WEEK, MONTH],
  ['month', MONTH, YEAR],
  ['year', YEAR, Infinity],
]

const NOW_WINDOW = 10 * SECOND

function toTime(value: DateInput): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

function relativeFormat(locale: string, style: string, numeric: string): Intl.RelativeTimeFormat {
  return cachedIntl(
    'relative',
    locale,
    { style, numeric },
    () =>
      new Intl.RelativeTimeFormat(locale, {
        style: style as Intl.RelativeTimeFormatStyle,
        numeric: numeric as Intl.RelativeTimeFormatNumeric,
      }),
  )
}

export function formatRelativeTime(
  date: DateInput | null | undefined,
  locale: string,
  now: DateInput = Date.now(),
  options: FormatRelativeTimeOptions = {},
): string {
  if (date === null || date === undefined) return ''
  const time = toTime(date)
  const reference = toTime(now)
  if (Number.isNaN(time) || Number.isNaN(reference)) return NO_VALUE

  const diff = time - reference
  const gap = Math.abs(diff)
  const sign = diff < 0 ? -1 : 1
  const style = options.style ?? 'long'

  if (options.absoluteAfterDays !== undefined && gap >= options.absoluteAfterDays * DAY) {
    return formatDateTime(time, locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    })
  }

  if (gap < NOW_WINDOW) return relativeFormat(locale, style, 'auto').format(0, 'second')

  const numeric = options.numeric ?? 'auto'
  const rtf = relativeFormat(locale, style, numeric)
  for (const [unit, size, below] of RANKS) {
    if (gap < below || unit === options.maxUnit) {
      return rtf.format(sign * Math.trunc(gap / size), unit)
    }
  }
  return rtf.format(sign * Math.trunc(gap / YEAR), 'year')
}

const FIELD_OPTIONS = [
  'dateStyle',
  'timeStyle',
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName',
] as const

function selectsFields(options: Intl.DateTimeFormatOptions | undefined): boolean {
  return options !== undefined && FIELD_OPTIONS.some((field) => options[field] !== undefined)
}

export function formatDateTime(
  date: DateInput | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date === null || date === undefined) return ''
  const time = toTime(date)
  if (Number.isNaN(time)) return NO_VALUE
  const resolved: Intl.DateTimeFormatOptions = selectsFields(options)
    ? (options as Intl.DateTimeFormatOptions)
    : { dateStyle: 'medium' as const, timeStyle: 'short' as const, ...options }
  return cachedIntl(
    'datetime',
    locale,
    resolved,
    () => new Intl.DateTimeFormat(locale, resolved),
  ).format(time)
}
