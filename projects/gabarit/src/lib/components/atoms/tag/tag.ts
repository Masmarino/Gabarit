import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { Icon } from '../icon/icon'
import { getReadableTextColor } from './tag-contrast'

@Component({
  selector: 'gbt-tag',
  standalone: true,
  imports: [Icon],
  templateUrl: './tag.html',
  styleUrl: './tag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tag {
  color = input.required<string>()
  removable = input<boolean>(false)
  removeLabel = input<string>('Remove')
  disabled = input<boolean>(false)

  removed = output<void>()

  protected readonly textColor = computed(() => getReadableTextColor(this.color()))

  protected onRemoveClick(event: MouseEvent): void {
    event.stopPropagation()
    this.removed.emit()
  }
}
