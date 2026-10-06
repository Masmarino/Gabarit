import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { AppShell } from './app-shell'
import { Icon } from '../icon/icon'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [AppShell],
  template: `
    <gbt-app-shell
      navLabel="Navigation principale"
      skipLabel="Aller au contenu principal"
      openMenuLabel="Ouvrir la navigation"
      closeMenuLabel="Fermer la navigation"
      collapseLabel="Réduire la navigation"
      expandLabel="Agrandir la navigation"
      [collapsed]="collapsed()"
      (collapsedChange)="collapsed.set($event)"
    >
      <a shell-brand href="/">Hangar</a>
      <a shell-nav href="/depots" class="gbt-app-shell__link" aria-current="page">Dépôts</a>
      <a shell-nav href="/utilisateurs" class="gbt-app-shell__link">Utilisateurs</a>
      <h1 shell-header>Tableau de bord</h1>
      <p data-content>Le contenu de la page.</p>
    </gbt-app-shell>
  `,
})
class HostComponent {
  collapsed = signal(false)
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const button = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-app-shell__toggle')

const collapseToggle = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-app-shell__collapse-toggle')

describe('AppShell', () => {
  it('projects content into a focusable main', () => {
    const fixture = setup()
    const main: HTMLElement = fixture.nativeElement.querySelector('main')
    expect(main).not.toBeNull()
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(main.querySelector('[data-content]')).not.toBeNull()
  })

  it('points the skip link at the main', () => {
    const fixture = setup()
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.gbt-app-shell__skip')
    const main: HTMLElement = fixture.nativeElement.querySelector('main')
    expect(link.textContent?.trim()).toBe('Aller au contenu principal')
    expect(link.getAttribute('href')).toBe(`#${main.id}`)
  })

  it('gives each instance a distinct id', () => {
    const first = setup().nativeElement.querySelector('main').id
    const second = setup().nativeElement.querySelector('main').id
    expect(first).not.toBe(second)
  })

  it('names the navigation, projects the brand and the links into it', () => {
    const fixture = setup()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.getAttribute('aria-label')).toBe('Navigation principale')
    expect(nav.querySelector('.gbt-app-shell__brand a')?.textContent?.trim()).toBe('Hangar')
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('.gbt-app-shell__link')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/depots', '/utilisateurs'])
  })

  it('denotes the current page via aria-current, not a class', () => {
    const fixture = setup()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    const current = [...nav.querySelectorAll<HTMLAnchorElement>('a[aria-current]')]
    expect(current.map((a) => a.getAttribute('href'))).toEqual(['/depots'])
    expect(current[0].getAttribute('aria-current')).toBe('page')
  })

  it('publishes link styles in the global stylesheet, outside encapsulation', () => {
    const root = join(process.cwd(), 'projects/gabarit/src/lib')
    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const componentScss = readFileSync(join(root, '../../app-shell/app-shell.scss'), 'utf8')
    expect(utilities).toContain('.gbt-app-shell__link')
    expect(componentScss).not.toContain('__link')
  })

  it('draws the graphite frame round the page and gives the content the panel ground', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const root = componentScss.slice(
      componentScss.indexOf('.gbt-app-shell {'),
      componentScss.indexOf('&__skip'),
    )
    const content = componentScss.slice(
      componentScss.indexOf('&__content {'),
      componentScss.indexOf('&:focus-visible', componentScss.indexOf('&__content {')),
    )
    expect(root).toContain('background: var(--frame)')
    expect(content).toContain('background: var(--bg-panel)')
    expect(content).toContain('border-top-left-radius')
  })

