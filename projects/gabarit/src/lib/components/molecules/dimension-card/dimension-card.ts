import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'
import { ChartEmpty } from '../../organisms/chart-empty/chart-empty'
import { formatNumber } from '../../../primitives'

export interface DimensionRow {
  label: string
  value: number
}

interface RenderedRow {
  label: string
  formattedValue: string

  part: number
}

@Component({
  selector: 'gbt-dimension-card',
  standalone: true,
  imports: [ChartEmpty],
  templateUrl: './dimension-card.html',
  styleUrl: './dimension-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DimensionCard {
  rows = input.required<DimensionRow[]>()
  caption = input.required<string>()
  labelColumn = input.required<string>()
  valueColumn = input.required<string>()
  emptyMessage = input.required<string>()
  locale = input.required<string>()

  protected readonly activeIndex = signal<number | null>(null)

  protected readonly renderedRows = computed<RenderedRow[]>(() => {
    const rows = this.rows()
    const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0)
    return rows.map((row) => ({
      label: row.label,
      formattedValue: formatNumber(row.value, this.locale()),

      part: maxValue <= 0 ? 0 : (row.value / maxValue) * 100,
    }))
  })
}
