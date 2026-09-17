import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { Icon } from '../icon/icon'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info'

@Component({
  selector: 'gbt-badge',
  standalone: true,
  imports: [Icon],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  variant = input<BadgeVariant>('neutral')
  icon = input<string>()
}
