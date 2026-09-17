import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Icon } from '../../atoms/icon/icon'
import { Select, SelectOption } from '../select/select'

export const ELLIPSIS = '…' as const
export type PaginationItem = number | typeof ELLIPSIS

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function paginationRange(page: number, pageCount: number, siblingCount: number): PaginationItem[] {
  const totalPageNumbers = siblingCount + 5

  if (totalPageNumbers >= pageCount) {
    return range(1, pageCount)
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1)
  const rightSiblingIndex = Math.min(page + siblingCount, pageCount)

  const shouldShowLeftDots = leftSiblingIndex > 2
  // -2, not -1: a lone skipped page right before the last one isn't worth an
  // ellipsis — showing that page costs no more room than the "…" would.
  const shouldShowRightDots = rightSiblingIndex < pageCount - 2

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + siblingCount * 2
    return [...range(1, leftItemCount), ELLIPSIS, pageCount]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + siblingCount * 2
    return [1, ELLIPSIS, ...range(pageCount - rightItemCount + 1, pageCount)]
  }

  return [1, ELLIPSIS, ...range(leftSiblingIndex, rightSiblingIndex), ELLIPSIS, pageCount]
}

@Component({
  selector: 'gbt-pagination',
  standalone: true,
  imports: [Icon, Select, ReactiveFormsModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  page = input<number>(1)
  pageSize = input<number>(10)
  totalItems = input.required<number>()
  siblingCount = input<number>(1)
  disabled = input(false, { transform: booleanAttribute })
  ariaLabel = input<string>('Pagination')
  previousLabel = input<string>('Previous page')
  nextLabel = input<string>('Next page')
  pageLabel = input<(page: number) => string>((page) => `Page ${page}`)

  pageSizeOptions = input<number[]>([])
  pageSizeLabel = input<(size: number) => string>((size) => `${size} / page`)
  pageSizeSelectLabel = input<string>('Rows per page')
  showItemsSummary = input(false, { transform: booleanAttribute })
  itemsSummaryLabel = input<(shown: number, total: number) => string>(
    (shown, total) => `${shown} of ${total} items`,
  )

  pageChange = output<number>()
  pageSizeChange = output<number>()

  protected readonly ELLIPSIS = ELLIPSIS

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  )

  protected readonly items = computed(() =>
    paginationRange(this.page(), this.pageCount(), this.siblingCount()),
  )

  protected readonly itemsShown = computed(() => {
    const start = (this.page() - 1) * this.pageSize()
    return Math.max(0, Math.min(this.pageSize(), this.totalItems() - start))
  })

  protected readonly itemsSummary = computed(() =>
    this.itemsSummaryLabel()(this.itemsShown(), this.totalItems()),
  )

  protected readonly pageSizeSelectOptions = computed<SelectOption<number>[]>(() =>
    this.pageSizeOptions().map((size) => ({ value: size, label: this.pageSizeLabel()(size) })),
  )

  protected readonly pageSizeControl = new FormControl<number>(this.pageSize(), {
    nonNullable: true,
  })

  constructor() {
    effect(() => {
      const size = this.pageSize()
      if (this.pageSizeControl.value !== size) {
        this.pageSizeControl.setValue(size, { emitEvent: false })
      }
    })

    this.pageSizeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((size) => {
      this.pageSizeChange.emit(size)
      this.pageChange.emit(1)
    })

    // Self-heals a stale `page` — e.g. a filter shrinks `totalItems` while
    // the app was sitting on a now out-of-range page — instead of leaving
    // the pager stuck with no page marked current and a live "previous"
    // button pointing at a page that no longer exists.
    effect(() => {
      const count = this.pageCount()
      const current = this.page()
      const clamped = Math.min(Math.max(current, 1), count)
      if (clamped !== current) {
        this.pageChange.emit(clamped)
      }
    })
  }

  protected goTo(page: number): void {
    if (this.disabled()) return
    const clamped = Math.min(Math.max(page, 1), this.pageCount())
    if (clamped === this.page()) return
    this.pageChange.emit(clamped)
  }
}
