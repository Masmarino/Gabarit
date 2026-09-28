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
import { floatingPanelAnchor } from '../../shared/floating-panel-position'

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
    '[class.gbt-select--full]': 'fullWidth()',
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
  hint = input<string>('')
  hideLabel = input(false, { transform: booleanAttribute })
  fullWidth = input(false, { transform: booleanAttribute })
  options = input.required<SelectOption<T>[]>()
  multiple = input(false, { transform: booleanAttribute })
  chips = input(false, { transform: booleanAttribute })
  placeholder = input<string>('Select…')
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  selectedCountLabel = input<(count: number) => string>((count) => `${count} selected`)
  chipRemoveLabel = input<(label: string) => string>((label) => `Remove ${label}`)
  noOptionsMessage = input<string>('No options')

  protected readonly open = signal(false)
  protected readonly activeIndex = signal(-1)
  protected readonly selected = signal<T[]>([])
  protected readonly panelStyle = signal<{ top: string; left: string; width: string } | null>(null)
  private readonly formDisabled = signal(false)

  protected readonly labelId = computed(() => `${this.id()}-label`)
  protected readonly chipsId = computed(() => `${this.id()}-chips`)
  protected readonly hintId = computed(() => `${this.id()}-hint`)
  protected readonly showHint = computed(() => !!this.hint() && !this.errorMessage())
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

  protected readonly describedBy = computed(() => {
    const ids: string[] = []
    if (this.chipsVisible()) {
      ids.push(this.chipsId())
    }
    if (this.errorMessage()) {
      ids.push(`${this.id()}-error`)
    } else if (this.showHint()) {
      ids.push(this.hintId())
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

  protected readonly hasNoOptions = computed(() => this.options().length === 0)

  protected isSelected(value: T): boolean {
    return this.selected().includes(value)
  }

  protected toggleOpen(): void {
    if (this.isDisabled()) {
      return
    }
    this.open.update((value) => !value)
    if (this.open()) {
      const options = this.options()
      this.activeIndex.set(
        options.length === 0
          ? -1
          : Math.max(
              0,
              options.findIndex((o) => this.isSelected(o.value)),
            ),
      )
      this.updatePanelPosition()
    } else {
      this.onTouched()
    }
  }

  protected updatePanelPosition(): void {
    const trigger = this.elementRef.nativeElement.querySelector(
      '.gbt-select__trigger',
    ) as HTMLElement | null
    const anchor = floatingPanelAnchor(this.open(), trigger, (rect) => {
      const chipRow = this.elementRef.nativeElement.querySelector(
        '.gbt-select__chips',
      ) as HTMLElement | null
      return chipRow ? Math.max(rect.bottom, chipRow.getBoundingClientRect().bottom) : rect.bottom
    })
    if (anchor) {
      this.panelStyle.set({
        top: `${anchor.bottom}px`,
        left: `${anchor.left}px`,
        width: `${anchor.rect.width}px`,
      })
    }
  }

  protected removeChip(value: T, index: number): void {
    if (this.isDisabled()) {
      return
    }
    const host = this.elementRef.nativeElement as HTMLElement
    const removeButtons = Array.from(
      host.querySelectorAll<HTMLElement>('.gbt-select__chips .gbt-tag__remove'),
    )
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
        if (options.length > 0) {
          this.activeIndex.update((i) => Math.min(i + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (options.length > 0) {
          this.activeIndex.update((i) => Math.max(i - 1, 0))
        }
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
