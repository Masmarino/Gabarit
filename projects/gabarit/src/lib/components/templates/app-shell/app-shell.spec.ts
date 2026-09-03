import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AppShell } from './app-shell'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [AppShell],
  template: `
    <gbt-app-shell
      navLabel="Navigation principale"
      skipLabel="Aller au contenu principal"
      openMenuLabel="Ouvrir la navigation"
      closeMenuLabel="Fermer la navigation"
    >
      <a shell-brand href="/">Hangar</a>
      <a shell-nav href="/depots" class="gbt-app-shell__link" aria-current="page">Dépôts</a>
      <a shell-nav href="/utilisateurs" class="gbt-app-shell__link">Utilisateurs</a>
      <h1 shell-header>Tableau de bord</h1>
      <p data-content>Le contenu de la page.</p>
    </gbt-app-shell>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const button = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-app-shell__toggle')

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
    const componentScss = readFileSync(
      join(root, 'components/templates/app-shell/app-shell.scss'),
      'utf8',
    )
    expect(utilities).toContain('.gbt-app-shell__link')
    expect(componentScss).not.toContain('__link')
  })

  it('gives the panel background to the whole page, content included', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/components/templates/app-shell/app-shell.scss'),
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
    expect(root).toContain('background: var(--bg-panel)')
    expect(content).not.toContain('background:')
  })

  it('lets the nav blur with the page behind the search backdrop, except when the mobile drawer is open', () => {
    const componentScss = readFileSync(
      join(process.cwd(), 'projects/gabarit/src/lib/components/templates/app-shell/app-shell.scss'),
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

    const links: HTMLAnchorElement[] = [...fixture.nativeElement.querySelectorAll('nav a')]
    const first = links[0]
    const last = links[links.length - 1]

    last.focus()
    fixture.nativeElement
      .querySelector('nav')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(first)

    first.focus()
    fixture.nativeElement
      .querySelector('nav')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(last)
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
