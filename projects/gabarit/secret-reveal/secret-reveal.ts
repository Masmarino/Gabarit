import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  effect,
  untracked,
  afterNextRender,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core'
import { Button } from '@masmarino/gabarit/button'
import { CopyButton, CopyButtonFeedback } from '@masmarino/gabarit/copy-button'
import { selectContents } from '@masmarino/gabarit/copy-button'

let nextSecretRevealId = 0

@Component({
  selector: 'gbt-secret-reveal',
  standalone: true,
  imports: [Button, CopyButton],
  templateUrl: './secret-reveal.html',
  styleUrl: './secret-reveal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-revealed]': 'revealed() ? "" : null',
  },
})
export class SecretReveal {
  value = input.required<string>()
  revealed = model(false)
  label = input<string | null>(null)
  showLabel = input('Show the secret')
  hideLabel = input('Hide the secret')
  hiddenLabel = input('Secret hidden')
  copyLabel = input('Copy the secret')
  copiedText = input('Copied')
  failedText = input('Copy failed, secret shown and selected')
  feedbackMs = input(2000)
  feedback = input<CopyButtonFeedback>('bubble')
  maskLength = input(24)

  copied = output<string>()
  copyFailed = output<void>()

  protected readonly id = `gbt-secret-reveal-${++nextSecretRevealId}`
  protected readonly valueId = `${this.id}-value`
  protected readonly labelId = `${this.id}-label`

  private readonly code = viewChild<ElementRef<HTMLElement>>('code')
  private readonly copyButton = viewChild(CopyButton)
  private readonly injector = inject(Injector)

  constructor() {
    effect(() => {
      if (!this.revealed()) {
        untracked(() => this.copyButton()?.reset())
      }
    })
  }

  protected mask(): string {
    return '•'.repeat(Math.max(1, Math.round(this.maskLength())))
  }

  protected toggle(): void {
    this.revealed.set(!this.revealed())
  }

  protected onCopyFailed(): void {
    this.copyFailed.emit()
    if (!this.revealed()) {
      this.revealed.set(true)
    }
    afterNextRender(() => selectContents(this.code()?.nativeElement), { injector: this.injector })
  }
}
