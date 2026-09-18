import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'

export type AvatarSize = 'sm' | 'md' | 'lg'

export function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

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

  protected readonly imageFailed = signal(false)

  protected readonly showImage = computed(() => !!this.src() && !this.imageFailed())
  protected readonly initials = computed(() => computeInitials(this.name()))

  protected onImageError(): void {
    this.imageFailed.set(true)
  }
}
