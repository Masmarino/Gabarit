import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  isDevMode,
  input,
  signal,
} from '@angular/core'
import { ChartEmpty } from '../chart-empty/chart-empty'
import { ChartLegend, type LegendEntry } from '../chart-legend/chart-legend'
import { ChartTable } from '../chart-table/chart-table'
import { arcPath, formatNumber, formatPercent } from '../../../primitives'

export interface PieSlice {
  label: string
  value: number
}

interface RenderedSlice {
  label: string
  formattedValue: string
  formattedShare: string
  path: string
  color: string
  showLabel: boolean
  labelX: number
  labelY: number
  labelAnchor: 'start' | 'middle' | 'end'
  accessibleLabel: string
}

const OUTER_RADIUS = 90
const LABEL_RADIUS = OUTER_RADIUS + 14
const LABEL_SHARE_THRESHOLD = 0.15
const PALETTE_SIZE = 6

@Component({
  selector: 'gbt-pie-chart',
  standalone: true,
  imports: [ChartTable, ChartEmpty, ChartLegend],
  templateUrl: './pie-chart.html',
  styleUrl: './pie-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChart {
  slices = input.required<PieSlice[]>()
  label = input.required<string>()
  locale = input.required<string>()
  emptyMessage = input.required<string>()
  tableCaption = input.required<string>()
  categoryColumn = input.required<string>()
  valueColumn = input.required<string>()
  shareColumn = input.required<string>()
  sliceAnnouncement = input.required<(label: string, value: string, share: string) => string>()

  innerRadiusRatio = input<number>(0)

  protected readonly activeIndex = signal<number | null>(null)

  private readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.value, 0),
  )

  protected readonly renderedSlices = computed<RenderedSlice[]>(() => {
    const total = this.total()
    const innerRadius = OUTER_RADIUS * this.innerRadiusRatio()
    let angle = 0
    return this.slices().map((slice, index) => {
      const share = total <= 0 ? 0 : slice.value / total
      const startAngle = angle
      const endAngle = angle + share * Math.PI * 2
      angle = endAngle

      const midAngle = (startAngle + endAngle) / 2
      const labelX = Math.round(LABEL_RADIUS * Math.sin(midAngle) * 100) / 100
      const labelY = Math.round(-LABEL_RADIUS * Math.cos(midAngle) * 100) / 100

      const formattedValue = formatNumber(slice.value, this.locale())
      const formattedShare = formatPercent(share, this.locale())

      return {
        label: slice.label,
        formattedValue,
        formattedShare,
        path: arcPath({ startAngle, endAngle, innerRadius, outerRadius: OUTER_RADIUS }),
        color: this.colorFor(index),
        showLabel: share >= LABEL_SHARE_THRESHOLD,
        labelX,
        labelY,
        labelAnchor: labelX > 5 ? 'start' : labelX < -5 ? 'end' : 'middle',
        accessibleLabel: `${slice.label} — ${formattedValue}`,
      }
    })
  })

  protected readonly legendEntries = computed<LegendEntry[]>(() =>
    this.renderedSlices().map((slice) => ({
      label: slice.label,
      value: slice.formattedValue,
      color: slice.color,
    })),
  )

  protected readonly activeSlice = computed<RenderedSlice | null>(() => {
    const index = this.activeIndex()
    if (index === null) return null
    return this.renderedSlices()[index] ?? null
  })

  protected readonly columns = computed(() => [
    this.categoryColumn(),
    this.valueColumn(),
    this.shareColumn(),
  ])

  protected readonly tableRows = computed<(string | number)[][]>(() =>
    this.renderedSlices().map((slice) => [slice.label, slice.formattedValue, slice.formattedShare]),
  )

  private colorFor(index: number): string {
    return `var(--chart-series-${(index % PALETTE_SIZE) + 1}-base)`
  }

  protected onMouseLeave(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement
    if (target.ownerDocument.activeElement === target) return
    this.activeIndex.set(null)
  }

  constructor() {
    if (isDevMode()) {
      effect(() => {
        const count = this.slices().length
        if (count > PALETTE_SIZE) {
          console.warn(
            `gbt-pie-chart: ${count} slices received for ${PALETTE_SIZE} distinguishable colors. The palette cycles.`,
          )
        }
      })
    }
  }
}
