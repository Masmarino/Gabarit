import { Component, input } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ChartAxis } from './chart-axis'
import { ChartFrame } from '../chart-frame/chart-frame'
import type { AxisSpec } from '../chart-context/chart-context'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ChartFrame, ChartAxis],
  template: `
    <gbt-chart-frame
      label="Test"
      [x]="x()"
      [y]="{ kind: 'linear', domain: [0, 100] }"
      [size]="size()"
    >
      <svg:g gbtChartLayer>
        <svg:g gbtChartAxis axis="x" locale="fr-FR" [grid]="grid()"></svg:g>
        <svg:g gbtChartAxis axis="y" locale="fr-FR" [grid]="grid()"></svg:g>
      </svg:g>
    </gbt-chart-frame>
  `,
})
class HostComponent {
  x = input.required<AxisSpec>()

  size = input<{ width: number; height: number }>({ width: 900, height: 300 })

  grid = input(false)
}

function render(x: AxisSpec, size?: { width: number; height: number }, grid?: boolean) {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.componentRef.setInput('x', x)
  if (size) fixture.componentRef.setInput('size', size)
  if (grid) fixture.componentRef.setInput('grid', grid)
  fixture.detectChanges()
  return fixture
}

function labels(fixture: ReturnType<typeof render>, axis: 'x' | 'y'): string[] {
  const host = fixture.nativeElement.querySelector(`g[axis="${axis}"]`)
  return [...host.querySelectorAll('text')].map((t: SVGTextElement) => t.textContent?.trim() ?? '')
}

