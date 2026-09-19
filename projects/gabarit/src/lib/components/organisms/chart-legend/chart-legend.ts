import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core'

export interface LegendEntry {
  label: string

  pattern?: 'solid' | 'dashed' | 'dotted'

  color?: string

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

  interactive = input(false, { transform: booleanAttribute })
  activeIndex = input<number | null>(null)
  activeIndexChange = output<number | null>()

  protected dashArray(pattern: LegendEntry['pattern']): string {
    return DASH_ARRAYS[pattern ?? 'solid']
  }

  protected onMouseLeave(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement
    if (target.ownerDocument.activeElement === target) return
    this.activeIndexChange.emit(null)
  }
}
