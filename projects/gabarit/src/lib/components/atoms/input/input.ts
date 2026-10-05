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
import { Icon } from '../icon/icon'

let nextInputId = 0

export type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'url'
export type InputSize = 'md' | 'sm'
export type InputInputmode =
  'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
export type InputAutocapitalize = 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters'
export type InputEnterkeyhint = 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'

/** Makes the field the combobox of a suggestion list the caller renders, with its keys and active option. */
export interface InputCombobox {
  /** Whether the listbox is shown. */
  expanded: boolean
  /** The id of the listbox. */
  controls: string
  /** The id of the highlighted option, `null` when none is. */
  activeDescendant: string | null
}

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
  type = input<InputType>('text')
  required = input(false, { transform: booleanAttribute })
  disabled = input(false, { transform: booleanAttribute })
  placeholder = input<string>('')
  errorMessage = input<string | null>(null)
  autocomplete = input<string>('off')

  hint = input<string>('')
  hideLabel = input(false, { transform: booleanAttribute })
  size = input<InputSize>('md')
  mono = input(false, { transform: booleanAttribute })
  leadingIcon = input<string | null>(null)
  inputmode = input<InputInputmode | null>(null)
  spellcheck = input<boolean | null>(null)
  autocapitalize = input<InputAutocapitalize | null>(null)
  enterkeyhint = input<InputEnterkeyhint | null>(null)
  maxlength = input<number | null>(null)
  min = input<number | string | null>(null)
  max = input<number | string | null>(null)

  combobox = input<InputCombobox | null>(null)

  showPasswordLabel = input<string>('Show password')

  hidePasswordLabel = input<string>('Hide password')

  committed = output<string>()

  protected readonly value = signal('')
  protected readonly passwordVisible = signal(false)
  protected readonly effectiveType = computed(() => {
    if (this.type() !== 'password') {
      return this.type()
    }
    return this.passwordVisible() ? 'text' : 'password'
  })

  protected readonly hintId = computed(() => `${this.id()}-hint`)
  protected readonly errorId = computed(() => `${this.id()}-error`)
  protected readonly showHint = computed(() => !!this.hint() && !this.errorMessage())
  protected readonly describedBy = computed(() => {
    if (this.errorMessage()) {
      return this.errorId()
    }
    return this.showHint() ? this.hintId() : null
  })

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
    this.committed.emit(this.value())
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible)
  }
}
