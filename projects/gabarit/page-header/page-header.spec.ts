import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { PageHeader, PageHeaderLevel } from './page-header'

@Component({
  standalone: true,
  imports: [PageHeader],
  template: `
    <gbt-page-header heading="harbor" [headingLevel]="level()">
      <span header-title class="title-suffix">#42</span>
      <span header-badges class="badge">Private</span>
      <span header-meta class="meta">florian · created 3 days ago</span>
      <button header-actions type="button" class="action">Follow</button>
    </gbt-page-header>
  `,
})
class FullHost {
  level = signal<PageHeaderLevel>(1)
}

@Component({
  standalone: true,
  imports: [PageHeader],
  template: `<gbt-page-header heading="Settings" />`,
})
class TitleOnlyHost {}

@Component({
  standalone: true,
  imports: [PageHeader],
  template: `
    <gbt-page-header heading="Settings">
      @if (showMeta()) {
        <span header-meta class="meta">3 accounts</span>
      }
    </gbt-page-header>
  `,
})
class ConditionalMetaHost {
  showMeta = signal(false)
}

describe('PageHeader', () => {
  it('renders the heading as the single <h1> by default', () => {
    const fixture = TestBed.createComponent(FullHost)
    fixture.detectChanges()

    const headings = fixture.nativeElement.querySelectorAll('h1')
    expect(headings.length).toBe(1)
    expect(headings[0].textContent.trim()).toBe('harbor')
  })

  it('maps headingLevel to h1 / h2 / h3, one heading at a time', () => {
    const fixture = TestBed.createComponent(FullHost)
    for (const level of [1, 2, 3] as const) {
      fixture.componentInstance.level.set(level)
      fixture.detectChanges()
      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(1)
      expect(headings[0].tagName).toBe(`H${level}`)
      expect(headings[0].classList).toContain('gbt-page-header__title')
    }
  })

  it('renders [header-title] and [header-badges] on the title row, outside the heading', () => {
    const fixture = TestBed.createComponent(FullHost)
    fixture.detectChanges()

    const row = fixture.nativeElement.querySelector('.gbt-page-header__title-row') as HTMLElement
    expect(row.querySelector('h1')).not.toBeNull()
    expect(row.querySelector('.title-suffix')?.textContent).toBe('#42')
    expect(row.querySelector('.badge')?.textContent).toBe('Private')
    expect(row.querySelector('h1 .title-suffix, h1 .badge')).toBeNull()
  })

  it('renders the meta line and the actions in their own regions', () => {
    const fixture = TestBed.createComponent(FullHost)
    fixture.detectChanges()

    const el = fixture.nativeElement as HTMLElement
    expect(el.querySelector('.gbt-page-header__meta .meta')?.textContent).toBe(
      'florian · created 3 days ago',
    )
    expect(el.querySelector('.gbt-page-header__actions .action')?.textContent).toBe('Follow')
  })

  it('is a <header> named by `heading`, and leaves no host title attribute (no native tooltip)', () => {
    const fixture = TestBed.createComponent(TitleOnlyHost)
    fixture.detectChanges()

    const host = fixture.nativeElement.querySelector('gbt-page-header') as HTMLElement
    expect(host.hasAttribute('title')).toBe(false)
    expect(host.querySelector('header.gbt-page-header')).not.toBeNull()
  })

  it('leaves the optional regions empty with only a heading', () => {
    const fixture = TestBed.createComponent(TitleOnlyHost)
    fixture.detectChanges()

    const el = fixture.nativeElement as HTMLElement
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Settings')
    for (const region of [
      '.gbt-page-header__badges',
      '.gbt-page-header__meta',
      '.gbt-page-header__actions',
    ]) {
      const element = el.querySelector(region)
      expect(element, region).not.toBeNull()
      expect(element!.childNodes.length, region).toBe(0)
    }
  })

  it('shows a slot once conditional content appears in it, and collapses it when it goes', () => {
    const fixture = TestBed.createComponent(ConditionalMetaHost)
    fixture.detectChanges()
    const meta = fixture.nativeElement.querySelector('.gbt-page-header__meta') as HTMLElement
    expect(getComputedStyle(meta).display).toBe('none')

    fixture.componentInstance.showMeta.set(true)
    fixture.detectChanges()
    expect(meta.querySelector('.meta')?.textContent).toBe('3 accounts')
    expect(getComputedStyle(meta).display).not.toBe('none')

    fixture.componentInstance.showMeta.set(false)
    fixture.detectChanges()
    expect(getComputedStyle(meta).display).toBe('none')
  })

  it('has no a11y violations, full and heading-only', async () => {
    const full = TestBed.createComponent(FullHost)
    full.detectChanges()
    await expectNoA11yViolations(full.nativeElement)

    const bare = TestBed.createComponent(TitleOnlyHost)
    bare.detectChanges()
    await expectNoA11yViolations(bare.nativeElement)
  })
})
