import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

let nextId = 0

@Component({
  selector: 'gbt-textarea',
  standalone: true,
  imports: [],
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
  ],
})
export class Textarea implements ControlValueAccessor {
  id = input<string>(`gbt-textarea-${++nextId}`)
  label = input<string>('')
  required = input(false, { transform: booleanAttribute })
  disabled = input(false, { transform: booleanAttribute })
  placeholder = input<string>('')
  errorMessage = input<string | null>(null)
  rows = input(3)

  committed = output<string>()

  protected readonly value = signal('')

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: string) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: string): void {
    this.value.set(value ?? '')
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value
    this.value.set(value)
    this.onChange(value)
  }

  protected onBlur(): void {
    this.onTouched()
    this.committed.emit(this.value())
  }
}
