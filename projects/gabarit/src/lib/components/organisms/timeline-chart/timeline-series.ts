import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { CHART_CONTEXT } from '../chart-context/chart-context'
import { estimateLabelWidth, linePath, type Scale } from '../../../primitives'
import type { ChartInterval, ChartSeries } from '../chart-data/chart-data'

const LABEL_INSET = 4

const STROKE_WIDTH = 3
const STROKE_WIDTH_ACTIVE = 6

interface RenderedBand {
  label: string
  x: number
  width: number

  labeled: boolean

  active: boolean
  strokeWidth: number
}

@Component({
  selector: 'g[gbtTimelineSeries]',
  standalone: true,
  imports: [],
  templateUrl: './timeline-series.html',
  styleUrl: './timeline-series.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class TimelineSeries {
  series = input.required<ChartSeries<Date>>()
  intervals = input.required<ChartInterval[]>()

  private readonly context = inject(CHART_CONTEXT)

  protected readonly height = computed(() => this.context.box().innerHeight)

  protected readonly strokePath = computed(() => {
    const x = this.context.xScale() as Scale<Date>
    const y = this.context.yScale()
    return linePath(this.series().points.map((p) => ({ x: x.map(p.x), y: y.map(p.y) })))
  })

  private readonly activeInstant = computed<number | null>(() => {
    const index = this.context.activeIndex()
    if (index === null) return null
    const value = this.context.pointValues()[index]
    return value instanceof Date ? value.getTime() : null
  })

  protected readonly activePoint = computed<{ x: number; y: number } | null>(() => {
    const time = this.activeInstant()
    if (time === null) return null
    const point = this.series().points.find((p) => p.x.getTime() === time)
    if (point === undefined) return null
    const x = this.context.xScale() as Scale<Date>
    const y = this.context.yScale()
    return { x: x.map(point.x), y: y.map(point.y) }
  })

  protected readonly bands = computed<RenderedBand[]>(() => {
    const x = this.context.xScale() as Scale<Date>
    const activeTime = this.activeInstant()
    return this.intervals().map((interval) => {
      const start = x.map(interval.start)
      const end = x.map(interval.end)
      const width = Math.max(1, end - start)

      const active =
        activeTime !== null &&
        activeTime >= interval.start.getTime() &&
        activeTime <= interval.end.getTime()
      return {
        label: interval.label,
        x: start,
        width,

        labeled: LABEL_INSET + estimateLabelWidth(interval.label) <= width,
        active,
        strokeWidth: active ? STROKE_WIDTH_ACTIVE : STROKE_WIDTH,
      }
    })
  })
}
