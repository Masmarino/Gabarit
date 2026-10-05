import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

export type MenuItemVariant = 'default' | 'danger'

@Component({
  selector: 'button[gbtMenuItem], a[gbtMenuItem]',
  standalone: true,
  imports: [Icon],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gbt-menu__item',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.data-variant]': 'variant() === "danger" ? "danger" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class MenuItem {
  icon = input<string | null>(null)
  variant = input<MenuItemVariant>('default')
  disabled = input(false, { transform: booleanAttribute })

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement
    if (host.tagName === 'BUTTON' && !host.hasAttribute('type')) {
      host.setAttribute('type', 'button')
    }

    const swallowWhenDisabled = (event: Event): void => {
      if (this.disabled()) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    host.addEventListener('click', swallowWhenDisabled, true)
    host.addEventListener('auxclick', swallowWhenDisabled, true)
    inject(DestroyRef).onDestroy(() => {
      host.removeEventListener('click', swallowWhenDisabled, true)
      host.removeEventListener('auxclick', swallowWhenDisabled, true)
    })
  }
}
