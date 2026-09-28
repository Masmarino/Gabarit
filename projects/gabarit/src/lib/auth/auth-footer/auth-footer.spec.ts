import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, Directive, Injectable, inject, input } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../testing/expect-no-a11y-violations'
import { Button } from '../../components/atoms/button/button'
import { AuthFooter, AuthFooterLink } from './auth-footer'

const SCSS = readFileSync(
  join(process.cwd(), 'projects/gabarit/src/lib/auth/auth-footer/auth-footer.scss'),
  'utf8',
)

// Gabarit does not depend on `@angular/router`: a stand-in with the part of `routerLink` that matters
// here (it draws the `href`, and on a plain click it navigates in the app and cancels the browser's).
@Injectable({ providedIn: 'root' })
class FakeRouter {
  url = '/'
}

@Directive({
  // The router's own selector, so the hosts below read as an application writes them.
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'a[routerLink]',
  standalone: true,
  host: { '[attr.href]': 'routerLink()', '(click)': 'navigate($event)' },
})
class RouterLink {
  routerLink = input.required<string>()
  private readonly router = inject(FakeRouter)

  protected navigate(event: MouseEvent): void {
    event.preventDefault()
    this.router.url = this.routerLink()
  }
}

/** The drawn form: `href` and `linkText`, no router. */
@Component({
  standalone: true,
  imports: [AuthFooter],
  template: `<gbt-auth-footer
    text="No account yet?"
    linkText="Create an account"
    href="/register"
  />`,
})
class Host {}

/** The projected form, as an application writes it: its own `routerLink` on the anchor. */
@Component({
  standalone: true,
  imports: [AuthFooter, AuthFooterLink, Button, RouterLink],
  template: `<gbt-auth-footer text="No account yet?"
    ><a gbtButton variant="link" gbtAuthFooterLink routerLink="/register"
      >Create an account</a
    ></gbt-auth-footer
  >`,
})
class ProjectedHost {}

/** The sentence alone: neither `href` nor a projected link. */
@Component({
  standalone: true,
  imports: [AuthFooter],
  template: `<gbt-auth-footer text="No account yet?" />`,
})
class TextOnlyHost {}

/** The `routerLink` + `a[gbtButton]` combination, as a projected footer link. */
@Component({
  standalone: true,
  imports: [AuthFooter, AuthFooterLink, RouterLink, Button],
  template: `<gbt-auth-footer text="No account yet?"
    ><a gbtButton variant="link" gbtAuthFooterLink [routerLink]="'/register'" [disabled]="disabled"
      >Create an account</a
    ></gbt-auth-footer
  >`,
})
class LinkHost {
  disabled = false
}

describe('AuthFooter', () => {
  it('says the sentence and links to the sibling page, as a link button', () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement

    expect(el.querySelector('p.gbt-auth-footer > span')?.textContent?.trim()).toBe(
      'No account yet?',
    )
    const link = el.querySelector<HTMLAnchorElement>('a')!
    expect(link.textContent?.trim()).toBe('Create an account')
    expect(link.getAttribute('href')).toBe('/register')
    expect(link.classList).toContain('gbt-button')
    expect(link.classList).toContain('gbt-button--link')
    expect(link.classList).toContain('gbt-auth-footer__link')
  })

  it('navigates to the sibling page when the projected routerLink is clicked', async () => {
    const fixture = TestBed.createComponent(ProjectedHost)
    fixture.detectChanges()
    const router = TestBed.inject(FakeRouter)

    fixture.nativeElement.querySelector('a').click()
    await fixture.whenStable()

    expect(router.url).toBe('/register')
  })

  it('places a projected link after the sentence, with the link-button and footer-link classes', () => {
    const fixture = TestBed.createComponent(ProjectedHost)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement

    const links = el.querySelectorAll<HTMLAnchorElement>('p.gbt-auth-footer a')
    expect(links.length).toBe(1)
    const link = links[0]
    expect(link.previousElementSibling?.textContent?.trim()).toBe('No account yet?')
    expect(link.textContent?.trim()).toBe('Create an account')
    expect(link.getAttribute('href')).toBe('/register')
    expect(link.classList).toContain('gbt-button')
    expect(link.classList).toContain('gbt-button--link')
    // The class hook of the 44px rule, set by AuthFooterLink.
    expect(link.classList).toContain('gbt-auth-footer__link')
  })

  it('draws no link of its own without href (only the sentence)', () => {
    const fixture = TestBed.createComponent(TextOnlyHost)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement

    expect(el.querySelector('a')).toBeNull()
    expect(el.querySelector('.gbt-auth-footer')?.textContent?.trim()).toBe('No account yet?')
  })

  it('makes the link, drawn or projected, 44px high to tap', () => {
    expect(SCSS).toMatch(
      /\.gbt-auth-footer ::ng-deep \.gbt-auth-footer__link,\s*\.gbt-auth-footer ::ng-deep a\.gbt-button--link\s*\{\s*min-height:\s*2\.75rem/,
    )
  })

  it('has no a11y violations, drawn or projected', async () => {
    const drawn = TestBed.createComponent(Host)
    drawn.detectChanges()
    await expectNoA11yViolations(drawn.nativeElement)

    TestBed.resetTestingModule()
    const projected = TestBed.createComponent(ProjectedHost)
    projected.detectChanges()
    await expectNoA11yViolations(projected.nativeElement)
  })
})

/** The `routerLink` + `a[gbtButton]` combination every projected footer link relies on. */
describe('a[gbtButton][gbtAuthFooterLink] with a routerLink', () => {
  function setup(disabled: boolean) {
    const fixture = TestBed.createComponent(LinkHost)
    fixture.componentInstance.disabled = disabled
    fixture.detectChanges()
    return {
      fixture,
      link: fixture.nativeElement.querySelector('a') as HTMLAnchorElement,
      router: TestBed.inject(FakeRouter),
    }
  }

  it('stays a real link (href, no aria-disabled) and navigates on click', async () => {
    const { fixture, link, router } = setup(false)

    expect(link.getAttribute('href')).toBe('/register')
    expect(link.hasAttribute('aria-disabled')).toBe(false)
    link.click()
    await fixture.whenStable()

    expect(router.url).toBe('/register')
  })

  it('does not navigate when disabled, and leaves the tab order', async () => {
    const { fixture, link, router } = setup(true)

    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.getAttribute('tabindex')).toBe('-1')
    link.click()
    await fixture.whenStable()

    expect(router.url).toBe('/')
  })
})
