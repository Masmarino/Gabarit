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
import { Icon } from '../icon/icon'

let nextInputId = 0

@Component({
  selector: 'gbt-input',
  standalone: true,
  imports: [Icon],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GbtInput),
      multi: true,
    },
  ],
})
export class GbtInput implements ControlValueAccessor {
  id = input<string>(`gbt-input-${++nextInputId}`)
  label = input<string>('')
  type = input<'text' | 'password'>('text')
  required = input(false, { transform: booleanAttribute })
  disabled = input(false, { transform: booleanAttribute })
  placeholder = input<string>('')
  errorMessage = input<string | null>(null)
  autocomplete = input<string>('off')

  showPasswordLabel = input<string>('Show password')

  hidePasswordLabel = input<string>('Hide password')

  protected readonly value = signal('')
  protected readonly passwordVisible = signal(false)
  protected readonly effectiveType = computed(() =>
    this.type() === 'password' && !this.passwordVisible() ? 'password' : 'text',
  )

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
    const value = (event.target as HTMLInputElement).value
    this.value.set(value)
    this.onChange(value)
  }

  protected onBlur(): void {
    this.onTouched()
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible)
  }
}
