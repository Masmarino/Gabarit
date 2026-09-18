import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core'

export type PopoverAlign = 'start' | 'end'

interface PopoverPosition {
  top: string
  left: string | null
  right: string | null
}

let nextPopoverId = 0

@Component({
  selector: 'gbt-popover',
  standalone: true,
  exportAs: 'gbtPopover',
  imports: [],
  templateUrl: './popover.html',
  styleUrl: './popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gbt-popover-host',
    '(click)': 'onTriggerClick($event)',
    '(document:click)': 'handleClickOutside($event)',
    '(keydown)': 'onKeydown($event)',
    '(window:scroll)': 'updatePosition()',
    '(window:resize)': 'updatePosition()',
  },
})
export class Popover {
  private readonly elementRef = inject(ElementRef<HTMLElement>)
  private readonly triggerSlot = viewChild<ElementRef<HTMLElement>>('triggerSlot')

  align = input<PopoverAlign>('start')

  readonly panelId = `gbt-popover-${++nextPopoverId}`

  private readonly isOpen = signal(false)
  readonly open = this.isOpen.asReadonly()

  protected readonly position = signal<PopoverPosition | null>(null)

  toggle(): void {
    this.isOpen.update((value) => !value)
    if (this.isOpen()) {
      this.updatePosition()
    }
  }

  close(returnFocus = false): void {
    if (!this.isOpen()) {
      return
    }
    this.isOpen.set(false)
    if (returnFocus) {
      this.focusTrigger()
    }
  }

  protected onTriggerClick(event: MouseEvent): void {
    const trigger = this.triggerSlot()?.nativeElement
    if (trigger?.contains(event.target as Node)) {
      this.toggle()
    }
  }

  protected updatePosition(): void {
    if (!this.isOpen()) {
      return
    }
    const trigger = this.triggerSlot()?.nativeElement
    if (!trigger) {
      return
    }
    const rect = trigger.getBoundingClientRect()
    this.position.set(
      this.align() === 'end'
        ? { top: `${rect.bottom + 6}px`, left: null, right: `${window.innerWidth - rect.right}px` }
        : { top: `${rect.bottom + 6}px`, left: `${rect.left}px`, right: null },
    )
  }

  protected handleClickOutside(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close(false)
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault()
      event.stopPropagation()
      this.close(true)
    }
  }

  private focusTrigger(): void {
    const trigger = this.triggerSlot()?.nativeElement
    trigger?.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')?.focus()
  }
}
