import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  untracked,
} from '@angular/core'
import { Button, ButtonSize, ButtonVariant } from '../button/button'
import { ClipboardFeedback, CopyValue } from './clipboard'

export type CopyButtonFeedback = 'bubble' | 'inline' | 'hidden'

export type { CopyValue } from './clipboard'

@Component({
  selector: 'gbt-copy-button',
  standalone: true,
  imports: [Button],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-status]': 'clipboard.status()',
  },
})
export class CopyButton {
  value = input<CopyValue>('')
  text = input('')
  ariaLabel = input<string | null>(null)
  copiedText = input('Copied')
  failedText = input('Copy failed')
  feedbackMs = input(2000)
  variant = input<ButtonVariant>('secondary')
  size = input<ButtonSize>('small')
  icon = input('copy')
  disabled = input(false, { transform: booleanAttribute })
  feedback = input<CopyButtonFeedback>('bubble')
  selectTarget = input<HTMLElement | null>(null)

  copied = output<string>()
  copyFailed = output<void>()

  protected readonly clipboard = new ClipboardFeedback()

  constructor() {
    effect(() => {
      const value = this.value()
      if (typeof value === 'string') {
        untracked(() => this.clipboard.reset())
      }
    })
  }

  reset(): void {
    this.clipboard.reset()
  }

  protected readonly glyph = computed(() => {
    switch (this.clipboard.status()) {
      case 'copied':
        return 'check'
      case 'failed':
        return 'alert-circle'
      default:
        return this.icon()
    }
  })

  protected readonly statusText = computed(() => {
    switch (this.clipboard.status()) {
      case 'copied':
        return this.copiedText()
      case 'failed':
        return this.failedText()
      default:
        return ''
    }
  })

  protected readonly name = computed(() => this.ariaLabel() ?? (this.text() ? null : 'Copy'))

  protected async copy(): Promise<void> {
    if (this.disabled()) {
      return
    }
    const outcome = await this.clipboard.copy(this.value(), this.feedbackMs(), this.selectTarget())
    if (!outcome) {
      return
    }
    if (outcome.copied) {
      this.copied.emit(outcome.text)
    } else {
      this.copyFailed.emit()
    }
  }
}
