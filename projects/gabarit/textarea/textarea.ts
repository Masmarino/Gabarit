import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

let nextId = 0

export type TextareaResize = 'vertical' | 'none' | 'both' | 'horizontal'

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

  hint = input<string>('')
  hideLabel = input(false, { transform: booleanAttribute })
  mono = input(false, { transform: booleanAttribute })
  autosize = input(false, { transform: booleanAttribute })
  maxRows = input<number | null>(null)
  resize = input<TextareaResize>('vertical')

  committed = output<string>()

  protected readonly value = signal('')

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field')

  protected readonly hintId = computed(() => `${this.id()}-hint`)
  protected readonly errorId = computed(() => `${this.id()}-error`)
  protected readonly showHint = computed(() => !!this.hint() && !this.errorMessage())
  protected readonly describedBy = computed(() => {
    if (this.errorMessage()) {
      return this.errorId()
    }
    return this.showHint() ? this.hintId() : null
  })
  protected readonly effectiveResize = computed(() => (this.autosize() ? 'none' : this.resize()))
  protected readonly maxRowsProperty = computed(() => (this.autosize() ? this.maxRows() : null))

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement

    let wasAutosize = false
    afterRenderEffect(() => {
      const textarea = this.field().nativeElement
      this.value()
      this.rows()
      if (this.autosize()) {
        this.fitToContent(textarea)
        wasAutosize = true
      } else if (wasAutosize) {
        textarea.style.height = ''
        wasAutosize = false
      }
    })

    afterRenderEffect((onCleanup) => {
      if (!this.autosize() || typeof ResizeObserver === 'undefined') {
        return
      }
      let lastWidth = host.clientWidth
      const observer = new ResizeObserver(() => {
        if (host.clientWidth !== lastWidth) {
          lastWidth = host.clientWidth
          this.fitToContent(this.field().nativeElement)
        }
      })
      observer.observe(host)
      onCleanup(() => observer.disconnect())
    })
  }

  private fitToContent(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto'
    const borders = textarea.offsetHeight - textarea.clientHeight
    textarea.style.height = `${Math.ceil(textarea.scrollHeight + borders)}px`
  }

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
