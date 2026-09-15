import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Button } from '../../atoms/button/button'
import { GbtInput } from '../../atoms/input/input'
import { Modal } from '../modal/modal'

@Component({
  selector: 'gbt-confirm-danger-modal',
  standalone: true,
  imports: [FormsModule, Modal, GbtInput, Button],
  templateUrl: './confirm-danger-modal.html',
  styleUrl: './confirm-danger-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDangerModal {
  isOpen = input.required<boolean>()
  heading = input.required<string>()
  message = input.required<string>()
  confirmText = input.required<string>()
  confirmInputLabel = input<string>('Type to confirm')
  confirmLabel = input<string>('Confirm')
  cancelLabel = input<string>('Cancel')
  closeLabel = input<string>('Close')

  confirmed = output<void>()
  closed = output<void>()

  protected readonly typed = signal('')
  protected readonly canConfirm = computed(
    () => this.typed().length > 0 && this.typed() === this.confirmText(),
  )

  constructor() {
    // Cleared whenever the modal transitions to closed (Cancel, Escape,
    // backdrop, or the consumer setting isOpen false after a successful
    // confirm) — a later reopen must never show the previous attempt's text.
    effect(() => {
      if (!this.isOpen()) {
        this.typed.set('')
      }
    })
  }

  protected confirm(): void {
    if (this.canConfirm()) {
      this.confirmed.emit()
    }
  }

  protected cancel(): void {
    this.closed.emit()
  }
}
