import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core'
import { Avatar } from '../../atoms/avatar/avatar'
import { Icon } from '../../atoms/icon/icon'

export interface AvatarGroupItem {
  name: string
  src?: string
}

@Component({
  selector: 'gbt-avatar-group',
  standalone: true,
  imports: [Avatar, Icon],
  templateUrl: './avatar-group.html',
  styleUrl: './avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'handleClickOutside($event)',
    '(keydown)': 'onKeydown($event)',
    '(window:scroll)': 'updatePanelPosition()',
    '(window:resize)': 'updatePanelPosition()',
  },
})
export class AvatarGroup<T extends AvatarGroupItem = AvatarGroupItem> {
  private readonly elementRef = inject(ElementRef)

  items = input.required<T[]>()
  max = input<number>(5)
  ariaLabel = input<string>('Users')
  moreLabel = input<(count: number) => string>((count) => `${count} more`)
  activeItem = input<T | null>(null)

  itemClick = output<T>()

  protected readonly panelOpen = signal(false)
  protected readonly panelStyle = signal<{ top: string; left: string } | null>(null)

  protected readonly visibleItems = computed(() => this.items().slice(0, this.max()))
  protected readonly overflowItems = computed(() => this.items().slice(this.max()))
  protected readonly overflowCount = computed(() => this.overflowItems().length)

  protected isActive(item: T): boolean {
    return this.activeItem() === item
  }

  protected selectItem(item: T): void {
    this.itemClick.emit(item)
    this.panelOpen.set(false)
  }

  protected toggleOverflowPanel(): void {
    this.panelOpen.update((value) => !value)
    if (this.panelOpen()) {
      this.updatePanelPosition()
    }
  }

  protected updatePanelPosition(): void {
    if (!this.panelOpen()) {
      return
    }
    const trigger = this.elementRef.nativeElement.querySelector(
      '.gbt-avatar-group__more',
    ) as HTMLElement | null
    if (!trigger) {
      return
    }
    const rect = trigger.getBoundingClientRect()
    this.panelStyle.set({
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
    })
  }

  protected handleClickOutside(event: MouseEvent): void {
    if (this.panelOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.panelOpen.set(false)
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.panelOpen()) {
      event.preventDefault()
      event.stopPropagation()
      this.panelOpen.set(false)
    }
  }
}
