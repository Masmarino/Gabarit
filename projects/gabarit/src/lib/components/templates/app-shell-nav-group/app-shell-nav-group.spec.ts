import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { AppShell } from '../app-shell/app-shell'
import { AppShellNavGroup } from './app-shell-nav-group'

@Component({
  standalone: true,
  imports: [AppShellNavGroup],
  template: `
    <nav aria-label="Main">
      <gbt-app-shell-nav-group label="Administration" [icon]="icon()" [(expanded)]="expanded">
        <a href="/admin/users" class="gbt-app-shell__link" aria-current="page"
          ><span>Users</span></a
        >
        <a href="/admin/health" class="gbt-app-shell__link"><span>Health</span></a>
      </gbt-app-shell-nav-group>
      <gbt-app-shell-nav-group label="Other">
        <a href="/other" class="gbt-app-shell__link"><span>Other page</span></a>
      </gbt-app-shell-nav-group>
    </nav>
  `,
})
class Host {
  expanded = signal(false)
  icon = signal<string | null>(null)
}

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    button: (index = 0) =>
      root.querySelectorAll<HTMLButtonElement>('.gbt-app-shell-nav-group__toggle')[index],
    panel: (index = 0) =>
      root.querySelectorAll<HTMLElement>('.gbt-app-shell-nav-group__panel')[index],
  }
}

