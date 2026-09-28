import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core'
import { Skeleton } from '../../atoms/skeleton/skeleton'

export type SkeletonListLeading = 'circle' | 'square' | 'none'

const TITLE_WIDTHS = ['62%', '48%', '70%', '55%', '66%', '44%']
const DETAIL_WIDTHS = ['36%', '24%']

@Component({
  selector: 'gbt-skeleton-list',
  standalone: true,
  imports: [Skeleton],
  templateUrl: './skeleton-list.html',
  styleUrl: './skeleton-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonList {
  rows = input(4)
  leading = input<SkeletonListLeading>('circle')
  leadingSize = input('1rem')
  lines = input<1 | 2 | 3>(2)
  loadingLabel = input('Loading…')
  divided = input(true, { transform: booleanAttribute })
  padded = input(true, { transform: booleanAttribute })

  protected readonly items = computed(() =>
    Array.from({ length: Math.max(0, Math.round(this.rows())) }, (_, row) => ({
      row,
      widths: Array.from({ length: this.lines() }, (_, line) =>
        line === 0
          ? TITLE_WIDTHS[row % TITLE_WIDTHS.length]
          : DETAIL_WIDTHS[Math.min(line - 1, DETAIL_WIDTHS.length - 1)],
      ),
    })),
  )
}
