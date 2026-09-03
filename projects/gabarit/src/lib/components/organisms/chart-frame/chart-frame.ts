import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import {
  CHART_CONTEXT,
  ChartContext,
  type AxisSpec,
  type ChartMargin,
  type LinearAxisSpec,
  type PointValue,
} from '../chart-context/chart-context'
import { nearestIndex } from '../../../primitives'

const DEFAULT_MARGIN: ChartMargin = { top: 16, right: 8, bottom: 32, left: 48 }

@Component({
  selector: 'gbt-chart-frame',
  standalone: true,
  imports: [],
  templateUrl: './chart-frame.html',
  styleUrl: './chart-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ChartContext, { provide: CHART_CONTEXT, useExisting: ChartContext }],
})
export class ChartFrame {
  private readonly context = inject(ChartContext)

  label = input.required<string>()
  heading = input('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)
  headline = input('')
  trend = input('')
  x = input.required<AxisSpec>()
  y = input.required<LinearAxisSpec>()
  margin = input<Partial<ChartMargin>>({})
  size = input<{ width: number; height: number } | null>(null)
  pointValues = input<PointValue[]>([])

  readonly activeIndexChange = output<number | null>()

  private readonly surface = viewChild.required<ElementRef<HTMLElement>>('surface')
  private readonly measured = signal<{ width: number; height: number } | null>(null)

  protected readonly ready = computed(() => this.context.box().innerWidth > 0)

  protected readonly viewBox = computed(() => {
    const b = this.context.box()
    return `0 0 ${b.width} ${b.height}`
  })

  protected readonly innerTransform = computed(() => {
    const m = this.context.box().margin
    return `translate(${m.left},${m.top})`
  })

  protected readonly activePosition = computed(() => this.context.activePosition())
  protected readonly innerHeight = computed(() => this.context.box().innerHeight)

  constructor() {
    effect(() => this.activeIndexChange.emit(this.context.activeIndex()))

    effect(() => {
      const margin = { ...DEFAULT_MARGIN, ...this.margin() }
      const size = this.size() ?? this.measured()
      const width = size?.width ?? 0
      const height = size?.height ?? 0
      this.context.setSpecs(this.x(), this.y())
      this.context.setPointValues(this.pointValues())
      this.context.setGeometry({
        width,
        height,
        margin,
        innerWidth: Math.max(0, width - margin.left - margin.right),
        innerHeight: Math.max(0, height - margin.top - margin.bottom),
      })
    })

    effect((onCleanup) => {
      if (this.size() || typeof ResizeObserver === 'undefined') return

      const element = this.surface().nativeElement
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect
        if (rect) this.measured.set({ width: rect.width, height: rect.height })
      })
      observer.observe(element)
      onCleanup(() => observer.disconnect())
    })
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.pointValues().length
    if (count === 0) return

    const current = this.context.activeIndex()
    const last = count - 1

    switch (event.key) {
      case 'ArrowRight':
        this.context.setActiveIndex(current === null ? 0 : Math.min(last, current + 1))
        break
      case 'ArrowLeft':
        this.context.setActiveIndex(current === null ? last : Math.max(0, current - 1))
        break
      case 'Home':
        this.context.setActiveIndex(0)
        break
      case 'End':
        this.context.setActiveIndex(last)
        break
      case 'Escape':
        this.context.setActiveIndex(null)
        break
      default:
        return
    }

    event.preventDefault()
  }

  protected onBlur(): void {
    this.context.setActiveIndex(null)
  }

  protected onPointerMove(event: PointerEvent | MouseEvent): void {
    const positions = this.context.pointPositions()
    if (positions.length === 0) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const local = event.clientX - rect.left - this.context.box().margin.left

    this.context.setActiveIndex(nearestIndex(positions, local))
  }

  protected onPointerLeave(event: PointerEvent | MouseEvent): void {
    const surface = event.currentTarget as HTMLElement
    if (surface.ownerDocument.activeElement === surface) return
    this.context.setActiveIndex(null)
  }
}
