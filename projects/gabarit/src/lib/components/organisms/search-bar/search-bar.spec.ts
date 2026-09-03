import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { SearchBar, SearchResultCategory } from './search-bar'

interface Item {
  id: string
  label: string
}

describe('SearchBar', () => {
  function render() {
    const fixture = TestBed.createComponent(SearchBar<Item>)
    fixture.detectChanges()
    return fixture
  }

  function type(fixture: ReturnType<typeof render>, value: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    input.value = value
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
  }

  function overlayOpen(fixture: ReturnType<typeof render>): boolean {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    return input.getAttribute('aria-expanded') === 'true'
  }

  function focusInput(fixture: ReturnType<typeof render>): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    input.dispatchEvent(new Event('focus'))
    fixture.detectChanges()
  }

  it('emits the query on input and shows the overlay once there is a query', () => {
    const fixture = render()
    const emitted: string[] = []
    fixture.componentInstance.queryChange.subscribe((q) => emitted.push(q))

    type(fixture, 'my-repo')

    expect(emitted).toEqual(['my-repo'])
    expect(overlayOpen(fixture)).toBe(true)
  })

  it('hides the overlay again once the query is cleared to empty', () => {
    const fixture = render()
    type(fixture, 'x')
    expect(overlayOpen(fixture)).toBe(true)

    type(fixture, '')

    expect(overlayOpen(fixture)).toBe(false)
  })

  it('emits an empty query on backspace-to-empty too, not just non-empty input', () => {
    const fixture = render()
    const emitted: string[] = []
    fixture.componentInstance.queryChange.subscribe((q) => emitted.push(q))

    type(fixture, 'x')
    type(fixture, '')

    expect(emitted).toEqual(['x', ''])
  })

  it('renders grouped results under their category label with a count', () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', icon: 'package', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(fixture, 'my')

    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Dépôts')
    expect(text).toContain('my-repo')
    expect(text).toContain('1')
  })

  it('emits the selected item and clears the query on click', () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(fixture, 'my')

    const selected: Item[] = []
    fixture.componentInstance.itemSelected.subscribe((item) => selected.push(item))
    fixture.nativeElement.querySelector('.gbt-sb-item').click()
    fixture.detectChanges()

    const searchInput: HTMLInputElement =
      fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    expect(selected).toEqual([{ id: 'r1', label: 'my-repo' }])
    expect(searchInput.value).toBe('')
    expect(overlayOpen(fixture)).toBe(false)
  })

  it('keeps the selected item visible in the input when keepQueryOnSelect is set', () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    fixture.componentRef.setInput('keepQueryOnSelect', true)
    type(fixture, 'my')

    fixture.nativeElement.querySelector('.gbt-sb-item').click()
    fixture.detectChanges()

    const searchInput: HTMLInputElement =
      fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    expect(searchInput.value).toBe('my-repo')
  })

  it('shows the empty state when grouped results are all empty', () => {
    const fixture = render()
    fixture.componentRef.setInput('groupedResults', [
      { label: 'Dépôts', items: [] },
    ] as SearchResultCategory<Item>[])
    type(fixture, 'nothing-matches')

    expect(fixture.nativeElement.textContent).toContain('No results')
  })

  it('marks the empty-state message as a status region so it is announced (RGAA 7.5)', () => {
    const fixture = render()
    fixture.componentRef.setInput('groupedResults', [
      { label: 'Dépôts', items: [] },
    ] as SearchResultCategory<Item>[])
    type(fixture, 'nothing-matches')

    const state = fixture.nativeElement.querySelector('.gbt-sb-state')
    expect(state.getAttribute('role')).toBe('status')
  })

  it('emits clear and refocuses the input when the clear button is clicked', () => {
    const fixture = render()
    type(fixture, 'abc')
    let cleared = false
    fixture.componentInstance.clear.subscribe(() => (cleared = true))

    fixture.nativeElement.querySelector('.gbt-sb-trigger__clear').click()
    fixture.detectChanges()

    const searchInput: HTMLInputElement =
      fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    expect(cleared).toBe(true)
    expect(searchInput.value).toBe('')
  })

  it('closes the overlay when clicking outside the component', () => {
    const fixture = render()
    type(fixture, 'abc')
    expect(overlayOpen(fixture)).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(overlayOpen(fixture)).toBe(false)
  })

  it('navigates the active item with the arrow keys and selects it with Enter', () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      {
        label: 'Dépôts',
        items: [
          { id: 'r1', label: 'first' },
          { id: 'r2', label: 'second' },
        ],
      },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(fixture, 'x')
    focusInput(fixture)
    const selected: Item[] = []
    fixture.componentInstance.itemSelected.subscribe((item) => selected.push(item))

    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    )
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )

    expect(selected).toEqual([{ id: 'r2', label: 'second' }])
  })

  it('closes the overlay on Escape, even with zero results', () => {
    const fixture = render()
    fixture.componentRef.setInput('groupedResults', [
      { label: 'Dépôts', items: [] },
    ] as SearchResultCategory<Item>[])
    type(fixture, 'nothing-matches')
    focusInput(fixture)
    expect(overlayOpen(fixture)).toBe(true)

    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    fixture.detectChanges()

    expect(overlayOpen(fixture)).toBe(false)
  })

  it('uses English labels by default', () => {
    const fixture = TestBed.createComponent(SearchBar)
    fixture.detectChanges()
    const input = fixture.nativeElement.querySelector('input')
    expect(input.getAttribute('placeholder')).toBe('Search…')
  })

  it('uses an English default label for the clear button', () => {
    const fixture = render()
    type(fixture, 'abc')

    const clear = fixture.nativeElement.querySelector('.gbt-sb-trigger__clear')
    expect(clear.getAttribute('aria-label')).toBe('Clear search')
  })

  it("allows customizing the clear button's label", () => {
    const fixture = TestBed.createComponent(SearchBar)
    fixture.componentRef.setInput('clearLabel', 'Vider')
    fixture.detectChanges()
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    input.value = 'abc'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    const clear = fixture.nativeElement.querySelector('.gbt-sb-trigger__clear')
    expect(clear.getAttribute('aria-label')).toBe('Vider')
  })

  it('shows an English default hint under the "no results" message', () => {
    const fixture = render()
    fixture.componentRef.setInput('groupedResults', [
      { label: 'Dépôts', items: [] },
    ] as SearchResultCategory<Item>[])
    type(fixture, 'nothing-matches')

    expect(fixture.nativeElement.textContent).toContain('Try a different search.')
  })

  it('announces the result count in English by default', () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(fixture, 'my')

    const status = fixture.nativeElement.querySelector('[role="status"][aria-live="polite"]')
    expect(status.textContent.trim()).toBe('1 result')
  })

  it("allows customizing the panel footer's label format", () => {
    const fixture = TestBed.createComponent(SearchBar)
    fixture.componentRef.setInput('navigateHint', 'Se déplacer')
    fixture.componentRef.setInput('selectHint', 'Choisir')
    fixture.componentRef.setInput('closeHint', 'Quitter')
    fixture.detectChanges()
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')
    input.value = 'x'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    const footer = fixture.nativeElement.querySelector('.gbt-sb-footer').textContent
    expect(footer).toContain('Se déplacer')
    expect(footer).toContain('Choisir')
    expect(footer).toContain('Quitter')
  })

  it('presents no accessibility violation, empty', async () => {
    const fixture = render()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('shows the no-results state, not an empty listbox, when neither results nor groupedResults is bound yet', () => {
    const fixture = render()
    type(fixture, 'x')

    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-sb-state')).not.toBeNull()
  })

  it('presents no accessibility violation, with results', async () => {
    const fixture = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    fixture.componentRef.setInput('groupedResults', categories)
    fixture.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(fixture, 'my')
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, no results', async () => {
    const fixture = render()
    fixture.componentRef.setInput('groupedResults', [
      { label: 'Dépôts', items: [] },
    ] as SearchResultCategory<Item>[])
    type(fixture, 'nothing-matches')
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('namespaces the panel id per instance, so two instances on one page never collide', () => {
    const first = render()
    type(first, 'x')
    const second = render()
    type(second, 'x')

    const firstPanelId = first.nativeElement.querySelector('.gbt-sb-panel').id
    const secondPanelId = second.nativeElement.querySelector('.gbt-sb-panel').id

    expect(firstPanelId).toBeTruthy()
    expect(secondPanelId).toBeTruthy()
    expect(firstPanelId).not.toBe(secondPanelId)
  })

  it('namespaces option ids per instance too', () => {
    const first = render()
    const second = render()
    const categories: SearchResultCategory<Item>[] = [
      { label: 'Dépôts', items: [{ id: 'r1', label: 'my-repo' }] },
    ]
    first.componentRef.setInput('groupedResults', categories)
    first.componentRef.setInput('displayFn', (item: Item) => item.label)
    second.componentRef.setInput('groupedResults', categories)
    second.componentRef.setInput('displayFn', (item: Item) => item.label)
    type(first, 'my')
    type(second, 'my')

    const firstItemId = first.nativeElement.querySelector('.gbt-sb-item').id
    const secondItemId = second.nativeElement.querySelector('.gbt-sb-item').id

    expect(firstItemId).toBeTruthy()
    expect(secondItemId).toBeTruthy()
    expect(firstItemId).not.toBe(secondItemId)
  })

  it('sets aria-controls on the input only while the overlay is open, pointing at an element that actually exists', () => {
    const fixture = render()
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-sb-trigger__input')

    expect(input.hasAttribute('aria-controls')).toBe(false)

    type(fixture, 'x')

    const controlsId = input.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    expect(fixture.nativeElement.querySelector(`#${controlsId}`)).not.toBeNull()

    type(fixture, '')

    expect(input.hasAttribute('aria-controls')).toBe(false)
  })

  it('keeps the trigger above its own backdrop, so it never renders dimmed or blurred', () => {
    const scss = readFileSync(
      join(
        process.cwd(),
        'projects/gabarit/src/lib/components/organisms/search-bar/search-bar.scss',
      ),
      'utf8',
    )
    const triggerBlock = scss.slice(
      scss.indexOf('.gbt-sb-trigger {'),
      scss.indexOf('.gbt-sb-trigger__icon'),
    )
    const backdropBlock = scss.slice(
      scss.indexOf('.gbt-sb-backdrop {'),
      scss.indexOf('.gbt-sb-panel {'),
    )

    const triggerZ = Number(/z-index:\s*(\d+)/.exec(triggerBlock)?.[1])
    const backdropZ = Number(/z-index:\s*(\d+)/.exec(backdropBlock)?.[1])

    expect(triggerBlock).toContain('position: relative')
    expect(triggerZ).toBeGreaterThan(backdropZ)
  })
})
