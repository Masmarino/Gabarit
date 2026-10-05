import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral'

export type AlertLive = 'auto' | 'assertive' | 'polite' | 'off'
export type AlertSize = 'md' | 'sm'
export type AlertAppearance = 'default' | 'subtle'
export type AlertIconAlign = 'auto' | 'center' | 'start'

const ASSERTIVE_VARIANTS: ReadonlySet<AlertVariant> = new Set(['warning', 'error'])

const VARIANT_ICONS: Record<AlertVariant, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
  neutral: 'info',
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

  live = input<AlertLive>('auto')
  heading = input<string>('')
  size = input<AlertSize>('md')
  appearance = input<AlertAppearance>('default')
  iconAlign = input<AlertIconAlign>('auto')

  dismissed = output<void>()

  protected readonly role = computed(() => {
    switch (this.live()) {
      case 'assertive':
        return 'alert'
      case 'polite':
        return 'status'
      case 'off':
        return null
      default:
        return ASSERTIVE_VARIANTS.has(this.variant()) ? 'alert' : 'status'
    }
  })

  protected readonly icon = computed(() => VARIANT_ICONS[this.variant()])
}
