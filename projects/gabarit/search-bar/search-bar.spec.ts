import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
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
      join(process.cwd(), 'projects/gabarit/search-bar/search-bar.scss'),
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

describe('SearchBar compact mode (collapsible)', () => {
  const CATEGORIES: SearchResultCategory<Item>[] = [
    { label: 'Repos', items: [{ id: 'r1', label: 'gabarit' }] },
  ]

  function render(collapsible: boolean | string = true) {
    const fixture = TestBed.createComponent(SearchBar<Item>)
    fixture.componentRef.setInput('collapsible', collapsible)
    fixture.componentRef.setInput('groupedResults', CATEGORIES)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement
    return {
      fixture,
      root,
      toggle: () => root.querySelector<HTMLButtonElement>('.gbt-sb-toggle'),
      trigger: () => root.querySelector<HTMLElement>('.gbt-sb-trigger')!,
      input: () => root.querySelector<HTMLInputElement>('.gbt-sb-trigger__input')!,
    }
  }

  function type(input: HTMLInputElement, value: string) {
    input.value = value
    input.dispatchEvent(new Event('input'))
  }

  it('changes nothing by default: no toggle, no id, no hidden field, no host attribute', () => {
    const fixture = TestBed.createComponent(SearchBar<Item>)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector('.gbt-sb-toggle')).toBeNull()
    expect(root.querySelector('.gbt-sb-trigger')?.hasAttribute('hidden')).toBe(false)
    expect(root.querySelector('.gbt-sb-trigger')?.hasAttribute('id')).toBe(false)
    expect(root.hasAttribute('data-collapsible')).toBe(false)
    expect(root.hasAttribute('data-expanded')).toBe(false)
  })

  it('an expanded model alone never folds a search bar that is not collapsible', () => {
    const fixture = TestBed.createComponent(SearchBar<Item>)
    fixture.componentRef.setInput('expanded', false)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-sb-trigger')?.hasAttribute('hidden')).toBe(
      false,
    )
  })

  it('shows an icon button and hides the field, until expanded', () => {
    const { toggle, trigger, root } = render()

    expect(toggle()).not.toBeNull()
    expect(toggle()?.getAttribute('type')).toBe('button')
    expect(toggle()?.getAttribute('aria-label')).toBe('Search')
    expect(toggle()?.getAttribute('aria-expanded')).toBe('false')
    expect(toggle()?.getAttribute('aria-controls')).toBe(trigger().id)
    expect(trigger().hasAttribute('hidden')).toBe(true)
    expect(root.getAttribute('data-collapsible')).toBe('always')
    expect(root.hasAttribute('data-expanded')).toBe(false)
  })

  it('names the icon button with openLabel', () => {
    const { fixture, toggle } = render()
    fixture.componentRef.setInput('openLabel', 'Rechercher')
    fixture.detectChanges()

    expect(toggle()?.getAttribute('aria-label')).toBe('Rechercher')
  })

  it('expands on click, focuses the field and emits expandedChange', async () => {
    const { fixture, toggle, trigger, input, root } = render()
    const emitted: boolean[] = []
    fixture.componentInstance.expanded.subscribe((value) => emitted.push(value))

    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(emitted).toEqual([true])
    expect(toggle()).toBeNull()
    expect(trigger().hasAttribute('hidden')).toBe(false)
    expect(root.hasAttribute('data-expanded')).toBe(true)
    expect(document.activeElement).toBe(input())
  })

  it('follows the expanded model when the header sets it', () => {
    const { fixture, toggle, trigger } = render()

    fixture.componentRef.setInput('expanded', true)
    fixture.detectChanges()

    expect(toggle()).toBeNull()
    expect(trigger().hasAttribute('hidden')).toBe(false)
  })

  it('folds on Escape when the field is empty, and returns focus to the icon button', async () => {
    const { fixture, toggle, trigger, input } = render()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    input().dispatchEvent(new FocusEvent('focus'))
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()
    await fixture.whenStable()

    expect(trigger().hasAttribute('hidden')).toBe(true)
    expect(toggle()).not.toBeNull()
    expect(document.activeElement).toBe(toggle())
  })

  it('closes the results first on Escape, and stays expanded', async () => {
    const { fixture, toggle, trigger, input } = render()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    input().dispatchEvent(new FocusEvent('focus'))
    type(input(), 'g')
    fixture.detectChanges()
    expect(input().getAttribute('aria-expanded')).toBe('true')

    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(trigger().hasAttribute('hidden')).toBe(false)
  })

  it('folds when focus leaves an empty field, without stealing focus back', async () => {
    const { fixture, toggle, trigger, input } = render()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    input().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }))
    fixture.detectChanges()
    await fixture.whenStable()

    expect(trigger().hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).not.toBe(toggle())
  })

  it('stays expanded when focus leaves a field that holds a query', async () => {
    const { fixture, toggle, trigger, input } = render()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    type(input(), 'g')
    input().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }))
    fixture.detectChanges()

    expect(trigger().hasAttribute('hidden')).toBe(false)
  })

  it('folds after a result is selected, unless keepQueryOnSelect is set', async () => {
    const { fixture, toggle, trigger, input, root } = render()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    type(input(), 'g')
    fixture.detectChanges()
    root.querySelector<HTMLButtonElement>('[role="option"]')!.click()
    fixture.detectChanges()

    expect(trigger().hasAttribute('hidden')).toBe(true)

    // keepQueryOnSelect: the chosen text stays in the field, so the field stays.
    const kept = render()
    kept.fixture.componentRef.setInput('keepQueryOnSelect', true)
    kept.toggle()!.click()
    kept.fixture.detectChanges()
    type(kept.input(), 'g')
    kept.fixture.detectChanges()
    kept.root.querySelector<HTMLButtonElement>('[role="option"]')!.click()
    kept.fixture.detectChanges()
    expect(kept.trigger().hasAttribute('hidden')).toBe(false)
  })

  it('shows a close button only while the compact field is shown, and names it with closeLabel', async () => {
    const { fixture, toggle, root } = render()
    const close = () => root.querySelector<HTMLButtonElement>('.gbt-sb-trigger__close')

    expect(close()).toBeNull()
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(close()).not.toBeNull()
    expect(close()?.getAttribute('type')).toBe('button')
    expect(close()?.getAttribute('aria-label')).toBe('Close search')
    fixture.componentRef.setInput('closeLabel', 'Fermer la recherche')
    fixture.detectChanges()
    expect(close()?.getAttribute('aria-label')).toBe('Fermer la recherche')
  })

  it('the close button folds a field that holds text, keeps the text and returns focus', async () => {
    const { fixture, toggle, trigger, input, root } = render()
    const emitted: boolean[] = []
    fixture.componentInstance.expanded.subscribe((value) => emitted.push(value))
    toggle()!.click()
    fixture.detectChanges()
    await fixture.whenStable()
    type(input(), 'gab')
    fixture.detectChanges()

    root.querySelector<HTMLButtonElement>('.gbt-sb-trigger__close')!.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(emitted).toEqual([true, false])
    expect(trigger().hasAttribute('hidden')).toBe(true)
    expect(input().value).toBe('gab')
    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle())
  })

  it('has no close button when the search bar is not collapsible', () => {
    const fixture = TestBed.createComponent(SearchBar<Item>)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-sb-trigger__close')).toBeNull()
  })

  it('accepts collapsible="narrow" and the bare attribute (an empty string means always)', () => {
    expect(render('narrow').root.getAttribute('data-collapsible')).toBe('narrow')
    expect(render('').root.getAttribute('data-collapsible')).toBe('always')
    expect(render(false).root.hasAttribute('data-collapsible')).toBe(false)
  })

  it('shows the icon button in narrow mode only up to 768px, in CSS (nothing to observe)', () => {
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/search-bar/search-bar.scss'),
      'utf8',
    )
    expect(scss).toContain('$narrow-breakpoint: 768px')
    expect(scss).toContain('@media (min-width: #{$narrow-breakpoint + 1})')
    const narrow = scss.slice(scss.indexOf("data-collapsible='narrow'"))
    expect(narrow).toContain('.gbt-sb-toggle')
    expect(narrow).toContain('display: none')
    expect(scss).toContain('.gbt-sb-trigger[hidden]')
    expect(narrow).toContain('.gbt-sb-trigger--folded')
    expect(narrow).not.toContain('[hidden]')
  })

  it('folds the narrow field with a class, not the hidden attribute, since CSS shows it above 768px', () => {
    const { fixture, toggle, trigger } = render('narrow')

    expect(trigger().hasAttribute('hidden')).toBe(false)
    expect(trigger().classList).toContain('gbt-sb-trigger--folded')

    toggle()!.click()
    fixture.detectChanges()
    expect(trigger().classList).not.toContain('gbt-sb-trigger--folded')
  })

  it('keeps the hidden attribute on a field folded at every width', () => {
    const { trigger } = render(true)

    expect(trigger().hasAttribute('hidden')).toBe(true)
    expect(trigger().classList).toContain('gbt-sb-trigger--folded')
  })

  it('has no violation detected by axe, folded', async () => {
    const { root } = render()
    await expectNoA11yViolations(root)
  })

  it('has no violation detected by axe, expanded', async () => {
    const { fixture, toggle, root } = render()
    toggle()!.click()
    fixture.detectChanges()
    await expectNoA11yViolations(root)
  })
})
