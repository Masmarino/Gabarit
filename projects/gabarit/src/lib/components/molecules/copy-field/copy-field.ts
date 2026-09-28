import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { CopyButton, CopyButtonFeedback } from '../../atoms/copy-button/copy-button'

export const COPY_FIELD_WRAP_AT = /(?<=[^/:]\/)/

let nextCopyFieldId = 0

@Component({
  selector: 'gbt-copy-field',
  standalone: true,
  imports: [CopyButton],
  templateUrl: './copy-field.html',
  styleUrl: './copy-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyField {
  value = input.required<string>()
  label = input<string | null>(null)
  copyLabel = input('Copy')
  copiedText = input('Copied')
  failedText = input('Copy failed, value selected')
  feedbackMs = input(2000)
  feedback = input<CopyButtonFeedback>('bubble')
  wrapAt = input<RegExp | null>(COPY_FIELD_WRAP_AT)

  copied = output<string>()
  copyFailed = output<void>()

  protected readonly labelId = `gbt-copy-field-label-${++nextCopyFieldId}`

  protected readonly segments = computed(() => this.cut(this.value(), this.wrapAt()))

  private cut(value: string, pattern: RegExp | null): string[] {
    if (!pattern) {
      return [value]
    }
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    const segments: string[] = []
    let start = 0
    for (const match of value.matchAll(new RegExp(pattern.source, flags))) {
      const end = match.index + match[0].length
      if (end > start && end < value.length) {
        segments.push(value.slice(start, end))
        start = end
      }
    }
    segments.push(value.slice(start))
    return segments
  }
}
