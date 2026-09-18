import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Icon } from '../../atoms/icon/icon'
import { Tag } from '../../atoms/tag/tag'

export interface SelectOption<T = string> {
  value: T
  label: string
  icon?: string
  color?: string
}

let nextSelectId = 0

@Component({
  selector: 'gbt-select',
  standalone: true,
  imports: [Icon, Tag],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'handleClickOutside($event)',
    '(keydown)': 'onKeydown($event)',
    '(window:scroll)': 'updatePanelPosition()',
    '(window:resize)': 'updatePanelPosition()',
    '[class.gbt-select--sm]': "size() === 'sm'",
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select<T = string> implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef)

  id = input<string>(`gbt-select-${++nextSelectId}`)
  label = input<string>('')
  size = input<'md' | 'sm'>('md')
  options = input.required<SelectOption<T>[]>()
  multiple = input(false, { transform: booleanAttribute })
  chips = input(false, { transform: booleanAttribute })
  placeholder = input<string>('Select…')
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  selectedCountLabel = input<(count: number) => string>((count) => `${count} selected`)
  chipRemoveLabel = input<(label: string) => string>((label) => `Remove ${label}`)

  protected readonly open = signal(false)
  protected readonly activeIndex = signal(-1)
  protected readonly selected = signal<T[]>([])
  protected readonly panelStyle = signal<{ top: string; left: string; width: string } | null>(null)
  private readonly formDisabled = signal(false)

  protected readonly labelId = computed(() => `${this.id()}-label`)
  protected readonly chipsId = computed(() => `${this.id()}-chips`)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: T | T[] | null) => void = () => {}
  private onTouched: () => void = () => {}

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  writeValue(value: T | T[] | null): void {
    if (this.multiple()) {
      this.selected.set(Array.isArray(value) ? (value as T[]) : [])
    } else {
      this.selected.set(value === null || value === undefined ? [] : [value as T])
    }
  }

  registerOnChange(fn: (value: T | T[] | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  protected readonly selectedOptions = computed(() => {
    const selected = this.selected()
    return this.options().filter((option) => selected.includes(option.value))
  })

  protected readonly triggerLabel = computed(() => {
    const opts = this.selectedOptions()
    if (opts.length === 0) {
      return this.placeholder()
    }
    if (this.chips() && this.multiple()) {
      return this.placeholder()
    }
    if (this.multiple() && opts.length > 1) {
      return this.selectedCountLabel()(opts.length)
    }
    return opts[0].label
  })

  protected readonly chipsVisible = computed(
    () => this.chips() && this.multiple() && this.selectedOptions().length > 0,
  )

  /**
   * In chips mode the trigger keeps showing the placeholder, so the selection
   * is conveyed to assistive technology by describing the trigger with the
   * chip row itself. The error message keeps its own id in the list.
   */
  protected readonly describedBy = computed(() => {
    const ids: string[] = []
    if (this.chipsVisible()) {
      ids.push(this.chipsId())
    }
    if (this.errorMessage()) {
      ids.push(`${this.id()}-error`)
    }
    return ids.length > 0 ? ids.join(' ') : null
  })

  protected readonly triggerIcon = computed(() => {
    const opts = this.selectedOptions()
    return opts.length === 1 ? opts[0].icon : undefined
  })

  protected readonly activeOptionId = computed(() =>
    this.open() && this.activeIndex() >= 0 ? `${this.id()}-option-${this.activeIndex()}` : null,
  )

  protected isSelected(value: T): boolean {
    return this.selected().includes(value)
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) {
      return
    }
    this.open.update((value) => !value)
    if (this.open()) {
      this.activeIndex.set(
        Math.max(
          0,
          this.options().findIndex((o) => this.isSelected(o.value)),
        ),
      )
      this.updatePanelPosition()
    } else {
      this.onTouched()
    }
  }

  protected updatePanelPosition(): void {
    if (!this.open()) {
      return
    }
    const trigger = this.elementRef.nativeElement.querySelector(
      '.gbt-select__trigger',
    ) as HTMLElement | null
    if (!trigger) {
      return
    }
    const rect = trigger.getBoundingClientRect()
    // In chips mode the chip row sits between the trigger and the panel.
    // Anchoring the panel to the trigger alone would lay it over the chips,
    // whose remove buttons are focusable — WCAG 2.4.11 "focus not obscured".
    const chipRow = this.elementRef.nativeElement.querySelector(
      '.gbt-select__chips',
    ) as HTMLElement | null
    const anchorBottom = chipRow
      ? Math.max(rect.bottom, chipRow.getBoundingClientRect().bottom)
      : rect.bottom
    this.panelStyle.set({
      top: `${anchorBottom + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    })
  }

  /**
   * Removes the chip at `index`. Refuses to mutate anything while the control
   * is disabled (the remove buttons are not rendered then, but a programmatic
   * caller must not be able to bypass the disabled state either), and moves
   * focus off the button it is about to destroy — otherwise focus falls back
   * to `<body>`.
   */
  protected removeChip(value: T, index: number): void {
    if (this.isDisabled()) {
      return
    }
    const host = this.elementRef.nativeElement as HTMLElement
    const removeButtons = Array.from(
      host.querySelectorAll<HTMLElement>('.gbt-select__chips .gbt-tag__remove'),
    )
    // `@for` tracks options by value, so the surviving chips keep their DOM
    // nodes across this removal — the element resolved here is still the right
    // one once the view updates.
    const nextFocus =
      removeButtons[index + 1] ??
      removeButtons[index - 1] ??
      host.querySelector<HTMLElement>('.gbt-select__trigger')
    this.selectOption(value)
    nextFocus?.focus()
  }

  protected selectOption(value: T): void {
    if (this.multiple()) {
      const current = this.selected()
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      this.selected.set(next)
      this.onChange(next)
      // A chip can be removed without ever opening the panel, so this is the
      // only place that marks the control as touched in that flow.
      this.onTouched()
    } else {
      this.selected.set([value])
      this.onChange(value)
      this.open.set(false)
      this.onTouched()
    }
  }

  protected handleClickOutside(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false)
      this.onTouched()
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return
    }
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this.toggleOpen()
      }
      return
    }
    const options = this.options()
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        this.open.set(false)
        this.onTouched()
        break
      case 'ArrowDown':
        event.preventDefault()
        this.activeIndex.update((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        this.activeIndex.update((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ': {
        event.preventDefault()
        const active = options[this.activeIndex()]
        if (active) {
          this.selectOption(active.value)
        }
        break
      }
    }
  }
}
