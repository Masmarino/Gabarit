import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, ErrorHandler, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { PageLayout } from '../../templates/page-layout/page-layout'
import { NavTab } from './nav-tab'
import { NavTabs, type NavTabsOrientation } from './nav-tabs'

@Component({
  standalone: true,
  imports: [NavTabs, NavTab],
  template: `
    <gbt-nav-tabs [ariaLabel]="label()" [orientation]="orientation()" [landmark]="landmark()">
      @for (section of sections(); track section.key) {
        <a
          gbtNavTab
          [href]="'#' + section.key"
          [icon]="section.icon"
          [badge]="section.badge"
          [active]="current() === section.key"
          (click)="$event.preventDefault(); current.set(section.key)"
          >{{ section.label }}</a
        >
      }
    </gbt-nav-tabs>
  `,
})
class Host {
  label = signal('Repository settings')
  orientation = signal<NavTabsOrientation>('horizontal')
  landmark = signal(true)
  current = signal('general')
  sections = signal<
    { key: string; label: string; icon: string | null; badge: number | string | null }[]
  >([
    { key: 'general', label: 'General', icon: 'info', badge: null },
    { key: 'webhooks', label: 'Webhooks', icon: null, badge: 3 },
    { key: 'members', label: 'Members', icon: null, badge: 0 },
  ])
}

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    tabs: () => [...root.querySelectorAll<HTMLAnchorElement>('a.gbt-nav-tab')],
    list: () => root.querySelector('.gbt-nav-tabs__list') as HTMLElement,
  }
}

