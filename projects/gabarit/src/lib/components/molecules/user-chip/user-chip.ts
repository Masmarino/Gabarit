import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { Avatar } from '../../atoms/avatar/avatar'

export type UserChipSize = 'sm' | 'md'

@Component({
  selector: 'gbt-user-chip',
  standalone: true,
  imports: [Avatar],
  templateUrl: './user-chip.html',
  styleUrl: './user-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserChip {
  name = input.required<string>()
  size = input<UserChipSize>('sm')
  src = input<string | null>(null)
}
