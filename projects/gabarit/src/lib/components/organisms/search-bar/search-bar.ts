import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { Icon } from '../../atoms/icon/icon'

export interface SearchResultCategory<T = unknown> {
  label: string
  icon?: string
  items: T[]
}

let nextSearchBarId = 0

export type SearchBarCollapsible = boolean | 'narrow'

function collapsibleAttribute(value: boolean | string | null | undefined): SearchBarCollapsible {
  return value === 'narrow' ? 'narrow' : booleanAttribute(value)
}

@Component({
  selector: 'gbt-search-bar',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onNavigationKeydown($event)',
    '(document:click)': 'handleClickOutside($event)',
    '[attr.data-collapsible]': 'collapsibleMode()',
    '[attr.data-expanded]': 'collapsibleMode() && expanded() ? "" : null',
  },
})
export class SearchBar<T = unknown> {
  private readonly elementRef = inject(ElementRef)
  private readonly injector = inject(Injector)

  id = input<string>(`gbt-search-bar-${++nextSearchBarId}`)
  results = input<T[] | null>(null)
  groupedResults = input<SearchResultCategory<T>[] | null>(null)
  placeholder = input<string>('Search…')
  ariaLabel = input<string>('')
  displayFn = input<(item: T) => string>((item) => String(item))
  itemTemplate = input<TemplateRef<unknown>>()
  keepQueryOnSelect = input(false)
  noResultsMessage = input<string>('No results')
  noResultsHint = input<string>('Try a different search.')
  clearLabel = input<string>('Clear search')
  resultsAnnouncement = input<(count: number) => string>(
    (count) => `${count} result${count !== 1 ? 's' : ''}`,
  )
  navigateHint = input<string>('Navigate')
  selectHint = input<string>('Select')
  closeHint = input<string>('Close')
  collapsible = input<SearchBarCollapsible, boolean | string | null | undefined>(false, {
    transform: collapsibleAttribute,
  })
  expanded = model(false)
  openLabel = input<string>('Search')
  closeLabel = input<string>('Close search')

  queryChange = output<string>()
  itemSelected = output<T>()
  clear = output<void>()

  protected readonly isFocused = signal(false)
  protected readonly showResults = signal(false)
  protected readonly searchQuery = signal('')
  protected readonly activeIndex = signal(0)

  protected readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput')
  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggle')

  protected readonly collapsibleMode = computed(() => {
    const mode = this.collapsible()
    return mode === 'narrow' ? 'narrow' : mode ? 'always' : null
  })

  protected readonly folded = computed(() => this.collapsibleMode() !== null && !this.expanded())

  protected readonly triggerId = computed(() => `${this.id()}-trigger`)

  private readonly hasGroupedResultsInput = computed(() => !!this.groupedResults())

  protected readonly allVisibleItems = computed<T[]>(() => {
    if (this.groupedResults()) {
      return this.groupedResults()!.flatMap((category) => category.items)
    }
    return this.results() ?? []
  })

  protected readonly showOverlay = computed(() => this.showResults())

  protected readonly panelId = computed(() => `${this.id()}-panel`)

  protected itemDomId(index: number): string {
    return `${this.id()}-item-${index}`
  }

  protected readonly indexedGroupedResults = computed(() => {
    const grouped = this.groupedResults()
    if (!grouped) return null
    const format = this.displayFn()
    let index = 0
    return grouped.map((category) => ({
      ...category,
      indexedItems: category.items.map((item) => ({
        item,
        index: index++,
        formatted: format(item),
      })),
    }))
  })

  protected readonly indexedResults = computed(() => {
    const format = this.displayFn()
    return (this.results() ?? []).map((item, index) => ({ item, index, formatted: format(item) }))
  })

  protected readonly activeItemDomId = computed(() => {
    if (!this.showOverlay()) return null
    const idx = this.activeIndex()

    return idx >= 0 && idx < this.allVisibleItems().length ? this.itemDomId(idx) : null
  })

  protected readonly resultCount = computed(() =>
    this.showOverlay() ? this.allVisibleItems().length : 0,
  )

  protected readonly hasGroupedResults = computed(
    () => this.hasGroupedResultsInput() && !!this.groupedResults()?.some((c) => c.items.length > 0),
  )

  protected readonly hasNoResults = computed(() => this.allVisibleItems().length === 0)

  protected onNavigationKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Escape' &&
      this.collapsibleMode() !== null &&
      this.expanded() &&
      !this.showOverlay()
    ) {
      event.preventDefault()
      this.fold(true)
      return
    }

    if (!this.isFocused() || !this.showOverlay()) return

    if (event.key === 'Escape') {
      event.preventDefault()
      this.blurSearch()
      return
    }

    const items = this.allVisibleItems()
    if (items.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        this.activeIndex.update((i) => Math.min(i + 1, items.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        this.activeIndex.update((i) => Math.max(i - 1, 0))
        break
      case 'Enter': {
        const active = items[this.activeIndex()]
        if (!active) break
        event.preventDefault()
        this.onSelect(active)
        break
      }
    }
  }

  protected handleClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showResults.set(false)
    }
  }

  focusSearch(): void {
    this.searchInput()?.nativeElement.focus()
  }

  protected blurSearch(): void {
    this.searchInput()?.nativeElement.blur()
    this.showResults.set(false)
  }

  protected onFocus(): void {
    this.isFocused.set(true)
    if (this.searchQuery().length > 0) this.showResults.set(true)
  }

  protected expand(): void {
    this.expanded.set(true)
    afterNextRender(() => this.focusSearch(), { injector: this.injector })
  }

  private fold(returnFocus: boolean): void {
    this.expanded.set(false)
    if (returnFocus) {
      afterNextRender(() => this.toggleButton()?.nativeElement.focus(), { injector: this.injector })
    }
  }

  protected close(event: Event): void {
    event.stopPropagation()
    this.showResults.set(false)
    this.fold(true)
  }

  protected onBlur(event?: FocusEvent): void {
    this.isFocused.set(false)
    if (
      this.collapsibleMode() !== null &&
      this.expanded() &&
      this.searchQuery().length === 0 &&
      !this.elementRef.nativeElement.contains(event?.relatedTarget)
    ) {
      this.fold(false)
    }
    setTimeout(() => {
      if (!this.elementRef.nativeElement.contains(document.activeElement)) {
        this.showResults.set(false)
      }
    }, 200)
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.searchQuery.set(value)
    this.activeIndex.set(0)
    this.showResults.set(value.length > 0)

    this.queryChange.emit(value)
  }

  protected onClear(): void {
    this.searchQuery.set('')
    this.activeIndex.set(0)
    this.showResults.set(false)
    this.clear.emit()
    this.focusSearch()
  }

  protected onSelect(item: T): void {
    this.itemSelected.emit(item)
    this.showResults.set(false)
    this.searchQuery.set(this.keepQueryOnSelect() ? this.displayFn()(item) : '')
    if (this.collapsibleMode() !== null && !this.keepQueryOnSelect()) this.fold(false)
  }
}
