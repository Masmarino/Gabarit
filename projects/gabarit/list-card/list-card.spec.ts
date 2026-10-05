import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { ListRow } from '../list-row/list-row'
import { ListCard, ListCardState } from './list-card'

const SCSS_DIR = join(process.cwd(), 'projects/gabarit/list-card')

@Component({
  standalone: true,
  imports: [ListCard, ListRow],
  template: `
    <gbt-list-card
      ariaLabel="Issues"
      [state]="state()"
      [skeletonRows]="rows()"
      [skeletonHeader]="skeletonHeader()"
      [retryLabel]="retryLabel()"
      failedMessage="Check your connection."
      emptyHeading="No issues yet"
      emptyMessage="Create the first one."
      [emptyIcon]="emptyIcon()"
      [emptyIllustration]="illustration()"
      (retry)="retried = retried + 1"
    >
      <div list-card-header class="header">3 issues</div>
      <ul class="items">
        <li>
          <gbt-list-row><a href="#">First</a></gbt-list-row>
        </li>
        <li>
          <gbt-list-row><a href="#">Second</a></gbt-list-row>
        </li>
      </ul>
      <p list-card-message class="message">No open issues</p>
      <button list-card-empty type="button" class="create">Create an issue</button>
      <button list-card-failed type="button" class="more">Open the status page</button>
    </gbt-list-card>
  `,
})
class Host {
  state = signal<ListCardState>('ready')
  rows = signal(4)
  skeletonHeader = signal(true)
  retryLabel = signal<string | null>('Retry')
  emptyIcon = signal<string | null>(null)
  illustration = signal<'checklist' | null>(null)
  retried = 0
}

function setup(state: ListCardState = 'ready') {
  const fixture = TestBed.createComponent(Host)
  fixture.componentInstance.state.set(state)
  fixture.detectChanges()
  return fixture
}

