import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core'
import { Icon } from '../icon/icon'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger' | 'link'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonHaspopup = 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'true' | 'false'

function nullableBoolean(value: boolean | string | null | undefined): boolean | null {
  return value === null || value === undefined ? null : booleanAttribute(value)
}

@Component({
  selector: 'gbt-button, a[gbtButton]',
  standalone: true,
  imports: [Icon],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.gbt-button-host--block]': 'block()',
    '[class]': 'anchorHostClass()',
    '[attr.aria-disabled]': 'isAnchor && disabled() ? "true" : null',
  },
})
export class Button {
  private readonly elementRef = inject(ElementRef<HTMLElement>)
  protected readonly isAnchor = this.elementRef.nativeElement.tagName === 'A'

  variant = input<ButtonVariant>('primary')
  size = input<ButtonSize>('medium')
  type = input<'button' | 'submit'>('button')
  text = input<string>('')
  iconName = input<string | null>(null)
  ariaLabel = input<string | null>(null)
  loading = input(false, { transform: booleanAttribute })
  loadingLabel = input<string>('Loading')
  disabled = input(false, { transform: booleanAttribute })

  pressed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBoolean,
  })
  ariaExpanded = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBoolean,
  })
  ariaControls = input<string | null>(null)
  ariaHaspopup = input<ButtonHaspopup | boolean | null>(null)
  block = input(false, { transform: booleanAttribute })
  iconOnly = input(false, { transform: booleanAttribute })

  clicked = output<void>()

  protected readonly anchorHostClass = computed(() => {
    if (!this.isAnchor) {
      return ''
    }
    const classes = ['gbt-button', `gbt-button--${this.variant()}`, `gbt-button--${this.size()}`]
    if (this.iconOnly()) {
      classes.push('gbt-button--icon-only')
    }
    return classes.join(' ')
  })

  constructor() {
    if (!this.isAnchor) {
      return
    }
    const anchor = this.elementRef.nativeElement
    const swallowWhenDisabled = (event: Event): void => {
      if (this.disabled()) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    anchor.addEventListener('click', swallowWhenDisabled, true)
    anchor.addEventListener('auxclick', swallowWhenDisabled, true)

    let consumerTabindex: string | null | undefined
    effect(() => {
      if (this.disabled()) {
        if (consumerTabindex === undefined) {
          consumerTabindex = anchor.getAttribute('tabindex')
        }
        anchor.setAttribute('tabindex', '-1')
      } else if (consumerTabindex !== undefined) {
        if (consumerTabindex === null) {
          anchor.removeAttribute('tabindex')
        } else {
          anchor.setAttribute('tabindex', consumerTabindex)
        }
        consumerTabindex = undefined
      }
    })

    inject(DestroyRef).onDestroy(() => {
      anchor.removeEventListener('click', swallowWhenDisabled, true)
      anchor.removeEventListener('auxclick', swallowWhenDisabled, true)
    })
  }

  protected handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit()
    }
  }
}
