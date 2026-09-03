import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'
import { ChartEmpty } from '../../organisms/chart-empty/chart-empty'
import { ChartTable } from '../../organisms/chart-table/chart-table'
import { formatNumber, linePath, linearScale, nearestIndex } from '../../../primitives'

const MARGIN = 4

@Component({
  selector: 'gbt-sparkline',
  standalone: true,
  imports: [ChartEmpty, ChartTable],
  templateUrl: './sparkline.html',
  styleUrl: './sparkline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sparkline {
  values = input.required<number[]>()
  tableCaption = input.required<string>()
  xColumn = input.required<string>()
  yColumn = input.required<string>()
  locale = input.required<string>()
  emptyMessage = input.required<string>()
  width = input(80)
  height = input(24)

  protected readonly activeIndex = signal<number | null>(null)

  protected readonly viewBox = computed(() => `0 0 ${this.width()} ${this.height()}`)

  protected readonly columns = computed(() => [this.xColumn(), this.yColumn()])

  protected readonly tableRows = computed<(string | number)[][]>(() =>
    this.values().map((value, index) => [
      formatNumber(index + 1, this.locale()),
      formatNumber(value, this.locale()),
    ]),
  )

  private readonly scales = computed(() => {
    const values = this.values()
    const min = Math.min(...values)
    const max = Math.max(...values)
    return {
      x: linearScale([0, Math.max(values.length - 1, 0)], [MARGIN, this.width() - MARGIN]),
      y: linearScale([min, max], [this.height() - MARGIN, MARGIN]),
    }
  })

  protected readonly path = computed(() => {
    const values = this.values()
    if (values.length === 0) return null
    const { x, y } = this.scales()
    return linePath(values.map((value, index) => ({ x: x.map(index), y: y.map(value) })))
  })

  protected readonly positions = computed<number[]>(() => {
    const { x } = this.scales()
    return this.values().map((_, index) => x.map(index))
  })

  protected readonly dot = computed<{ x: number; y: number } | null>(() => {
    const index = this.activeIndex()
    if (index === null) return null
    const value = this.values()[index]
    if (value === undefined) return null
    const { x, y } = this.scales()
    return { x: x.map(index), y: y.map(value) }
  })

  protected readonly tooltip = computed<string | null>(() => {
    const index = this.activeIndex()
    if (index === null) return null
    const value = this.values()[index]
    if (value === undefined) return null
    return `${this.xColumn()} ${formatNumber(index + 1, this.locale())} — ${this.yColumn()} ${formatNumber(value, this.locale())}`
  })

  protected onPointerMove(event: PointerEvent | MouseEvent): void {
    const positions = this.positions()
    if (positions.length === 0) return
    const rect = (event.currentTarget as Element).getBoundingClientRect()
    this.activeIndex.set(nearestIndex(positions, event.clientX - rect.left))
  }

  protected onPointerLeave(event: PointerEvent | MouseEvent): void {
    const target = event.currentTarget as Element
    if (target.ownerDocument.activeElement === target) return
    this.activeIndex.set(null)
  }

  protected onBlur(): void {
    this.activeIndex.set(null)
  }

  protected onKeydown(event: KeyboardEvent): void {
    const lastIndex = this.values().length - 1
    if (lastIndex < 0) return
    const current = this.activeIndex()
    switch (event.key) {
      case 'ArrowRight':
        this.activeIndex.set(current === null ? 0 : Math.min(lastIndex, current + 1))
        break
      case 'ArrowLeft':
        this.activeIndex.set(current === null ? lastIndex : Math.max(0, current - 1))
        break
      case 'Home':
        this.activeIndex.set(0)
        break
      case 'End':
        this.activeIndex.set(lastIndex)
        break
      case 'Escape':
        this.activeIndex.set(null)
        break
      default:
        return
    }
    event.preventDefault()
  }
}
