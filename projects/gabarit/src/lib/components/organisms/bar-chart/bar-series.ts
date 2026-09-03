import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { CHART_CONTEXT } from '../chart-context/chart-context'
import type { BandScale } from '../../../primitives'
import type { ChartSeries } from '../chart-data/chart-data'

interface RenderedBar {
  category: string
  x: number
  y: number
  width: number
  height: number
}

@Component({
  selector: 'g[gbtBarSeries]',
  standalone: true,
  imports: [],
  templateUrl: './bar-series.html',
  styleUrl: './bar-series.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class BarSeries {
  private readonly context = inject(CHART_CONTEXT)

  series = input.required<ChartSeries<string>>()

  protected readonly activeIndex = computed(() => this.context.activeIndex())

  protected readonly bars = computed<RenderedBar[]>(() => {
    const x = this.context.xScale() as BandScale
    const y = this.context.yScale()
    const base = y.map(0)

    return this.series().points.map((point) => {
      const top = y.map(point.y)
      return {
        category: point.x,
        x: x.map(point.x),

        y: Math.min(top, base),
        width: x.bandwidth,
        height: Math.abs(base - top),
      }
    })
  })
}
