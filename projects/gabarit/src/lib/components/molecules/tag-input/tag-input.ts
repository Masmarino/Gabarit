import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Tag } from '../../atoms/tag/tag'

let nextId = 0

@Component({
  selector: 'gbt-tag-input',
  standalone: true,
  imports: [Tag],
  templateUrl: './tag-input.html',
  styleUrl: './tag-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInput),
      multi: true,
    },
  ],
})
export class TagInput implements ControlValueAccessor {
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input')

  id = input<string>(`gbt-tag-input-${++nextId}`)
  label = input<string>('')
  placeholder = input<string>('')
  disabled = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  separatorKeys = input<string[]>(['Enter', ','])
  allowDuplicates = input(false, { transform: booleanAttribute })
  color = input<string>('#6b7280')
  removeLabel = input<(value: string) => string>((value) => `Remove ${value}`)

  protected readonly tags = signal<string[]>([])
  protected readonly draft = signal('')

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: string[]) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: string[] | null): void {
    this.tags.set(value ?? [])
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected focusInput(): void {
    if (!this.isDisabled()) {
      this.inputRef()?.nativeElement.focus()
    }
  }

  protected onInputChange(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value)
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.separatorKeys().includes(event.key)) {
      event.preventDefault()
      this.commitDraft()
      return
    }
    if (event.key === 'Backspace' && this.draft() === '' && this.tags().length > 0) {
      event.preventDefault()
      this.removeTagAt(this.tags().length - 1)
    }
  }

  protected onBlur(): void {
    this.commitDraft()
    this.onTouched()
  }

  protected removeTagAt(index: number): void {
    if (this.isDisabled()) {
      return
    }
    const next = this.tags().filter((_, i) => i !== index)
    this.tags.set(next)
    this.onChange(next)
  }

  private commitDraft(): void {
    const value = this.draft().trim()
    this.draft.set('')
    if (!value || this.isDisabled()) {
      return
    }
    if (!this.allowDuplicates() && this.tags().includes(value)) {
      return
    }
    const next = [...this.tags(), value]
    this.tags.set(next)
    this.onChange(next)
  }
}
