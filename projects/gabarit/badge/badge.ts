import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core'
import { ClipboardFeedback } from '@masmarino/gabarit/copy-button'
import { Icon } from '@masmarino/gabarit/icon'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info'
export type BadgeAppearance = 'filled' | 'outline'
export type BadgeSize = 'md' | 'sm'

@Component({
  selector: 'gbt-badge',
  standalone: true,
  imports: [Icon],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.gbt-badge-host--truncate]': 'truncate()',
    '[style.max-width]': 'maxWidth()',
    '[attr.hidden]': 'visible() ? null : ""',
  },
})
export class Badge {
  variant = input<BadgeVariant>('neutral')
  icon = input<string>()
  appearance = input<BadgeAppearance>('filled')
  size = input<BadgeSize>('md')
  truncate = input(false, { transform: booleanAttribute })
  tabularNums = input(false, { transform: booleanAttribute })

  mono = input(false, { transform: booleanAttribute })
  maxWidth = input<string | null>(null)
  fullText = input<string | null>(null)

  copyable = input(false, { transform: booleanAttribute })
  copyValue = input<string | null>(null)
  copyLabel = input('Copy')
  copiedText = input('Copied')
  failedText = input('Copy failed')
  feedbackMs = input(2000)

  value = input<number | null>(null)
  max = input<number | null>(null)
  hideZero = input(false, { transform: booleanAttribute })
  label = input<string | null>(null)

  copied = output<string>()
  copyFailed = output<void>()

  protected readonly clipboard = new ClipboardFeedback()
  private readonly content = viewChild<ElementRef<HTMLElement>>('content')

  protected readonly hasValue = computed(() => this.value() !== null)

  private readonly count = computed(() => {
    const value = this.value()
    if (value === null) {
      return null
    }
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
  })

  protected readonly displayText = computed(() => {
    const count = this.count()
    if (count === null) {
      return ''
    }
    const max = this.max()
    return max !== null && count > max ? `${max}+` : String(count)
  })

  protected readonly visible = computed(() => {
    const count = this.count()
    return !(this.hideZero() && count === 0)
  })

  protected readonly glyph = computed(() => {
    switch (this.clipboard.status()) {
      case 'copied':
        return 'check'
      case 'failed':
        return 'alert-circle'
      default:
        return 'copy'
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

  protected async copy(): Promise<void> {
    const element = this.content()?.nativeElement
    const value = this.copyValue() ?? element?.textContent?.trim() ?? ''
    const outcome = await this.clipboard.copy(value, this.feedbackMs(), element)
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
