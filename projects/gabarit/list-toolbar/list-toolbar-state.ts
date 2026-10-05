import { computed, signal, type Signal, type WritableSignal } from '@angular/core'
import { cachedIntl } from '@masmarino/gabarit/format'
import type { ListToolbarSortOption } from './list-toolbar'

export type ListToolbarDirection = 'asc' | 'desc'

export type ListToolbarSortValue = string | number | boolean | Date | null | undefined

export interface ListToolbarStateConfig<K extends string> {
  sortOptions?: ListToolbarSortOption<K>[]
  defaultSort?: K
  defaultDirection?: ListToolbarDirection
  initialSearch?: string
}

export interface ListToolbarAccessors<T, K extends string> {
  text?: (item: T) => string | readonly (string | null | undefined)[] | null | undefined
  matches?: (item: T, query: string) => boolean
  sortBy?: Partial<Record<K, (item: T) => ListToolbarSortValue>>
  compare?: (a: T, b: T, key: K) => number
  locale?: string
}

export interface ListToolbarState<K extends string = string> {
  readonly search: WritableSignal<string>
  readonly sortValue: WritableSignal<K>
  readonly direction: WritableSignal<ListToolbarDirection>
  readonly sortOptions: ListToolbarSortOption<K>[]
  readonly dirty: Signal<boolean>
  reset(): void
  apply<T>(items: readonly T[], accessors: ListToolbarAccessors<T, K>): T[]
  filtered<T>(source: () => readonly T[], accessors: ListToolbarAccessors<T, K>): Signal<T[]>
}

function normalise(value: ListToolbarSortValue): string | number | null {
  if (value === null || value === undefined) return null
  const primitive =
    value instanceof Date ? value.getTime() : typeof value === 'boolean' ? +value : value
  if (typeof primitive === 'number') return Number.isFinite(primitive) ? primitive : null
  return primitive
}

export function createListToolbarState<K extends string = string>(
  config: ListToolbarStateConfig<K> = {},
): ListToolbarState<K> {
  const sortOptions = config.sortOptions ?? []
  const defaultSort = config.defaultSort ?? sortOptions[0]?.value ?? ('' as K)
  const defaultDirection = config.defaultDirection ?? 'asc'
  const initialSearch = config.initialSearch ?? ''

  const search = signal(initialSearch)
  const sortValue = signal<K>(defaultSort)
  const direction = signal<ListToolbarDirection>(defaultDirection)
  const dirty = computed(
    () =>
      search() !== initialSearch || sortValue() !== defaultSort || direction() !== defaultDirection,
  )

  const apply = <T>(items: readonly T[], accessors: ListToolbarAccessors<T, K>): T[] => {
    const query = search().trim().toLowerCase()
    const matches =
      accessors.matches ??
      ((item: T, q: string) => {
        const text = accessors.text?.(item)
        const texts = Array.isArray(text) ? text : [text]
        return texts.some((entry) => typeof entry === 'string' && entry.toLowerCase().includes(q))
      })
    const filtered = query ? items.filter((item) => matches(item, query)) : [...items]

    const key = sortValue()
    const sign = direction() === 'asc' ? 1 : -1

    if (accessors.compare) {
      const compare = accessors.compare
      const sorted = filtered.sort((a, b) => compare(a, b, key))
      return sign === 1 ? sorted : sorted.reverse()
    }

    const read = accessors.sortBy?.[key]
    if (!read) return filtered
    let collator: Intl.Collator | undefined
    const text = (left: string, right: string) => {
      collator ??= cachedIntl(
        'collator',
        accessors.locale ?? '',
        undefined,
        () => new Intl.Collator(accessors.locale, { numeric: true, sensitivity: 'accent' }),
      )
      return collator.compare(left, right)
    }
    return filtered.sort((a, b) => {
      const left = normalise(read(a))
      const right = normalise(read(b))
      if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1
      if (typeof left === 'number' && typeof right === 'number') {
        return sign * (left < right ? -1 : left > right ? 1 : 0)
      }
      return sign * text(String(left), String(right))
    })
  }

  return {
    search,
    sortValue,
    direction,
    sortOptions,
    dirty,
    reset: () => {
      search.set(initialSearch)
      sortValue.set(defaultSort)
      direction.set(defaultDirection)
    },
    apply,
    filtered: (source, accessors) => computed(() => apply(source(), accessors)),
  }
}
