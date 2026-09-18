import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type SkeletonVariant = 'text' | 'circle' | 'rect'

@Component({
  selector: 'gbt-skeleton',
  standalone: true,
  template: '',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    'aria-hidden': 'true',
  },
})
export class Skeleton {
  variant = input<SkeletonVariant>('text')
  width = input<string>('100%')
  height = input<string | null>(null)
}
