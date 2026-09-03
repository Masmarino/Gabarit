import { niceTicks } from '../../../primitives'

export interface ChartPoint<X> {
  x: X
  y: number

  display?: string
}

export interface ChartSeries<X> {
  label: string
  points: ChartPoint<X>[]

  pattern?: 'solid' | 'dashed' | 'dotted'
}

export interface ChartInterval {
  start: Date
  end: Date
  label: string
}

const DAY = 86400000

export function yDomain<X>(series: ChartSeries<X>[], includeZero: boolean): [number, number] {
  const values = series.flatMap((s) => s.points.map((p) => p.y))

  if (values.length === 0) return [0, 1]

  let min = Math.min(...values)
  let max = Math.max(...values)
  if (includeZero) {
    min = Math.min(min, 0)
    max = Math.max(max, 0)
  }

  if (min === max) return [min, min + 1]
  return [min, max]
}

export function numericXDomain(series: ChartSeries<number>[]): [number, number] {
  const values = series.flatMap((s) => s.points.map((p) => p.x))
  if (values.length === 0) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? [min, min + 1] : [min, max]
}

export function timeXDomain(series: ChartSeries<Date>[]): [Date, Date] {
  const values = series.flatMap((s) => s.points.map((p) => p.x.getTime()))

  if (values.length === 0) return [new Date(-DAY), new Date(0)]
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? [new Date(min), new Date(min + DAY)] : [new Date(min), new Date(max)]
}

export function longestSeriesLength<X>(series: ChartSeries<X>[]): number {
  return series.reduce((longest, s) => Math.max(longest, s.points.length), 0)
}

export function niceYDomain<X>(
  series: ChartSeries<X>[],
  includeZero: boolean,
  tickCount: number,
): [number, number] {
  const [min, max] = yDomain(series, includeZero)
  const ticks = niceTicks(min, max, tickCount)

  if (ticks.length === 0) return [min, max]
  return [ticks[0], ticks[ticks.length - 1]]
}

export function niceXDomain(series: ChartSeries<number>[], tickCount: number): [number, number] {
  const [min, max] = numericXDomain(series)
  const ticks = niceTicks(min, max, tickCount)
  if (ticks.length === 0) return [min, max]
  return [ticks[0], ticks[ticks.length - 1]]
}
