import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BarSeries } from './bar-series'
import { CHART_CONTEXT, ChartContext } from '../chart-context/chart-context'
import type { ChartSeries } from '../chart-data/chart-data'

@Component({
  standalone: true,
  imports: [BarSeries],
  providers: [ChartContext, { provide: CHART_CONTEXT, useExisting: ChartContext }],
  template: `
    <svg>
      <g gbtBarSeries [series]="series()"></g>
    </svg>
  `,
})
class HostComponent {
  series = signal<ChartSeries<string>>({
    label: 'Dépôts',
    points: [
      { x: 'maven', y: 12 },
      { x: 'npm', y: 30 },
      { x: 'docker', y: 7 },
    ],
  })
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
  ctx.setSpecs(
    { kind: 'band', domain: ['maven', 'npm', 'docker'], padding: 0.2 },
    { kind: 'linear', domain: [0, 30] },
  )
  fixture.detectChanges()
  return { fixture, ctx }
}

describe('BarSeries — bar accented on hover', () => {
  it('accents no bar while nothing is active', () => {
    const { fixture } = setup()
    expect(fixture.nativeElement.querySelector('.gbt-bar-series__bar[data-active]')).toBeNull()
  })

  it('accents the bar at the active index, and only that one', () => {
    const { fixture, ctx } = setup()
    ctx.setActiveIndex(1)
    fixture.detectChanges()
    const actives = fixture.nativeElement.querySelectorAll('.gbt-bar-series__bar[data-active]')
    expect(actives.length).toBe(1)
    const toutes = [...fixture.nativeElement.querySelectorAll('.gbt-bar-series__bar')]
    expect(toutes.indexOf(actives[0])).toBe(1)
  })
})