const q = (fixture: { nativeElement: HTMLElement }, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement | null

/** The declarations of the first rule whose selector is exactly `selector` (comments dropped). */
function ruleBody(scss: string, selector: string): string | null {
  const flat = ' ' + scss.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ')
  const start = flat.search(new RegExp(`(?:^|[};]) +${selector.replace(/[.[\]()]/g, '\\$&')} \\{`))
  if (start === -1) return null
  const open = flat.indexOf('{', start)
  return flat.slice(open + 1, flat.indexOf('}', open)).trim()
}

describe('ListCard', () => {
  it('is a <section> named by ariaLabel, carrying its state', () => {
    const fixture = setup()
    const section = q(fixture, 'section.gbt-list-card')!
    expect(section.getAttribute('aria-label')).toBe('Issues')
    expect(section.dataset['state']).toBe('ready')
    // The section is the component's only root: the landmark wraps everything it renders.
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelector('gbt-list-card')!.children),
    ).toEqual([section])
  })

  it('is ready by default and shows the header and the projected rows only', () => {
    const fixture = setup()
    expect(q(fixture, '.gbt-list-card__header .header')?.textContent).toBe('3 issues')
    expect(q(fixture, '.gbt-list-card__body > ul.items')).not.toBeNull()
    expect(q(fixture, '.gbt-list-card__body > [list-card-message]')).not.toBeNull()
    expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__body gbt-list-row').length).toBe(
      2,
    )
    for (const other of ['.gbt-list-card__loading', '.gbt-list-card__failed', 'gbt-empty-state']) {
      expect(q(fixture, other), other).toBeNull()
    }
    expect(q(fixture, '.create')).toBeNull()
    // The status region exists (so a later change is announced) but says nothing.
    expect(q(fixture, '[role="status"]')?.textContent).toBe('')
  })

  it('collapses the header when nothing is projected into it', () => {
    const fixture = TestBed.createComponent(ListCard)
    fixture.detectChanges()
    const header = q(fixture, '.gbt-list-card__header')!
    // Still in its place (above the box, in the section), just empty and not displayed.
    expect(header.parentElement).toBe(q(fixture, 'section.gbt-list-card'))
    expect(header.nextElementSibling).toBe(q(fixture, '.gbt-list-card__box'))
    expect(header.childNodes.length).toBe(0)
    expect(getComputedStyle(header).display).toBe('none')
  })

  describe('the header sits above the box, outside it, inside the named section', () => {
    const parts = (fixture: { nativeElement: HTMLElement }) => ({
      section: q(fixture, 'section.gbt-list-card')!,
      status: q(fixture, '[role="status"]')!,
      header: q(fixture, '.gbt-list-card__header'),
      box: q(fixture, '.gbt-list-card__box')!,
    })

    it('renders the header as the sibling right before the box, never inside it (ready)', () => {
      const fixture = setup()
      const { section, status, header, box } = parts(fixture)
      expect(Array.from(section.children)).toEqual([status, header, box])
      expect(header!.nextElementSibling).toBe(box)
      expect(box.contains(header)).toBe(false)
      expect(box.querySelector('.header')).toBeNull()
      // The projected header content is in the header, the list is in the box.
      expect(header!.querySelector('.header')?.textContent).toBe('3 issues')
      expect(box.querySelector(':scope > .gbt-list-card__body > ul.items')).not.toBeNull()
    })

    it("keeps the header's tabs and filters inside the landmark named by ariaLabel", () => {
      const fixture = setup()
      const projected = q(fixture, '.header')!
      const region = projected.closest('section')!
      expect(region).toBe(parts(fixture).section)
      expect(region.getAttribute('aria-label')).toBe('Issues')
      // …and the list too: header and rows belong to the same region.
      expect(q(fixture, 'ul.items')!.closest('section')).toBe(region)
    })

    it('puts the loading placeholder in the header position, outside the box and the busy region', () => {
      const fixture = setup('loading')
      const { section, status, header, box } = parts(fixture)
      expect(Array.from(section.children)).toEqual([status, header, box])
      expect(header!.getAttribute('aria-hidden')).toBe('true')
      expect(header!.querySelector('gbt-skeleton[data-variant="rect"]')).not.toBeNull()
      expect(box.contains(header)).toBe(false)
      expect(header!.closest('[aria-busy]')).toBeNull()
      expect(box.querySelector(':scope > .gbt-list-card__loading[aria-busy="true"]')).not.toBeNull()
    })

    it('renders the box alone after the status when there is no header (failed, empty, loading without one)', () => {
      const cases: [ListCardState, boolean][] = [
        ['failed', true],
        ['empty', true],
        ['loading', false],
      ]
      for (const [state, skeletonHeader] of cases) {
        const fixture = setup(state)
        fixture.componentInstance.skeletonHeader.set(skeletonHeader)
        fixture.detectChanges()
        const { section, status, header, box } = parts(fixture)
        expect(header, state).toBeNull()
        expect(Array.from(section.children), state).toEqual([status, box])
      }
    })

    it('keeps the same header height in loading and ready, so nothing jumps', () => {
      const scss = readFileSync(join(SCSS_DIR, 'list-card.scss'), 'utf8')
      const html = readFileSync(join(SCSS_DIR, 'list-card.html'), 'utf8')
      // The header reserves the height of a md control whatever it holds…
      expect(ruleBody(scss, '.gbt-list-card__header')).toContain(
        'min-height: var(--gbt-control-height-md);',
      )
      // …and the placeholder is no taller (the height of the tabs it stands for).
      expect(html).toMatch(
        /<gbt-skeleton variant="rect" width="14rem" height="var\(--gbt-control-height-sm\)" \/>/,
      )
    })
  })

  describe('loading', () => {
    it('shows a skeleton of the same shape, hidden from assistive technology', () => {
      const fixture = setup('loading')
      const loading = q(fixture, '.gbt-list-card__loading')!
      expect(loading.getAttribute('aria-busy')).toBe('true')
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__skeleton-row').length).toBe(4)
      expect(q(fixture, '.gbt-list-card__header')?.getAttribute('aria-hidden')).toBe('true')
      // The skeleton is decorative: it is aria-hidden.
      expect(
        loading.querySelector('.gbt-list-card__skeleton-row')?.closest('[aria-hidden="true"]'),
      ).not.toBeNull()
      // The projected content is not rendered while loading.
      expect(q(fixture, '.gbt-list-card__body')).toBeNull()
      expect(q(fixture, '.header')).toBeNull()
    })

    it('announces itself through a persistent polite status that is never inside an aria-busy region', () => {
      const fixture = setup('ready')
      const status = q(fixture, '[role="status"]')!
      expect(status.classList).toContain('sr-only')
      expect(status.parentElement).toBe(q(fixture, 'section.gbt-list-card'))
      expect(status.textContent).toBe('')

      fixture.componentInstance.state.set('loading')
      fixture.detectChanges()
      // The SAME node: it existed before its text changed, which is what makes it announce.
      expect(q(fixture, '[role="status"]')).toBe(status)
      expect(status.textContent).toBe('Loading…')
      // aria-busy holds back changes in its subtree: it must not contain, or be, the status region.
      expect(status.closest('[aria-busy="true"]')).toBeNull()
      const busy = fixture.nativeElement.querySelectorAll('[aria-busy]') as NodeListOf<HTMLElement>
      expect(busy.length).toBe(1)
      expect(busy[0].contains(status)).toBe(false)

      fixture.componentInstance.state.set('failed')
      fixture.detectChanges()
      expect(q(fixture, '[role="status"]')).toBe(status)
      expect(status.textContent).toBe('')
      expect(fixture.nativeElement.querySelector('[aria-busy]')).toBeNull()
    })

    it('takes the row count and the header placeholder from inputs', () => {
      const fixture = setup('loading')
      fixture.componentInstance.rows.set(6)
      fixture.componentInstance.skeletonHeader.set(false)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__skeleton-row').length).toBe(6)
      expect(q(fixture, '.gbt-list-card__header')).toBeNull()

      fixture.componentInstance.rows.set(0)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__skeleton-row').length).toBe(0)
    })
  })

  describe('failed', () => {
    it('shows an alert block with the heading, the message and a retry button, and no rows or header', () => {
      const fixture = setup('failed')
      const failed = q(fixture, '.gbt-list-card__failed')!
      expect(failed.getAttribute('role')).toBe('alert')
      expect(failed.textContent).toContain('The list could not be loaded')
      expect(failed.textContent).toContain('Check your connection.')
      expect(failed.querySelector('.gbt-empty-state[data-tone="error"]')).not.toBeNull()
      expect(failed.querySelector('gbt-button button')?.textContent?.trim()).toBe('Retry')
      expect(q(fixture, '.header')).toBeNull()
      expect(q(fixture, 'ul.items')).toBeNull()
    })

    it('emits `retry` when the button is pressed', () => {
      const fixture = setup('failed')
      ;(q(fixture, '.gbt-list-card__failed gbt-button button') as HTMLButtonElement).click()
      expect(fixture.componentInstance.retried).toBe(1)
    })

    it('hides the retry button when retryLabel is null and still shows [list-card-failed]', () => {
      const fixture = setup('failed')
      fixture.componentInstance.retryLabel.set(null)
      fixture.detectChanges()
      expect(q(fixture, '.gbt-list-card__failed gbt-button')).toBeNull()
      expect(q(fixture, '.gbt-list-card__failed .more')?.textContent).toBe('Open the status page')
    })
  })

  describe('empty', () => {
    it('shows the empty heading, message and the [list-card-empty] action, and no rows or header', () => {
      const fixture = setup('empty')
      const empty = q(fixture, 'gbt-empty-state')!
      expect(empty.textContent).toContain('No issues yet')
      expect(empty.textContent).toContain('Create the first one.')
      expect(empty.querySelector('.create')?.textContent).toBe('Create an issue')
      expect(q(fixture, '.header')).toBeNull()
      expect(q(fixture, 'ul.items')).toBeNull()
      expect(q(fixture, '.gbt-list-card__failed')).toBeNull()
    })

    it('is a compact icon block by default and the full artwork with an illustration', () => {
      const fixture = setup('empty')
      fixture.componentInstance.emptyIcon.set('folder')
      fixture.detectChanges()
      const block = () => q(fixture, '.gbt-empty-state')!
      expect(block().dataset['size']).toBe('compact')
      expect(block().querySelector('.gbt-empty-state__icon')).not.toBeNull()

      fixture.componentInstance.illustration.set('checklist')
      fixture.detectChanges()
      expect(block().hasAttribute('data-size')).toBe(false)
      expect(block().querySelector('.gbt-empty-state__illustration')).not.toBeNull()
    })
  })

  it('switches from one state to the next without keeping the previous block', () => {
    const fixture = setup('loading')
    for (const state of ['ready', 'failed', 'empty', 'loading'] as const) {
      fixture.componentInstance.state.set(state)
      fixture.detectChanges()
      expect(q(fixture, 'section')?.dataset['state']).toBe(state)
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__loading').length).toBe(
        state === 'loading' ? 1 : 0,
      )
      // One box and at most one header, whatever the previous state was.
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__box').length).toBe(1)
      expect(fixture.nativeElement.querySelectorAll('.gbt-list-card__header').length).toBe(
        state === 'ready' || state === 'loading' ? 1 : 0,
      )
    }
  })

  describe('stylesheet contract (jsdom has no layout)', () => {
    const scss = readFileSync(join(SCSS_DIR, 'list-card.scss'), 'utf8')
    /** The declarations only: the `//` comments may name a property in prose. */
    const code = scss.replace(/\/\/.*$/gm, '')

    it('makes the section (header + box) the size container named gbt-list-card', () => {
      const section = ruleBody(scss, '.gbt-list-card') ?? ''
      expect(section).toContain('container: gbt-list-card / inline-size;')
      // Declared once, on the element that wraps both the header and the box.
      expect(code.match(/container:/g)?.length).toBe(1)
    })

    it('places the header then the box in the section grid, with a gap under the header', () => {
      const section = ruleBody(scss, '.gbt-list-card') ?? ''
      expect(section).toContain('position: relative;')
      expect(section).toContain('display: grid;')
      expect(section).toContain("grid-template-areas: 'gbt-list-card-header' 'gbt-list-card-box';")
      expect(section).toContain('grid-template-columns: minmax(0, 1fr);')
      // Same header-to-box gap as gbt-card.
      expect(ruleBody(scss, '.gbt-list-card__header')).toContain('margin-bottom: 0.5rem;')
      expect(ruleBody(scss, '.gbt-list-card__header')).toContain('grid-area: gbt-list-card-header;')
      expect(ruleBody(scss, '.gbt-list-card__box')).toContain('grid-area: gbt-list-card-box;')
      // The section itself paints nothing: the box does.
      for (const property of ['border', 'border-radius', 'background', 'overflow', 'box-shadow']) {
        expect(section, property).not.toMatch(new RegExp(`(^|[; ])${property}\\s*:`))
      }
    })

    it('gives the header no background, border, radius, shadow or padding of its own', () => {
      const header = ruleBody(scss, '.gbt-list-card__header') ?? ''
      for (const property of [
        'background',
        'border',
        'border-bottom',
        'border-radius',
        'box-shadow',
        'padding',
      ]) {
        expect(header, property).not.toMatch(new RegExp(`(^|[; ])${property}\\s*:`))
      }
      // No other rule reaches into the header to paint it (the band is gone).
      expect(code).not.toContain('--bg-hover')
      expect(scss.replace(/\s+/g, ' ')).not.toMatch(
        /\.gbt-list-card__header[^{]*\{[^}]*(background|border|padding)/,
      )
    })

    it('draws the edge on the box, in the shared card tokens, and clips the rows to its corners', () => {
      const box = ruleBody(scss, '.gbt-list-card__box') ?? ''
      expect(box).toContain('position: relative;')
      expect(box).toContain('overflow: hidden;')
      expect(box).toContain('border: 1px solid var(--gbt-card-border);')
      expect(box).toContain('border-radius: var(--site-border-radius);')
      expect(box).toContain('background: var(--bg-principal);')
      expect(scss).toContain('var(--gbt-hairline)')
      // Only the box clips: the header above it is never cut.
      expect(code.match(/overflow:/g)?.length).toBe(1)
    })

    it('resets the bullets of a direct child list and styles the list-card-message', () => {
      expect(scss).toMatch(/> ul,\s*::ng-deep > ol\s*\{[^}]*list-style:\s*none/)
      expect(scss).toContain('[list-card-message]')
    })

    it('tightens the header in a narrow card with a container query, never a media query on width', () => {
      expect(scss.replace(/\s+/g, ' ')).toContain(
        '@container gbt-list-card (max-width: 559px) { .gbt-list-card__header { gap: 0.5rem; } }',
      )
      expect(ruleBody(scss, '.gbt-list-card__header')).toContain('gap: 0.75rem;')
      expect(scss).not.toMatch(/@media\s*\(\s*(min|max)-width/)
    })
  })

  it('has no a11y violations in any of the four states', async () => {
    for (const state of ['ready', 'loading', 'failed', 'empty'] as const) {
      const fixture = setup(state)
      await expectNoA11yViolations(fixture.nativeElement)
    }
  })
})
