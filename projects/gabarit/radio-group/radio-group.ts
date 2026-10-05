import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

export interface RadioOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

let nextId = 0

@Component({
  selector: 'gbt-radio-group',
  standalone: true,
  imports: [],
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroup),
      multi: true,
    },
  ],
})
export class RadioGroup<T = string> implements ControlValueAccessor {
  id = input<string>(`gbt-radio-group-${++nextId}`)
  label = input.required<string>()
  options = input.required<RadioOption<T>[]>()
  orientation = input<'vertical' | 'horizontal'>('vertical')
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)

  protected readonly selected = signal<T | null>(null)

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: T) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: T | null): void {
    this.selected.set(value)
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected isSelected(value: T): boolean {
    return this.selected() === value
  }

  protected selectOption(value: T): void {
    this.selected.set(value)
    this.onChange(value)
    this.onTouched()
  }
}
