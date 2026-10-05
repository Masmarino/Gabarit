import { Component, type Provider, type Type, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Button } from '../button/button'
import { Icon } from '../icon/icon'
import { type LoginLabels, provideAuthLabels } from '../auth/auth-labels'
import { AuthFooterLink } from '../auth/auth-footer/auth-footer'
import { MfaEnrollment } from '../mfa-enrollment/mfa-enrollment'
import { AUTH_PORT } from '../auth/ports/auth.port'
import { TOTP_QR_RENDERER } from '../mfa-enrollment/totp-qr/totp-qr'
import { type FakeAuthPort, fakeAuthPort, fakeQrRenderer } from '../auth/testing/fake-ports'
import {
  REQUEST_OPTIONS,
  dismissedPrompt,
  fakeAssertion,
  stubPasskeyBrowser,
} from '../auth/testing/webauthn-testing'
import { AuthLogin } from './login'

const LOGO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

/** The application's page: its logo, its link to the registration page, and what it does on `loggedIn`. */
@Component({
  standalone: true,
  imports: [AuthLogin, Button, AuthFooterLink],
  template: `<gbt-auth-login [labels]="labels()" (loggedIn)="loggedIn = loggedIn + 1">
    <img auth-logo src="${LOGO}" alt="Acme" />
    <a gbtButton variant="link" gbtAuthFooterLink href="/register">Create an account</a>
  </gbt-auth-login>`,
})
class Host {
  labels = signal<Partial<LoginLabels>>({})
  loggedIn = 0
}

/** An application that offers no registration link at all. */
@Component({
  standalone: true,
  imports: [AuthLogin],
  template: `<gbt-auth-login (loggedIn)="loggedIn = loggedIn + 1">
    <img auth-logo src="${LOGO}" alt="Acme" />
  </gbt-auth-login>`,
})
class HostWithoutLink {
  labels = signal<Partial<LoginLabels>>({})
  loggedIn = 0
}

/** An application with something to say above the form (a session that ended, a link that failed). */
@Component({
  standalone: true,
  imports: [AuthLogin],
  template: `<gbt-auth-login>
    <img auth-logo src="${LOGO}" alt="Acme" />
    <p auth-notice class="notice">Your sessions were ended.</p>
  </gbt-auth-login>`,
})
class HostWithNotice {
  labels = signal<Partial<LoginLabels>>({})
  loggedIn = 0
}

