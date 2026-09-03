import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { LineSeries } from './line-series'
import { CHART_CONTEXT, ChartContext } from '../chart-context/chart-context'
import type { ChartSeries } from '../chart-data/chart-data'

@Component({
  standalone: true,
  imports: [LineSeries],
  providers: [ChartContext, { provide: CHART_CONTEXT, useExisting: ChartContext }],
  template: `
    <svg>
      <g gbtLineSeries [series]="series()"></g>
    </svg>
  `,
})
class HostComponent {
  series = signal<ChartSeries<number>[]>([
    {
      label: 'Requêtes',
      points: [
        { x: 0, y: 10 },
        { x: 1, y: 30 },
        { x: 2, y: 20 },
      ],
    },
  ])
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  const ctx = fixture.debugElement.injector.get(ChartContext)
  ctx.setGeometry({
    width: 600,
    height: 300,
    margin: { top: 8, right: 8, bottom: 32, left: 48 },
    innerWidth: 544,
    innerHeight: 252,
  })
  ctx.setSpecs({ kind: 'linear', domain: [0, 2] }, { kind: 'linear', domain: [0, 30] })
  fixture.detectChanges()
  return { fixture, ctx }
}

describe('LineSeries — dots at the active point', () => {
  it('places no dot while nothing is active', () => {
    const { fixture } = setup()
    expect(fixture.nativeElement.querySelectorAll('.gbt-line-series__dot').length).toBe(0)
  })

  it('places one dot per series present at the active x-value', () => {
    const { fixture, ctx } = setup()
    ctx.setPointValues([0, 1, 2])

    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 30 },
        ],
      },
      { label: 'B', points: [{ x: 1, y: 99 }] },
    ])
    ctx.setActiveIndex(1)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-line-series__dot').length).toBe(2)
  })

  it('places none for a series absent from the active x-value', () => {
    const { fixture, ctx } = setup()
    ctx.setPointValues([0, 1, 2])
    fixture.componentInstance.series.set([
      {
        label: 'A',
        points: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 30 },
        ],
      },
      { label: 'B', points: [{ x: 1, y: 99 }] },
    ])
    ctx.setActiveIndex(2)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.gbt-line-series__dot').length).toBe(1)
  })
})