describe('NavTabs', () => {
  it('renders one native link per tab, in a <nav> named by ariaLabel', () => {
    const { root, tabs } = setup()

    const nav = root.querySelector('nav')
    expect(nav?.getAttribute('aria-label')).toBe('Repository settings')
    expect(tabs().map((a) => a.getAttribute('href'))).toEqual(['#general', '#webhooks', '#members'])
    expect(tabs().every((a) => a.tagName === 'A' && !a.hasAttribute('role'))).toBe(true)
    expect(tabs().every((a) => !a.hasAttribute('tabindex'))).toBe(true)
  })

  it('marks only the active tab with aria-current="page", and follows the application', () => {
    const { fixture, host, tabs } = setup()

    expect(tabs().map((a) => a.getAttribute('aria-current'))).toEqual(['page', null, null])
    expect(tabs()[0].hasAttribute('data-active')).toBe(true)

    tabs()[1].click()
    fixture.detectChanges()
    expect(host.current()).toBe('webhooks')
    expect(tabs().map((a) => a.getAttribute('aria-current'))).toEqual([null, 'page', null])
    expect(tabs()[0].hasAttribute('data-active')).toBe(false)
  })

  it('marks no tab when none is active', () => {
    const { fixture, host, tabs } = setup()

    host.current.set('unknown')
    fixture.detectChanges()

    expect(tabs().some((a) => a.hasAttribute('aria-current'))).toBe(false)
  })

  it('renders no landmark, no aria-label and no <nav> when landmark is false', () => {
    const { fixture, host, root } = setup()

    host.landmark.set(false)
    fixture.detectChanges()

    expect(root.querySelector('nav')).toBeNull()
    expect(root.querySelector('[aria-label]')).toBeNull()
    expect(root.querySelectorAll('a.gbt-nav-tab').length).toBe(3)
  })

  it('renders the landmark without an empty aria-label when no name is given', () => {
    const { fixture, host, root } = setup()

    host.label.set('')
    fixture.detectChanges()

    expect(root.querySelector('nav')?.hasAttribute('aria-label')).toBe(false)
  })

  it('is horizontal by default and reflects the orientation on the container and every tab', () => {
    const { fixture, host, root, tabs } = setup()
    const container = () => root.querySelector('.gbt-nav-tabs') as HTMLElement

    expect(container().getAttribute('data-orientation')).toBe('horizontal')
    expect(tabs().every((a) => a.getAttribute('data-orientation') === 'horizontal')).toBe(true)

    host.orientation.set('vertical')
    fixture.detectChanges()
    expect(container().getAttribute('data-orientation')).toBe('vertical')
    expect(tabs().every((a) => a.getAttribute('data-orientation') === 'vertical')).toBe(true)
  })

  it('keeps the tabs when switching between the landmark and the plain container', () => {
    const { fixture, host, tabs } = setup()

    host.landmark.set(false)
    fixture.detectChanges()
    host.landmark.set(true)
    fixture.detectChanges()

    expect(tabs().length).toBe(3)
  })

  it('never imports @angular/router (the navigation is router-agnostic)', () => {
    for (const file of ['nav-tabs.ts', 'nav-tab.ts', 'nav-tabs.token.ts']) {
      const source = readFileSync(
        join(process.cwd(), 'projects/gabarit/src/lib/components/molecules/nav-tabs', file),
        'utf8',
      )
      expect(source).not.toMatch(/from\s+'@angular\/router'/)
    }
  })

  it('has no violation detected by axe, horizontal with an icon and badges', async () => {
    const { fixture } = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violation detected by axe, vertical', async () => {
    const { fixture, host } = setup()
    host.orientation.set('vertical')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('NavTab', () => {
  it('projects the label into a span and copies its text to data-label (a row reserves its bold width)', async () => {
    const { fixture, root } = setup()
    await fixture.whenStable()

    const labels = [...root.querySelectorAll<HTMLElement>('.gbt-nav-tab__label')]
    expect(labels.map((l) => l.textContent?.trim())).toEqual(['General', 'Webhooks', 'Members'])
    expect(labels.map((l) => l.getAttribute('data-label'))).toEqual([
      'General',
      'Webhooks',
      'Members',
    ])
  })

  it('shows a decorative icon only when one is given', () => {
    const { tabs } = setup()

    const icon = tabs()[0].querySelector('gbt-icon.gbt-nav-tab__icon')
    expect(icon).not.toBeNull()
    expect(icon?.getAttribute('aria-hidden')).toBe('true')
    expect(tabs()[1].querySelector('gbt-icon')).toBeNull()
  })

  it('shows a badge after the label, zero included, and none for null or an empty string', () => {
    @Component({
      standalone: true,
      imports: [NavTab],
      template: `
        <a gbtNavTab href="#a" [badge]="null">A</a>
        <a gbtNavTab href="#b" [badge]="''">B</a>
        <a gbtNavTab href="#c" [badge]="0">C</a>
        <a gbtNavTab href="#d" badge="20+">D</a>
      `,
    })
    class Badges {}
    const fixture = TestBed.createComponent(Badges)
    fixture.detectChanges()
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')]

    expect(links.map((a) => a.querySelector('.gbt-nav-tab__badge')?.textContent)).toEqual([
      undefined,
      undefined,
      '0',
      '20+',
    ])
  })

  it('reads the badge as part of the link name, separated from the label by a real space', () => {
    const { tabs } = setup()

    expect(tabs()[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('Webhooks 3')
  })

  it('works outside a gbt-nav-tabs (horizontal look, no error)', () => {
    @Component({
      standalone: true,
      imports: [NavTab],
      template: `<a gbtNavTab href="#x" [active]="true">Solo</a>`,
    })
    class Solo {}
    const fixture = TestBed.createComponent(Solo)
    fixture.detectChanges()
    const link: HTMLElement = fixture.nativeElement.querySelector('a')

    expect(link.getAttribute('data-orientation')).toBe('horizontal')
    expect(link.getAttribute('aria-current')).toBe('page')
  })
})

@Component({
  standalone: true,
  imports: [PageLayout, NavTabs, NavTab],
  template: `
    <gbt-page-layout navLabel="Repository settings">
      <gbt-nav-tabs
        page-nav
        ariaLabel="Repository settings"
        [landmark]="false"
        orientation="vertical"
      >
        <a gbtNavTab href="#a" [active]="true">General</a>
        <a gbtNavTab href="#b">Webhooks</a>
      </gbt-nav-tabs>
      <p>Section</p>
    </gbt-page-layout>
  `,
})
class InLayoutHost {}

describe('NavTabs inside a gbt-page-layout [page-nav]', () => {
  it('meets one navigation landmark, not two nested ones', async () => {
    const fixture = TestBed.createComponent(InLayoutHost)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelectorAll('nav').length).toBe(1)
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Repository settings')
    expect(root.querySelectorAll('nav a.gbt-nav-tab').length).toBe(2)
    await expectNoA11yViolations(root)
  })
})

describe('NavTabs overflow fades (browser-only ResizeObserver)', () => {
  const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  const errors: unknown[] = []

  class FakeResizeObserver {
    static instances: FakeResizeObserver[] = []
    observed: Element[] = []
    disconnected = false
    constructor(readonly callback: ResizeObserverCallback) {
      FakeResizeObserver.instances.push(this)
    }
    observe(element: Element): void {
      this.observed.push(element)
    }
    unobserved: Element[] = []
    unobserve(element: Element): void {
      this.unobserved.push(element)
    }
    disconnect(): void {
      this.disconnected = true
    }
  }

  function install(): void {
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver
  }

  function measure(
    list: HTMLElement,
    layout: { scrollWidth: number; clientWidth: number; scrollLeft: number },
  ) {
    for (const [key, value] of Object.entries(layout)) {
      Object.defineProperty(list, key, { configurable: true, writable: true, value })
    }
  }

  beforeEach(() => {
    errors.length = 0
    FakeResizeObserver.instances = []
    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useValue: { handleError: (e: unknown) => errors.push(e) } },
      ],
    })
  })

  afterEach(() => {
    if (original === undefined) {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    } else {
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = original
    }
  })

  it('works when ResizeObserver does not exist (no error, no fade)', async () => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    const { fixture, list } = setup()
    await fixture.whenStable()

    expect(errors).toEqual([])
    expect(list().hasAttribute('data-hidden-before')).toBe(false)
    expect(list().hasAttribute('data-hidden-after')).toBe(false)
  })

  it('observes the list, and fades the hidden side when the row overflows', async () => {
    install()
    const { fixture, list } = setup()
    await fixture.whenStable()

    expect(FakeResizeObserver.instances.length).toBe(1)
    // The list first, then each tab (a badge or label changing width overflows the row without
    // resizing the list).
    expect(FakeResizeObserver.instances[0].observed).toEqual([
      list(),
      ...Array.from(list().children),
    ])
    expect(FakeResizeObserver.instances[0].observed.length).toBeGreaterThan(1)

    measure(list(), { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 })
    FakeResizeObserver.instances[0].callback([], FakeResizeObserver.instances[0] as never)
    await fixture.whenStable()
    fixture.detectChanges()
    expect(list().hasAttribute('data-hidden-before')).toBe(false)
    expect(list().hasAttribute('data-hidden-after')).toBe(true)

    // Scrolled to the middle: both sides fade.
    measure(list(), { scrollWidth: 600, clientWidth: 300, scrollLeft: 100 })
    list().dispatchEvent(new Event('scroll'))
    fixture.detectChanges()
    expect(list().hasAttribute('data-hidden-before')).toBe(true)
    expect(list().hasAttribute('data-hidden-after')).toBe(true)

    // Scrolled to the end: only the start fades.
    measure(list(), { scrollWidth: 600, clientWidth: 300, scrollLeft: 300 })
    list().dispatchEvent(new Event('scroll'))
    fixture.detectChanges()
    expect(list().hasAttribute('data-hidden-before')).toBe(true)
    expect(list().hasAttribute('data-hidden-after')).toBe(false)

    // The row fits again: no fade at all.
    measure(list(), { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 })
    FakeResizeObserver.instances[0].callback([], FakeResizeObserver.instances[0] as never)
    fixture.detectChanges()
    expect(list().hasAttribute('data-hidden-before')).toBe(false)
    expect(list().hasAttribute('data-hidden-after')).toBe(false)
    expect(errors).toEqual([])
  })

  it('observes a tab that is added later, and stops observing one that is removed', async () => {
    install()
    const { fixture, host, list } = setup()
    await fixture.whenStable()
    const observer = FakeResizeObserver.instances[0]

    host.sections.update((all) => [
      ...all,
      { key: 'danger', label: 'Danger zone', icon: null, badge: null },
    ])
    fixture.detectChanges()
    await fixture.whenStable()
    expect(observer.observed).toContain(list().lastElementChild)
    expect(observer.observed.length).toBe(1 + 4)

    const removed = list().children[1]
    host.sections.update((all) => all.filter((_, index) => index !== 1))
    fixture.detectChanges()
    await fixture.whenStable()
    expect(observer.unobserved).toEqual([removed])
    expect(errors).toEqual([])
  })

  it('brings the newly active tab into view inside the row, keeping a glimpse of the previous one', async () => {
    install()
    const { fixture, host, list, tabs } = setup()
    await fixture.whenStable()

    measure(list(), { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 })
    Object.defineProperty(tabs()[2], 'offsetLeft', { configurable: true, value: 420 })
    Object.defineProperty(tabs()[2], 'offsetWidth', { configurable: true, value: 100 })

    host.current.set('members')
    fixture.detectChanges()
    await fixture.whenStable()

    // end (520) + glimpse (40) - clientWidth (300)
    expect(list().scrollLeft).toBe(260)
    expect(errors).toEqual([])
  })

  it('does not scroll at all while the row fits', async () => {
    install()
    const { fixture, host, list } = setup()
    await fixture.whenStable()

    measure(list(), { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 })
    host.current.set('members')
    fixture.detectChanges()
    await fixture.whenStable()

    expect(list().scrollLeft).toBe(0)
  })

  it('disconnects the observer when destroyed', async () => {
    install()
    const { fixture } = setup()
    await fixture.whenStable()

    expect(FakeResizeObserver.instances[0].disconnected).toBe(false)
    fixture.destroy()
    expect(FakeResizeObserver.instances[0].disconnected).toBe(true)
    expect(errors).toEqual([])
  })
})

describe('NavTab touch targets', () => {
  it('reaches 44px on a coarse pointer for both orientations, after the base rules', () => {
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/components/molecules/nav-tabs/nav-tab.scss'),
      'utf8',
    )
    const coarse = scss.slice(scss.indexOf('@media (pointer: coarse)'))
    expect(coarse).toContain(":host([data-orientation='vertical'])")
    expect(coarse).toContain(":host([data-orientation='horizontal'])")
    expect(coarse).toContain('min-height: 44px')
    // Later than the 36px / 40px rules, so that it wins at equal specificity.
    expect(scss.indexOf('@media (pointer: coarse)')).toBeGreaterThan(scss.indexOf('@include row('))
  })
})
