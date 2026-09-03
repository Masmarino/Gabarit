import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { ChartFrame } from '../chart-frame/chart-frame'
import { ChartAxis } from '../chart-axis/chart-axis'
import { ChartTooltip, type TooltipPoint } from '../chart-tooltip/chart-tooltip'
import { ChartEmpty } from '../chart-empty/chart-empty'
import { ChartTable } from '../chart-table/chart-table'
import { TimelineSeries } from './timeline-series'
import { formatNumber } from '../../../primitives'
import type { AxisSpec, LinearAxisSpec, PointValue } from '../chart-context/chart-context'
import {
  niceYDomain,
  timeXDomain,
  type ChartInterval,
  type ChartPoint,
  type ChartSeries,
} from '../chart-data/chart-data'

@Component({
  selector: 'gbt-timeline-chart',
  standalone: true,
  imports: [ChartFrame, ChartAxis, ChartTooltip, ChartEmpty, ChartTable, TimelineSeries],
  templateUrl: './timeline-chart.html',
  styleUrl: './timeline-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineChart {
  series = input.required<ChartSeries<Date>>()
  intervals = input.required<ChartInterval[]>()
  locale = input.required<string>()
  label = input.required<string>()
  tableCaption = input.required<string>()
  intervalsCaption = input.required<string>()
  xColumn = input.required<string>()
  emptyMessage = input.required<string>()
  yZero = input(true)
  yTickCount = input(5)
  size = input<{ width: number; height: number } | null>(null)
  heading = input('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)
  headline = input('')
  trend = input('')

  protected readonly hasData = computed(() => this.series().points.length > 0)

  protected readonly publicXValues = computed<PointValue[]>(() =>
    this.series().points.map((p) => p.x),
  )

  protected readonly xSpec = computed<AxisSpec>(() => ({
    kind: 'time',
    domain: timeXDomain([this.series()]),
  }))

  protected readonly ySpec = computed<LinearAxisSpec>(() => ({
    kind: 'linear',
    domain: niceYDomain([this.series()], this.yZero(), this.yTickCount()),
  }))

  protected readonly tooltipPoints = computed<TooltipPoint<Date>[]>(() =>
    this.series().points.map((point) => ({
      x: point.x,
      header: this.formatInstant(point.x),
      rows: [{ label: this.series().label, value: this.displayValue(point), series: 1 }],
    })),
  )

  protected readonly tableColumns = computed(() => [this.xColumn(), this.series().label])

  protected readonly tableRows = computed<(string | number)[][]>(() =>
    this.series().points.map((point) => [this.formatInstant(point.x), this.displayValue(point)]),
  )

  protected readonly intervalColumns = computed(() => [
    this.intervalsCaption(),
    `${this.xColumn()} — start`,
    `${this.xColumn()} — end`,
  ])

  protected readonly intervalRows = computed<(string | number)[][]>(() =>
    this.intervals().map((interval) => [
      interval.label,
      this.formatInstant(interval.start),
      this.formatInstant(interval.end),
    ]),
  )

  private readonly formatInstant = (d: Date): string =>
    new Intl.DateTimeFormat(this.locale(), {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(d)

  private displayValue(point: ChartPoint<Date>): string {
    return point.display ?? formatNumber(point.y, this.locale())
  }
}
