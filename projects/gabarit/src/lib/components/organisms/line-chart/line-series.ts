import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { CHART_CONTEXT } from '../chart-context/chart-context'
import { areaPath, linePath, type Scale } from '../../../primitives'
import type { ChartSeries } from '../chart-data/chart-data'

interface RenderedSeries {
  label: string
  strokePath: string
  fillPath: string

  colorIndex: number
  dashArray: string
}

interface ActiveDot {
  x: number
  y: number
  colorIndex: number
}

const DASH_ARRAYS: Record<NonNullable<ChartSeries<unknown>['pattern']>, string> = {
  solid: 'none',
  dashed: '6 3',
  dotted: '1 3',
}

export const DEFAULT_PATTERNS: NonNullable<ChartSeries<unknown>['pattern']>[] = [
  'solid',
  'dashed',
  'dotted',
]

@Component({
  selector: 'g[gbtLineSeries]',
  standalone: true,
  imports: [],
  templateUrl: './line-series.html',
  styleUrl: './line-series.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class LineSeries<X> {
  series = input.required<ChartSeries<X>[]>()
  area = input(false)

  private readonly context = inject(CHART_CONTEXT)

  protected readonly renderedLines = computed<RenderedSeries[]>(() => {
    const x = this.context.xScale() as Scale<never>
    const y = this.context.yScale()

    const base = Math.min(Math.max(y.map(0), 0), this.context.box().innerHeight)

    return this.series().map((oneSeries, index) => {
      const points = oneSeries.points.map((p) => ({
        x: x.map(p.x as never),
        y: y.map(p.y),
      }))
      return {
        label: oneSeries.label,
        strokePath: linePath(points),
        fillPath: areaPath(points, base),
        colorIndex: (index % 3) + 1,
        dashArray:
          DASH_ARRAYS[oneSeries.pattern ?? DEFAULT_PATTERNS[index % DEFAULT_PATTERNS.length]],
      }
    })
  })

  protected readonly activeDots = computed<ActiveDot[]>(() => {
    const activeIndex = this.context.activeIndex()
    if (activeIndex === null) return []
    const activeXValue = this.context.pointValues()[activeIndex]
    if (activeXValue === undefined) return []

    const key = activeXValue instanceof Date ? activeXValue.getTime() : activeXValue
    const x = this.context.xScale() as Scale<never>
    const y = this.context.yScale()

    const dots: ActiveDot[] = []
    this.series().forEach((oneSeries, seriesIndex) => {
      const point = oneSeries.points.find(
        (p) => (p.x instanceof Date ? p.x.getTime() : p.x) === key,
      )
      if (point === undefined) return
      dots.push({
        x: x.map(point.x as never),
        y: y.map(point.y),
        colorIndex: (seriesIndex % 3) + 1,
      })
    })
    return dots
  })
}
