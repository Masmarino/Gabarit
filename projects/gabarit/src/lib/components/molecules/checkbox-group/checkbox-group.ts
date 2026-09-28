import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Checkbox } from '../../atoms/checkbox/checkbox'

export interface CheckboxGroupOption<T = string> {
  value: T
  label: string
  hint?: string
  disabled?: boolean
}

export interface CheckboxGroupSection<T = string> {
  label: string
  options: CheckboxGroupOption<T>[]
}

interface RenderedItem<T> {
  id: string
  option: CheckboxGroupOption<T>
}

interface RenderedSection<T> {
  key: string
  label: string | null
  labelId: string
  items: RenderedItem<T>[]
}

let nextCheckboxGroupId = 0

@Component({
  selector: 'gbt-checkbox-group',
  standalone: true,
  imports: [Checkbox],
  templateUrl: './checkbox-group.html',
  styleUrl: './checkbox-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxGroup),
      multi: true,
    },
  ],
})
export class CheckboxGroup<T = string> implements ControlValueAccessor {
  id = input<string>(`gbt-checkbox-group-${++nextCheckboxGroupId}`)
  legend = input.required<string>()
  hideLegend = input(false, { transform: booleanAttribute })
  options = input<CheckboxGroupOption<T>[]>([])
  groups = input<CheckboxGroupSection<T>[]>([])
  columns = input<number | 'auto'>(1)
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  hint = input<string>('')
  errorMessage = input<string | null>(null)
  value = model<T[]>([])

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  protected readonly hintId = computed(() => `${this.id()}-hint`)
  protected readonly errorId = computed(() => `${this.id()}-error`)
  protected readonly showHint = computed(() => !!this.hint() && !this.errorMessage())
  protected readonly describedBy = computed(() => {
    if (this.errorMessage()) return this.errorId()
    return this.showHint() ? this.hintId() : null
  })

  protected readonly sections = computed<RenderedSection<T>[]>(() => {
    const id = this.id()
    const result: RenderedSection<T>[] = []
    const flat = this.options()
    if (flat.length > 0) {
      result.push({
        key: 'options',
        label: null,
        labelId: '',
        items: flat.map((option, i) => ({ id: `${id}-${i}`, option })),
      })
    }
    this.groups().forEach((group, g) => {
      result.push({
        key: `group-${g}`,
        label: group.label,
        labelId: `${id}-group-${g}`,
        items: group.options.map((option, i) => ({ id: `${id}-g${g}-${i}`, option })),
      })
    })
    return result
  })

  protected readonly sectioned = computed(() => this.sections().some((s) => s.label !== null))

  protected readonly gridColumns = computed(() => {
    const columns = this.columns()
    if (columns === 'auto') return 'repeat(auto-fill, minmax(11rem, 1fr))'
    const count = Math.max(1, Math.floor(columns))
    return count === 1 ? null : `repeat(${count}, minmax(0, 1fr))`
  })

  private onChange: (value: T[]) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: T[] | null): void {
    this.value.set(Array.isArray(value) ? [...value] : [])
  }

  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected isChecked(value: T): boolean {
    return this.value().includes(value)
  }

  protected setChecked(value: T, checked: boolean): void {
    const current = this.value()
    if (current.includes(value) === checked) return
    const next = checked ? [...current, value] : current.filter((v) => v !== value)
    const order = this.sections().flatMap((s) => s.items.map((item) => item.option.value))
    const rank = (v: T): number => {
      const index = order.indexOf(v)
      return index === -1 ? order.length : index
    }
    next.sort((a, b) => rank(a) - rank(b))
    this.value.set(next)
    this.onChange(next)
    this.onTouched()
  }
}
