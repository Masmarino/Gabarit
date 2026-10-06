import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'
import { Spinner } from '@masmarino/gabarit/spinner'
import { matchCommand } from './command-match'
import { matchesShortcut } from './shortcut'

/** Something the palette offers: a page to open, an action to run, a search result. */
export interface CommandItem<T = unknown> {
  /** Unique within the palette. */
  id: string
  label: string
  /** A second, quieter line: a path, an owner, what the action does. */
  description?: string
  icon?: string
  /** More words it answers to, beyond its label and description. */
  keywords?: readonly string[]
  /** Keys shown on the right, for display only, e.g. `['G', 'D']`. */
  shortcut?: readonly string[]
  data?: T
}

export interface CommandGroup<T = unknown> {
  label: string
  items: readonly CommandItem<T>[]
  /**
   * `false` for items that already answer the query, like server search results: shown as given. By default the
   * palette keeps the items that match the query, best first.
   */
  filter?: boolean
}

interface IndexedItem<T> {
  item: CommandItem<T>
  index: number
}

interface IndexedGroup<T> {
  label: string
  labelId: string
  items: IndexedItem<T>[]
}

let nextPaletteId = 0

/**
 * A palette to search, jump and act from the keyboard: opened with ⌘K on Apple systems and Ctrl+K elsewhere (or other
 * `shortcuts`), it lists groups of commands, filters them as one types, and runs the one chosen. The application
 * supplies the groups (navigation, actions, its own search results, which it can fetch on `queryChange`) and handles
 * `itemSelected`.
 */
@Component({
  selector: 'gbt-command-palette',
  standalone: true,
  imports: [Icon, Spinner],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette<T = unknown> {
  private readonly injector = inject(Injector)

  open = model(false)
  groups = input<readonly CommandGroup<T>[]>([])
  /** Global shortcuts that open (and close) the palette. Plain keys like `'/'` are ignored while someone types. */
  shortcuts = input<readonly string[]>(['mod+k'])
  /** Items kept per filtered group, so a short query doesn't list everything. */
  maxItemsPerGroup = input(8)
  placeholder = input('Search or jump to…')
  ariaLabel = input('Command palette')
  loading = input(false)
  loadingLabel = input('Searching…')
  emptyMessage = input('No results')
  navigateHint = input('Navigate')
  selectHint = input('Open')
  closeHint = input('Close')
  /** Names the close button phones get, having no Escape key. */
  closeLabel = input('Close')
  resultsAnnouncement = input<(count: number) => string>((count) =>
    count === 1 ? '1 result' : `${count} results`,
  )

  queryChange = output<string>()
  itemSelected = output<CommandItem<T>>()

  protected readonly id = `gbt-command-palette-${++nextPaletteId}`
  protected readonly listId = `${this.id}-list`
  protected readonly query = signal('')
  protected readonly activeIndex = signal(0)

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input')
  private readonly list = viewChild<ElementRef<HTMLElement>>('list')
  private previouslyFocused: HTMLElement | null = null

  protected readonly visibleGroups = computed<IndexedGroup<T>[]>(() => {
    const query = this.query().trim()
    const max = this.maxItemsPerGroup()
    let index = 0
    const groups: IndexedGroup<T>[] = []
    this.groups().forEach((group, groupIndex) => {
      let items = [...group.items]
      if (group.filter !== false && query) {
        items = items
          .map((item, order) => ({ item, order, score: matchCommand(item, query) }))
          .filter(
            (entry): entry is { item: CommandItem<T>; order: number; score: number } =>
              entry.score !== null,
          )
          .sort((a, b) => b.score - a.score || a.order - b.order)
          .slice(0, max)
          .map((entry) => entry.item)
      }
      if (items.length === 0) return
      groups.push({
        label: group.label,
        labelId: `${this.id}-group-${groupIndex}`,
        items: items.map((item) => ({ item, index: index++ })),
      })
    })
    return groups
  })

  private readonly visibleItems = computed(() =>
    this.visibleGroups().flatMap((group) => group.items.map((entry) => entry.item)),
  )

  protected readonly activeId = computed(() => {
    const count = this.visibleItems().length
    return count > 0 ? this.optionId(Math.min(this.activeIndex(), count - 1)) : null
  })

  protected readonly announcement = computed(() =>
    this.loading() ? this.loadingLabel() : this.resultsAnnouncement()(this.visibleItems().length),
  )

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.previouslyFocused = document.activeElement as HTMLElement | null
          this.setQuery('')
          afterNextRender(() => this.input()?.nativeElement.focus(), { injector: this.injector })
        })
      } else if (this.previouslyFocused) {
        const target = this.previouslyFocused
        this.previouslyFocused = null
        // A choice that navigates may have removed it; focus only what is still in the page.
        if (target.isConnected) target.focus()
      }
    })

    // The active option stays in view as the arrows move through a long list.
    afterRenderEffect(() => {
      const id = this.activeId()
      if (!id) return
      this.list()
        ?.nativeElement.querySelector(`#${CSS.escape(id)}`)
        ?.scrollIntoView?.({ block: 'nearest' })
    })
  }

  /** Opens the palette, e.g. from a button. */
  show(): void {
    this.open.set(true)
  }

  close(): void {
    this.open.set(false)
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    if (this.shortcuts().some((shortcut) => matchesShortcut(event, shortcut))) {
      // The same keys close it again, as in the palettes people know.
      event.preventDefault()
      this.open.update((open) => !open)
    }
  }

  protected optionId(index: number): string {
    return `${this.id}-option-${index}`
  }

  protected onInput(event: Event): void {
    this.setQuery((event.target as HTMLInputElement).value)
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.visibleItems().length
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        this.close()
        return
      case 'Tab':
        // Only the field takes the focus: the options are reached with the arrows.
        event.preventDefault()
        return
      case 'ArrowDown':
        event.preventDefault()
        if (count > 0) this.activeIndex.update((index) => (index + 1) % count)
        return
      case 'ArrowUp':
        event.preventDefault()
        if (count > 0) this.activeIndex.update((index) => (index - 1 + count) % count)
        return
      case 'Home':
      case 'End':
        if (count > 0 && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          this.activeIndex.set(event.key === 'Home' ? 0 : count - 1)
        }
        return
      case 'Enter': {
        const item = this.visibleItems()[Math.min(this.activeIndex(), count - 1)]
        if (!item) return
        event.preventDefault()
        this.select(item)
        return
      }
    }
  }

  protected activate(index: number): void {
    this.activeIndex.set(index)
  }

  protected select(item: CommandItem<T>): void {
    this.close()
    this.itemSelected.emit(item)
  }

  protected onBackdropMousedown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close()
  }

  private setQuery(query: string): void {
    this.query.set(query)
    this.activeIndex.set(0)
    this.queryChange.emit(query)
  }
}
