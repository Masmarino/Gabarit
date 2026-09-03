import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { ChartFrame } from '../chart-frame/chart-frame'
import { ChartAxis } from '../chart-axis/chart-axis'
import { ChartTooltip, type TooltipPoint } from '../chart-tooltip/chart-tooltip'
import { ChartEmpty } from '../chart-empty/chart-empty'
import { ChartTable } from '../chart-table/chart-table'
import { BarSeries } from './bar-series'
import { formatNumber } from '../../../primitives'
import type { AxisSpec, LinearAxisSpec, PointValue } from '../chart-context/chart-context'
import { niceYDomain, type ChartPoint, type ChartSeries } from '../chart-data/chart-data'

const BAND_PADDING = 0.2

@Component({
  selector: 'gbt-bar-chart',
  standalone: true,
  imports: [ChartFrame, ChartAxis, ChartTooltip, ChartEmpty, ChartTable, BarSeries],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChart {
  series = input.required<ChartSeries<string>>()
  locale = input.required<string>()
  label = input.required<string>()
  tableCaption = input.required<string>()
  xColumn = input.required<string>()
  emptyMessage = input.required<string>()
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
    kind: 'band',
    domain: this.series().points.map((p) => p.x),
    padding: BAND_PADDING,
  }))

  protected readonly ySpec = computed<LinearAxisSpec>(() => ({
    kind: 'linear',

    domain: niceYDomain([this.series()], true, this.yTickCount()),
  }))

  private displayValue(point: ChartPoint<string>): string {
    return point.display ?? formatNumber(point.y, this.locale())
  }

  protected readonly tooltipPoints = computed<TooltipPoint<string>[]>(() =>
    this.series().points.map((point) => ({
      x: point.x,
      header: point.x,
      rows: [{ label: this.series().label, value: this.displayValue(point), series: 1 }],
    })),
  )

  protected readonly tableColumns = computed(() => [this.xColumn(), this.series().label])

  protected readonly tableRows = computed<(string | number)[][]>(() =>
    this.series().points.map((point) => [point.x, this.displayValue(point)]),
  )
}
