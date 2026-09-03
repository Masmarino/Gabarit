import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
  signal,
} from '@angular/core'
import { ChartFrame } from '../chart-frame/chart-frame'
import { ChartAxis } from '../chart-axis/chart-axis'
import { ChartTooltip, type TooltipPoint } from '../chart-tooltip/chart-tooltip'
import { ChartLegend, type LegendEntry } from '../chart-legend/chart-legend'
import { ChartEmpty } from '../chart-empty/chart-empty'
import { ChartTable } from '../chart-table/chart-table'
import { DEFAULT_PATTERNS, LineSeries } from './line-series'
import { formatCompact, formatNumber } from '../../../primitives'
import type { AxisSpec, LinearAxisSpec, PointValue } from '../chart-context/chart-context'
import {
  niceXDomain,
  niceYDomain,
  timeXDomain,
  type ChartPoint,
  type ChartSeries,
} from '../chart-data/chart-data'

const MAX_SERIES = 3

const ABSENT = '—'

@Component({
  selector: 'gbt-line-chart',
  standalone: true,
  imports: [ChartFrame, ChartAxis, ChartTooltip, ChartLegend, ChartEmpty, ChartTable, LineSeries],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChart<X extends number | Date> {
  series = input.required<ChartSeries<X>[]>()
  xKind = input.required<'linear' | 'time'>()
  locale = input.required<string>()
  label = input.required<string>()
  tableCaption = input.required<string>()
  xColumn = input.required<string>()
  emptyMessage = input.required<string>()
  area = input(false)
  yZero = input(true)
  yTickCount = input(5)
  xTickCount = input(5)
  size = input<{ width: number; height: number } | null>(null)
  heading = input('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)
  headline = input('')
  trend = input('')

  protected readonly activeIndex = signal<number | null>(null)

  protected readonly hasData = computed(() => this.series().some((s) => s.points.length > 0))

  protected readonly xSpec = computed<AxisSpec>(() =>
    this.xKind() === 'time'
      ? { kind: 'time', domain: timeXDomain(this.series() as ChartSeries<Date>[]) }
      : {
          kind: 'linear',
          domain: niceXDomain(this.series() as ChartSeries<number>[], this.xTickCount()),
        },
  )

  protected readonly ySpec = computed<LinearAxisSpec>(() => ({
    kind: 'linear',
    domain: niceYDomain(this.series(), this.yZero(), this.yTickCount()),
  }))

  protected readonly legendEntries = computed<LegendEntry[]>(() => {
    const index = this.activeIndex()
    const xValues = this.xValues()

    const x = index === null ? xValues[xValues.length - 1] : xValues[index]
    return this.series().map((s, seriesIndex) => ({
      label: s.label,

      pattern: s.pattern ?? DEFAULT_PATTERNS[seriesIndex % DEFAULT_PATTERNS.length],
      value: x === undefined ? ABSENT : this.displayValue(s, x),
    }))
  })

  protected readonly publicXValues = computed<PointValue[]>(() => this.xValues())

  protected readonly tooltipPoints = computed<TooltipPoint<X>[]>(() =>
    this.xValues().map((x) => ({
      x,
      header: this.formatX(x),
      rows: this.series().map((s, index) => ({
        label: s.label,
        value: this.displayValue(s, x),
        series: ((index % 3) + 1) as 1 | 2 | 3,
        pattern: s.pattern ?? DEFAULT_PATTERNS[index % DEFAULT_PATTERNS.length],
      })),
    })),
  )

  protected readonly tableColumns = computed(() => [
    this.xColumn(),
    ...this.series().map((s) => s.label),
  ])

  protected readonly tableRows = computed<(string | number)[][]>(() =>
    this.xValues().map((x) => [
      this.formatX(x),
      ...this.series().map((s) => this.displayValue(s, x)),
    ]),
  )

  private readonly formatX = (x: X): string =>
    x instanceof Date
      ? new Intl.DateTimeFormat(this.locale(), {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'UTC',
        }).format(x)
      : formatCompact(x as number, this.locale())

  private readonly xValues = computed<X[]>(() => {
    const seen = new Map<number | string, X>()
    for (const oneSeries of this.series()) {
      for (const point of oneSeries.points) {
        seen.set(point.x instanceof Date ? point.x.getTime() : (point.x as number), point.x)
      }
    }
    return [...seen.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([, x]) => x)
  })

  private findPoint(oneSeries: ChartSeries<X>, x: X): ChartPoint<X> | null {
    const key = x instanceof Date ? x.getTime() : x
    return oneSeries.points.find((p) => (p.x instanceof Date ? p.x.getTime() : p.x) === key) ?? null
  }

  private displayValue(oneSeries: ChartSeries<X>, x: X): string {
    const point = this.findPoint(oneSeries, x)
    if (point === null) return ABSENT
    return point.display ?? formatNumber(point.y, this.locale())
  }

  constructor() {
    if (isDevMode()) {
      effect(() => {
        const count = this.series().length
        if (count > MAX_SERIES) {
          console.warn(
            `gbt-line-chart: ${count} series received for ${MAX_SERIES} distinguishable colors. The palette cycles.`,
          )
        }
      })
    }
  }
}
