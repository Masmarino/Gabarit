import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export interface LegendEntry {
  label: string

  pattern?: 'solid' | 'dashed' | 'dotted'

  value?: string
}

const DASH_ARRAYS: Record<NonNullable<LegendEntry['pattern']>, string> = {
  solid: 'none',
  dashed: '6 3',
  dotted: '1 3',
}

@Component({
  selector: 'gbt-chart-legend',
  standalone: true,
  imports: [],
  templateUrl: './chart-legend.html',
  styleUrl: './chart-legend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartLegend {
  entries = input.required<LegendEntry[]>()

  protected dashArray(pattern: LegendEntry['pattern']): string {
    return DASH_ARRAYS[pattern ?? 'solid']
  }
}
