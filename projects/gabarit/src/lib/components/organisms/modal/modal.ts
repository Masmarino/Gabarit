import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

@Component({
  selector: 'gbt-modal',
  standalone: true,
  imports: [Icon],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal implements OnDestroy {
  isOpen = input.required<boolean>()
  heading = input<string>('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)
  closeLabel = input<string>('Close')

  closed = output<void>()

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog')

  private previouslyFocused: HTMLElement | null = null

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.previouslyFocused = document.activeElement as HTMLElement | null
        queueMicrotask(() => this.dialog()?.nativeElement.focus())
      } else if (this.previouslyFocused) {
        const target = this.previouslyFocused
        this.previouslyFocused = null
        target.focus()
      }
    })
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus()
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) {
      this.closed.emit()
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit()
    }
  }

  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return
    }
    const dialog = this.dialog()?.nativeElement
    if (!dialog) {
      return
    }
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) {
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
