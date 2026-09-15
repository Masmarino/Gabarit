import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NgTemplateOutlet } from '@angular/common'
import { Subscription, isObservable, type Observable } from 'rxjs'

export type AutocompleteSearchFn<T> = (query: string) => Observable<T[]> | Promise<T[]>

let nextAutocompleteId = 0

@Component({
  selector: 'gbt-autocomplete',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'updatePanelPosition()',
    '(window:resize)': 'updatePanelPosition()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Autocomplete),
      multi: true,
    },
  ],
})
export class Autocomplete<T = unknown> implements ControlValueAccessor, OnDestroy {
  private readonly elementRef = inject(ElementRef)

  id = input<string>(`gbt-autocomplete-${++nextAutocompleteId}`)
  label = input<string>('')
  placeholder = input<string>('')
  disabled = input(false, { transform: booleanAttribute })
  required = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  search = input.required<AutocompleteSearchFn<T>>()
  displayFn = input<(item: T) => string>((item) => String(item))
  itemTemplate = input<TemplateRef<unknown>>()
  debounceMs = input<number>(300)
  minLength = input<number>(1)
  loadingMessage = input<string>('Searching…')
  noResultsMessage = input<string>('No results')
  searchErrorMessage = input<string>('Search failed')
  resultsAnnouncement = input<(count: number) => string>(
    (count) => `${count} result${count !== 1 ? 's' : ''}`,
  )

  itemSelected = output<T>()

  protected readonly query = signal('')
  protected readonly open = signal(false)
  protected readonly results = signal<T[]>([])
  protected readonly loading = signal(false)
  protected readonly searchFailed = signal(false)
  protected readonly activeIndex = signal(0)
  protected readonly selectedItem = signal<T | null>(null)
  protected readonly panelStyle = signal<{ top: string; left: string; width: string } | null>(null)

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  protected readonly hasNoResults = computed(
    () => this.open() && !this.loading() && !this.searchFailed() && this.results().length === 0,
  )

  protected readonly activeOptionId = computed(() =>
    this.open() && this.results().length > 0 ? `${this.id()}-option-${this.activeIndex()}` : null,
  )

  private onChange: (value: T | null) => void = () => {}
  private onTouched: () => void = () => {}

  private requestSeq = 0
  private debounceHandle?: ReturnType<typeof setTimeout>
  private subscription?: Subscription

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  writeValue(value: T | null): void {
    this.selectedItem.set(value)
    this.query.set(value === null || value === undefined ? '' : this.displayFn()(value))
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.query.set(value)
    this.activeIndex.set(0)
    if (this.selectedItem() !== null) {
      this.selectedItem.set(null)
      this.onChange(null)
    }
    this.scheduleSearch(value)
  }

  protected onFocus(): void {
    if (
      this.query().trim().length >= this.minLength() &&
      (this.results().length > 0 || this.searchFailed())
    ) {
      this.open.set(true)
      this.updatePanelPosition()
    }
  }

  protected onBlur(): void {
    this.onTouched()
    setTimeout(() => {
      if (!this.elementRef.nativeElement.contains(document.activeElement)) {
        this.open.set(false)
      }
    }, 200)
  }

  private scheduleSearch(value: string): void {
    clearTimeout(this.debounceHandle)
    if (value.trim().length < this.minLength()) {
      this.requestSeq++
      this.subscription?.unsubscribe()
      this.open.set(false)
      this.results.set([])
      this.loading.set(false)
      this.searchFailed.set(false)
      return
    }
    this.debounceHandle = setTimeout(() => this.runSearch(value), this.debounceMs())
  }

  private runSearch(query: string): void {
    const seq = ++this.requestSeq
    this.subscription?.unsubscribe()
    this.loading.set(true)
    this.searchFailed.set(false)
    this.open.set(true)
    this.updatePanelPosition()

    const applyResults = (items: T[]): void => {
      if (seq !== this.requestSeq) return
      this.results.set(items)
      this.loading.set(false)
      this.activeIndex.set(0)
      this.updatePanelPosition()
    }
    const applyError = (): void => {
      if (seq !== this.requestSeq) return
      this.results.set([])
      this.loading.set(false)
      this.searchFailed.set(true)
      this.updatePanelPosition()
    }

    const result = this.search()(query)
    if (isObservable(result)) {
      this.subscription = result.subscribe({ next: applyResults, error: applyError })
    } else {
      result.then(applyResults, applyError)
    }
  }

  protected updatePanelPosition(): void {
    if (!this.open()) {
      return
    }
    const trigger = this.elementRef.nativeElement.querySelector(
      '.gbt-autocomplete__input',
    ) as HTMLElement | null
    if (!trigger) {
      return
    }
    const rect = trigger.getBoundingClientRect()
    this.panelStyle.set({
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    })
  }

  protected selectOption(item: T): void {
    this.selectedItem.set(item)
    this.query.set(this.displayFn()(item))
    this.results.set([])
    this.open.set(false)
    this.onChange(item)
    this.onTouched()
    this.itemSelected.emit(item)
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return
    }
    if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault()
        event.stopPropagation()
        this.open.set(false)
      }
      return
    }
    if (!this.open() || this.results().length === 0) {
      return
    }
    const results = this.results()
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.activeIndex.update((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        this.activeIndex.update((i) => Math.max(i - 1, 0))
        break
      case 'Enter': {
        event.preventDefault()
        const active = results[this.activeIndex()]
        if (active) {
          this.selectOption(active)
        }
        break
      }
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceHandle)
    this.subscription?.unsubscribe()
  }
}