describe('AuthLogin', () => {
  function setup(
    options: { providers?: Provider[]; host?: Type<Host | HostWithoutLink | HostWithNotice> } = {},
  ) {
    const port: FakeAuthPort = fakeAuthPort()
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_PORT, useValue: port },
        { provide: TOTP_QR_RENDERER, useValue: fakeQrRenderer },
        ...(options.providers ?? []),
      ],
    })
    const fixture = TestBed.createComponent<Host | HostWithoutLink | HostWithNotice>(
      options.host ?? Host,
    )
    fixture.detectChanges()
    const component = fixture.debugElement.query(By.directive(AuthLogin))
      .componentInstance as AuthLogin
    return {
      fixture,
      component,
      port,
      host: fixture.componentInstance,
      el: fixture.nativeElement as HTMLElement,
    }
  }

  const submitButton = (el: HTMLElement) =>
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!
  /** The page's own submit button (`gbt-button`), as a component. */
  const submitComponent = (fixture: ReturnType<typeof setup>['fixture']) =>
    fixture.debugElement.query(By.css('gbt-button.gbt-auth-panel__submit'))
      .componentInstance as Button

  it('shows an error message when login fails', () => {
    const { fixture, component, port } = setup()
    component.username.set('admin')
    component['password'].set('wrong')

    component.submit()
    port.calls.expectOne('login').fail(401, { error: 'invalid username or password' })
    fixture.detectChanges()

    expect(component.error()).toContain('Incorrect')
  })

  describe('how a failed login is worded', () => {
    const failWith = (status: number, body: object) => {
      const ctx = setup()
      ctx.component.username.set('admin')
      ctx.component['password'].set('a-correct-password')
      ctx.component.submit()
      ctx.port.calls.expectOne('login').fail(status, body)
      ctx.fixture.detectChanges()
      return ctx
    }
    const alertOf = (el: HTMLElement) =>
      el.querySelector('gbt-alert [role="alert"]')?.textContent?.trim()

    it('says the username or password is wrong on a 401 only', () => {
      const { el } = failWith(401, { error: 'invalid username or password' })

      expect(alertOf(el)).toBe('Incorrect username or password')
    })

    it('says to wait on a 429 (the rate limiter), not that the password is wrong', () => {
      const { el } = failWith(429, { error: 'too many attempts, try again later' })

      expect(alertOf(el)).toBe('Too many attempts, try again in a few minutes')
    })

    it('says the login failed, announced as an alert, on a 500 (e.g. the fail-closed answer)', () => {
      const { el, component } = failWith(500, { error: 'internal error' })

      expect(alertOf(el)).toBe('Sign-in failed, try again.')
      expect(component.error()).not.toContain('Incorrect')
    })

    it('says the login failed on a network error (status 0)', () => {
      const ctx = setup()
      ctx.component.submit()
      ctx.port.calls.expectOne('login').fail(0)
      ctx.fixture.detectChanges()

      expect(alertOf(ctx.el)).toBe('Sign-in failed, try again.')
    })

    it.each([401, 429, 500])(
      'puts the focus back in the password field and re-enables the button after a %i',
      async (status) => {
        const { fixture, component, port, el } = setup()
        component.submit()
        port.calls.expectOne('login').fail(status, {})
        fixture.detectChanges()
        await fixture.whenStable()

        expect(document.activeElement).toBe(el.querySelector('[id^="gbt-login-"][id$="-password"]'))
        expect(component.submitting()).toBe(false)
      },
    )
  })

  it('shows the error inline as an alert with an icon', () => {
    const { fixture, component, port, el } = setup()
    expect(el.querySelector('gbt-alert')).toBeNull()

    component.submit()
    port.calls.expectOne('login').fail(401, { error: 'invalid' })
    fixture.detectChanges()

    const alert = el.querySelector('gbt-alert [role="alert"]')
    expect(alert?.textContent?.trim()).toBe('Incorrect username or password')
    expect(alert?.getAttribute('role')).toBe('alert')
    const icon = fixture.debugElement.query(By.css('gbt-alert')).query(By.directive(Icon))
    expect((icon.componentInstance as Icon).name()).toBe('alert-circle')
    expect(icon.nativeElement.getAttribute('aria-hidden')).toBe('true')
  })

  it('posts the credentials and reports the user signed in on success', () => {
    const { component, port, host } = setup()
    component.username.set('admin')
    component['password'].set('secret')

    component.submit()
    const call = port.calls.expectOne('login')
    expect(call.args).toEqual(['admin', 'secret'])
    call.flush({ token: 'abc' })

    expect(host.loggedIn).toBe(1)
    // The port stores the session of `login` itself: nothing goes through `setToken`.
    expect(port.tokens).toEqual([])
  })

  it('submits when the form is submitted (Enter in a field)', () => {
    const { el, port } = setup()
    el.querySelector('form')!.dispatchEvent(new Event('submit'))
    port.calls.expectOne('login')
  })

  it('clears the previous error when submitting again', () => {
    const { fixture, component, port, el } = setup()
    component.submit()
    port.calls.expectOne('login').fail(401, {})
    fixture.detectChanges()
    expect(el.querySelector('gbt-alert')).toBeTruthy()

    component.submit()
    fixture.detectChanges()
    expect(el.querySelector('gbt-alert')).toBeNull()
    port.calls.expectOne('login')
  })

  it('shows a loading, disabled button while the login is in flight, and ignores a second submit', () => {
    const { fixture, component, port, el } = setup()
    const button = submitComponent(fixture)
    expect(button.loading()).toBe(false)

    component.submit()
    fixture.detectChanges()
    expect(button.loading()).toBe(true)
    expect(submitButton(el).disabled).toBe(true)
    expect(submitButton(el).getAttribute('aria-busy')).toBe('true')
    expect(el.textContent).toContain('Signing in')

    component.submit()
    port.calls.expectOne('login').fail(401, {})
    fixture.detectChanges()

    expect(button.loading()).toBe(false)
    expect(submitButton(el).disabled).toBe(false)
  })

  describe('the link to the registration page', () => {
    const link = (el: HTMLElement) => el.querySelector<HTMLAnchorElement>('gbt-auth-footer a')

    it('asks the instance once, when the page opens, and shows no link until it answered', () => {
      const { fixture, port, el } = setup()

      port.calls.expectOne('authConfig')
      fixture.detectChanges()

      expect(link(el)).toBeNull()
    })

    it('offers the projected "Create an account" under the form when registration is open', () => {
      const { fixture, port, el } = setup()

      port.calls.expectOne('authConfig').flush({ registrationEnabled: true })
      fixture.detectChanges()

      expect(link(el)?.textContent?.trim()).toBe('Create an account')
      expect(link(el)?.getAttribute('href')).toBe('/register')
      expect(el.querySelector('gbt-auth-footer')?.textContent).toContain('No account yet?')
      expect(
        el.querySelector('form')!.compareDocumentPosition(link(el)!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(el.querySelectorAll('button.gbt-button:not(.gbt-button--link)').length).toBe(1)
    })

    it('shows no link when registration is closed', () => {
      const { fixture, port, el } = setup()

      port.calls.expectOne('authConfig').flush({ registrationEnabled: false })
      fixture.detectChanges()

      expect(link(el)).toBeNull()
      expect(el.querySelector('gbt-auth-footer')).toBeNull()
    })

    it('shows no footer when the application projects no link, even with registration open', () => {
      const { fixture, port, el } = setup({ host: HostWithoutLink })

      port.calls.expectOne('authConfig').flush({ registrationEnabled: true })
      fixture.detectChanges()

      expect(el.querySelector('gbt-auth-footer')).toBeNull()
    })

    it('shows no link when the configuration cannot be read, and signing in still works', () => {
      const { fixture, component, port, el } = setup()

      port.calls.expectOne('authConfig').fail(500, { error: 'internal error' })
      fixture.detectChanges()
      component.submit()

      expect(link(el)).toBeNull()
      port.calls.expectOne('login')
    })

    it('does not offer it on the MFA steps', async () => {
      const { fixture, component, port, el } = setup()
      port.calls.expectOne('authConfig').flush({ registrationEnabled: true })
      component.submit()
      port.calls
        .expectOne('login')
        .flush({ token: null, mfaToken: 'pending', mfaSetupRequired: false })
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()

      expect(link(el)).toBeNull()
    })
  })

  describe('the notice ([auth-notice])', () => {
    it('shows the projected notice first in the credentials form', () => {
      const { el } = setup({ host: HostWithNotice })
      const form = el.querySelector('form')!

      expect(form.firstElementChild?.matches('[auth-notice]')).toBe(true)
      expect(form.querySelector('.notice')?.textContent).toBe('Your sessions were ended.')
    })

    it('leaves it out of the MFA steps', async () => {
      const { fixture, component, port, el } = setup({ host: HostWithNotice })
      component.submit()
      port.calls
        .expectOne('login')
        .flush({ token: null, mfaToken: 'pending', mfaSetupRequired: false })
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()

      expect(el.querySelector('[auth-notice]')).toBeNull()
    })
  })

  it('has a single, primary "Sign in" button', () => {
    const { el } = setup()
    const buttons = el.querySelectorAll('button.gbt-button:not(.gbt-button--link)')
    expect(buttons.length).toBe(1)
    expect(buttons[0].classList).toContain('gbt-button--primary')
    expect(buttons[0].textContent?.trim()).toBe('Sign in')
    expect(submitButton(el)).toBe(buttons[0])
  })

  it('spans the form with its one action (block, large: 44px to tap)', () => {
    const { el } = setup()
    expect(el.querySelector('gbt-button.gbt-auth-panel__submit')!.classList).toContain(
      'gbt-button-host--block',
    )
    expect(submitButton(el).classList).toContain('gbt-button--large')
  })

  it('labels its fields and gives them the right type and autocomplete hints', () => {
    const { el } = setup()
    const username = el.querySelector<HTMLInputElement>('[id^="gbt-login-"][id$="-username"]')!
    const password = el.querySelector<HTMLInputElement>('[id^="gbt-login-"][id$="-password"]')!
    expect(
      el.querySelector(`label[for^="gbt-login-"][for$="-username"]`)?.textContent?.trim(),
    ).toBe('Username')
    expect(
      el.querySelector(`label[for^="gbt-login-"][for$="-password"]`)?.textContent?.trim(),
    ).toBe('Password')
    expect(username.type).toBe('text')
    expect(username.getAttribute('autocomplete')).toBe('username')
    expect(password.type).toBe('password')
    expect(password.getAttribute('autocomplete')).toBe('current-password')
  })

  it('gives each instance its own element ids, so two on one document never collide', () => {
    const first = setup()
    const second = TestBed.createComponent(Host)
    second.detectChanges()
    const ids = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('gbt-auth-login [id]'), (node) => node.id)

    const both = [...ids(first.el), ...ids(second.nativeElement as HTMLElement)]
    expect(both.length).toBeGreaterThan(0)
    expect(new Set(both).size).toBe(both.length)
    // Each label still points at its own field.
    for (const el of [first.el, second.nativeElement as HTMLElement]) {
      const label = el.querySelector<HTMLLabelElement>('label[for$="-username"]')!
      expect(el.querySelector(`#${label.htmlFor}`)?.getAttribute('autocomplete')).toBe('username')
    }
  })

  it('focuses the username field when the page opens', async () => {
    const { fixture, el } = setup()
    await fixture.whenStable()
    expect(document.activeElement).toBe(el.querySelector('[id^="gbt-login-"][id$="-username"]'))
  })

  it('moves the focus to the password field after a failed login, to try again', async () => {
    const { fixture, component, port, el } = setup()
    await fixture.whenStable()
    component.submit()
    fixture.detectChanges()
    port.calls.expectOne('login').fail(401, {})
    fixture.detectChanges()
    await fixture.whenStable()
    expect(document.activeElement).toBe(el.querySelector('[id^="gbt-login-"][id$="-password"]'))
  })

  it("shows the application's logo and a heading", () => {
    const { el } = setup()
    expect(el.querySelector('.gbt-auth-panel__logo img')?.getAttribute('alt')).toBe('Acme')
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Sign in')
    // The page is the main landmark (drawn by the panel), with a single h1.
    expect(el.querySelectorAll('main').length).toBe(1)
    expect(el.querySelectorAll('h1').length).toBe(1)
  })

  describe('labels', () => {
    it('takes its strings from the labels input, string by string', () => {
      const { fixture, host, el } = setup()

      host.labels.set({ heading: 'Connexion', submit: 'Se connecter' })
      fixture.detectChanges()

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Connexion')
      expect(submitButton(el).textContent?.trim()).toBe('Se connecter')
      // What is not overridden keeps its English default.
      expect(
        el.querySelector('label[for^="gbt-login-"][for$="-username"]')?.textContent?.trim(),
      ).toBe('Username')
    })

    it('words its messages from the labels input too', () => {
      const { fixture, component, port, host, el } = setup()
      host.labels.set({ wrongCredentials: "Nom d'utilisateur ou mot de passe incorrect" })
      fixture.detectChanges()

      component.submit()
      port.calls.expectOne('login').fail(401, { error: 'invalid username or password' })
      fixture.detectChanges()

      expect(el.querySelector('gbt-alert [role="alert"]')?.textContent?.trim()).toBe(
        "Nom d'utilisateur ou mot de passe incorrect",
      )
    })

    it('takes the strings the application provided once with provideAuthLabels', () => {
      const { el } = setup({
        providers: [
          provideAuthLabels({ login: { heading: 'Connexion', username: "Nom d'utilisateur" } }),
        ],
      })

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Connexion')
      expect(
        el.querySelector('label[for^="gbt-login-"][for$="-username"]')?.textContent?.trim(),
      ).toBe("Nom d'utilisateur")
      expect(
        el.querySelector('label[for^="gbt-login-"][for$="-password"]')?.textContent?.trim(),
      ).toBe('Password')
    })

    it('lets its own labels input win over provideAuthLabels', () => {
      const { fixture, host, el } = setup({
        providers: [provideAuthLabels({ login: { heading: 'Connexion' } })],
      })

      host.labels.set({ heading: 'Identification' })
      fixture.detectChanges()

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Identification')
    })
  })

  describe('MFA', () => {
    const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10))
    const alertText = (el: HTMLElement) =>
      el.querySelector('gbt-alert [role="alert"]')?.textContent?.trim()
    const codeField = (el: HTMLElement) =>
      el.querySelector<HTMLInputElement>('input[id^="gbt-login-"][id$="-mfa-code"]')!
    const backupField = (el: HTMLElement) =>
      el.querySelector<HTMLInputElement>('input[id^="gbt-login-"][id$="-mfa-backup-code"]')!
    const linkByText = (el: HTMLElement, text: string) =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button.gbt-button--link')).find(
        (b) => b.textContent?.trim() === text,
      )!

    /** Signs in with a password the server accepts but answers with an MFA step. */
    async function toChallenge() {
      const ctx = setup()
      ctx.component.username.set('admin')
      ctx.component['password'].set('secret')
      ctx.component.submit()
      ctx.port.calls.expectOne('login').flush({
        token: null,
        mfaToken: 'pending',
        mfaSetupRequired: false,
        mfaHasTotp: true,
        mfaHasPasskey: false,
      })
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()
      ctx.fixture.detectChanges()
      return ctx
    }
    async function toEnrollment() {
      const ctx = setup()
      ctx.component.username.set('admin')
      ctx.component['password'].set('secret')
      ctx.component.submit()
      ctx.port.calls.expectOne('login').flush({
        token: null,
        mfaToken: 'pending',
        mfaSetupRequired: true,
        mfaHasTotp: false,
        mfaHasPasskey: false,
      })
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()
      ctx.fixture.detectChanges()
      return ctx
    }

    describe('after the password step', () => {
      it('shows the challenge, not a session, when the account already has an authenticator', async () => {
        const { component, el, port, host } = await toChallenge()

        expect(component['mfaToken']()).toBe('pending')
        expect(component.mfaSetupRequired()).toBe(false)
        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Two-step verification')
        expect(el.querySelector('[id^="gbt-login-"][id$="-username"]')).toBeNull()
        expect(port.tokens).toEqual([])
        expect(host.loggedIn).toBe(0)
      })

      it('never keeps the password once the credentials step succeeded', async () => {
        const { component } = await toChallenge()

        expect(component['password']()).toBe('')
      })

      it('does not keep the password when the server hands out a session either', () => {
        const { component, port } = setup()
        component['password'].set('secret')

        component.submit()
        port.calls.expectOne('login').flush({ token: 'abc' })

        expect(component['password']()).toBe('')
      })

      it('shows the enrolment when the account has no authenticator yet', async () => {
        const { component, el, fixture } = await toEnrollment()

        expect(component.mfaSetupRequired()).toBe(true)
        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Two-factor authentication')
        expect(el.querySelector('gbt-mfa-enrollment')).toBeTruthy()
        expect(
          (
            fixture.debugElement.query(By.directive(MfaEnrollment))
              .componentInstance as MfaEnrollment
          ).mfaToken(),
        ).toBe('pending')
        expect(component['password']()).toBe('')
      })

      it('gives the enrolment a wider panel', async () => {
        const { el } = await toEnrollment()

        expect(el.querySelector('.gbt-auth-panel__panel--wide')).toBeTruthy()
      })

      it("keeps the application's logo on the MFA steps, without the registration footer", async () => {
        const challenge = await toChallenge()
        expect(challenge.el.querySelector('.gbt-auth-panel__logo img')?.getAttribute('alt')).toBe(
          'Acme',
        )
        TestBed.resetTestingModule()

        const enrolment = await toEnrollment()
        expect(enrolment.el.querySelector('.gbt-auth-panel__logo img')?.getAttribute('alt')).toBe(
          'Acme',
        )
        expect(enrolment.el.querySelector('gbt-auth-footer')).toBeNull()
      })

      it('treats an answer with neither a token nor an mfaToken as a failed login', () => {
        const { component, port, host } = setup()

        component.submit()
        port.calls.expectOne('login').flush({ token: null })

        expect(component['mfaToken']()).toBeNull()
        expect(component.error()).toBe('Sign-in failed, try again.')
        expect(component.submitting()).toBe(false)
        expect(host.loggedIn).toBe(0)
      })
    })

    describe('challenge', () => {
      it('has a labelled one-time-code field, focused, with a numeric keypad hint', async () => {
        const { el } = await toChallenge()

        expect(
          el.querySelector('label[for^="gbt-login-"][for$="-mfa-code"]')?.textContent?.trim(),
        ).toBe('6-digit code')
        expect(codeField(el).getAttribute('autocomplete')).toBe('one-time-code')
        expect(codeField(el).getAttribute('inputmode')).toBe('numeric')
        expect(document.activeElement).toBe(codeField(el))
      })

      it('keeps the one-time-code field free of what only gets in the way of a code (spell check, capitals)', async () => {
        const { el } = await toChallenge()

        expect(codeField(el).getAttribute('spellcheck')).toBe('false')
        expect(codeField(el).getAttribute('autocapitalize')).toBe('off')
        expect(codeField(el).getAttribute('enterkeyhint')).toBe('go')
      })

      it('has a single, primary "Verify" button', async () => {
        const { el } = await toChallenge()

        const buttons = el.querySelectorAll('button.gbt-button:not(.gbt-button--link)')
        expect(buttons.length).toBe(1)
        expect(buttons[0].classList).toContain('gbt-button--primary')
        expect(buttons[0].textContent?.trim()).toBe('Verify')
      })

      it('sends the mfaToken and the code stripped of spaces, then reports the user signed in', async () => {
        const { component, port, host } = await toChallenge()
        component['code'].set(' 123 456 ')

        component.verify()
        const call = port.calls.expectOne('verifyMfa')
        expect(call.args).toEqual(['pending', { code: '123456' }])
        call.flush()

        expect(host.loggedIn).toBe(1)
        expect(port.tokens).toEqual([])
        expect(component['mfaToken']()).toBeNull()
      })

      it('submits on Enter in the field', async () => {
        const { el, port, component } = await toChallenge()
        component['code'].set('123456')

        el.querySelector('form')!.dispatchEvent(new Event('submit'))

        port.calls.expectOne('verifyMfa')
      })

      it('does not ask the server for an empty code, and says what is missing', async () => {
        const { component, fixture, port, el } = await toChallenge()

        component.verify()
        fixture.detectChanges()

        port.calls.expectNone('verifyMfa')
        expect(alertText(el)).toBe('Enter the 6-digit code from your app')
      })

      it('shows "Incorrect code" on a 401, empties the field and puts the focus back in it; the state is kept', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('000000')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, { error: 'invalid code' })
        fixture.detectChanges()
        await fixture.whenStable()

        expect(alertText(el)).toBe('Incorrect code')
        expect(component['code']()).toBe('')
        expect(component['mfaToken']()).toBe('pending')
        expect(document.activeElement).toBe(codeField(el))
      })

      it('goes back to the credentials, saying the login expired, on an invalid-or-expired-token 401', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('123456')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, { error: 'invalid or expired token' })
        fixture.detectChanges()
        await fixture.whenStable()
        fixture.detectChanges()

        expect(component['mfaToken']()).toBeNull()
        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Sign in')
        expect(alertText(el)).toBe('Your sign-in has expired, sign in again.')
        expect(component['code']()).toBe('')
        expect(document.activeElement).toBe(
          el.querySelector('input[id^="gbt-login-"][id$="-password"]'),
        )
        expect(component.submitting()).toBe(false)
      })

      it('leaves the backup-code mode when the login expired there', async () => {
        const { component, fixture, port, el } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()
        component['backupCode'].set('deadbeef')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, { error: 'invalid or expired token' })
        fixture.detectChanges()

        expect(component.useBackupCode()).toBe(false)
        expect(component['mfaToken']()).toBeNull()
      })

      it('says to wait on a 429, keeping the typed code', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('123456')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(429, {})
        fixture.detectChanges()

        expect(alertText(el)).toBe('Too many attempts, try again in a few minutes')
        expect(component['code']()).toBe('123456')
        expect(component.submitting()).toBe(false)
      })

      it('gives a generic message on any other failure', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('123456')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(500, {})
        fixture.detectChanges()

        expect(alertText(el)).toBe('Verification failed, try again.')
      })

      it('shows a loading, disabled button while the check is in flight, and ignores a second submit', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('123456')
        const button = submitComponent(fixture)

        component.verify()
        fixture.detectChanges()
        component.verify()

        expect(button.loading()).toBe(true)
        expect(submitButton(el).disabled).toBe(true)
        port.calls.expectOne('verifyMfa').fail(401, {})
        fixture.detectChanges()
        expect(button.loading()).toBe(false)
      })

      it('clears the previous error when submitting again', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('111111')
        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, {})
        fixture.detectChanges()
        expect(el.querySelector('gbt-alert')).toBeTruthy()

        component['code'].set('222222')
        component.verify()
        fixture.detectChanges()

        expect(el.querySelector('gbt-alert')).toBeNull()
        port.calls.expectOne('verifyMfa')
      })
    })

    describe('backup code', () => {
      it('swaps the code field for a backup-code field, focused, and back', async () => {
        const { el, fixture, component } = await toChallenge()

        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()
        await fixture.whenStable()

        expect(component.useBackupCode()).toBe(true)
        expect(codeField(el)).toBeNull()
        expect(
          el
            .querySelector('label[for^="gbt-login-"][for$="-mfa-backup-code"]')
            ?.textContent?.trim(),
        ).toBe('Backup code')
        expect(document.activeElement).toBe(backupField(el))
        // A backup code is text, not digits: the plain keyboard, still without spell check or capitals.
        expect(backupField(el).getAttribute('inputmode')).toBe('text')
        expect(backupField(el).getAttribute('spellcheck')).toBe('false')
        expect(backupField(el).getAttribute('autocapitalize')).toBe('off')
        expect(backupField(el).getAttribute('enterkeyhint')).toBe('go')

        linkByText(el, 'Use the code from my app').click()
        fixture.detectChanges()
        await fixture.whenStable()

        expect(component.useBackupCode()).toBe(false)
        expect(backupField(el)).toBeNull()
        expect(document.activeElement).toBe(codeField(el))
      })

      it('sends the backup code as backupCode, spaces stripped, capitals untouched', async () => {
        const { component, port, el, fixture } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()
        component['backupCode'].set(' 00112233 44556677 ')

        component.verify()
        const call = port.calls.expectOne('verifyMfa')

        expect(call.args).toEqual(['pending', { backupCode: '0011223344556677' }])
      })

      it('shows "Incorrect code" for a refused backup code and refocuses the backup field', async () => {
        const { component, port, el, fixture } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()
        component['backupCode'].set('deadbeef')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, {})
        fixture.detectChanges()
        await fixture.whenStable()

        expect(alertText(el)).toBe('Incorrect code')
        expect(document.activeElement).toBe(backupField(el))
      })

      it('says what is missing when the backup code is empty', async () => {
        const { component, port, el, fixture } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()

        component.verify()
        fixture.detectChanges()

        port.calls.expectNone('verifyMfa')
        expect(alertText(el)).toBe('Enter a backup code')
      })

      it('drops the previous error when switching', async () => {
        const { component, port, el, fixture } = await toChallenge()
        component['code'].set('000000')
        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, {})
        fixture.detectChanges()

        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()

        expect(el.querySelector('gbt-alert')).toBeNull()
      })
    })

    describe('"Back"', () => {
      it('goes back to the credentials: the username stays, the password is empty, the focus is on it', async () => {
        const { component, el, fixture } = await toChallenge()

        linkByText(el, 'Back').click()
        fixture.detectChanges()
        await fixture.whenStable()
        fixture.detectChanges() // the ngModel writes the retained username after the first pass

        expect(component['mfaToken']()).toBeNull()
        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Sign in')
        expect(
          el.querySelector<HTMLInputElement>('input[id^="gbt-login-"][id$="-username"]')!.value,
        ).toBe('admin')
        expect(
          el.querySelector<HTMLInputElement>('input[id^="gbt-login-"][id$="-password"]')!.value,
        ).toBe('')
        expect(document.activeElement).toBe(
          el.querySelector('input[id^="gbt-login-"][id$="-password"]'),
        )
      })

      it('leaves the backup-code mode, so the next challenge starts on the authenticator', async () => {
        const { component, el, fixture } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()

        linkByText(el, 'Back').click()

        expect(component.useBackupCode()).toBe(false)
      })

      it('is what the enrolment\'s own "Back" (its `cancelled` output) does', async () => {
        const { component, el, fixture, host } = await toEnrollment()

        Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
          .find((b) => b.textContent?.trim() === 'Back')!
          .click()
        fixture.detectChanges()

        expect(component['mfaToken']()).toBeNull()
        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Sign in')
        expect(el.querySelector('gbt-mfa-enrollment')).toBeNull()
        expect(host.loggedIn).toBe(0)
      })
    })

    describe('passkey challenge', () => {
      const CHALLENGE_ID = '7b1f7f2e-0000-4000-8000-000000000001'
      const UNSUPPORTED = 'This browser does not support passkeys. Use a backup code.'

      // A browser with WebAuthn (or without) for the test, put back afterwards.
      let restoreBrowser: (() => void) | null = null
      afterEach(() => {
        restoreBrowser?.()
        restoreBrowser = null
      })
      const browser = (get?: () => Promise<unknown>) => {
        restoreBrowser?.()
        restoreBrowser = stubPasskeyBrowser(get ? { get, create: vi.fn() } : null)
      }

      /** Signs in with a password the server accepts; the account has the given factors. */
      async function toChallengeWith(
        factors: { totp: boolean; passkey: boolean },
        config?: { passkeysAvailable: boolean },
      ) {
        const ctx = setup()
        if (config) {
          ctx.port.calls.expectOne('authConfig').flush({ registrationEnabled: false, ...config })
        }
        ctx.component.username.set('admin')
        ctx.component['password'].set('secret')
        ctx.component.submit()
        ctx.port.calls.expectOne('login').flush({
          token: null,
          mfaToken: 'pending',
          mfaSetupRequired: false,
          mfaHasTotp: factors.totp,
          mfaHasPasskey: factors.passkey,
        })
        ctx.fixture.detectChanges()
        await ctx.fixture.whenStable()
        ctx.fixture.detectChanges()
        return ctx
      }
      const passkeyButton = (el: HTMLElement) =>
        Array.from(
          el.querySelectorAll<HTMLButtonElement>('button.gbt-button:not(.gbt-button--link)'),
        ).find((b) => b.textContent?.includes('Use a passkey')) ?? null
      const buttons = (el: HTMLElement) =>
        Array.from(
          el.querySelectorAll<HTMLButtonElement>('button.gbt-button:not(.gbt-button--link)'),
        ).map(
          (b) =>
            `${b.classList.contains('gbt-button--primary') ? 'primary' : 'secondary'}:${b.textContent?.trim()}`,
        )
      const noticeText = (el: HTMLElement) => el.querySelector('gbt-alert')?.textContent?.trim()
      const startWith = (ctx: Awaited<ReturnType<typeof toChallengeWith>>) =>
        ctx.port.calls
          .expectOne('startPasskeyChallenge')
          .flush({ challengeId: CHALLENGE_ID, publicKey: REQUEST_OPTIONS })

      describe('what the screen offers', () => {
        it('a passkey user: one primary "Use a passkey", no code field, the backup-code way out', async () => {
          browser(vi.fn())
          const { el } = await toChallengeWith({ totp: false, passkey: true })

          expect(buttons(el)).toEqual(['primary:Use a passkey'])
          expect(codeField(el)).toBeNull()
          expect(linkByText(el, 'Use a backup code')).toBeTruthy()
          expect(linkByText(el, 'Back')).toBeTruthy()
          expect(el.querySelector('h1')?.textContent?.trim()).toBe('Two-step verification')
        })

        it('focuses the passkey button, the one thing to do', async () => {
          browser(vi.fn())
          const { el } = await toChallengeWith({ totp: false, passkey: true })

          expect(document.activeElement).toBe(passkeyButton(el))
        })

        it('a user with both factors: the passkey is the single primary, the code form is secondary', async () => {
          browser(vi.fn())
          const { el } = await toChallengeWith({ totp: true, passkey: true })

          expect(buttons(el)).toEqual(['primary:Use a passkey', 'secondary:Verify'])
          expect(codeField(el)).toBeTruthy()
          expect(el.querySelector('gbt-divider')).toBeTruthy()
          expect(linkByText(el, 'Use a backup code')).toBeTruthy()
        })

        it('a TOTP user keeps the challenge it had: no passkey button, "Verify" primary, the field focused', async () => {
          browser(vi.fn())
          const { el } = await toChallengeWith({ totp: true, passkey: false })

          expect(buttons(el)).toEqual(['primary:Verify'])
          expect(passkeyButton(el)).toBeNull()
          expect(document.activeElement).toBe(codeField(el))
        })

        it('a user with both factors on a browser without WebAuthn gets the TOTP challenge, primary', async () => {
          browser()
          const { el } = await toChallengeWith({ totp: true, passkey: true })

          expect(buttons(el)).toEqual(['primary:Verify'])
          expect(passkeyButton(el)).toBeNull()
          expect(document.activeElement).toBe(codeField(el))
        })

        it('takes an answer that names no factor for a TOTP challenge rather than leaving a dead end', async () => {
          browser()
          const { el } = await toChallengeWith({ totp: false, passkey: false })

          expect(codeField(el)).toBeTruthy()
        })

        it('says what to type or do in the introduction: passkey, both, TOTP', async () => {
          browser(vi.fn())
          const intro = (el: HTMLElement) => el.querySelector('.gbt-auth-panel__intro')?.textContent
          const passkeyOnly = await toChallengeWith({ totp: false, passkey: true })
          expect(intro(passkeyOnly.el)).toContain('passkey')
          expect(intro(passkeyOnly.el)).not.toContain('6-digit')
          TestBed.resetTestingModule()

          const both = await toChallengeWith({ totp: true, passkey: true })
          expect(intro(both.el)).toContain('passkey')
          expect(intro(both.el)).toContain('6-digit')
          TestBed.resetTestingModule()

          const totpOnly = await toChallengeWith({ totp: true, passkey: false })
          expect(intro(totpOnly.el)).toBe('Enter the 6-digit code shown by your authenticator app.')
        })
      })

      describe('a passkey user on a browser without WebAuthn', () => {
        it('gets the reason and the backup-code form, never a dead end', async () => {
          browser()
          const { el, component } = await toChallengeWith({ totp: false, passkey: true })

          expect(noticeText(el)).toBe(UNSUPPORTED)
          // A note that is on the page from the start (the reason, a warning) is no live region: nothing interrupts the reader.
          const note = el.querySelector('gbt-alert .gbt-alert')!
          expect(note.getAttribute('data-variant')).toBe('warning')
          expect(note.hasAttribute('role')).toBe(false)
          expect(note.hasAttribute('aria-live')).toBe(false)
          expect(passkeyButton(el)).toBeNull()
          expect(backupField(el)).toBeTruthy()
          expect(buttons(el)).toEqual(['primary:Verify'])
          expect(document.activeElement).toBe(backupField(el))
          expect(component.useBackupCode()).toBe(false) // the user did not choose it: the screen has nothing else to offer
        })

        it('has no way "back" to a passkey or a code that it cannot use, only Back', async () => {
          browser()
          const { el } = await toChallengeWith({ totp: false, passkey: true })

          const links = Array.from(el.querySelectorAll('button.gbt-button--link')).map((b) =>
            b.textContent?.trim(),
          )
          expect(links).toEqual(['Back'])
        })

        it('signs in with a backup code', async () => {
          browser()
          const { component, port, host } = await toChallengeWith({ totp: false, passkey: true })
          component['backupCode'].set('abcd-efgh')

          component.verify()
          const call = port.calls.expectOne('verifyMfa')
          expect(call.args).toEqual(['pending', { backupCode: 'abcd-efgh' }])
          call.flush()

          expect(host.loggedIn).toBe(1)
          expect(port.tokens).toEqual([])
        })

        it('says the server has passkeys switched off, when the instance says so, and still offers the backup codes', async () => {
          browser(vi.fn())
          const { el } = await toChallengeWith(
            { totp: false, passkey: true },
            { passkeysAvailable: false },
          )

          expect(noticeText(el)).toContain('Passkeys are not available on this server.')
          expect(noticeText(el)).toContain('backup code')
          expect(passkeyButton(el)).toBeNull()
          expect(backupField(el)).toBeTruthy()
        })

        it('does not take an unreadable configuration for a server without passkeys', async () => {
          browser(vi.fn())
          const ctx = setup()
          ctx.port.calls.expectOne('authConfig').fail(500, {})
          ctx.component.username.set('admin')
          ctx.component['password'].set('secret')
          ctx.component.submit()
          ctx.port.calls.expectOne('login').flush({
            token: null,
            mfaToken: 'pending',
            mfaSetupRequired: false,
            mfaHasTotp: false,
            mfaHasPasskey: true,
          })
          ctx.fixture.detectChanges()

          expect(passkeyButton(ctx.el)).toBeTruthy()
        })
      })

      describe('the backup-code way out', () => {
        it('swaps the passkey for the backup-code field and back, the primary being "Verify" while it is open', async () => {
          browser(vi.fn())
          const { el, fixture } = await toChallengeWith({ totp: false, passkey: true })

          linkByText(el, 'Use a backup code').click()
          fixture.detectChanges()
          await fixture.whenStable()

          expect(buttons(el)).toEqual(['primary:Verify'])
          expect(document.activeElement).toBe(backupField(el))

          linkByText(el, 'Use my passkey').click()
          fixture.detectChanges()
          await fixture.whenStable()
          fixture.detectChanges()

          expect(buttons(el)).toEqual(['primary:Use a passkey'])
          expect(document.activeElement).toBe(passkeyButton(el))
        })

        it('with both factors, comes back to the screen offering both', async () => {
          browser(vi.fn())
          const { el, fixture } = await toChallengeWith({ totp: true, passkey: true })
          linkByText(el, 'Use a backup code').click()
          fixture.detectChanges()
          expect(buttons(el)).toEqual(['primary:Verify'])

          linkByText(el, 'Use my passkey or my app').click()
          fixture.detectChanges()

          expect(buttons(el)).toEqual(['primary:Use a passkey', 'secondary:Verify'])
        })
      })

      describe('using the passkey', () => {
        it('starts the challenge with the mfaToken, hands the options to the browser, and finishes with its answer', async () => {
          const get = vi.fn().mockResolvedValue(fakeAssertion())
          browser(get)
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          const start = ctx.port.calls.expectOne('startPasskeyChallenge')
          expect(start.args).toEqual(['pending'])
          start.flush({ challengeId: CHALLENGE_ID, publicKey: REQUEST_OPTIONS })
          await settle()

          expect(get).toHaveBeenCalledTimes(1)
          const finish = ctx.port.calls.expectOne('finishPasskeyChallenge')
          expect(finish.args).toEqual([
            'pending',
            CHALLENGE_ID,
            {
              id: 'credential-id',
              rawId: 'AQID',
              type: 'public-key',
              response: {
                authenticatorData: 'BAU',
                clientDataJSON: 'Bgc',
                signature: 'CAk',
                userHandle: null,
              },
            },
          ])
          finish.flush()

          expect(ctx.host.loggedIn).toBe(1)
          expect(ctx.port.tokens).toEqual([])
          expect(ctx.component['mfaToken']()).toBeNull()
        })

        it('works from the challenge of a user with both factors too', async () => {
          browser(vi.fn().mockResolvedValue(fakeAssertion()))
          const ctx = await toChallengeWith({ totp: true, passkey: true })

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.port.calls.expectOne('finishPasskeyChallenge').flush()

          expect(ctx.host.loggedIn).toBe(1)
        })

        it('shows the spinner on the passkey button, ignores a second click, and keeps the way out open while the prompt is open', async () => {
          browser(() => new Promise(() => undefined))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          ctx.fixture.detectChanges()
          startWith(ctx)
          await settle()
          ctx.fixture.detectChanges()

          expect(ctx.component.submitting()).toBe(true)
          const button = ctx.fixture.debugElement
            .queryAll(By.directive(Button))
            .map((d) => d.componentInstance as Button)
            .find((b) => b.text() === 'Use a passkey')!
          expect(button.loading()).toBe(true)
          expect(ctx.el.querySelector('[role="status"]')?.textContent).toContain(
            'Confirm on your device',
          )
          expect(
            ctx.el.querySelector('gbt-alert [role="status"]')?.getAttribute('data-variant'),
          ).toBe('info') // a note that announces its result reads politely...
          expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull() // ...never as an error
          ctx.component.usePasskey()
          ctx.port.calls.expectNone('startPasskeyChallenge')
          // The prompt can be lost behind another window for minutes: the user is never stuck on the screen.
          const links = Array.from(
            ctx.el.querySelectorAll<HTMLButtonElement>('button.gbt-button--link'),
          )
          expect(links.length).toBe(2)
          expect(links.some((b) => b.disabled)).toBe(false)
        })
      })

      describe('when it does not work out', () => {
        it('a dismissed prompt (NotAllowedError) is a quiet "Operation cancelled": the screen stays, the button is back and focused', async () => {
          browser(vi.fn().mockRejectedValue(dismissedPrompt()))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.fixture.detectChanges()
          await ctx.fixture.whenStable()

          expect(noticeText(ctx.el)).toBe('Operation cancelled')
          expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull() // not an error...
          expect(ctx.el.querySelector('gbt-alert [role="status"]')?.textContent?.trim()).toBe(
            'Operation cancelled',
          ) // ...but read politely
          ctx.port.calls.expectNone('finishPasskeyChallenge')
          expect(ctx.component['mfaToken']()).toBe('pending')
          expect(ctx.component.submitting()).toBe(false)
          expect(document.activeElement).toBe(passkeyButton(ctx.el))
        })

        it('lets the user try again after a cancellation, and the notice goes away', async () => {
          const get = vi
            .fn()
            .mockRejectedValueOnce(dismissedPrompt())
            .mockResolvedValue(fakeAssertion())
          browser(get)
          const ctx = await toChallengeWith({ totp: false, passkey: true })
          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.fixture.detectChanges()

          passkeyButton(ctx.el)!.click()
          ctx.fixture.detectChanges()
          expect(ctx.el.textContent).not.toContain('Operation cancelled')
          startWith(ctx)
          await settle()
          ctx.port.calls.expectOne('finishPasskeyChallenge').flush()

          expect(ctx.host.loggedIn).toBe(1)
        })

        it('a refused assertion (401 "invalid code") is "Passkey refused", announced, the screen kept', async () => {
          browser(vi.fn().mockResolvedValue(fakeAssertion()))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.port.calls.expectOne('finishPasskeyChallenge').fail(401, { error: 'invalid code' })
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe('Passkey refused')
          expect(ctx.component['mfaToken']()).toBe('pending')
          expect(ctx.component.submitting()).toBe(false)
          expect(ctx.host.loggedIn).toBe(0)
          expect(ctx.port.tokens).toEqual([])
        })

        it('goes back to the credentials, saying the login expired, on an invalid-or-expired-token 401 at the start', async () => {
          browser(vi.fn())
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          ctx.port.calls
            .expectOne('startPasskeyChallenge')
            .fail(401, { error: 'invalid or expired token' })
          ctx.fixture.detectChanges()
          await ctx.fixture.whenStable()

          expect(ctx.component['mfaToken']()).toBeNull()
          expect(alertText(ctx.el)).toBe('Your sign-in has expired, sign in again.')
          expect(document.activeElement).toBe(
            ctx.el.querySelector('[id^="gbt-login-"][id$="-password"]'),
          )
        })

        it('goes back to the credentials on an invalid-or-expired-token 401 at the finish too', async () => {
          browser(vi.fn().mockResolvedValue(fakeAssertion()))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.port.calls
            .expectOne('finishPasskeyChallenge')
            .fail(401, { error: 'invalid or expired token' })
          ctx.fixture.detectChanges()

          expect(ctx.component['mfaToken']()).toBeNull()
          expect(alertText(ctx.el)).toBe('Your sign-in has expired, sign in again.')
        })

        it('says to wait on a 429, at the start and at the finish', async () => {
          browser(vi.fn().mockResolvedValue(fakeAssertion()))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          ctx.port.calls.expectOne('startPasskeyChallenge').fail(429, {})
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.port.calls.expectOne('finishPasskeyChallenge').fail(429, {})
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')
          expect(ctx.component['mfaToken']()).toBe('pending')
        })

        it('says passkeys are unavailable on a 503', async () => {
          browser(vi.fn())
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          ctx.port.calls
            .expectOne('startPasskeyChallenge')
            .fail(503, { error: 'passkeys are not available on this server' })
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe('Passkeys are not available on this server.')
        })

        it('gives a generic message on any other failure (server error, unexpected browser error)', async () => {
          browser(vi.fn().mockRejectedValue(new DOMException('x', 'SecurityError')))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          ctx.port.calls.expectOne('startPasskeyChallenge').fail(500, {})
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Verification failed, try again.')

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Verification failed, try again.')
          ctx.port.calls.expectNone('finishPasskeyChallenge')
        })

        it('says the browser cannot when its authenticator does not support what was asked (NotSupportedError)', async () => {
          browser(vi.fn().mockRejectedValue(new DOMException('x', 'NotSupportedError')))
          const ctx = await toChallengeWith({ totp: false, passkey: true })

          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe('This browser does not support passkeys.')
          expect(ctx.component['mfaToken']()).toBe('pending')
        })

        it('drops the answer of a challenge the user walked away from ("Back" while the prompt is open)', async () => {
          let answer!: (value: unknown) => void
          browser(() => new Promise((resolve) => (answer = resolve)))
          const ctx = await toChallengeWith({ totp: false, passkey: true })
          passkeyButton(ctx.el)!.click()
          startWith(ctx)
          await settle()

          ctx.component.backToCredentials()
          answer(fakeAssertion())
          await settle()

          ctx.port.calls.expectNone('finishPasskeyChallenge')
          expect(ctx.component['mfaToken']()).toBeNull()
          expect(ctx.host.loggedIn).toBe(0)
        })
      })

      it('opens no prompt at all when the user left before the server answered the start', async () => {
        const get = vi.fn().mockResolvedValue(fakeAssertion())
        browser(get)
        const ctx = await toChallengeWith({ totp: false, passkey: true })
        passkeyButton(ctx.el)!.click()
        const start = ctx.port.calls.expectOne('startPasskeyChallenge')

        linkByText(ctx.el, 'Back').click()
        start.flush({ challengeId: CHALLENGE_ID, publicKey: REQUEST_OPTIONS })
        await settle()

        expect(get).not.toHaveBeenCalled()
        ctx.port.calls.expectNone('finishPasskeyChallenge')
        expect(ctx.component['mfaToken']()).toBeNull()
        expect(ctx.component.submitting()).toBe(false)
      })

      it('resets everything about the challenge when the user goes back to the credentials', async () => {
        browser(vi.fn())
        const ctx = await toChallengeWith({ totp: false, passkey: true })

        linkByText(ctx.el, 'Back').click()
        ctx.fixture.detectChanges()

        expect(ctx.el.querySelector('[id^="gbt-login-"][id$="-username"]')).toBeTruthy()
        expect(ctx.el.textContent).not.toMatch(/passkey/i)
      })
    })

    describe('enrolment', () => {
      const enrolmentOf = (fixture: ReturnType<typeof setup>['fixture']) =>
        fixture.debugElement.query(By.directive(MfaEnrollment)).componentInstance as MfaEnrollment

      it('goes back to the credentials, saying so, when the enrolment reports the login expired', async () => {
        const { component, fixture, port, el, host } = await toEnrollment()

        enrolmentOf(fixture).begin()
        port.calls.expectOne('enrollTotp').fail(401, { error: 'invalid or expired token' })
        fixture.detectChanges()
        await fixture.whenStable()
        fixture.detectChanges()

        expect(component['mfaToken']()).toBeNull()
        expect(el.querySelector('gbt-mfa-enrollment')).toBeNull()
        expect(alertText(el)).toBe('Your sign-in has expired, sign in again.')
        expect(document.activeElement).toBe(
          el.querySelector('input[id^="gbt-login-"][id$="-password"]'),
        )
        expect(host.loggedIn).toBe(0)
      })

      it('offers the passkey choice only when the instance says passkeys are available (and the browser can)', async () => {
        const restore = stubPasskeyBrowser({ create: vi.fn(), get: vi.fn() })
        try {
          const ctx = setup()
          ctx.port.calls
            .expectOne('authConfig')
            .flush({ registrationEnabled: false, passkeysAvailable: true })
          ctx.component.username.set('admin')
          ctx.component['password'].set('secret')
          ctx.component.submit()
          ctx.port.calls.expectOne('login').flush({
            token: null,
            mfaToken: 'pending',
            mfaSetupRequired: true,
            mfaHasTotp: false,
            mfaHasPasskey: false,
          })
          ctx.fixture.detectChanges()
          await ctx.fixture.whenStable()
          ctx.fixture.detectChanges()

          const labels = Array.from(
            ctx.el.querySelectorAll('gbt-mfa-enrollment button.gbt-button'),
          ).map((b) => b.textContent?.trim())
          expect(labels).toEqual(['Use a passkey', 'Use an app', 'Back'])
        } finally {
          restore()
        }
      })

      it('offers the authenticator alone while the configuration is unknown or says no', async () => {
        const restore = stubPasskeyBrowser({ create: vi.fn(), get: vi.fn() })
        try {
          const { el } = await toEnrollment()

          const labels = Array.from(
            el.querySelectorAll('gbt-mfa-enrollment button.gbt-button'),
          ).map((b) => b.textContent?.trim())
          expect(labels).toEqual(['Get started', 'Back'])
        } finally {
          restore()
        }
      })

      it('hands the session token to the port and reports the user signed in once the enrolment reports it completed', async () => {
        const { component, port, host } = await toEnrollment()

        component.enrolled('session-jwt')

        expect(port.tokens).toEqual(['session-jwt'])
        expect(host.loggedIn).toBe(1)
        expect(component['mfaToken']()).toBeNull()
      })

      it('completes through the real enrolment: nothing is handed over before the codes are acknowledged', async () => {
        const { fixture, port, el, host } = await toEnrollment()
        const enrolment = enrolmentOf(fixture)

        enrolment.begin()
        const enroll = port.calls.expectOne('enrollTotp')
        expect(enroll.args).toEqual(['pending'])
        enroll.flush({ secret: 'JBSWY3DP', otpauthUrl: 'otpauth://totp/x?secret=JBSWY3DP' })
        fixture.detectChanges()
        enrolment['code'].set('123456')
        enrolment.confirm()
        const confirm = port.calls.expectOne('confirmTotp')
        expect(confirm.args).toEqual(['pending', '123456'])
        confirm.flush({ token: 'session-jwt', backupCodes: ['a'.repeat(32)] })
        fixture.detectChanges()
        await settle()

        expect(port.tokens).toEqual([])
        expect(host.loggedIn).toBe(0)

        el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click()
        fixture.detectChanges()
        Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
          .find((b) => b.textContent?.trim() === 'Continue')!
          .click()

        expect(port.tokens).toEqual(['session-jwt'])
        expect(host.loggedIn).toBe(1)
      })

      // login doesn't pass its labels down, so provideAuthLabels has to reach three levels deep.
      it('localises the nested enrolment, QR and backup codes from provideAuthLabels, three levels down', async () => {
        const ctx = setup({
          providers: [
            provideAuthLabels({
              mfaEnrollment: {
                begin: 'Commencer',
                scanHeading: 'Configurez votre application',
                scanLead: 'Scannez ce QR code avec votre application.',
                codeLabel: 'Code à 6 chiffres',
                activate: 'Activer',
                codesHeading: 'Enregistrez vos codes de secours',
                continue: 'Continuer',
              },
              totpQr: {
                imageAlt: 'QR code à scanner',
                secretLabel: 'Ou saisissez cette clé',
                copyLabel: 'Copier la clé',
              },
              backupCodes: {
                listLabel: 'Codes de secours',
                copy: 'Copier les codes',
                download: 'Télécharger',
                acknowledge: "J'ai enregistré mes codes de secours",
              },
            }),
          ],
        })
        const { fixture, port, el } = ctx
        const refresh = async () => {
          fixture.detectChanges()
          await fixture.whenStable()
          await settle()
          fixture.detectChanges()
        }
        const text = (node: Element | null | undefined) =>
          node?.textContent?.replace(/\s+/g, ' ').trim()
        const buttonNamed = (label: string) =>
          Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
            (b) => text(b) === label,
          )
        ctx.component.username.set('admin')
        ctx.component['password'].set('secret')
        ctx.component.submit()
        port.calls.expectOne('login').flush({
          token: null,
          mfaToken: 'pending',
          mfaSetupRequired: true,
          mfaHasTotp: false,
          mfaHasPasskey: false,
        })
        await refresh()

        // The scan step: the enrolment's own words, and the QR's inside it.
        buttonNamed('Commencer')!.click()
        port.calls
          .expectOne('enrollTotp')
          .flush({ secret: 'JBSWY3DP', otpauthUrl: 'otpauth://totp/x?secret=JBSWY3DP' })
        await refresh()

        const enrolment = el.querySelector('gbt-mfa-enrollment')!
        expect(text(enrolment.querySelector('h2'))).toBe('Configurez votre application')
        expect(text(enrolment)).toContain('Scannez ce QR code avec votre application.')
        expect(text(enrolment.querySelector('label[for$="-code"]'))).toBe('Code à 6 chiffres')
        const qr = enrolment.querySelector('gbt-totp-qr')!
        expect(qr.querySelector('img')?.getAttribute('alt')).toBe('QR code à scanner')
        expect(text(qr.querySelector('.gbt-totp-qr__label'))).toBe('Ou saisissez cette clé')
        expect(qr.querySelector('button[aria-label="Copier la clé"]')).toBeTruthy()
        expect(text(el)).not.toContain('Or enter this key in your app')

        // The codes step: the enrolment's words, and the backup codes' inside it.
        const code = enrolment.querySelector<HTMLInputElement>('input[id$="-code"]')!
        code.value = '123456'
        code.dispatchEvent(new Event('input'))
        await refresh()
        buttonNamed('Activer')!.click()
        port.calls
          .expectOne('confirmTotp')
          .flush({ token: 'session-jwt', backupCodes: ['a'.repeat(32)] })
        await refresh()

        expect(text(enrolment.querySelector('h2'))).toBe('Enregistrez vos codes de secours')
        const codes = enrolment.querySelector('gbt-backup-codes')!
        expect(codes.querySelector('ol')?.getAttribute('aria-label')).toBe('Codes de secours')
        expect(buttonNamed('Copier les codes')).toBeTruthy()
        expect(buttonNamed('Télécharger')).toBeTruthy()
        expect(text(codes)).toContain("J'ai enregistré mes codes de secours")
        expect(buttonNamed('Continuer')?.disabled).toBe(true)
        expect(text(el)).not.toContain('I have saved my backup codes')
        expect(port.tokens).toEqual([])
      })
    })

    // The kit never navigates, so a 401 during the challenge must keep the same page and report no sign-in.
    describe('on a 401 of the challenge (the page never leaves on its own)', () => {
      it('shows the expired login on the credentials step, on the same page instance', async () => {
        const { component, fixture, port, el, host } = await toChallenge()
        component['code'].set('123456')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, { error: 'invalid or expired token' })
        await fixture.whenStable()
        fixture.detectChanges()

        expect(fixture.debugElement.query(By.directive(AuthLogin)).componentInstance).toBe(
          component,
        )
        expect(component['mfaToken']()).toBeNull()
        expect(alertText(el)).toBe('Your sign-in has expired, sign in again.')
        expect(host.loggedIn).toBe(0)
      })

      it('keeps the challenge on screen after a wrong code, on the same page instance', async () => {
        const { component, fixture, port, el, host } = await toChallenge()
        component['code'].set('000000')

        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, {})
        await fixture.whenStable()
        fixture.detectChanges()

        expect(fixture.debugElement.query(By.directive(AuthLogin)).componentInstance).toBe(
          component,
        )
        expect(component['mfaToken']()).toBe('pending')
        expect(alertText(el)).toBe('Incorrect code')
        expect(host.loggedIn).toBe(0)
      })
    })

    describe('accessibility', () => {
      let restoreBrowser: (() => void) | null = null
      afterEach(() => {
        restoreBrowser?.()
        restoreBrowser = null
      })

      it('has no axe violations on the credentials step, with the registration link', async () => {
        const { fixture, port, el } = setup()
        port.calls.expectOne('authConfig').flush({ registrationEnabled: true })
        fixture.detectChanges()

        await expectNoA11yViolations(el)
      })

      it('has no axe violations with a failed login', async () => {
        const { fixture, component, port, el } = setup()
        component.submit()
        port.calls.expectOne('login').fail(401, { error: 'invalid username or password' })
        fixture.detectChanges()

        await expectNoA11yViolations(el)
      })

      it('has no axe violations on the TOTP challenge, with an error', async () => {
        const { component, fixture, port, el } = await toChallenge()
        component['code'].set('000000')
        component.verify()
        port.calls.expectOne('verifyMfa').fail(401, { error: 'invalid code' })
        fixture.detectChanges()

        await expectNoA11yViolations(el)
      })

      it('has no axe violations on the backup-code form', async () => {
        const { fixture, el } = await toChallenge()
        linkByText(el, 'Use a backup code').click()
        fixture.detectChanges()

        await expectNoA11yViolations(el)
      })

      it('has no axe violations on the challenge offering both factors', async () => {
        restoreBrowser = stubPasskeyBrowser({ get: vi.fn(), create: vi.fn() })
        const ctx = setup()
        ctx.component.submit()
        ctx.port.calls.expectOne('login').flush({
          token: null,
          mfaToken: 'pending',
          mfaHasTotp: true,
          mfaHasPasskey: true,
        })
        ctx.fixture.detectChanges()

        await expectNoA11yViolations(ctx.el)
      })

      it('has no axe violations when the passkey cannot be used here (the warning and the backup-code form)', async () => {
        restoreBrowser = stubPasskeyBrowser(null)
        const ctx = setup()
        ctx.component.submit()
        ctx.port.calls.expectOne('login').flush({
          token: null,
          mfaToken: 'pending',
          mfaHasTotp: false,
          mfaHasPasskey: true,
        })
        ctx.fixture.detectChanges()

        await expectNoA11yViolations(ctx.el)
      })

      it('has no axe violations on the first-time enrolment', async () => {
        const { el } = await toEnrollment()

        await expectNoA11yViolations(el)
      })
    })
  })
})
