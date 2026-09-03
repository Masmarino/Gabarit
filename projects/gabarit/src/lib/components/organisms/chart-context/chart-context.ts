import { Injectable, InjectionToken, computed, signal, type Signal } from '@angular/core'
import { bandScale, linearScale, timeScale, type BandScale, type Scale } from '../../../primitives'

export interface ChartMargin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ChartBox {
  readonly width: number
  readonly height: number
  readonly margin: ChartMargin
  readonly innerWidth: number
  readonly innerHeight: number
}

export type LinearAxisSpec = { kind: 'linear'; domain: [number, number] }

export type PointValue = number | Date | string

export type AxisSpec =
  | LinearAxisSpec
  | { kind: 'time'; domain: [Date, Date] }
  | { kind: 'band'; domain: string[]; padding?: number }

const EMPTY_BOX: ChartBox = {
  width: 0,
  height: 0,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  innerWidth: 0,
  innerHeight: 0,
}

export interface ChartReader {
  readonly box: Signal<ChartBox>
  readonly xSpec: Signal<AxisSpec>
  readonly ySpec: Signal<LinearAxisSpec>
  readonly xScale: Signal<Scale<number> | Scale<Date> | BandScale>
  readonly yScale: Signal<Scale<number>>
  readonly activeIndex: Signal<number | null>
  readonly pointValues: Signal<PointValue[]>
  readonly activePosition: Signal<number | null>
}

export const CHART_CONTEXT = new InjectionToken<ChartReader>('gbt-chart-context')

@Injectable()
export class ChartContext implements ChartReader {
  private readonly _box = signal<ChartBox>(EMPTY_BOX)
  private readonly _xSpec = signal<AxisSpec>({ kind: 'linear', domain: [0, 1] })
  private readonly _ySpec = signal<LinearAxisSpec>({ kind: 'linear', domain: [0, 1] })
  private readonly _activeIndex = signal<number | null>(null)
  private readonly _pointValues = signal<PointValue[]>([])

  readonly box = this._box.asReadonly()
  readonly xSpec = this._xSpec.asReadonly()
  readonly ySpec = this._ySpec.asReadonly()
  readonly activeIndex = this._activeIndex.asReadonly()
  readonly pointValues = this._pointValues.asReadonly()

  readonly xScale = computed<Scale<number> | Scale<Date> | BandScale>(() => {
    const spec = this._xSpec()
    const range: [number, number] = [0, this._box().innerWidth]
    if (spec.kind === 'time') return timeScale(spec.domain, range)
    if (spec.kind === 'band') return bandScale(spec.domain, range, spec.padding ?? 0)
    return linearScale(spec.domain, range)
  })

  readonly yScale = computed<Scale<number>>(() =>
    linearScale(this._ySpec().domain, [this._box().innerHeight, 0]),
  )

  readonly pointPositions = computed<number[]>(() => {
    const kind = this._xSpec().kind
    const scale = this.xScale()
    return this._pointValues().map((value) =>
      kind === 'band'
        ? (scale as BandScale).map(value as string) + (scale as BandScale).bandwidth / 2
        : (scale as Scale<number> | Scale<Date>).map(value as never),
    )
  })

  readonly activePosition = computed<number | null>(() => {
    const index = this._activeIndex()
    if (index === null) return null
    return this.pointPositions()[index] ?? null
  })

  setPointValues(values: PointValue[]): void {
    this._pointValues.set(values)
  }

  setGeometry(box: ChartBox): void {
    this._box.set(box)
  }

  setSpecs(x: AxisSpec, y: LinearAxisSpec): void {
    this._xSpec.set(x)
    this._ySpec.set(y)
  }

  setActiveIndex(index: number | null): void {
    this._activeIndex.set(index)
  }
}
