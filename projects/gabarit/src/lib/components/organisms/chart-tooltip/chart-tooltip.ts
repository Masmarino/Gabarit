import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { CHART_CONTEXT } from '../chart-context/chart-context'

export interface TooltipRow {
  label: string
  value: string

  series?: 1 | 2 | 3

  pattern?: 'solid' | 'dashed' | 'dotted'
}

export interface TooltipPoint<X> {
  x: X

  header: string
  rows: TooltipRow[]
}

@Component({
  selector: 'gbt-chart-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './chart-tooltip.html',
  styleUrl: './chart-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartTooltip<X> {
  private readonly context = inject(CHART_CONTEXT)

  points = input.required<TooltipPoint<X>[]>()

  protected readonly active = computed<TooltipPoint<X> | null>(() => {
    const index = this.context.activeIndex()
    if (index === null) return null
    return this.points()[index] ?? null
  })

  protected readonly left = computed(() => {
    const position = this.context.activePosition()
    if (position === null) return 0
    return position + this.context.box().margin.left
  })

  protected readonly anchor = computed<'start' | 'middle' | 'end'>(() => {
    const index = this.context.activeIndex()
    if (index === null) return 'middle'
    const last = this.context.pointValues().length - 1
    return index === 0 ? 'start' : index === last ? 'end' : 'middle'
  })
}
