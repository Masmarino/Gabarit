import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { ListRow, ListRowTone } from './list-row'

const SCSS_DIR = join(process.cwd(), 'projects/gabarit/src/lib/components/molecules/list-row')

@Component({
  standalone: true,
  imports: [ListRow],
  template: `
    <ul class="rows">
      <li>
        <gbt-list-row [tone]="tone()">
          <span row-leading class="status-icon">●</span>
          <a href="/issues/12" class="title">Fix the pagination</a>
          <span class="tag">bug</span>
          <span row-meta class="meta">#12 opened 2 days ago by alice</span>
          <span row-trailing class="comments">3</span>
        </gbt-list-row>
      </li>
      <li>
        <gbt-list-row>
          <a href="/issues/13" class="title">Title only</a>
        </gbt-list-row>
      </li>
    </ul>
  `,
})
class FullAndBareRowsHost {
  tone = signal<ListRowTone>('neutral')
}

@Component({
  standalone: true,
  imports: [ListRow],
  template: `
    <gbt-list-row>
      <a href="/issues/12" class="title">Fix the pagination</a>
      @if (showMeta()) {
        <span row-meta class="meta">opened 2 days ago</span>
      }
    </gbt-list-row>
  `,
})
class ConditionalMetaHost {
  showMeta = signal(false)
}

function rows(fixture: { nativeElement: HTMLElement }) {
  return Array.from(fixture.nativeElement.querySelectorAll('gbt-list-row')) as HTMLElement[]
}

/** An empty slot's wrapper holds no element or text (an `@if` anchor comment is fine) and is not displayed. */
function isCollapsed(row: HTMLElement, slot: string): boolean {
  const wrapper = row.querySelector(`.gbt-list-row__${slot}`) as HTMLElement | null
  if (!wrapper) return true
  const hasContent = Array.from(wrapper.childNodes).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()),
  )
  const hidden = getComputedStyle(wrapper).display === 'none'
  if (hasContent === hidden) {
    throw new Error(
      `.gbt-list-row__${slot}: content ${hasContent} but display ${getComputedStyle(wrapper).display}`,
    )
  }
  return hidden
}

describe('ListRow', () => {
  it('renders one .gbt-list-row root with a leading column, a main column (title + meta) and a trailing column', () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    fixture.detectChanges()
    const [full] = rows(fixture)

    const root = full.querySelector(':scope > .gbt-list-row') as HTMLElement
    expect(root).toBeTruthy()
    expect(root.querySelector(':scope > .gbt-list-row__leading')).toBeTruthy()
    expect(root.querySelector(':scope > .gbt-list-row__main > .gbt-list-row__title')).toBeTruthy()
    expect(root.querySelector(':scope > .gbt-list-row__main > .gbt-list-row__meta')).toBeTruthy()
    expect(root.querySelector(':scope > .gbt-list-row__trailing')).toBeTruthy()
  })

  it('projects each slot into its own wrapper, the title link as a DIRECT child of the title area', () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    fixture.detectChanges()
    const [full] = rows(fixture)

    expect(full.querySelector('.gbt-list-row__leading > .status-icon')).toBeTruthy()
    expect(full.querySelector('.gbt-list-row__title > a.title')?.textContent).toBe(
      'Fix the pagination',
    )
    expect(full.querySelector('.gbt-list-row__title > .tag')?.textContent).toBe('bug')
    expect(full.querySelector('.gbt-list-row__meta > .meta')?.textContent).toContain('by alice')
    expect(full.querySelector('.gbt-list-row__trailing > .comments')?.textContent).toBe('3')
  })

  it('collapses the wrappers of empty slots: nothing inside them, and not displayed (no box, no gap)', () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    fixture.detectChanges()
    const [full, bare] = rows(fixture)

    expect(bare.querySelector('.gbt-list-row__title > .title')).toBeTruthy()
    for (const slot of ['leading', 'meta', 'trailing']) {
      expect(isCollapsed(bare, slot), `${slot} of the bare row`).toBe(true)
      expect(isCollapsed(full, slot), `${slot} of the full row`).toBe(false)
    }
  })

  it('shows a slot once conditional content appears in it, and collapses it again when it goes', () => {
    const fixture = TestBed.createComponent(ConditionalMetaHost)
    fixture.detectChanges()
    const row = fixture.nativeElement.querySelector('gbt-list-row') as HTMLElement
    expect(isCollapsed(row, 'meta')).toBe(true)

    fixture.componentInstance.showMeta.set(true)
    fixture.detectChanges()
    expect(row.querySelector('.gbt-list-row__meta > .meta')?.textContent).toBe('opened 2 days ago')
    expect(isCollapsed(row, 'meta')).toBe(false)

    fixture.componentInstance.showMeta.set(false)
    fixture.detectChanges()
    expect(isCollapsed(row, 'meta')).toBe(true)
  })

  it('keeps list semantics: the page’s ul > li wrap the rows, the row adds no role of its own', () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    fixture.detectChanges()

    const items = fixture.nativeElement.querySelectorAll('ul.rows > li > gbt-list-row')
    expect(items.length).toBe(2)
    for (const row of rows(fixture)) {
      expect(row.getAttribute('role')).toBeNull()
      expect(row.querySelector('[role]')).toBeNull()
    }
  })

  it('tints the leading slot with `tone`: neutral by default, then each status tone', () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    fixture.detectChanges()
    const leading = () =>
      fixture.nativeElement.querySelector('.gbt-list-row__leading') as HTMLElement
    expect(leading().getAttribute('data-tone')).toBe('neutral')

    for (const tone of ['success', 'warning', 'error', 'info'] as const) {
      fixture.componentInstance.tone.set(tone)
      fixture.detectChanges()
      expect(leading().getAttribute('data-tone')).toBe(tone)
    }
  })

  it('has hover and focus-within backgrounds, and no motion under prefers-reduced-motion', () => {
    const scss = readFileSync(join(SCSS_DIR, 'list-row.scss'), 'utf8')
    expect(scss).toMatch(/&:hover,\s*&:focus-within\s*\{\s*background:\s*var\(--bg-hover\)/)
    expect(scss).toMatch(
      /prefers-reduced-motion:\s*reduce\)\s*\{\s*\.gbt-list-row\s*\{\s*transition:\s*none/,
    )
  })

  it('draws the separators with the shared hairline, between rows only', () => {
    const scss = readFileSync(join(SCSS_DIR, 'list-row.scss'), 'utf8')
    expect(scss).toContain('li + li > gbt-list-row')
    expect(scss).toContain('gbt-list-row + gbt-list-row')
    expect(scss).toContain('var(--gbt-hairline)')
  })

  it('has no a11y violations, full and bare rows, every tone', async () => {
    const fixture = TestBed.createComponent(FullAndBareRowsHost)
    for (const tone of ['neutral', 'success', 'warning', 'error', 'info'] as const) {
      fixture.componentInstance.tone.set(tone)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    }
  })
})
