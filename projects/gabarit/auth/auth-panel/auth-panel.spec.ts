import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../src/testing/expect-no-a11y-violations'
import { AuthPanel } from './auth-panel'

const SCSS = readFileSync(
  join(process.cwd(), 'projects/gabarit/auth/auth-panel/auth-panel.scss'),
  'utf8',
)

const LOGO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
const LOGO_DARK = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACw='

@Component({
  standalone: true,
  imports: [AuthPanel],
  template: `<gbt-auth-panel [heading]="heading" [intro]="intro" [wide]="wide">
    <picture auth-logo>
      <source [attr.srcset]="logoDark" media="(prefers-color-scheme: dark)" />
      <img [src]="logo" alt="Acme" width="480" height="120" />
    </picture>
    <p class="projected">The page's content</p>
  </gbt-auth-panel>`,
})
class Host {
  heading = 'Sign in'
  intro = 'One sentence.'
  wide = false
  logo = LOGO
  logoDark = LOGO_DARK
}

/** The same panel, without a logo projected. */
@Component({
  standalone: true,
  imports: [AuthPanel],
  template: `<gbt-auth-panel heading="Sign in"
    ><p class="projected">The page's content</p></gbt-auth-panel
  >`,
})
class NoLogoHost {}

/** `wide` as a bare attribute. */
@Component({
  standalone: true,
  imports: [AuthPanel],
  template: `<gbt-auth-panel heading="Two-factor authentication" wide />`,
})
class WideAttributeHost {}

describe('AuthPanel', () => {
  function setup(patch: Partial<Host> = {}) {
    const fixture = TestBed.createComponent(Host)
    Object.assign(fixture.componentInstance, patch)
    fixture.detectChanges()
    return { fixture, el: fixture.nativeElement as HTMLElement }
  }

  it('owns the main landmark, the panel and the projected logo with its dark variant', () => {
    const { el } = setup()

    expect(el.querySelectorAll('main').length).toBe(1)
    expect(el.querySelector('main.gbt-auth-panel .gbt-auth-panel__panel')).toBeTruthy()
    const logo = el.querySelector('.gbt-auth-panel__logo')!
    expect(logo.querySelector('img')?.getAttribute('alt')).toBe('Acme')
    expect(logo.querySelector('img')?.getAttribute('src')).toBe(LOGO)
    const dark = logo.querySelector('picture source')
    expect(dark?.getAttribute('srcset')).toBe(LOGO_DARK)
    expect(dark?.getAttribute('media')).toBe('(prefers-color-scheme: dark)')
    // The logo is the first thing in the panel, before the heading.
    expect(el.querySelector('.gbt-auth-panel__panel')?.firstElementChild).toBe(logo)
  })

  it('leaves the logo slot empty when nothing is projected (hidden by :empty)', () => {
    const fixture = TestBed.createComponent(NoLogoHost)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement

    const logo = el.querySelector('.gbt-auth-panel__logo')!
    // jsdom does not compute `:empty`: the slot has no element child, and the rule hides it.
    expect(logo.children.length).toBe(0)
    expect(logo.textContent?.trim()).toBe('')
    expect(el.querySelector('img')).toBeNull()
    expect(SCSS).toMatch(/\.gbt-auth-panel__logo\s*\{[^}]*&:empty\s*\{\s*display:\s*none/)
    // The default slot still gets the page's content.
    expect(el.querySelector('.gbt-auth-panel__logo .projected')).toBeNull()
    expect(el.querySelector('.gbt-auth-panel__panel .projected')).toBeTruthy()
  })

  it('shows the heading as the page h1, focusable by script, then the intro, then the projected content', () => {
    const { el } = setup()

    const h1 = el.querySelector('h1')!
    expect(h1.textContent?.trim()).toBe('Sign in')
    expect(h1.classList).toContain('gbt-auth-panel__heading')
    expect(h1.getAttribute('tabindex')).toBe('-1')
    expect(el.querySelector('p.gbt-auth-panel__intro')?.textContent?.trim()).toBe('One sentence.')
    expect(
      h1.compareDocumentPosition(el.querySelector('.projected')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(el.querySelector('.projected')?.textContent).toBe("The page's content")
    // The projected content is not swallowed by the logo slot.
    expect(el.querySelector('.gbt-auth-panel__logo .projected')).toBeNull()
  })

  it('leaves the heading alone, with room under it, when there is no intro', () => {
    const { el } = setup({ intro: '' })

    expect(el.querySelector('.gbt-auth-panel__intro')).toBeNull()
    expect(el.querySelector('h1')?.classList).toContain('gbt-auth-panel__heading--alone')
  })

  it('draws no heading at all when there is none (a state that draws its own)', () => {
    const { el } = setup({ heading: '', intro: 'ignored' })

    expect(el.querySelector('h1')).toBeNull()
    expect(el.querySelector('.gbt-auth-panel__intro')).toBeNull()
    expect(el.querySelector('.projected')).toBeTruthy()
  })

  it('is wider only when asked to be', () => {
    expect(setup().el.querySelector('.gbt-auth-panel__panel--wide')).toBeNull()
    TestBed.resetTestingModule()
    expect(setup({ wide: true }).el.querySelector('.gbt-auth-panel__panel--wide')).toBeTruthy()
  })

  it('takes wide as a bare attribute', () => {
    const fixture = TestBed.createComponent(WideAttributeHost)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-auth-panel__panel--wide')).toBeTruthy()
  })

  it('has no a11y violations with a heading and intro, alone, or without a heading', async () => {
    await expectNoA11yViolations(setup().el)
    TestBed.resetTestingModule()
    await expectNoA11yViolations(setup({ intro: '' }).el)
    TestBed.resetTestingModule()
    await expectNoA11yViolations(setup({ heading: '' }).el)
    TestBed.resetTestingModule()
    const noLogo = TestBed.createComponent(NoLogoHost)
    noLogo.detectChanges()
    await expectNoA11yViolations(noLogo.nativeElement)
  })
})
