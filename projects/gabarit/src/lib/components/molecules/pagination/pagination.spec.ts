import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Select } from '../select/select'
import { ELLIPSIS, Pagination, paginationRange } from './pagination'

describe('paginationRange', () => {
  it('returns every page when they all fit without ellipsis', () => {
    expect(paginationRange(1, 5, 1)).toEqual([1, 2, 3, 4, 5])
    expect(paginationRange(3, 6, 1)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('shows only a right ellipsis when near the start', () => {
    expect(paginationRange(1, 20, 1)).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 20])
    expect(paginationRange(2, 20, 1)).toEqual([1, 2, 3, 4, 5, ELLIPSIS, 20])
  })

  it('shows only a left ellipsis when near the end', () => {
    expect(paginationRange(20, 20, 1)).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20])
    expect(paginationRange(19, 20, 1)).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20])
  })

  it('shows both ellipses when in the middle', () => {
    expect(paginationRange(10, 20, 1)).toEqual([1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 20])
  })

  it('respects a wider siblingCount', () => {
    expect(paginationRange(10, 20, 2)).toEqual([1, ELLIPSIS, 8, 9, 10, 11, 12, ELLIPSIS, 20])
  })

  it('never spends an ellipsis to skip just one page', () => {
    // page 17 of 20: only page 19 would be skipped between the window and the
    // last page — show it plainly instead of "…" for a single-page gap.
    expect(paginationRange(17, 20, 1)).toEqual([1, ELLIPSIS, 16, 17, 18, 19, 20])
  })
})

function setup() {
  const fixture = TestBed.createComponent(Pagination)
  fixture.componentRef.setInput('totalItems', 95)
  fixture.componentRef.setInput('pageSize', 10)
  fixture.detectChanges()
  return fixture
}

const pageButtons = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-pagination__page'),
]

const navButton = (f: ReturnType<typeof setup>, label: string): HTMLButtonElement =>
  f.nativeElement.querySelector(`[aria-label="${label}"]`)

