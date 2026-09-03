import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core'
import { CHART_CONTEXT, type ChartReader } from '../chart-context/chart-context'
import {
  LABEL_GAP,
  estimateLabelWidth,
  formatCompact,
  niceTicks,
  timeTicks,
  type BandScale,
  type Scale,
} from '../../../primitives'

interface Tick {
  key: string
  x: number
  y: number
  label: string

  date: string | null
  anchor: 'start' | 'middle' | 'end'
}

@Component({
  selector: 'g[gbtChartAxis]',
  standalone: true,
  imports: [],
  templateUrl: './chart-axis.html',
  styleUrl: './chart-axis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.transform]': 'groupTransform()',
    '[attr.axis]': 'axis()',
    'aria-hidden': 'true',
  },
})
export class ChartAxis {
  private readonly context: ChartReader = inject(CHART_CONTEXT)

  axis = input.required<'x' | 'y'>()
  locale = input.required<string>()
  tickCount = input(5)
  format = input<((value: never) => string) | null>(null)
  grid = input(false, { transform: booleanAttribute })

  protected readonly groupTransform = computed(() => {
    const box = this.context.box()

    return this.axis() === 'x' ? `translate(0,${box.innerHeight})` : 'translate(0,0)'
  })

  protected readonly ticks = computed<Tick[]>(() => {
    if (this.axis() === 'y') return this.yTicks()
    const ticks = this.xTicks()

    if (this.context.xSpec().kind === 'band') return ticks

    const last = ticks.length - 1
    return ticks.map((tick, index) => ({
      ...tick,
      anchor: index === 0 ? 'start' : index === last ? 'end' : 'middle',
    }))
  })

  protected readonly gridLines = computed<number[]>(() => {
    if (!this.grid() || this.axis() !== 'y') return []
    return this.yTicks().map((tick) => tick.y - 4)
  })

  protected readonly innerWidth = computed(() => this.context.box().innerWidth)

  private yTicks(): Tick[] {
    const spec = this.context.ySpec()
    const scale = this.context.yScale()
    const custom = this.format()
    return niceTicks(spec.domain[0], spec.domain[1], this.tickCount()).map((value) => ({
      key: `y-${value}`,
      x: -8,
      y: scale.map(value) + 4,
      label: custom ? custom(value as never) : formatCompact(value, this.locale()),
      date: null,
      anchor: 'end',
    }))
  }

  private xTicks(): Tick[] {
    const spec = this.context.xSpec()
    const box = this.context.box()
    const custom = this.format()

    if (spec.kind === 'band') {
      const scale = this.context.xScale() as BandScale

      const labels = spec.domain.map((category) => (custom ? custom(category as never) : category))
      const step = spec.domain.length === 0 ? 0 : box.innerWidth / spec.domain.length
      const widest = labels.reduce((large, label) => Math.max(large, estimateLabelWidth(label)), 0)
      const keepEvery = Math.max(1, Math.ceil((widest + LABEL_GAP) / Math.max(step, 1)))

      return spec.domain
        .map((category, index) => ({
          key: `x-${category}`,
          x: scale.map(category) + scale.bandwidth / 2,
          y: 20,
          label: labels[index],
          date: null,
          anchor: 'middle' as const,
        }))
        .filter((_, index) => index % keepEvery === 0)
    }

    if (spec.kind === 'time') {
      const scale = this.context.xScale() as Scale<Date>
      const result = timeTicks(spec.domain[0], spec.domain[1], box.innerWidth)

      const fine = result.unit === 'hour' || result.unit === 'minute' || result.unit === 'second'
      const days = new Set(result.values.map((v) => v.toISOString().slice(0, 10)))
      const multiDay = days.size > 1
      const seen = new Set<string>()

      return result.values.map((value) => {
        const day = value.toISOString().slice(0, 10)

        const first = fine && multiDay && !seen.has(day)
        seen.add(day)

        return {
          key: `x-${value.getTime()}`,
          x: scale.map(value),
          y: first ? 14 : 20,
          label: custom ? custom(value as never) : result.format(value, this.locale()),
          date: first
            ? new Intl.DateTimeFormat(this.locale(), {
                day: '2-digit',
                month: '2-digit',
                timeZone: 'UTC',
              }).format(value)
            : null,
          anchor: 'middle',
        }
      })
    }

    const scale = this.context.xScale() as Scale<number>
    return niceTicks(spec.domain[0], spec.domain[1], this.tickCount()).map((value) => ({
      key: `x-${value}`,
      x: scale.map(value),
      y: 20,
      label: custom ? custom(value as never) : formatCompact(value, this.locale()),
      date: null,
      anchor: 'middle',
    }))
  }
}