describe('ChartAxis', () => {
  it('ticks a linear domain with round values', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })

    expect(labels(fixture, 'x')).toEqual(['0', '20', '40', '60', '80', '100'])
  })

  it('ticks a category domain, one tick per category', () => {
    const fixture = render({ kind: 'band', domain: ['lun', 'mar', 'mer'] })
    expect(labels(fixture, 'x')).toEqual(['lun', 'mar', 'mer'])
  })

  it("thins out categories when they don't fit", () => {
    const fixture = render(
      { kind: 'band', domain: ['maven', 'npm', 'docker', 'pypi', 'nuget', 'gems', 'cargo'] },
      { width: 320, height: 300 },
    )
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const etiquettes = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      t.textContent?.trim(),
    )
    expect(etiquettes).toEqual(['maven', 'docker', 'nuget', 'cargo'])
  })

  it("shows them all when there's room", () => {
    const fixture = render(
      { kind: 'band', domain: ['maven', 'npm', 'docker', 'pypi', 'nuget', 'gems', 'cargo'] },
      { width: 900, height: 300 },
    )
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    expect(host.querySelectorAll('text').length).toBe(7)
  })

  it("doesn't thin out three short categories", () => {
    const fixture = render(
      { kind: 'band', domain: ['lun', 'mar', 'mer'] },
      { width: 320, height: 300 },
    )
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    expect(host.querySelectorAll('text').length).toBe(3)
  })

  it('thins out three categories with long labels', () => {
    const fixture = render(
      { kind: 'band', domain: ['authentification', 'autorisation', 'journalisation'] },
      { width: 320, height: 300 },
    )
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const etiquettes = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      t.textContent?.trim(),
    )
    expect(etiquettes).toEqual(['authentification', 'journalisation'])
  })

  it('always keeps the first category', () => {
    const fixture = render(
      { kind: 'band', domain: ['maven', 'npm', 'docker', 'pypi', 'nuget', 'gems', 'cargo'] },
      { width: 320, height: 300 },
    )
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    expect(host.querySelector('text')?.textContent?.trim()).toBe('maven')
  })

  it("estimates the formatted label's width, not the raw category's", () => {
    @Component({
      standalone: true,
      imports: [ChartFrame, ChartAxis],
      template: `
        <gbt-chart-frame
          label="Test"
          [x]="{ kind: 'band', domain: ['npm', 'pip', 'gem'] }"
          [y]="{ kind: 'linear', domain: [0, 100] }"
          [size]="{ width: 320, height: 300 }"
        >
          <svg:g gbtChartLayer>
            <svg:g gbtChartAxis axis="x" locale="fr-FR" [format]="format"></svg:g>
          </svg:g>
        </gbt-chart-frame>
      `,
    })
    class FormatHost {
      format = (category: string) => `${category} package registry`
    }

    const fixture = TestBed.createComponent(FormatHost)
    fixture.detectChanges()
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const etiquettes = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      t.textContent?.trim(),
    )
    expect(etiquettes).toEqual(['npm package registry', 'gem package registry'])
  })

  it('ticks a time domain', () => {
    const fixture = render({
      kind: 'time',
      domain: [new Date('2026-01-01T00:00:00Z'), new Date('2026-02-01T00:00:00Z')],
    })
    expect(labels(fixture, 'x').length).toBeGreaterThan(1)
    expect(labels(fixture, 'x').every((l) => /\d{2}\/\d{2}/.test(l))).toBe(true)
  })

  it('carries the date on the first tick of each day', () => {
    const fixture = render({
      kind: 'time',
      domain: [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-04T00:00:00Z')],
    })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const dated = [...host.querySelectorAll('text')].filter(
      (t: SVGTextElement) => t.querySelectorAll('tspan').length === 2,
    )
    const minuits = [...host.querySelectorAll('text')].filter((t: SVGTextElement) =>
      (t.textContent ?? '').includes('00:00'),
    )

    expect(dated.length).toBe(minuits.length)
    expect(dated.length).toBeGreaterThan(0)
  })

  it("doesn't date ticks that aren't day boundaries", () => {
    const fixture = render({
      kind: 'time',
      domain: [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-04T00:00:00Z')],
    })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const nonMinuit = [...host.querySelectorAll('text')].filter(
      (t: SVGTextElement) => !(t.textContent ?? '').includes('00:00'),
    )
    for (const t of nonMinuit) {
      expect(t.querySelectorAll('tspan').length).toBeLessThan(2)
    }
  })

  it('dates nothing when the ticks fit within a single day', () => {
    const fixture = render({
      kind: 'time',
      domain: [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-01T12:00:00Z')],
    })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    for (const t of host.querySelectorAll('text')) {
      expect((t as SVGTextElement).querySelectorAll('tspan').length).toBeLessThan(2)
    }
  })

  it('abbreviates large numbers on the y-axis', () => {
    @Component({
      standalone: true,
      imports: [ChartFrame, ChartAxis],
      template: `
        <gbt-chart-frame
          label="Test"
          [x]="{ kind: 'linear', domain: [0, 1] }"
          [y]="{ kind: 'linear', domain: [0, 40000] }"
          [size]="{ width: 900, height: 300 }"
        >
          <svg:g gbtChartLayer>
            <svg:g gbtChartAxis axis="y" locale="fr-FR"></svg:g>
          </svg:g>
        </gbt-chart-frame>
      `,
    })
    class GrandsNombresHost {}

    const fixture = TestBed.createComponent(GrandsNombresHost)
    fixture.detectChanges()
    const host = fixture.nativeElement.querySelector('g[axis="y"]')
    const etiquettes = [...host.querySelectorAll('text')].map(
      (t: SVGTextElement) => t.textContent?.trim() ?? '',
    )

    expect(etiquettes.some((l) => /k/i.test(l))).toBe(true)
    expect(etiquettes.every((l) => l.length <= 6)).toBe(true)
  })

  it('has no violation detected by axe', async () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('is hosted by a <g>, an element the SVG namespace knows about', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    expect(host).not.toBeNull()
    expect(host.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(host.localName).toBe('g')
  })

  it("anchors the x-axis's outermost labels inward, toward the frame", () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const textes = [...host.querySelectorAll('text')]

    const ancres = textes.map((t: SVGTextElement) => t.getAttribute('text-anchor'))
    expect(ancres[0]).toBe('start')
    expect(ancres[ancres.length - 1]).toBe('end')
    for (const ancre of ancres.slice(1, -1)) {
      expect(ancre).toBe('middle')
    }
  })

  it('places every label of an already-ticked domain within the frame', () => {
    const fixture = render({ kind: 'linear', domain: [0, 100] })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const textes = [...host.querySelectorAll('text')]
    const largeurUtile = 900 - 48 - 8
    expect(textes.length).toBeGreaterThan(1)
    for (const t of textes) {
      const x = Number(t.getAttribute('x'))
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(largeurUtile)
    }
  })

  it('keeps every y-axis label right-aligned', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })
    const host = fixture.nativeElement.querySelector('g[axis="y"]')
    const ancres = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      t.getAttribute('text-anchor'),
    )
    expect(new Set(ancres)).toEqual(new Set(['end']))
  })

  it('keeps category labels centered on their band', () => {
    const fixture = render({ kind: 'band', domain: ['lun', 'mar', 'mer'] })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const ancres = [...host.querySelectorAll('text')].map((t: SVGTextElement) =>
      t.getAttribute('text-anchor'),
    )
    expect(new Set(ancres)).toEqual(new Set(['middle']))
  })

  it('shifts a dated tick up so its second line fits in the margin', () => {
    const fixture = render({
      kind: 'time',
      domain: [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-04T00:00:00Z')],
    })
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    const textes = [...host.querySelectorAll('text')]
    const datees = textes.filter((t: SVGTextElement) => t.querySelectorAll('tspan').length === 2)
    const simples = textes.filter((t: SVGTextElement) => t.querySelectorAll('tspan').length < 2)
    expect(datees.length).toBeGreaterThan(0)
    for (const t of datees) expect(Number(t.getAttribute('y'))).toBe(14)
    for (const t of simples) expect(Number(t.getAttribute('y'))).toBe(20)
  })

  it('draws no grid line by default', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] })
    expect(fixture.nativeElement.querySelectorAll('.gbt-chart-axis__grid').length).toBe(0)
  })

  it('draws one grid line per tick when requested', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] }, undefined, true)
    const lignes = [...fixture.nativeElement.querySelectorAll('.gbt-chart-axis__grid')]
    const host = fixture.nativeElement.querySelector('g[axis="y"]')
    const etiquettes = [...host.querySelectorAll('.gbt-chart-axis__label')]
    expect(lignes.length).toBe(etiquettes.length)

    expect(lignes.every((l: SVGLineElement) => l.getAttribute('x1') === '0')).toBe(true)
  })

  it('draws no grid line on the x-axis', () => {
    const fixture = render({ kind: 'linear', domain: [0, 97] }, undefined, true)
    const host = fixture.nativeElement.querySelector('g[axis="x"]')
    expect(host.querySelectorAll('.gbt-chart-axis__grid').length).toBe(0)
  })
})