describe('AppShellNavGroup', () => {
  it('renders a native toggle button named by the label, collapsed by default', () => {
    const { button, panel } = setup()

    expect(button().tagName).toBe('BUTTON')
    expect(button().getAttribute('type')).toBe('button')
    expect(button().textContent).toContain('Administration')
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(panel().hidden).toBe(true)
  })

  it('wears the shell link look, so it inherits its layout, hover and rail flyout', () => {
    const { button } = setup()

    expect(button().classList.contains('gbt-app-shell__link')).toBe(true)
    // The label is a direct child <span>: what the collapsed rail's flyout reveals.
    expect(button().querySelector(':scope > span')?.textContent).toContain('Administration')
  })

  it('links the toggle to its panel with aria-controls, with distinct ids per instance', () => {
    const { button, panel } = setup()

    expect(button(0).getAttribute('aria-controls')).toBe(panel(0).id)
    expect(button(1).getAttribute('aria-controls')).toBe(panel(1).id)
    expect(panel(0).id).not.toBe(panel(1).id)
  })

  it('expands and collapses on click, keeping the accessible name unchanged', () => {
    const { fixture, host, button, panel } = setup()

    button().click()
    fixture.detectChanges()
    expect(button().getAttribute('aria-expanded')).toBe('true')
    expect(panel().hidden).toBe(false)
    expect(host.expanded()).toBe(true)
    expect(button().textContent).toContain('Administration')
    expect(button().hasAttribute('aria-label')).toBe(false)

    button().click()
    fixture.detectChanges()
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(panel().hidden).toBe(true)
    expect(host.expanded()).toBe(false)
  })

  it('follows the expanded model when the app sets it', () => {
    const { fixture, host, button, panel } = setup()

    host.expanded.set(true)
    fixture.detectChanges()

    expect(button().getAttribute('aria-expanded')).toBe('true')
    expect(panel().hidden).toBe(false)
    expect(
      fixture.nativeElement
        .querySelector('.gbt-app-shell-nav-group')
        ?.hasAttribute('data-expanded'),
    ).toBe(true)
  })

  it('keeps an unbound group independent of the others', () => {
    const { fixture, button, panel } = setup()

    button(1).click()
    fixture.detectChanges()

    expect(panel(1).hidden).toBe(false)
    expect(panel(0).hidden).toBe(true)
  })

  it('shows the group icon before the label only when one is given, and hides every icon from assistive technology', () => {
    const { fixture, host, button } = setup()
    const icons = () => button().querySelectorAll('gbt-icon')

    // Only the chevron.
    expect(icons().length).toBe(1)

    host.icon.set('check')
    fixture.detectChanges()
    expect(icons().length).toBe(2)
    for (const icon of Array.from(icons())) {
      expect(icon.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('projects the sub-links into the panel, keeping aria-current on the current one', () => {
    const { panel } = setup()

    const links = [...panel().querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/admin/users', '/admin/health'])
    expect(links[0].getAttribute('aria-current')).toBe('page')
  })

  it('publishes the sub-link indent, the rail alignment and the current-group weight in the global stylesheet', () => {
    const utilities = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/tokens/_utilities.scss'),
      'utf8',
    )
    expect(utilities).toContain('.gbt-app-shell-nav-group__panel .gbt-app-shell__link')
    expect(utilities).toContain(
      '.gbt-app-shell__nav--collapsed .gbt-app-shell-nav-group__panel .gbt-app-shell__link',
    )
    expect(utilities).toContain(':has(.gbt-app-shell__link[aria-current])')
  })

  it('keeps the chevron inside the 40px link box of the collapsed rail (positioned, not pushed out and clipped)', () => {
    const scss = readFileSync(
      join(
        process.cwd(),
        'projects/gabarit/src/lib/components/templates/app-shell-nav-group/app-shell-nav-group.scss',
      ),
      'utf8',
    )
    const rail = scss.slice(scss.indexOf(':host-context(.gbt-app-shell__nav--collapsed)'))
    expect(rail).toContain('position: absolute')
    expect(rail).toContain('right: 0.125rem')
    // Same desktop-only guard as the shell's rail.
    expect(scss).toContain('@media (min-width: 769px)')
  })

  it('has no violation detected by axe, collapsed', async () => {
    const { fixture } = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violation detected by axe, expanded with an icon', async () => {
    const { fixture, host } = setup()
    host.expanded.set(true)
    host.icon.set('check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [AppShell, AppShellNavGroup],
  template: `
    <gbt-app-shell
      navLabel="Main"
      skipLabel="Skip"
      openMenuLabel="Open"
      closeMenuLabel="Close"
      collapseLabel="Collapse"
      expandLabel="Expand"
      [collapsed]="true"
    >
      <gbt-app-shell-nav-group shell-nav label="Administration" [expanded]="true">
        <a href="/admin/users" class="gbt-app-shell__link"><span>Users</span></a>
      </gbt-app-shell-nav-group>
      <p>Content</p>
    </gbt-app-shell>
  `,
})
class InShellHost {}

describe('AppShellNavGroup inside a collapsed AppShell', () => {
  it('projects through the [shell-nav] slot into the rail', () => {
    const fixture = TestBed.createComponent(InShellHost)
    fixture.detectChanges()
    const nav: HTMLElement = fixture.nativeElement.querySelector(
      'nav.gbt-app-shell__nav--collapsed',
    )

    expect(nav.querySelector('gbt-app-shell-nav-group')).not.toBeNull()
    expect(nav.querySelector('.gbt-app-shell-nav-group__panel a')?.getAttribute('href')).toBe(
      '/admin/users',
    )
  })

  it('has no violation detected by axe', async () => {
    const fixture = TestBed.createComponent(InShellHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [AppShell, AppShellNavGroup],
  template: `
    <gbt-app-shell
      navLabel="Main"
      skipLabel="Skip"
      openMenuLabel="Open"
      closeMenuLabel="Close"
      [collapsible]="false"
    >
      <gbt-app-shell-nav-group shell-nav label="Administration">
        <a href="/admin/users" class="gbt-app-shell__link"><span>Users</span></a>
      </gbt-app-shell-nav-group>
    </gbt-app-shell>
  `,
})
class DrawerHost {}

describe('AppShell drawer focus trap with a collapsed nav group', () => {
  it('ignores the links of the hidden panel, so Tab wraps from the last visible control', () => {
    const fixture = TestBed.createComponent(DrawerHost)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement
    root.querySelector<HTMLButtonElement>('.gbt-app-shell__toggle')!.click()
    fixture.detectChanges()

    const groupToggle = root.querySelector<HTMLButtonElement>('.gbt-app-shell-nav-group__toggle')!
    groupToggle.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    groupToggle.dispatchEvent(event)

    // The toggle is the only tabbable control of the drawer: Tab would leave it, the trap keeps it in.
    expect(event.defaultPrevented).toBe(true)
  })
})
