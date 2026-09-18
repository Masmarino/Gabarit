import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const ASSERTIVE_VARIANTS: ReadonlySet<AlertVariant> = new Set(['warning', 'error'])

const VARIANT_ICONS: Record<AlertVariant, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}

@Component({
  selector: 'gbt-alert',
  standalone: true,
  imports: [Icon],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  variant = input<AlertVariant>('info')
  dismissible = input(false, { transform: booleanAttribute })
  closeLabel = input<string>('Dismiss')

  dismissed = output<void>()

  protected readonly role = computed(() => (ASSERTIVE_VARIANTS.has(this.variant()) ? 'alert' : 'status'))

  protected readonly icon = computed(() => VARIANT_ICONS[this.variant()])
}