  it('lets the nav blur with the page behind the search backdrop, except when the mobile drawer is open', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const desktopNav = componentScss.slice(
      componentScss.indexOf('&__nav {'),
      componentScss.indexOf('&__brand'),
    )
    const drawerNav = componentScss.slice(
      componentScss.indexOf('&__nav {', componentScss.indexOf('@media (max-width')),
      componentScss.indexOf('&--open'),
    )
    expect(desktopNav).not.toContain('z-index')
    expect(drawerNav).toContain('z-index: 1030')
  })

  it('narrows the nav to an icon rail when collapsed', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const desktopNav = componentScss.slice(
      componentScss.indexOf('&__nav {'),
      componentScss.indexOf('&__brand'),
    )
    expect(desktopNav).toContain('&--collapsed')
    expect(desktopNav).toContain('width: 64px')
    expect(desktopNav).toContain('transition: width')
    expect(desktopNav).toContain('overflow-x: hidden')
  })

  it('holds the rail and the header to the window, the rail scrolling on its own under a fixed bottom', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const rule = (selector: string) => {
      const start = componentScss.indexOf(selector)
      return componentScss.slice(start, componentScss.indexOf('\n  }', start))
    }
    const nav = rule('&__nav {')
    expect(nav).toContain('position: sticky')
    expect(nav).toContain('height: 100dvh')
    expect(nav).toContain('overflow-y: auto')
    const bottom = rule('&__bottom {')
    expect(bottom).toContain('position: sticky')
    expect(bottom).toContain('bottom: 0')
    const header = rule('&__header {')
    expect(header).toContain('position: sticky')
    expect(header).toContain('top: 0')
    expect(header).toContain('var(--gbt-shell-header-bg, var(--bg-panel))')
  })

  it('on a wide screen, holds the frame still and lets the sheet scroll its own content, under its corner', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const block = (start: string, end: string) =>
      componentScss.slice(componentScss.indexOf(start), componentScss.indexOf(end))
    const frame = block('.gbt-app-shell {', '&__skip {')
    expect(frame).toMatch(
      /@media \(min-width: \$drawer-breakpoint \+ 1\) \{\s*height: 100vh;\s*height: 100dvh;\s*min-height: 0;\s*overflow: hidden;/,
    )
    const content = block('&__content {', '@media (max-width: $drawer-breakpoint)')
    expect(content).toContain('border-top-left-radius: $corner')
    expect(content).toMatch(
      /@media \(min-width: \$drawer-breakpoint \+ 1\) \{\s*min-height: 0;\s*overflow-y: auto;/,
    )
    // The corner is the sheet's own: nothing redraws it over what scrolls.
    expect(componentScss).not.toContain('radial-gradient')
    // On paper, nothing is cut at the height of the screen.
    expect(frame).toMatch(/@media print \{\s*height: auto;\s*overflow: visible;/)
    expect(content).toMatch(/@media print \{\s*overflow: visible;/)
  })

  it('animates the collapse-toggle icon rotation, guarded by prefers-reduced-motion', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const toggleRule = componentScss.slice(
      componentScss.indexOf('&__collapse-toggle {'),
      componentScss.indexOf('&__body'),
    )
    expect(toggleRule).toContain('rotate(180deg)')
    expect(toggleRule).toContain('transition: transform')

    const reducedMotion = componentScss.slice(
      componentScss.indexOf('@media (prefers-reduced-motion: reduce)'),
    )
    expect(reducedMotion).toContain('&__nav')
    expect(reducedMotion).toContain('&__collapse-toggle')
  })

  it('hides the collapse-toggle button below the drawer breakpoint — collapsing to a rail is a desktop-only concept', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const desktopToggleRule = componentScss.slice(
      componentScss.indexOf('&__collapse-toggle {'),
      componentScss.indexOf('&__body'),
    )
    expect(desktopToggleRule).not.toContain('display: none')

    const drawerBlock = componentScss.slice(
      componentScss.indexOf('@media (max-width'),
      componentScss.lastIndexOf('@media (prefers-reduced-motion: reduce)'),
    )
    expect(drawerBlock).toContain('&__collapse-toggle')
    const drawerToggleRule = drawerBlock.slice(drawerBlock.indexOf('&__collapse-toggle'))
    expect(drawerToggleRule).toContain('display: none')
  })

  it('reveals a collapsed link label on hover/focus via the global stylesheet, not the component one', () => {
    const utilities = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/tokens/_utilities.scss'),
      'utf8',
    )
    expect(utilities).toContain('.gbt-app-shell__nav--collapsed')
    const collapsedRule = utilities.slice(utilities.indexOf('.gbt-app-shell__nav--collapsed'))
    expect(collapsedRule).toContain('width: 0')
    expect(collapsedRule).toContain('opacity: 0')
    expect(collapsedRule.replace(/\s+/g, ' ')).toContain('transition: opacity')
    expect(collapsedRule).toContain(':hover > span')
    expect(collapsedRule).toContain(':focus-visible > span')

    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    expect(componentScss).not.toContain('__link')
  })

  it('keeps the collapsed link icon anchored — no justify-content jump, no static-to-absolute jump during the collapse animation itself', () => {
    const utilities = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/tokens/_utilities.scss'),
      'utf8',
    )
    const collapsedBlock = utilities.slice(
      utilities.indexOf('.gbt-app-shell__nav--collapsed'),
      utilities.indexOf('.gbt-container'),
    )
    // justify-content can't animate, so re-centring the icon mid-collapse would jump.
    expect(collapsedBlock).not.toContain('justify-content')

    // Only the hover flyout takes the label out of flow; otherwise its fade wouldn't follow the rail's width.
    const baseSpanRule = collapsedBlock.slice(
      collapsedBlock.indexOf('> span {'),
      collapsedBlock.indexOf(':hover > span'),
    )
    expect(baseSpanRule).not.toContain('position: absolute')

    // The flyout rule is the `flyout` mixin, included on focus and on a real hover.
    const hoverRule = collapsedBlock.slice(collapsedBlock.indexOf(':hover > span'))
    expect(hoverRule).toContain('@include flyout')
    const flyoutMixin = utilities.slice(
      utilities.indexOf('@mixin flyout'),
      utilities.indexOf('.gbt-app-shell__nav--collapsed'),
    )
    expect(flyoutMixin).toContain('position: absolute')
  })

  it("keeps the two files' desktop-only guards in sync (769px = 768px drawer breakpoint + 1)", () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/app-shell/app-shell.scss'),
      'utf8',
    )
    const breakpointMatch = componentScss.match(/\$drawer-breakpoint:\s*(\d+)px/)
    expect(breakpointMatch).not.toBeNull()
    const drawerBreakpoint = Number(breakpointMatch![1])

    const utilities = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/tokens/_utilities.scss'),
      'utf8',
    )
    expect(utilities).toContain(`@media (min-width: ${drawerBreakpoint + 1}px)`)
  })

  it('renders the drawer collapsed, and the button denotes it', () => {
    const fixture = setup()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(button(fixture).getAttribute('aria-expanded')).toBe('false')
    expect(button(fixture).getAttribute('aria-controls')).toBe(nav.id)
    expect(button(fixture).getAttribute('aria-label')).toBe('Ouvrir la navigation')
    expect(fixture.nativeElement.querySelector('.gbt-app-shell__scrim')).toBeNull()
  })

  it("expands the drawer and changes the button's label", () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()
    expect(button(fixture).getAttribute('aria-expanded')).toBe('true')
    expect(button(fixture).getAttribute('aria-label')).toBe('Fermer la navigation')
    expect(fixture.nativeElement.querySelector('.gbt-app-shell__scrim')).not.toBeNull()
  })

  it('moves focus into the drawer on open', async () => {
    const fixture = setup()
    button(fixture).focus()
    button(fixture).click()
    fixture.detectChanges()
    await Promise.resolve()

    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(document.activeElement).toBe(nav)
  })

  it('closes on Escape and returns focus to the button', () => {
    const fixture = setup()
    button(fixture).focus()
    button(fixture).click()
    fixture.detectChanges()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(button(fixture).getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button(fixture))
  })

  it('closes on a click in the backdrop, and not on a click in the drawer', () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()

    fixture.nativeElement.querySelector('nav').click()
    fixture.detectChanges()
    expect(button(fixture).getAttribute('aria-expanded')).toBe('true')

    fixture.nativeElement.querySelector('.gbt-app-shell__scrim').click()
    fixture.detectChanges()
    expect(button(fixture).getAttribute('aria-expanded')).toBe('false')
  })

  it('traps focus within the expanded drawer', () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()

    const nav = fixture.nativeElement.querySelector('nav')
    const focusableElements = [
      ...(nav.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>),
    ]
    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]

    last.focus()
    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(first)

    first.focus()
    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(last)
  })

  it('collapse toggle button is reachable by tab and wraps focus back to first', () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()

    const nav = fixture.nativeElement.querySelector('nav')
    const collapseBtn = collapseToggle(fixture)
    const links = [...(nav.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>)]
    const firstLink = links[0]

    // Focus the collapse button directly and verify Tab wraps back to first
    collapseBtn.focus()
    expect(document.activeElement).toBe(collapseBtn)

    nav.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(firstLink)
  })

  it('leaves out of the focus trap an element that is not rendered (the collapse toggle in the drawer)', () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()

    // jsdom has no layout; a real browser reports false for `display: none` (the collapse toggle is
    // hidden in the mobile drawer), which is what the trap must skip.
    const toggle = collapseToggle(fixture)
    Object.defineProperty(toggle, 'checkVisibility', { configurable: true, value: () => false })
    const nav = fixture.nativeElement.querySelector('nav')
    const links = [...(nav.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>)]
    const first = links[0]
    const last = links[links.length - 1]
    expect(nav.contains(toggle)).toBe(true)

    // Shift+Tab on the first link goes to the last VISIBLE element, not to the hidden toggle.
    first.focus()
    nav.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }),
    )
    expect(document.activeElement).toBe(last)

    // Tab on the last visible one wraps to the first instead of leaving the drawer.
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    last.focus()
    nav.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
  })

  it('is expanded by default, offering to collapse', () => {
    const fixture = setup()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(false)
    expect(collapseToggle(fixture).getAttribute('aria-label')).toBe('Réduire la navigation')
    expect(collapseToggle(fixture).getAttribute('aria-expanded')).toBe('true')
  })

  it('collapses on click, emitting collapsedChange, and then offers to expand', () => {
    const fixture = setup()
    collapseToggle(fixture).click()
    fixture.detectChanges()

    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(true)
    expect(collapseToggle(fixture).getAttribute('aria-label')).toBe('Agrandir la navigation')
    expect(collapseToggle(fixture).getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps a single collapse-toggle icon and rotates it 180° when collapsed, instead of swapping icons', () => {
    const fixture = setup()
    const iconName = () =>
      fixture.debugElement.query(By.directive(Icon)).componentInstance.name() as string

    expect(iconName()).toBe('chevrons-left')
    expect(
      collapseToggle(fixture).classList.contains('gbt-app-shell__collapse-toggle--collapsed'),
    ).toBe(false)

    collapseToggle(fixture).click()
    fixture.detectChanges()

    expect(iconName()).toBe('chevrons-left')
    expect(
      collapseToggle(fixture).classList.contains('gbt-app-shell__collapse-toggle--collapsed'),
    ).toBe(true)
  })

  it('expands again on a second click', () => {
    const fixture = setup()
    collapseToggle(fixture).click()
    fixture.detectChanges()
    collapseToggle(fixture).click()
    fixture.detectChanges()

    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(false)
    expect(collapseToggle(fixture).getAttribute('aria-label')).toBe('Réduire la navigation')
  })

  it('does not collapse on its own if the consumer never updates the bound value (fully controlled)', () => {
    @Component({
      standalone: true,
      imports: [AppShell],
      template: `
        <gbt-app-shell
          navLabel="Navigation principale"
          skipLabel="Aller au contenu principal"
          openMenuLabel="Ouvrir la navigation"
          closeMenuLabel="Fermer la navigation"
          collapseLabel="Réduire la navigation"
          expandLabel="Agrandir la navigation"
        >
          <a shell-brand href="/">Hangar</a>
          <a shell-nav href="/depots" class="gbt-app-shell__link">Dépôts</a>
        </gbt-app-shell>
      `,
    })
    class UncontrolledHost {}

    const fixture = TestBed.createComponent(UncontrolledHost)
    fixture.detectChanges()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    fixture.nativeElement.querySelector('.gbt-app-shell__collapse-toggle').click()
    fixture.detectChanges()

    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(false)
  })

  it('omits the collapse-toggle button when collapsible is false, without needing collapseLabel/expandLabel', () => {
    @Component({
      standalone: true,
      imports: [AppShell],
      template: `
        <gbt-app-shell
          navLabel="Navigation principale"
          skipLabel="Aller au contenu principal"
          openMenuLabel="Ouvrir la navigation"
          closeMenuLabel="Fermer la navigation"
          [collapsible]="false"
        >
          <a shell-brand href="/">Hangar</a>
          <a shell-nav href="/depots" class="gbt-app-shell__link">Dépôts</a>
        </gbt-app-shell>
      `,
    })
    class NotCollapsibleHost {}

    const fixture = TestBed.createComponent(NotCollapsibleHost)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-app-shell__collapse-toggle')).toBeNull()
  })

  it('still lets an app drive collapsed/collapsedChange from its own control when collapsible is false', () => {
    @Component({
      standalone: true,
      imports: [AppShell],
      template: `
        <button type="button" data-external-toggle (click)="collapsed.set(!collapsed())">
          Basculer
        </button>
        <gbt-app-shell
          navLabel="Navigation principale"
          skipLabel="Aller au contenu principal"
          openMenuLabel="Ouvrir la navigation"
          closeMenuLabel="Fermer la navigation"
          [collapsible]="false"
          [collapsed]="collapsed()"
          (collapsedChange)="collapsed.set($event)"
        >
          <a shell-brand href="/">Hangar</a>
          <a shell-nav href="/depots" class="gbt-app-shell__link">Dépôts</a>
        </gbt-app-shell>
      `,
    })
    class ExternallyControlledHost {
      collapsed = signal(false)
    }

    const fixture = TestBed.createComponent(ExternallyControlledHost)
    fixture.detectChanges()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(false)

    fixture.nativeElement.querySelector('[data-external-toggle]').click()
    fixture.detectChanges()

    expect(nav.classList.contains('gbt-app-shell__nav--collapsed')).toBe(true)
  })

  it('has no violation detected by axe, nav collapsed', async () => {
    const fixture = setup()
    collapseToggle(fixture).click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no violation detected by axe, drawer expanded', async () => {
    const fixture = setup()
    button(fixture).click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('AppShell collapsed rail flyout', () => {
  const root = join(process.cwd(), 'projects/gabarit/src/lib')

  it('lets the flyout label out: neither the collapsed rail nor its links clip their box', () => {
    const componentScss = readFileSync(join(root, '../../app-shell/app-shell.scss'), 'utf8')
    const collapsedRail = componentScss.slice(
      componentScss.indexOf('&--collapsed {'),
      componentScss.indexOf('&__brand'),
    )
    expect(collapsedRail).toContain('width: 64px')
    expect(collapsedRail).toContain('overflow: visible')

    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const collapsedLink = utilities.slice(
      utilities.indexOf('.gbt-app-shell__nav--collapsed'),
      utilities.indexOf('> span {', utilities.indexOf('.gbt-app-shell__nav--collapsed')),
    )
    expect(collapsedLink).toContain('overflow: visible')
  })

  it('still clips when expanded and in the drawer (the base rules are unchanged)', () => {
    const componentScss = readFileSync(join(root, '../../app-shell/app-shell.scss'), 'utf8')
    const baseNav = componentScss.slice(
      componentScss.indexOf('&__nav {'),
      componentScss.indexOf('&--collapsed {'),
    )
    expect(baseNav).toContain('overflow-x: hidden')

    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const baseLink = utilities.slice(
      utilities.indexOf('.gbt-app-shell__link {'),
      utilities.indexOf('@media (min-width: 769px)'),
    )
    expect(baseLink).toContain('overflow: hidden')
  })

  function flyoutSource(): string {
    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const start = utilities.indexOf('@mixin flyout')
    return utilities.slice(start, utilities.indexOf('@media (min-width: 769px)', start))
  }

  it('paints the flyout in the primary text colour, above the header, never in the white of the current link', () => {
    const flyout = flyoutSource()
    expect(flyout).toContain('color: var(--text-primary)')
    const zIndex = Number(/z-index:\s*(\d+)/.exec(flyout)?.[1])
    // The header is z-index 1010, the mobile drawer 1030 (which has no flyout).
    expect(zIndex).toBeGreaterThan(1010)
  })

  it('shows the flyout on hover only where a pointer hovers, and on keyboard focus always', () => {
    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const collapsed = utilities.slice(utilities.indexOf('.gbt-app-shell__nav--collapsed'))
    const hoverMedia = collapsed.indexOf('@media (hover: hover)')
    expect(hoverMedia).toBeGreaterThan(-1)
    // Every `:hover > span` rule sits inside that media query; the focus rule sits outside it.
    expect(collapsed.indexOf('&:hover > span')).toBeGreaterThan(hoverMedia)
    expect(collapsed.indexOf('&:focus-visible > span')).toBeLessThan(hoverMedia)
    expect(collapsed.match(/:hover > span/g)?.length).toBe(1)
  })

  it('bridges the gap between the link and the flyout, so the pointer can reach it', () => {
    const flyout = flyoutSource()
    const gap = Number(/left:\s*calc\(100% \+ ([\d.]+)rem\)/.exec(flyout)?.[1])
    const bridge = flyout.slice(flyout.indexOf('&::before'))
    const bridgeWidth = Number(/width:\s*([\d.]+)rem/.exec(bridge)?.[1])
    expect(gap).toBeGreaterThan(0)
    expect(bridge).toContain('right: 100%')
    expect(bridgeWidth).toBeGreaterThanOrEqual(gap)
  })
})
