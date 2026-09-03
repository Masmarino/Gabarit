export function niceTicks(min: number, max: number, count: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return []

  if (min === max) return [min]

  if (max < min) return niceTicks(max, min, count)

  const rawStep = (max - min) / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const step = magnitude * (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10)

  const first = Math.floor(min / step) * step
  const last = Math.ceil(max / step) * step

  const decimals = Math.max(0, -Math.floor(Math.log10(step)))

  const ticks: number[] = []

  for (let value = first; value <= last + step / 1e9; value += step) {
    ticks.push(Number(value.toFixed(decimals)))
  }
  return ticks
}

export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'

export interface TimeTicks {
  readonly values: Date[]
  readonly unit: TimeUnit
  format(date: Date, locale: string): string
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const STEPS: { ms: number; unit: TimeUnit; months?: number }[] = [
  { ms: SECOND, unit: 'second' },
  { ms: 5 * SECOND, unit: 'second' },
  { ms: 15 * SECOND, unit: 'second' },
  { ms: 30 * SECOND, unit: 'second' },
  { ms: MINUTE, unit: 'minute' },
  { ms: 5 * MINUTE, unit: 'minute' },
  { ms: 15 * MINUTE, unit: 'minute' },
  { ms: 30 * MINUTE, unit: 'minute' },
  { ms: HOUR, unit: 'hour' },
  { ms: 3 * HOUR, unit: 'hour' },
  { ms: 6 * HOUR, unit: 'hour' },
  { ms: 12 * HOUR, unit: 'hour' },
  { ms: DAY, unit: 'day' },
  { ms: 2 * DAY, unit: 'day' },
  { ms: 7 * DAY, unit: 'day' },
  { ms: 30 * DAY, unit: 'month', months: 1 },
  { ms: 90 * DAY, unit: 'month', months: 3 },
  { ms: 365 * DAY, unit: 'year', months: 12 },
]

const FORMATS: Record<TimeUnit, Intl.DateTimeFormatOptions> = {
  second: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  minute: { hour: '2-digit', minute: '2-digit' },
  hour: { hour: '2-digit', minute: '2-digit' },
  day: { day: '2-digit', month: '2-digit' },
  month: { month: 'short', year: 'numeric' },
  year: { year: 'numeric' },
}

const MIN_PIXELS_PER_TICK = 60

export function timeTicks(start: Date, end: Date, pixelWidth: number): TimeTicks {
  const span = end.getTime() - start.getTime()
  const makeFormatter = (unit: TimeUnit) => (date: Date, locale: string) =>
    new Intl.DateTimeFormat(locale, { ...FORMATS[unit], timeZone: 'UTC' }).format(date)

  if (span <= 0) {
    return { values: [start], unit: 'day', format: makeFormatter('day') }
  }

  const maxTicks = Math.max(2, Math.floor(pixelWidth / MIN_PIXELS_PER_TICK))

  const coarsest = STEPS[STEPS.length - 1]
  const chosen = STEPS.find((step) => span / step.ms + 1 <= maxTicks) ?? {
    ...coarsest,
    months: coarsest.months! * Math.max(1, Math.ceil((span / coarsest.ms + 1) / maxTicks)),
  }

  const values: Date[] = []
  if (chosen.months) {
    const step = chosen.months
    const cursor =
      step >= 12
        ? new Date(Date.UTC(Math.floor(start.getUTCFullYear() / (step / 12)) * (step / 12), 0, 1))
        : new Date(
            Date.UTC(start.getUTCFullYear(), Math.floor(start.getUTCMonth() / step) * step, 1),
          )
    while (cursor.getTime() < start.getTime()) cursor.setUTCMonth(cursor.getUTCMonth() + step)
    while (cursor.getTime() <= end.getTime()) {
      values.push(new Date(cursor))
      cursor.setUTCMonth(cursor.getUTCMonth() + step)
    }
  } else {
    const first = Math.ceil(start.getTime() / chosen.ms) * chosen.ms
    for (let t = first; t <= end.getTime(); t += chosen.ms) {
      values.push(new Date(t))
    }
  }

  if (values.length === 0) values.push(start)

  return { values, unit: chosen.unit, format: makeFormatter(chosen.unit) }
}
