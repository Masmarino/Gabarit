import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core'
import { Icon } from '../icon/icon'

@Component({
  selector: 'gbt-button',
  standalone: true,
  imports: [Icon],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  variant = input<'primary' | 'secondary' | 'danger'>('primary')
  size = input<'small' | 'medium' | 'large'>('medium')
  type = input<'button' | 'submit'>('button')
  text = input<string>('')
  iconName = input<string | null>(null)
  ariaLabel = input<string | null>(null)
  loading = input(false, { transform: booleanAttribute })
  loadingLabel = input<string>('Loading')
  disabled = input(false, { transform: booleanAttribute })

  clicked = output<void>()

  protected handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit()
    }
  }
}
