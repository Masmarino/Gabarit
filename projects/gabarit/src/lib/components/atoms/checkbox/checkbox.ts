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

let nextCheckboxId = 0

@Component({
  selector: 'gbt-checkbox',
  standalone: true,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
})
export class Checkbox implements ControlValueAccessor {
  id = input<string>(`gbt-checkbox-${++nextCheckboxId}`)
  label = input<string>('')
  disabled = input(false, { transform: booleanAttribute })

  protected readonly checked = signal(false)

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: boolean) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: boolean): void {
    this.checked.set(!!value)
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected onToggle(event: Event): void {
    const value = (event.target as HTMLInputElement).checked
    this.checked.set(value)
    this.onChange(value)
    this.onTouched()
  }
}
