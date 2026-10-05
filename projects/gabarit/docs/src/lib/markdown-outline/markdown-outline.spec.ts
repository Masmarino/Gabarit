import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { MarkdownOutline, hasOutline } from './markdown-outline'
import { FRENCH_DOCS_LABELS } from '../testing/docs-fixtures'
import { provideDocsLabels } from '../docs-labels'
import { MarkdownOutlineEntry } from '../markdown-view/markdown-view'

const ENTRIES: MarkdownOutlineEntry[] = [
  { level: 2, text: 'Installation', id: 'user-content-installation' },
  { level: 3, text: 'Linux', id: 'user-content-linux' },
  { level: 4, text: 'Variables', id: 'user-content-variables' },
  { level: 2, text: 'Utilisation', id: 'user-content-utilisation' },
]

describe('MarkdownOutline', () => {
  const text = (el: Element | null | undefined) =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

  function setup(entries: MarkdownOutlineEntry[] = ENTRIES) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideDocsLabels(FRENCH_DOCS_LABELS)],
    })
    const fixture = TestBed.createComponent(MarkdownOutline)
    fixture.componentRef.setInput('entries', entries)
    fixture.detectChanges()
    return { fixture, el: fixture.nativeElement as HTMLElement }
  }

  afterEach(() => {
    document.querySelectorAll('.planted-heading').forEach((node) => node.remove())
  })

  it('is worth showing from two headings on', () => {
    expect(hasOutline([])).toBe(false)
    expect(hasOutline(ENTRIES.slice(0, 1))).toBe(false)
    expect(hasOutline(ENTRIES.slice(0, 2))).toBe(true)
  })

  it('renders a "Sur cette page" panel (h2) listing every heading in order, indented by level', () => {
    const { el } = setup()
    const heading = el.querySelector('h2')
    expect(text(heading)).toBe('Sur cette page')
    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('ul.gbt-markdown-outline__list > li > a'),
    )
    expect(links.map((a) => text(a))).toEqual(['Installation', 'Linux', 'Variables', 'Utilisation'])
    expect(links.map((a) => a.parentElement!.getAttribute('data-level'))).toEqual([
      '2',
      '3',
      '4',
      '2',
    ])
  })

  it('links each entry to its heading id as a fragment of the current page', () => {
    const { el } = setup()
    const link = el.querySelector<HTMLAnchorElement>('.gbt-markdown-outline__list a')!
    expect(link.getAttribute('href')).toBe('/#user-content-installation')
  })

  it('scrolls to the heading and moves focus to it on click', () => {
    const { el } = setup()
    const target = document.createElement('h2')
    target.id = 'user-content-linux'
    target.className = 'planted-heading'
    document.body.appendChild(target)
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView

    el.querySelectorAll<HTMLAnchorElement>('.gbt-markdown-outline__list a')[1].click()

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(target.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(target)
  })
})
