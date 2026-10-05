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

let nextId = 0

@Component({
  selector: 'gbt-slider',
  standalone: true,
  imports: [],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Slider),
      multi: true,
    },
  ],
})
export class Slider implements ControlValueAccessor {
  id = input<string>(`gbt-slider-${++nextId}`)
  label = input.required<string>()
  min = input(0)
  max = input(100)
  step = input(1)
  disabled = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  showValue = input(true, { transform: booleanAttribute })
  formatValue = input<(value: number) => string>((value) => `${value}`)

  protected readonly value = signal(0)

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  protected readonly fillPercent = computed(() => {
    const range = this.max() - this.min()
    if (range <= 0) {
      return 0
    }
    return ((this.value() - this.min()) / range) * 100
  })

  private onChange: (value: number) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: number): void {
    this.value.set(value ?? 0)
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value)
    this.value.set(value)
    this.onChange(value)
  }

  protected onBlur(): void {
    this.onTouched()
  }
}