describe('Pagination', () => {
  it('computes the page count from totalItems and pageSize', () => {
    const fixture = setup()
    // 95 items / 10 per page = 10 pages; on page 1 with the default siblingCount
    // of 1, that's still few enough to trigger just the right-hand ellipsis.
    expect(pageButtons(fixture).map((b) => b.textContent?.trim())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '10',
    ])
  })

  it('marks the current page with aria-current and a modifier class', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 2)
    fixture.detectChanges()

    const current = fixture.nativeElement.querySelector('[aria-current="page"]')
    expect(current.textContent?.trim()).toBe('2')
    expect(current.classList).toContain('gbt-pagination__page--current')
  })

  it('emits pageChange when a page number is clicked', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 1)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    pageButtons(fixture)[2].click()

    expect(emitted).toEqual([3])
  })

  it('does not emit when clicking the already-current page', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 2)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    pageButtons(fixture)[1].click()

    expect(emitted).toEqual([])
  })

  it('disables previous on the first page and next on the last page', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 1)
    fixture.detectChanges()

    expect(navButton(fixture, 'Previous page').disabled).toBe(true)
    expect(navButton(fixture, 'Next page').disabled).toBe(false)

    fixture.componentRef.setInput('page', 3)
    fixture.detectChanges()

    expect(navButton(fixture, 'Previous page').disabled).toBe(false)
    expect(navButton(fixture, 'Next page').disabled).toBe(true)
  })

  it('emits page - 1 / page + 1 from the previous/next buttons', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 2)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    navButton(fixture, 'Previous page').click()
    navButton(fixture, 'Next page').click()

    expect(emitted).toEqual([1, 3])
  })

  it('renders ellipsis as non-interactive, hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 200)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 10)
    fixture.detectChanges()

    const ellipses = [...fixture.nativeElement.querySelectorAll('.gbt-pagination__ellipsis')]
    expect(ellipses.length).toBe(2)
    for (const el of ellipses) {
      expect(el.tagName).toBe('LI')
      expect(el.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('names the nav and each page button', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Pagination')
    expect(pageButtons(fixture)[0].getAttribute('aria-label')).toBe('Page 1')
  })

  it('allows customizing the labels', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('ariaLabel', 'Navigation des pages')
    fixture.componentRef.setInput('previousLabel', 'Page précédente')
    fixture.componentRef.setInput('nextLabel', 'Page suivante')
    fixture.componentRef.setInput('pageLabel', (p: number) => `Aller à la page ${p}`)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe(
      'Navigation des pages',
    )
    expect(navButton(fixture, 'Page précédente')).not.toBeNull()
    expect(navButton(fixture, 'Page suivante')).not.toBeNull()
    expect(pageButtons(fixture)[0].getAttribute('aria-label')).toBe('Aller à la page 1')
  })

  it('does not show the items summary or the page-size selector by default', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-pagination__summary')).toBeNull()
    expect(fixture.debugElement.query(By.directive(Select))).toBeNull()
  })

  it('shows the items summary when enabled', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 1)
    fixture.componentRef.setInput('showItemsSummary', true)
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-pagination__summary').textContent.trim(),
    ).toBe('10 of 95 items')
  })

  it('accounts for a shorter last page in the items summary', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 10)
    fixture.componentRef.setInput('showItemsSummary', true)
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-pagination__summary').textContent.trim(),
    ).toBe('5 of 95 items')
  })

  it('allows customizing the items summary text', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('showItemsSummary', true)
    fixture.componentRef.setInput(
      'itemsSummaryLabel',
      (shown: number, total: number) => `${shown} sur ${total} éléments`,
    )
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-pagination__summary').textContent.trim(),
    ).toBe('10 sur 95 éléments')
  })

  it('shows a page-size selector with the given options', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 30, 50, 100])
    fixture.detectChanges()

    const select = fixture.debugElement.query(By.directive(Select))
    expect(select).not.toBeNull()
    expect(select.componentInstance.options()).toEqual([
      { value: 10, label: '10 / page' },
      { value: 20, label: '20 / page' },
      { value: 30, label: '30 / page' },
      { value: 50, label: '50 / page' },
      { value: 100, label: '100 / page' },
    ])
  })

  it('emits pageSizeChange and resets to page 1 when a new page size is picked', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 5)
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 30, 50, 100])
    fixture.detectChanges()

    const sizeChanges: number[] = []
    const pageChanges: number[] = []
    fixture.componentInstance.pageSizeChange.subscribe((s: number) => sizeChanges.push(s))
    fixture.componentInstance.pageChange.subscribe((p: number) => pageChanges.push(p))

    fixture.nativeElement.querySelector('.gbt-select__trigger').click()
    fixture.detectChanges()
    const options = [...fixture.nativeElement.querySelectorAll('.gbt-select__option')]
    const fiftyOption = options.find((o: HTMLElement) => o.textContent?.includes('50'))
    fiftyOption.click()
    fixture.detectChanges()

    expect(sizeChanges).toEqual([50])
    expect(pageChanges).toEqual([1])
  })

  it('keeps the page-size selector in sync when pageSize is changed externally', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 30, 50, 100])
    fixture.detectChanges()

    fixture.componentRef.setInput('pageSize', 30)
    fixture.detectChanges()

    const trigger = fixture.nativeElement.querySelector('.gbt-select__trigger')
    expect(trigger.textContent).toContain('30')
  })

  it('has no a11y violations, few pages', async () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 30)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no a11y violations, many pages with ellipsis', async () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 200)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 10)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no a11y violations, with the items summary and page-size selector', async () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 30, 50, 100])
    fixture.componentRef.setInput('showItemsSummary', true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('clamps a stale page down when totalItems shrinks the page count', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 10)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    // 25 items at 10/page is only 3 pages — page 10 no longer exists.
    fixture.componentRef.setInput('totalItems', 25)
    fixture.detectChanges()

    expect(emitted).toEqual([3])
  })

  it('clamps a page below 1 up to 1', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 0)
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    fixture.detectChanges()

    expect(emitted).toEqual([1])
  })

  it('does not emit a correction when the page is already within range', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 5)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    fixture.componentRef.setInput('totalItems', 96)
    fixture.detectChanges()

    expect(emitted).toEqual([])
  })

  it('disables every button and the page-size selector when disabled', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 5)
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 30, 50, 100])
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()

    const buttons: HTMLButtonElement[] = [
      ...fixture.nativeElement.querySelectorAll('.gbt-pagination__nav, .gbt-pagination__page'),
    ]
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.every((b) => b.disabled)).toBe(true)

    const select = fixture.debugElement.query(By.directive(Select))
    expect(select.componentInstance.isDisabled()).toBe(true)
  })

  it('ignores clicks on a disabled page button', () => {
    const fixture = TestBed.createComponent(Pagination)
    fixture.componentRef.setInput('totalItems', 95)
    fixture.componentRef.setInput('pageSize', 10)
    fixture.componentRef.setInput('page', 5)
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    const emitted: number[] = []
    fixture.componentInstance.pageChange.subscribe((p: number) => emitted.push(p))

    const pageButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.gbt-pagination__page',
    )
    pageButton.click()
    fixture.detectChanges()

    expect(emitted).toEqual([])
  })
})
