import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { SkeletonList } from './skeleton-list'

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SkeletonList)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    root,
    rows: () => root.querySelectorAll('.gbt-skeleton-list__row'),
    status: () => root.querySelector('[role="status"]') as HTMLElement,
    list: () => root.querySelector('.gbt-skeleton-list') as HTMLElement,
  }
}

describe('SkeletonList', () => {
  it('draws four rows of a round block and two lines by default', () => {
    const { rows } = setup()

    expect(rows().length).toBe(4)
    for (const row of Array.from(rows())) {
      expect(row.querySelectorAll('.gbt-skeleton-list__leading').length).toBe(1)
      expect(row.querySelector('.gbt-skeleton-list__leading')?.getAttribute('data-variant')).toBe(
        'circle',
      )
      expect(row.querySelectorAll('.gbt-skeleton-list__lines gbt-skeleton').length).toBe(2)
    }
  })

  it('takes the number of rows, and none for 0 or a negative number', () => {
    expect(setup({ rows: 7 }).rows().length).toBe(7)
    expect(setup({ rows: 0 }).rows().length).toBe(0)
    expect(setup({ rows: -3 }).rows().length).toBe(0)
  })

  it('takes the leading block: square, none, and its size', () => {
    const square = setup({ leading: 'square', leadingSize: '2.25rem' })
    const block = square.root.querySelector('.gbt-skeleton-list__leading') as HTMLElement
    expect(block.getAttribute('data-variant')).toBe('rect')
    expect(block.getAttribute('data-leading')).toBe('square')
    expect(block.style.width).toBe('2.25rem')
    expect(block.style.height).toBe('2.25rem')

    expect(setup({ leading: 'none' }).root.querySelector('.gbt-skeleton-list__leading')).toBeNull()
  })

  it('takes the number of lines per row, the first being the longest', () => {
    const { rows } = setup({ lines: 3, rows: 1 })
    const widths = Array.from(
      rows()[0].querySelectorAll('.gbt-skeleton-list__lines gbt-skeleton'),
    ).map((s) => parseFloat((s as HTMLElement).style.width))

    expect(widths.length).toBe(3)
    expect(widths[0]).toBeGreaterThan(widths[1])
    expect(widths[1]).toBeGreaterThanOrEqual(widths[2])
    expect(
      setup({ lines: 1 }).rows()[0].querySelectorAll('.gbt-skeleton-list__lines gbt-skeleton')
        .length,
    ).toBe(1)
  })

  it('varies the width of the first line from row to row', () => {
    const { rows } = setup({ rows: 3 })
    const first = Array.from(rows()).map(
      (row) =>
        (row.querySelector('.gbt-skeleton-list__lines gbt-skeleton') as HTMLElement).style.width,
    )
    expect(new Set(first).size).toBe(3)
  })

  it('tells screen readers with a polite status that is always there, and hides the shapes', () => {
    const { status, list } = setup()

    expect(status().textContent?.trim()).toBe('Loading…')
    expect(list().querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(status().closest('[aria-hidden="true"]')).toBeNull()
    // No busy ancestor around the live region.
    expect(status().closest('[aria-busy]')).toBeNull()
    expect(list().querySelector('[aria-busy]')).toBeNull()
  })

  it('takes its loading label from the input', () => {
    expect(setup({ loadingLabel: 'Chargement des runners…' }).status().textContent?.trim()).toBe(
      'Chargement des runners…',
    )
  })

  it('separates rows and pads them by default, and can do without', () => {
    const on = setup()
    expect(on.list().hasAttribute('data-divided')).toBe(true)
    expect(on.list().hasAttribute('data-padded')).toBe(true)

    const off = setup({ divided: false, padded: false })
    expect(off.list().hasAttribute('data-divided')).toBe(false)
    expect(off.list().hasAttribute('data-padded')).toBe(false)
  })

  it('has no accessibility violations (default, avatars, no leading, empty)', async () => {
    await expectNoA11yViolations(setup().root)
    await expectNoA11yViolations(setup({ leading: 'square', leadingSize: '2rem', lines: 3 }).root)
    await expectNoA11yViolations(setup({ leading: 'none', lines: 1 }).root)
    await expectNoA11yViolations(setup({ rows: 0 }).root)
  })
})
