import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core'
import { computeInitials } from '../../../primitives'

export { computeInitials }

export type AvatarSize = 'sm' | 'md' | 'lg'

@Component({
  selector: 'gbt-avatar',
  standalone: true,
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class Avatar {
  name = input.required<string>()
  src = input<string | null>(null)
  size = input<AvatarSize>('md')

  protected readonly imageFailed = linkedSignal<string | null, boolean>({
    source: this.src,
    computation: () => false,
  })

  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed())
  protected readonly initials = computed(() => computeInitials(this.name()))

  protected onImageError(): void {
    this.imageFailed.set(true)
  }
}
