import {
  ChangeDetectionStrategy,
  booleanAttribute,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Button, ButtonVariant } from '@masmarino/gabarit/button'
import { Icon } from '@masmarino/gabarit/icon'
import { GbtInput } from '@masmarino/gabarit/input'
import { Modal } from '@masmarino/gabarit/modal'

export type ConfirmDangerModalTone = 'danger' | 'warning' | 'neutral'

@Component({
  selector: 'gbt-confirm-danger-modal',
  standalone: true,
  imports: [FormsModule, Modal, GbtInput, Button, Icon],
  templateUrl: './confirm-danger-modal.html',
  styleUrl: './confirm-danger-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDangerModal {
  isOpen = input.required<boolean>()
  heading = input.required<string>()
  message = input.required<string>()
  confirmText = input<string | null | undefined>(undefined)
  confirmInputLabel = input<string>('Type to confirm')
  confirmLabel = input<string>('Confirm')
  cancelLabel = input<string>('Cancel')
  closeLabel = input<string>('Close')
  busy = input(false, { transform: booleanAttribute })
  busyLabel = input<string>('Working')
  confirmIcon = input<string | null>(null)
  tone = input<ConfirmDangerModalTone>('danger')

  confirmed = output<void>()
  closed = output<void>()

  protected readonly typed = signal('')
  protected readonly requiresTyping = computed(() => {
    const expected = this.confirmText()
    return expected !== null && expected !== undefined
  })
  protected readonly canConfirm = computed(
    () =>
      !this.requiresTyping() || (this.typed().length > 0 && this.typed() === this.confirmText()),
  )
  protected readonly confirmVariant = computed<ButtonVariant>(() =>
    this.tone() === 'danger' ? 'danger' : 'primary',
  )
  protected readonly toneIcon = computed(() =>
    this.tone() === 'neutral' ? 'info' : 'alert-triangle',
  )

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.typed.set('')
      }
    })
  }

  protected confirm(): void {
    if (this.canConfirm() && !this.busy()) {
      this.confirmed.emit()
    }
  }

  protected cancel(): void {
    if (!this.busy()) {
      this.closed.emit()
    }
  }
}
