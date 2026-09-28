import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { StatTile } from '../stat-tile/stat-tile'
import { StatGrid } from './stat-grid'

@Component({
  standalone: true,
  imports: [StatGrid, StatTile],
  template: `
    <gbt-stat-grid [columns]="columns()" [loading]="loading()" [loadingCount]="2">
      <gbt-stat-tile label="Users" [value]="120" />
      <gbt-stat-tile label="Repositories" [value]="48" />
      <gbt-stat-tile label="Pipelines" [value]="9" />
    </gbt-stat-grid>
  `,
})
class Host {
  columns = signal<2 | 3 | 4 | 5 | 6>(4)
  loading = signal(false)
}

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    list: () => root.querySelector('.gbt-stat-grid') as HTMLElement,
    status: () => root.querySelector('[role="status"]') as HTMLElement,
  }
}

describe('StatGrid', () => {
  it('is a list named "Summary" whose items are the tiles', () => {
    const { list, root } = setup()

    expect(list().getAttribute('role')).toBe('list')
    expect(list().getAttribute('aria-label')).toBe('Summary')
    expect(root.querySelectorAll('gbt-stat-tile[role="listitem"]').length).toBe(3)
    expect(list().hasAttribute('aria-hidden')).toBe(false)
  })

  it('names the list from ariaLabel', () => {
    const fixture = TestBed.createComponent(StatGrid)
    fixture.componentRef.setInput('ariaLabel', 'Aperçu')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-stat-grid').getAttribute('aria-label')).toBe(
      'Aperçu',
    )
  })

  it('carries the column count as data-columns', () => {
    const { fixture, host, list } = setup()
    expect(list().getAttribute('data-columns')).toBe('4')

    host.columns.set(3)
    fixture.detectChanges()
    expect(list().getAttribute('data-columns')).toBe('3')
  })

  it('shows loadingCount placeholders and a polite status while loading, and no tile', () => {
    const { fixture, host, list, root, status } = setup()
    host.loading.set(true)
    fixture.detectChanges()

    expect(list().getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelectorAll('.gbt-stat-grid__placeholder').length).toBe(2)
    expect(root.querySelector('gbt-stat-tile')).toBeNull()
    expect(status().textContent?.trim()).toBe('Loading…')
    expect(status().closest('[aria-hidden="true"]')).toBeNull()
  })

  it('renders no placeholder (only the status) when loadingCount is 0', () => {
    const fixture = TestBed.createComponent(StatGrid)
    fixture.componentRef.setInput('loading', true)
    fixture.componentRef.setInput('loadingCount', 0)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelectorAll('.gbt-stat-grid__placeholder').length).toBe(0)
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent?.trim()).toBe(
      'Loading…',
    )
  })

  it('keeps the status region in the DOM, empty, when not loading', () => {
    const { status } = setup()
    expect(status()).not.toBeNull()
    expect(status().textContent?.trim()).toBe('')
  })

  it('brings the tiles back, in order, when loading ends', () => {
    const { fixture, host, root } = setup()
    host.loading.set(true)
    fixture.detectChanges()
    host.loading.set(false)
    fixture.detectChanges()

    const labels = Array.from(root.querySelectorAll('.gbt-stat-tile__label')).map((l) =>
      l.textContent?.trim(),
    )
    expect(labels).toEqual(['Users', 'Repositories', 'Pipelines'])
  })

  it('follows the width of its own container, not the viewport', () => {
    // jsdom has no layout: the contract is asserted on the stylesheet.
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/components/molecules/stat-grid/stat-grid.scss'),
      'utf8',
    )
    expect(scss).toContain('container: gbt-stat-grid / inline-size')
    expect(scss).toContain('@container gbt-stat-grid (min-width: 600px)')
    expect(scss).not.toMatch(/@media[^{]*(min|max)-width/)
  })

  it('has no accessibility violations (loaded and loading)', async () => {
    const { fixture, host, root } = setup()
    await expectNoA11yViolations(root)

    host.loading.set(true)
    fixture.detectChanges()
    await expectNoA11yViolations(root)
  })
})
