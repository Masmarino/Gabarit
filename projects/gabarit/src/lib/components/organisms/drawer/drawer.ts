import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

export type DrawerEdge = 'right' | 'left' | 'top' | 'bottom'

const CLOSE_ANIMATION_MS = 200

@Component({
  selector: 'gbt-drawer',
  standalone: true,
  imports: [Icon],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drawer implements OnDestroy {
  isOpen = input.required<boolean>()
  edge = input<DrawerEdge>('right')
  heading = input<string>('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)
  closeLabel = input<string>('Close')

  closed = output<void>()

  protected readonly rendered = signal(false)

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel')

  private previouslyFocused: HTMLElement | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (this.closeTimer !== null) {
          clearTimeout(this.closeTimer)
          this.closeTimer = null
        }
        this.rendered.set(true)
        this.previouslyFocused = document.activeElement as HTMLElement | null
        queueMicrotask(() => this.panel()?.nativeElement.focus())
      } else if (this.rendered()) {
        this.closeTimer = setTimeout(() => {
          this.closeTimer = null
          this.rendered.set(false)
          if (this.previouslyFocused) {
            const target = this.previouslyFocused
            this.previouslyFocused = null
            target.focus()
          }
        }, CLOSE_ANIMATION_MS)
      }
    })
  }

  ngOnDestroy(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer)
    }
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

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return
    }
    const panel = this.panel()?.nativeElement
    if (!panel) {
      return
    }
    const focusable = panel.querySelectorAll<HTMLElement>(
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
