import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { StatGrid } from '../stat-grid/stat-grid'
import { StatTile } from './stat-tile'
import { StatTileLink } from './stat-tile-link'

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(StatTile)
  fixture.componentRef.setInput('label', 'Open issues')
  fixture.componentRef.setInput('value', 12)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  const q = (selector: string) => root.querySelector(selector) as HTMLElement | null
  return { fixture, root, q, label: () => q('.gbt-stat-tile__label')?.textContent?.trim() }
}

describe('StatTile', () => {
  it('shows the label and the figure, the label first in the DOM', () => {
    const { q, label } = setup()

    expect(label()).toBe('Open issues')
    expect(q('.gbt-stat-tile__value')?.textContent).toBe('12')
    const order = Array.from(q('.gbt-stat-tile')!.children).map((c) => c.className)
    expect(order.indexOf('gbt-stat-tile__label')).toBeLessThan(
      order.indexOf('gbt-stat-tile__value'),
    )
  })

  it('shows a string figure as is', () => {
    expect(setup({ value: '3.4 GB' }).q('.gbt-stat-tile__value')?.textContent).toBe('3.4 GB')
  })

  it('has no icon, hint, trend or link by default, and is not a list item outside a grid', () => {
    const { root, q } = setup()

    expect(q('gbt-icon-marker')).toBeNull()
    expect(q('.gbt-stat-tile__meta')).toBeNull()
    expect(q('a')).toBeNull()
    expect(root.hasAttribute('role')).toBe(false)
    expect(root.hasAttribute('data-link')).toBe(false)
    expect(root.hasAttribute('data-muted')).toBe(false)
  })

  it('draws the icon on a tile-shaped, decorative marker, tinted info by default', () => {
    const { q } = setup({ icon: 'folder' })

    const marker = q('.gbt-icon-marker') as HTMLElement
    expect(marker.getAttribute('data-shape')).toBe('tile')
    expect(marker.getAttribute('data-tone')).toBe('info')
    expect(marker.getAttribute('aria-hidden')).toBe('true')
  })

  it('takes the icon tone, and steps back to neutral when muted', () => {
    const tone = setup({ icon: 'folder', iconTone: 'success' })
    expect(tone.q('.gbt-icon-marker')?.getAttribute('data-tone')).toBe('success')

    const muted = setup({ icon: 'folder', iconTone: 'success', muted: true })
    expect(muted.q('.gbt-icon-marker')?.getAttribute('data-tone')).toBe('neutral')
    expect(muted.root.hasAttribute('data-muted')).toBe(true)
  })

  it('shows a hint under the label', () => {
    expect(setup({ hint: 'last 30 days' }).q('.gbt-stat-tile__hint')?.textContent).toBe(
      'last 30 days',
    )
  })

  it('shows a trend as text, with an arrow when it goes up or down, none when flat', () => {
    const up = setup({ trend: 'up', trendLabel: '+12 %', trendTone: 'success' })
    const trend = up.q('.gbt-stat-tile__trend') as HTMLElement
    expect(trend.textContent?.trim()).toBe('+12 %')
    expect(trend.getAttribute('data-tone')).toBe('success')
    expect(trend.getAttribute('data-trend')).toBe('up')
    expect(trend.querySelector('gbt-icon')).not.toBeNull()

    const down = setup({ trend: 'down', trendLabel: '-3', trendTone: 'error' })
    expect(down.q('.gbt-stat-tile__trend gbt-icon')).not.toBeNull()

    const flat = setup({ trend: 'flat', trendLabel: 'stable' })
    expect(flat.q('.gbt-stat-tile__trend gbt-icon')).toBeNull()
  })

  it('shows no trend without a trendLabel (an arrow alone says nothing)', () => {
    expect(setup({ trend: 'up' }).q('.gbt-stat-tile__trend')).toBeNull()
  })

  it('makes the label a link over the whole tile with href', () => {
    const { root, q } = setup({ href: '/issues' })

    const link = q('a') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/issues')
    expect(link.textContent?.trim()).toBe('Open issues')
    expect(link.classList.contains('gbt-stat-tile__link')).toBe(true)
    expect(root.hasAttribute('data-link')).toBe(true)
  })

  it('has no accessibility violations (plain, iconed, trend, link, muted)', async () => {
    await expectNoA11yViolations(setup().root)
    await expectNoA11yViolations(
      setup({ icon: 'folder', hint: 'last 30 days', trend: 'up', trendLabel: '+4', muted: true })
        .root,
    )
    await expectNoA11yViolations(setup({ href: '/issues' }).root)
  })
})

@Component({
  standalone: true,
  imports: [StatGrid, StatTile, StatTileLink],
  template: `
    <gbt-stat-grid ariaLabel="Overview">
      <gbt-stat-tile label="Runners" [value]="3" icon="folder" />
      <gbt-stat-tile [value]="n()"><a gbtStatTileLink href="/issues">Open issues</a></gbt-stat-tile>
    </gbt-stat-grid>
  `,
})
class InGridHost {
  n = signal(12)
}

describe('StatTile in a grid', () => {
  it('becomes a list item, and a projected link replaces the label', () => {
    const fixture = TestBed.createComponent(InGridHost)
    fixture.detectChanges()
    const tiles = Array.from(
      fixture.nativeElement.querySelectorAll('gbt-stat-tile'),
    ) as HTMLElement[]

    expect(tiles.map((t) => t.getAttribute('role'))).toEqual(['listitem', 'listitem'])
    expect(tiles[1].getAttribute('data-link')).toBe('')
    const link = tiles[1].querySelector('a') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/issues')
    expect(tiles[1].querySelector('.gbt-stat-tile__label')?.textContent?.trim()).toBe('Open issues')
    expect(tiles[0].querySelector('a')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(InGridHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [StatGrid, StatTile], // StatTileLink is deliberately NOT imported
  template: `
    <gbt-stat-grid>
      <gbt-stat-tile [value]="12"><a gbtStatTileLink href="/issues">Open issues</a></gbt-stat-tile>
    </gbt-stat-grid>
  `,
})
class NoImportHost {}

describe('StatTile with a projected link whose directive was not imported', () => {
  it('still renders the anchor and its text (unstyled, but never dropped)', () => {
    const fixture = TestBed.createComponent(NoImportHost)
    fixture.detectChanges()
    const link = fixture.nativeElement.querySelector('gbt-stat-tile a') as HTMLAnchorElement

    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe('/issues')
    expect(link.textContent?.trim()).toBe('Open issues')
    expect(fixture.nativeElement.querySelector('.gbt-stat-tile__label')?.textContent?.trim()).toBe(
      'Open issues',
    )
  })

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(NoImportHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
