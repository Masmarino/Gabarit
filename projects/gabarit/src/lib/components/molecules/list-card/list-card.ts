import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { Button } from '../../atoms/button/button'
import { Skeleton } from '../../atoms/skeleton/skeleton'
import { EmptyState, EmptyStateIllustration } from '../empty-state/empty-state'

export type ListCardState = 'loading' | 'failed' | 'empty' | 'ready'

const SKELETON_WIDTHS = ['62%', '48%', '70%', '55%', '66%', '44%']

@Component({
  selector: 'gbt-list-card',
  standalone: true,
  imports: [Button, EmptyState, Skeleton],
  templateUrl: './list-card.html',
  styleUrl: './list-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCard {
  state = input<ListCardState>('ready')
  ariaLabel = input<string | null>(null)

  loadingLabel = input('Loading…')
  skeletonRows = input(4)
  skeletonHeader = input(true)

  failedHeading = input('The list could not be loaded')
  failedMessage = input('')
  retryLabel = input<string | null>('Retry')
  retry = output<void>()

  emptyHeading = input('Nothing here yet')
  emptyMessage = input('')
  emptyIllustration = input<EmptyStateIllustration | null>(null)
  emptyIcon = input<string | null>(null)

  /** The projected header when ready, its placeholder while loading (unless skeletonHeader is off), else nothing. */
  protected readonly header = computed<'slot' | 'skeleton' | null>(() => {
    switch (this.state()) {
      case 'loading':
        return this.skeletonHeader() ? 'skeleton' : null
      case 'failed':
      case 'empty':
        return null
      default:
        return 'slot'
    }
  })

  protected readonly placeholders = computed(() =>
    Array.from(
      { length: Math.max(0, Math.floor(this.skeletonRows())) },
      (_, index) => SKELETON_WIDTHS[index % SKELETON_WIDTHS.length],
    ),
  )
}
