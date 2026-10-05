import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import {
  PageLayout,
  PageLayoutAsidePosition,
  PageLayoutAsideWidth,
  PageLayoutWidth,
} from './page-layout'

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <gbt-page-layout
      [width]="width()"
      [asideWidth]="asideWidth()"
      [asidePosition]="asidePosition()"
    >
      <p class="main-content">Main content</p>
    </gbt-page-layout>
  `,
})
class MainOnlyHost {
  width = signal<PageLayoutWidth>('default')
  asideWidth = signal<PageLayoutAsideWidth>('md')
  asidePosition = signal<PageLayoutAsidePosition>('end')
}

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <gbt-page-layout>
      <p class="main-content">Main content</p>
      <div page-aside class="aside-content">About</div>
    </gbt-page-layout>
  `,
})
class WithAsideHost {}

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <gbt-page-layout navLabel="Repository files" asideLabel="About" [stickyNav]="stickyNav()">
      <div page-nav class="nav-content">Files</div>
      <p class="main-content">Main content</p>
      <div page-aside class="aside-content">About</div>
    </gbt-page-layout>
  `,
})
class ThreeColumnsHost {
  stickyNav = signal(false)
}

@Component({
  standalone: true,
  imports: [PageLayout],
  template: `
    <gbt-page-layout>
      @if (showNav()) {
        <div page-nav class="nav-content">Files</div>
      }
      <p class="main-content">Main content</p>
      @if (showAside()) {
        <div page-aside class="aside-content">About</div>
      }
    </gbt-page-layout>
  `,
})
class ConditionalHost {
  showNav = signal(false)
  showAside = signal(false)
}

const SCSS_DIR = join(process.cwd(), 'projects/gabarit/page-layout')

describe('PageLayout', () => {
  const host = (el: HTMLElement) => el.querySelector('gbt-page-layout') as HTMLElement

  it('renders the projected main content inside a <main>-free region', () => {
    const fixture = TestBed.createComponent(MainOnlyHost)
    fixture.detectChanges()

    const main = host(fixture.nativeElement).querySelector('.gbt-page-layout__main')
    expect(main?.querySelector('.main-content')?.textContent).toBe('Main content')
    // The application shell already renders the page's <main> landmark: no second one here.
    expect(host(fixture.nativeElement).querySelector('main')).toBeNull()
  })

  it('leaves the aside and nav regions empty when nothing is projected into them', () => {
    const fixture = TestBed.createComponent(MainOnlyHost)
    fixture.detectChanges()

    const el = host(fixture.nativeElement)
    const aside = el.querySelector('aside.gbt-page-layout__aside') as HTMLElement
    const nav = el.querySelector('nav.gbt-page-layout__nav') as HTMLElement
    // The regions exist (hidden by `:empty` in CSS) and hold nothing, not even whitespace.
    expect(aside).not.toBeNull()
    expect(nav).not.toBeNull()
    expect(aside.childNodes.length).toBe(0)
    expect(nav.childNodes.length).toBe(0)
    expect(getComputedStyle(aside).display).toBe('none')
    expect(getComputedStyle(nav).display).toBe('none')
  })

  it('renders [page-aside] content inside an <aside>', () => {
    const fixture = TestBed.createComponent(WithAsideHost)
    fixture.detectChanges()

    const el = host(fixture.nativeElement)
    const aside = el.querySelector('aside') as HTMLElement
    expect(aside.querySelector('.aside-content')?.textContent).toBe('About')
    expect(el.querySelector('.gbt-page-layout__main .aside-content')).toBeNull()
    expect(getComputedStyle(aside).display).not.toBe('none')
  })

  it('renders [page-nav] content inside a labelled <nav> placed before the main content', () => {
    const fixture = TestBed.createComponent(ThreeColumnsHost)
    fixture.detectChanges()

    const el = host(fixture.nativeElement)
    const nav = el.querySelector('nav') as HTMLElement
    expect(nav.querySelector('.nav-content')?.textContent).toBe('Files')
    expect(nav.getAttribute('aria-label')).toBe('Repository files')
    const regions = Array.from(el.querySelectorAll('.gbt-page-layout > *')).map((r) =>
      r.tagName.toLowerCase(),
    )
    expect(regions).toEqual(['nav', 'div', 'aside'])
  })

  it('names the nav landmark in English by default, and leaves the aside unnamed unless asked', () => {
    const plain = TestBed.createComponent(WithAsideHost)
    plain.detectChanges()
    const el = host(plain.nativeElement)
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Page navigation')
    expect(el.querySelector('aside')?.hasAttribute('aria-label')).toBe(false)

    const named = TestBed.createComponent(ThreeColumnsHost)
    named.detectChanges()
    expect(host(named.nativeElement).querySelector('aside')?.getAttribute('aria-label')).toBe(
      'About',
    )
  })

  it('maps width to a data attribute on the host (max-width in CSS)', () => {
    const fixture = TestBed.createComponent(MainOnlyHost)
    fixture.detectChanges()
    const el = host(fixture.nativeElement)
    expect(el.dataset['width']).toBe('default')

    for (const width of ['narrow', 'wide', 'full'] as const) {
      fixture.componentInstance.width.set(width)
      fixture.detectChanges()
      expect(el.dataset['width']).toBe(width)
    }
  })

  it('maps asideWidth and asidePosition to data attributes on the host', () => {
    const fixture = TestBed.createComponent(MainOnlyHost)
    fixture.detectChanges()
    const el = host(fixture.nativeElement)
    expect(el.dataset['asideWidth']).toBe('md')
    expect(el.dataset['asidePosition']).toBe('end')

    fixture.componentInstance.asideWidth.set('lg')
    fixture.componentInstance.asidePosition.set('start')
    fixture.detectChanges()
    expect(el.dataset['asideWidth']).toBe('lg')
    expect(el.dataset['asidePosition']).toBe('start')
  })

  it('marks the host when the nav column should stay in view (stickyNav), and not by default', () => {
    const fixture = TestBed.createComponent(ThreeColumnsHost)
    fixture.detectChanges()
    const el = host(fixture.nativeElement)
    expect(el.hasAttribute('data-sticky-nav')).toBe(false)

    fixture.componentInstance.stickyNav.set(true)
    fixture.detectChanges()
    expect(el.hasAttribute('data-sticky-nav')).toBe(true)
    // The other attributes stay.
    expect(el.dataset['width']).toBe('default')
    expect(el.dataset['asideWidth']).toBe('md')

    fixture.componentInstance.stickyNav.set(false)
    fixture.detectChanges()
    expect(el.hasAttribute('data-sticky-nav')).toBe(false)
  })

  it('shows a region once content with a single root element is projected into it under @if', () => {
    const fixture = TestBed.createComponent(ConditionalHost)
    fixture.detectChanges()
    const el = host(fixture.nativeElement)
    const nav = el.querySelector('nav') as HTMLElement
    const aside = el.querySelector('aside') as HTMLElement
    // An `@if` anchor is a comment: `:empty` ignores it, so both regions are still collapsed.
    expect(getComputedStyle(nav).display).toBe('none')
    expect(getComputedStyle(aside).display).toBe('none')

    fixture.componentInstance.showNav.set(true)
    fixture.componentInstance.showAside.set(true)
    fixture.detectChanges()
    expect(nav.querySelector('.nav-content')?.textContent).toBe('Files')
    expect(aside.querySelector('.aside-content')?.textContent).toBe('About')
    expect(getComputedStyle(nav).display).not.toBe('none')
    expect(getComputedStyle(aside).display).not.toBe('none')

    fixture.componentInstance.showNav.set(false)
    fixture.componentInstance.showAside.set(false)
    fixture.detectChanges()
    expect(getComputedStyle(nav).display).toBe('none')
    expect(getComputedStyle(aside).display).toBe('none')
  })

  describe('responsive contract (jsdom has no layout: asserted on the stylesheet)', () => {
    const scss = readFileSync(join(SCSS_DIR, 'page-layout.scss'), 'utf8')

    it('responds to its own width through a named size container, never to the viewport', () => {
      expect(scss).toMatch(/container:\s*gbt-page-layout\s*\/\s*inline-size/)
      expect(scss).not.toMatch(/@media\s*\(\s*(min|max)-width/)
    })

    it('switches to two columns above 768px and to three above 1100px of layout width', () => {
      expect(scss).toContain('@container gbt-page-layout (min-width: 769px)')
      expect(scss).toContain('@container gbt-page-layout (min-width: 1101px)')
    })

    it('declares the column widths as custom properties on the host, consumed by the grid tracks', () => {
      expect(scss).toMatch(/:host\s*\{[^}]*--gbt-page-aside-width:\s*300px/)
      expect(scss).toMatch(/:host\s*\{[^}]*--gbt-page-nav-width:\s*240px/)
      expect(scss).toContain('var(--gbt-page-aside-width)')
      expect(scss).toContain('var(--gbt-page-nav-width)')
    })

    it('draws the stacked aside separator with the shared hairline token', () => {
      expect(scss).toContain('var(--gbt-hairline)')
    })
  })

  it('has no a11y violations, main only, with an aside and with nav + aside', async () => {
    for (const component of [MainOnlyHost, WithAsideHost, ThreeColumnsHost]) {
      const fixture = TestBed.createComponent(component)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    }
  })
})
