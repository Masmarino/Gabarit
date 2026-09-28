import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  afterRenderEffect,
  booleanAttribute,
  effect,
  input,
  output,
  untracked,
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
  busy = input(false, { transform: booleanAttribute })
  busyLabel = input<string>('Please wait')
  returnFocus = input(true, { transform: booleanAttribute })

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
        if (untracked(() => this.returnFocus())) {
          target.focus()
        }
      }
    })

    afterRenderEffect((onCleanup) => {
      const dialog = this.dialog()?.nativeElement
      if (!this.busy() || !dialog) {
        return
      }
      const restore = (): void => {
        if (this.busy() && !dialog.contains(document.activeElement)) {
          dialog.focus()
        }
      }
      restore()
      onCleanup(afterTwoFrames(restore))
    })
  }

  ngOnDestroy(): void {
    if (this.returnFocus()) {
      this.previouslyFocused?.focus()
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen() && !this.busy()) {
      this.closed.emit()
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy()) {
      this.closed.emit()
    }
  }

  protected onCloseClick(): void {
    if (!this.busy()) {
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
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

function afterTwoFrames(callback: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(callback)
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }
  const timer = setTimeout(callback, 50)
  return () => clearTimeout(timer)
}
