import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

export type NotificationDotVariant = 'error' | 'warning' | 'success' | 'info'

@Component({
  selector: 'gbt-notification-dot',
  standalone: true,
  exportAs: 'gbtNotificationDot',
  templateUrl: './notification-dot.html',
  styleUrl: './notification-dot.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDot {
  count = input<number | null>(null)
  max = input<number>(99)
  variant = input<NotificationDotVariant>('error')
  hidden = input(false)

  protected readonly showDot = computed(() => !this.hidden() && this.count() !== 0)

  protected readonly displayValue = computed(() => {
    const count = this.count()
    if (count === null) {
      return ''
    }
    const max = this.max()
    return count > max ? `${max}+` : `${count}`
  })
}
