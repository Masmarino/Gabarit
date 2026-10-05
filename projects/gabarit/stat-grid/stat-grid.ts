import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { Skeleton } from '@masmarino/gabarit/skeleton'

export type StatGridColumns = 2 | 3 | 4 | 5 | 6

@Component({
  selector: 'gbt-stat-grid',
  standalone: true,
  imports: [Skeleton],
  templateUrl: './stat-grid.html',
  styleUrl: './stat-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatGrid {
  ariaLabel = input('Summary')
  columns = input<StatGridColumns>(4)
  loading = input(false)
  loadingCount = input(4)
  loadingLabel = input('Loading…')

  protected readonly placeholders = computed(() =>
    Array.from({ length: Math.max(0, Math.round(this.loadingCount())) }, (_, i) => i),
  )
}
