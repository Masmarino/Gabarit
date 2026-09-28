import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

interface PopupPosition {
  top: string
  left: string | null
  right: string | null
}

@Directive({
  selector: '[gbtMenuTrigger]',
  standalone: true,
})
export class MenuTrigger {}

@Component({
  selector: 'gbt-menu',
  standalone: true,
  imports: [Icon],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
    '(window:scroll)': 'updatePosition()',
    '(window:resize)': 'updatePosition()',
    '[class.gbt-menu-host--custom]': '!triggerIcon() && !!customTrigger()',
  },
})
export class Menu {
  private readonly elementRef = inject(ElementRef<HTMLElement>)
  private readonly injector = inject(Injector)

  label = input.required<string>()
  align = input<'start' | 'end'>('start')
  triggerIcon = input<string | null>(null)
  triggerAriaLabel = input<string | null>(null)
  chevron = input(true, { transform: booleanAttribute })
  opened = output<void>()

  protected readonly open = signal(false)
  protected readonly position = signal<PopupPosition | null>(null)

  protected readonly customTrigger = contentChild(MenuTrigger)

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger')
  private readonly list = viewChild<ElementRef<HTMLElement>>('list')

  protected toggle(): void {
    this.open.update((value) => !value)
    if (this.open()) {
      this.updatePosition()
      this.focusAfterRender('first')
      this.opened.emit()
    }
  }

  protected close(returnFocus: boolean): void {
    if (!this.open()) return
    const active = document.activeElement
    const focusIsFree =
      !active || active === document.body || !!this.list()?.nativeElement.contains(active)
    this.open.set(false)
    if (returnFocus && focusIsFree) {
      this.trigger()?.nativeElement.focus()
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault()
      this.close(true)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const target = event.key === 'ArrowUp' ? 'last' : 'first'
    if (!this.open()) {
      this.open.set(true)
      this.updatePosition()
      this.opened.emit()
    }
    this.focusAfterRender(target)
  }

  protected onListKeydown(event: KeyboardEvent): void {
    const items = this.items()
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLElement)
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        this.close(true)
        break
      case 'ArrowDown':
        event.preventDefault()
        this.focus((index + 1) % items.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        this.focus((index - 1 + items.length) % items.length)
        break
      case 'Home':
        event.preventDefault()
        this.focus(0)
        break
      case 'End':
        event.preventDefault()
        this.focus(items.length - 1)
        break
    }
  }

  protected onListClick(event: MouseEvent): void {
    const item = (event.target as Element | null)?.closest('[role="menuitem"]') ?? null
    if (item?.getAttribute('aria-disabled') === 'true') return
    this.close(item !== null)
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close(false)
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const target = event.relatedTarget as Node | null
    if (this.open() && !this.elementRef.nativeElement.contains(target)) {
      this.open.set(false)
    }
  }

  protected updatePosition(): void {
    if (!this.open()) return
    const trigger = this.trigger()?.nativeElement
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    this.position.set(
      this.align() === 'end'
        ? { top: `${rect.bottom + 6}px`, left: null, right: `${window.innerWidth - rect.right}px` }
        : { top: `${rect.bottom + 6}px`, left: `${rect.left}px`, right: null },
    )
  }

  private items(): HTMLElement[] {
    const list = this.list()?.nativeElement
    if (!list) return []
    return [...list.querySelectorAll<HTMLElement>('[role="menuitem"]')]
  }

  private focus(index: number): void {
    this.items()[index]?.focus()
  }

  private focusAfterRender(target: 'first' | 'last'): void {
    afterNextRender(
      () => {
        const items = this.items()
        this.focus(target === 'last' ? items.length - 1 : 0)
      },
      { injector: this.injector },
    )
  }
}
