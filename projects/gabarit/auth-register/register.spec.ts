import { Component, type Provider, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Button } from '../button/button'
import { type RegisterLabels, provideAuthLabels } from '../auth/auth-labels'
import { AuthFooterLink } from '../auth/auth-footer/auth-footer'
import { MfaEnrollment } from '../mfa-enrollment/mfa-enrollment'
import { AUTH_PORT } from '../auth/ports/auth.port'
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '../auth/shared/account-rules'
import { type FakeAuthPort, fakeAuthPort, fakeQrRenderer } from '../auth/testing/fake-ports'
import { stubPasskeyBrowser } from '../auth/testing/webauthn-testing'
import { TOTP_QR_RENDERER } from '../mfa-enrollment/totp-qr/totp-qr'
import { AuthRegister } from './register'

const PENDING = {
  token: null,
  mfaToken: 'pending',
  mfaSetupRequired: true,
  mfaHasTotp: false,
  mfaHasPasskey: false,
}

/** The page as an application mounts it: its logo and its link to the sign-in page projected. */
@Component({
  standalone: true,
  imports: [AuthRegister, Button, AuthFooterLink],
  template: `<gbt-auth-register
    [labels]="labels()"
    [minPasswordLength]="minPasswordLength()"
    [usernamePattern]="usernamePattern()"
    (registered)="registered = registered + 1"
    (signIn)="signIn = signIn + 1"
  >
    <img auth-logo src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Acme" />
    <a gbtButton variant="link" gbtAuthFooterLink href="/login">Sign in</a>
  </gbt-auth-register>`,
})
class Host {
  labels = signal<Partial<RegisterLabels>>({})
  minPasswordLength = signal(MIN_PASSWORD_LENGTH)
  usernamePattern = signal(USERNAME_PATTERN)
  registered = 0
  signIn = 0
}

interface SetupOptions {
  labels?: Partial<RegisterLabels>
  minPasswordLength?: number
  usernamePattern?: RegExp
  providers?: Provider[]
}

describe('AuthRegister', () => {
  function setup(options: SetupOptions = {}) {
    const port = fakeAuthPort()
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_PORT, useValue: port },
        { provide: TOTP_QR_RENDERER, useValue: fakeQrRenderer },
        ...(options.providers ?? []),
      ],
    })
    const fixture = TestBed.createComponent(Host)
    const host = fixture.componentInstance
    if (options.labels) host.labels.set(options.labels)
    if (options.minPasswordLength) host.minPasswordLength.set(options.minPasswordLength)
    if (options.usernamePattern) host.usernamePattern.set(options.usernamePattern)
    fixture.detectChanges()
    const component = fixture.debugElement.query(By.directive(AuthRegister))
      .componentInstance as AuthRegister
    return { fixture, host, component, port, el: fixture.nativeElement as HTMLElement }
  }

  async function settle(ctx: { fixture: ReturnType<typeof setup>['fixture'] }) {
    ctx.fixture.detectChanges()
    await ctx.fixture.whenStable()
    ctx.fixture.detectChanges()
  }

  /** The page once the instance said registration is open, the username field focused. */
  async function open(options: SetupOptions = {}) {
    const ctx = setup(options)
    ctx.port.calls
      .expectOne('authConfig')
      .flush({ registrationEnabled: true, passkeysAvailable: false })
    await settle(ctx)
    return ctx
  }

  /** A field by the end of its per-instance id (`gbt-register-<n>-username`). */
  const field = (el: HTMLElement, suffix: string) =>
    el.querySelector<HTMLInputElement>(`input[id^="gbt-register-"][id$="-${suffix}"]`)!
  /** The texts an input is described by (`aria-describedby`): its hint, or its error. */
  const describedBy = (el: HTMLElement, suffix: string) =>
    (field(el, suffix).getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((target) => el.querySelector(`#${target}`)?.textContent?.trim())
  const alertText = (el: HTMLElement) =>
    el.querySelector('gbt-alert [role="alert"]')?.textContent?.trim()
  const fieldErrors = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.gbt-input__error')).map((e) => e.textContent?.trim())
  const fill = (
    component: AuthRegister,
    values: { username?: string; email?: string; password?: string } = {},
  ) => {
    component.username.set(values.username ?? 'alice')
    component.email.set(values.email ?? 'alice@example.com')
    component['password'].set(values.password ?? 'a-long-password')
  }
  const submitButton = (fixture: ReturnType<typeof setup>['fixture']) =>
    fixture.debugElement.query(By.css('form gbt-button')).injector.get(Button)

  describe('while the instance is being read', () => {
    it('asks the instance once and shows neither the form nor the closed state until it answered', () => {
      const { fixture, port, el } = setup()

      port.calls.expectOne('authConfig')
      fixture.detectChanges()

      expect(el.querySelector('form')).toBeNull()
      expect(el.textContent).not.toContain('Registration is closed')
      expect(el.querySelector('.gbt-auth-panel__logo img')).toBeTruthy()
      expect(el.querySelector('[aria-busy="true"]')).toBeTruthy()
      expect(el.querySelector('[role="status"].sr-only')?.textContent).toBe('Loading')
      expect(el.querySelector('h1')).toBeNull()
    })

    it('announces the loading from a status that no aria-busy element contains (it would be kept quiet)', () => {
      const { fixture, port, el } = setup()

      port.calls.expectOne('authConfig')
      fixture.detectChanges()

      const statuses = Array.from(el.querySelectorAll('[role="status"]'))
      expect(statuses.map((status) => status.textContent?.trim())).toContain('Loading')
      for (const status of statuses) {
        expect(status.closest('[aria-busy="true"]')).toBeNull()
      }
    })

    it('has no accessibility violation', async () => {
      const { el } = setup()

      await expectNoA11yViolations(el)
    })
  })

  describe('when registration is closed', () => {
    async function closed() {
      const ctx = setup()
      ctx.port.calls
        .expectOne('authConfig')
        .flush({ registrationEnabled: false, passkeysAvailable: false })
      await settle(ctx)
      return ctx
    }

    it('says so instead of showing the form, with the way back to the sign-in', async () => {
      const { el } = await closed()

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Registration is closed')
      expect(el.querySelector('form')).toBeNull()
      expect(el.querySelector('input')).toBeNull()
      expect(el.textContent).toContain('Ask an administrator for an invitation')
    })

    it('has a single, primary "Sign in" button that emits signIn', async () => {
      const { fixture, el, host } = await closed()

      const buttons = el.querySelectorAll('button.gbt-button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].classList).toContain('gbt-button--primary')
      expect(buttons[0].textContent?.trim()).toBe('Sign in')
      ;(buttons[0] as HTMLButtonElement).click()
      fixture.detectChanges()

      expect(host.signIn).toBe(1)
      expect(host.registered).toBe(0)
    })

    it('moves the focus to the heading, so the state is announced', async () => {
      const { el } = await closed()

      expect(document.activeElement).toBe(el.querySelector('h1'))
    })

    it('has no accessibility violation', async () => {
      const { el } = await closed()

      await expectNoA11yViolations(el)
    })
  })

  it('shows the form when the instance cannot be read: the server stays the authority', async () => {
    const ctx = setup()

    ctx.port.calls.expectOne('authConfig').fail(500, { error: 'internal error' })
    await settle(ctx)

    expect(ctx.el.querySelector('form')).toBeTruthy()
    expect(document.activeElement).toBe(field(ctx.el, 'username'))
  })

  describe('the form', () => {
    it('shows the heading, the three labelled fields with their hints, and the projected sign-in link', async () => {
      const { el } = await open()

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Create an account')
      expect(el.querySelector('.gbt-auth-panel__logo img')?.getAttribute('alt')).toBe('Acme')
      expect(
        el.querySelector('label[for^="gbt-register-"][for$="-username"]')?.textContent?.trim(),
      ).toBe('Username')
      expect(
        el.querySelector('label[for^="gbt-register-"][for$="-email"]')?.textContent?.trim(),
      ).toBe('Email address')
      expect(
        el.querySelector('label[for^="gbt-register-"][for$="-password"]')?.textContent?.trim(),
      ).toBe('Password')
      expect(el.textContent).toContain('3 to 32 characters: letters, digits, - and _')
      expect(el.textContent).toContain('At least 8 characters')
      expect(el.querySelector('gbt-auth-footer')?.textContent).toContain('Already have an account?')
      const link = el.querySelector<HTMLAnchorElement>('gbt-auth-footer a')!
      expect(link.textContent?.trim()).toBe('Sign in')
      expect(link.getAttribute('href')).toBe('/login')
    })

    it('says under the username field that the name is saved in lower case', async () => {
      const { el } = await open()

      expect(describedBy(el, 'username')).toEqual([
        '3 to 32 characters: letters, digits, - and _. Saved in lower case.',
      ])
    })

    it('links each hint to its field, and gives way to the field error once there is one', async () => {
      const { fixture, component, el } = await open()

      expect(describedBy(el, 'password')).toEqual(['At least 8 characters.'])
      expect(describedBy(el, 'email')).toEqual([])

      fill(component, { password: 'short' })
      component.submit()
      fixture.detectChanges()
      await fixture.whenStable()

      // One description at a time: the error replaces the hint.
      expect(describedBy(el, 'password')).toEqual(['At least 8 characters'])
      expect(el.textContent).not.toContain('At least 8 characters.')
    })

    it('gives the fields the right types and autocomplete hints', async () => {
      const { el } = await open()

      expect(field(el, 'username').getAttribute('autocomplete')).toBe('username')
      expect(field(el, 'email').getAttribute('autocomplete')).toBe('email')
      expect(field(el, 'email').type).toBe('email')
      expect(field(el, 'password').getAttribute('autocomplete')).toBe('new-password')
      expect(field(el, 'password').type).toBe('password')
    })

    it('has a single, primary "Create my account" button', async () => {
      const { el } = await open()

      const buttons = el.querySelectorAll('button.gbt-button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].classList).toContain('gbt-button--primary')
      expect(buttons[0].textContent?.trim()).toBe('Create my account')
    })

    it('starts in the username field', async () => {
      const { el } = await open()

      expect(document.activeElement).toBe(field(el, 'username'))
    })

    it('keeps the signals in step with what is typed, and shows what the signals hold', async () => {
      const { fixture, component, el } = await open()

      const input = field(el, 'username')
      input.value = 'bob'
      input.dispatchEvent(new Event('input'))
      expect(component.username()).toBe('bob')

      component.email.set('bob@example.com')
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      expect(field(el, 'email').value).toBe('bob@example.com')
    })

    it('submits when the form is submitted (Enter in a field)', async () => {
      const { component, el, port } = await open()
      fill(component)

      el.querySelector('form')!.dispatchEvent(new Event('submit'))

      port.calls.expectOne('register')
    })

    it('shows no footer when the application projects no sign-in link', async () => {
      const port = fakeAuthPort()
      TestBed.configureTestingModule({ providers: [{ provide: AUTH_PORT, useValue: port }] })
      const fixture = TestBed.createComponent(AuthRegister)
      fixture.detectChanges()
      port.calls
        .expectOne('authConfig')
        .flush({ registrationEnabled: true, passkeysAvailable: false })
      fixture.detectChanges()
      await fixture.whenStable()
      const el = fixture.nativeElement as HTMLElement

      expect(el.querySelector('form')).toBeTruthy()
      expect(el.querySelector('gbt-auth-footer')).toBeNull()
    })

    it('has no accessibility violation', async () => {
      const { el } = await open()

      await expectNoA11yViolations(el)
    })
  })

  describe('checks before the request', () => {
    it('shows nothing before the first attempt', async () => {
      const { el, component, fixture } = await open()
      component.username.set('a')
      fixture.detectChanges()

      expect(fieldErrors(el)).toEqual([])
    })

    it('sends nothing and names every wrong field after a first attempt with an empty form', async () => {
      const { fixture, component, port, el } = await open()

      component.submit()
      fixture.detectChanges()

      port.calls.expectNone('register')
      expect(fieldErrors(el)).toEqual([
        'Enter a username',
        'Enter your email address',
        'Enter a password',
      ])
      expect(component.submitting()).toBe(false)
    })

    it('states the rule for a wrong username, e-mail and short password, and moves the focus to the first wrong field', async () => {
      const { fixture, component, port, el } = await open()
      fill(component, { username: '1a', email: 'nope', password: 'short' })

      component.submit()
      fixture.detectChanges()
      await fixture.whenStable()

      port.calls.expectNone('register')
      expect(fieldErrors(el)).toEqual([
        'Start with a letter; 3 to 32 characters: letters, digits, - and _',
        'Enter a valid email address, for example name@example.com',
        'At least 8 characters',
      ])
      expect(document.activeElement).toBe(field(el, 'username'))
    })

    it('focuses the e-mail field when it is the first wrong one', async () => {
      const { fixture, component, el } = await open()
      fill(component, { email: 'nope' })

      component.submit()
      fixture.detectChanges()
      await fixture.whenStable()

      expect(document.activeElement).toBe(field(el, 'email'))
    })

    it('keeps checking live once an attempt was made, and lets the fixed form through', async () => {
      const { fixture, component, port, el } = await open()
      fill(component, { password: 'short' })
      component.submit()
      fixture.detectChanges()
      expect(fieldErrors(el)).toEqual(['At least 8 characters'])

      component['password'].set('a-long-password')
      fixture.detectChanges()
      expect(fieldErrors(el)).toEqual([])

      component.submit()
      port.calls.expectOne('register')
    })

    it('has no accessibility violation with the field errors shown', async () => {
      const { fixture, component, el } = await open()
      fill(component, { username: '1a', email: 'nope', password: 'short' })
      component.submit()
      fixture.detectChanges()

      await expectNoA11yViolations(el)
    })
  })

  describe('the server rules the application passes', () => {
    it('checks the password against minPasswordLength, and says so in the hint and the error', async () => {
      const { fixture, component, port, el } = await open({ minPasswordLength: 12 })

      expect(describedBy(el, 'password')).toEqual(['At least 12 characters.'])
      fill(component, { password: 'eleven-char' })
      component.submit()
      fixture.detectChanges()

      port.calls.expectNone('register')
      expect(fieldErrors(el)).toEqual(['At least 12 characters'])

      component['password'].set('twelve-chars')
      component.submit()
      port.calls.expectOne('register')
    })

    it('checks the trimmed username against usernamePattern', async () => {
      const { fixture, component, port, el } = await open({
        usernamePattern: /^[a-z]{2,}\.[a-z]{2,}$/,
      })

      fill(component, { username: 'alice' })
      component.submit()
      fixture.detectChanges()

      port.calls.expectNone('register')
      expect(fieldErrors(el)).toEqual([
        'Start with a letter; 3 to 32 characters: letters, digits, - and _',
      ])

      component.username.set(' alice.martin ')
      component.submit()
      expect(port.calls.expectOne('register').args[0]).toBe('alice.martin')
    })
  })

  describe('signing up', () => {
    it('sends the trimmed name and address with the password', async () => {
      const { component, port } = await open()
      fill(component, { username: '  alice  ', email: ' alice@example.com ' })

      component.submit()
      const call = port.calls.expectOne('register')

      expect(call.args).toEqual(['alice', 'alice@example.com', 'a-long-password'])
    })

    it('shows a loading, disabled button while in flight and ignores a second submit', async () => {
      const { fixture, component, port, el } = await open()
      fill(component)
      const button = submitButton(fixture)

      component.submit()
      fixture.detectChanges()
      expect(button.loading()).toBe(true)
      expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true)
      expect(el.textContent).toContain('Creating the account')

      component.submit()
      port.calls.expectOne('register').fail(500, { error: 'internal error' })
      fixture.detectChanges()

      expect(button.loading()).toBe(false)
    })

    it('goes on to the mandatory enrolment with the mfaToken, and never keeps the password', async () => {
      const ctx = await open()
      const { fixture, component, port, el, host } = ctx
      fill(component)

      component.submit()
      port.calls.expectOne('register').flush(PENDING)
      await settle(ctx)

      expect(component['password']()).toBe('')
      expect(component['mfaToken']()).toBe('pending')
      expect(el.querySelector('form')).toBeNull()
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Two-factor authentication')
      expect(el.querySelector('.gbt-auth-panel__panel--wide')).toBeTruthy()
      expect(
        fixture.debugElement.query(By.directive(MfaEnrollment)).componentInstance.mfaToken(),
      ).toBe('pending')
      // No session yet: nothing to navigate to, nothing handed to the port.
      expect(host.registered).toBe(0)
      expect(port.tokens).toEqual([])
    })

    it('opens the app at once when the server issued a session (a backend without MFA enforcement)', async () => {
      const { component, port, host } = await open()
      fill(component)

      component.submit()
      port.calls.expectOne('register').flush({ token: 'session-jwt' })

      // The port stored the session it obtained: the page only says so.
      expect(host.registered).toBe(1)
      expect(port.tokens).toEqual([])
      expect(component['password']()).toBe('')
    })

    it('treats an answer with neither a token nor an mfaToken as a failure', async () => {
      const { component, port, host } = await open()
      fill(component)

      component.submit()
      port.calls.expectOne('register').flush({ token: null })

      expect(component.error()).toBe('The account could not be created, try again.')
      expect(component['mfaToken']()).toBeNull()
      expect(component.submitting()).toBe(false)
      expect(host.registered).toBe(0)
    })

    it('has no accessibility violation on the enrolment', async () => {
      const ctx = await open()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').flush(PENDING)
      await settle(ctx)

      await expectNoA11yViolations(ctx.el)
    })
  })

  describe('the enrolment offers a passkey when the instance can run them', () => {
    let restoreBrowser: (() => void) | null = null
    afterEach(() => {
      restoreBrowser?.()
      restoreBrowser = null
    })

    /** Opens the page with the given configuration, registers, and lands on the enrolment. */
    async function enrollingWith(answer: (port: FakeAuthPort) => void) {
      const ctx = setup()
      answer(ctx.port)
      await settle(ctx)
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').flush(PENDING)
      await settle(ctx)
      return ctx
    }
    const withConfig = (config: object) => (port: FakeAuthPort) =>
      port.calls.expectOne('authConfig').flush(config)
    const labels = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('gbt-mfa-enrollment button.gbt-button')).map((b) =>
        b.textContent?.trim(),
      )

    it('offers the choice between a passkey and an authenticator when the configuration says passkeys are available', async () => {
      restoreBrowser = stubPasskeyBrowser({ create: vi.fn(), get: vi.fn() })
      const { el, fixture } = await enrollingWith(
        withConfig({ registrationEnabled: true, passkeysAvailable: true }),
      )

      expect(labels(el)).toEqual(['Use a passkey', 'Use an app', 'Back'])
      expect(
        (
          fixture.debugElement.query(By.directive(MfaEnrollment)).componentInstance as MfaEnrollment
        ).passkeysAvailable(),
      ).toBe(true)
    })

    it('offers the authenticator alone when the configuration says passkeys are not available', async () => {
      restoreBrowser = stubPasskeyBrowser({ create: vi.fn(), get: vi.fn() })
      const { el } = await enrollingWith(
        withConfig({ registrationEnabled: true, passkeysAvailable: false }),
      )

      expect(labels(el)).toEqual(['Get started', 'Back'])
    })

    it('offers the authenticator alone when the configuration cannot be read (the form still opens)', async () => {
      restoreBrowser = stubPasskeyBrowser({ create: vi.fn(), get: vi.fn() })
      const { el } = await enrollingWith((port) =>
        port.calls.expectOne('authConfig').fail(500, { error: 'internal error' }),
      )

      expect(labels(el)).toEqual(['Get started', 'Back'])
    })

    it('does not offer a passkey on a browser without WebAuthn, whatever the server says', async () => {
      restoreBrowser = stubPasskeyBrowser(null)
      const { el } = await enrollingWith(
        withConfig({ registrationEnabled: true, passkeysAvailable: true }),
      )

      expect(labels(el)).toEqual(['Get started', 'Back'])
    })
  })

  describe('the enrolment hand-off', () => {
    async function enrolling(username?: string) {
      const ctx = await open()
      fill(ctx.component, { username })
      ctx.component.submit()
      ctx.port.calls.expectOne('register').flush(PENDING)
      await settle(ctx)
      const enrollment = ctx.fixture.debugElement.query(By.directive(MfaEnrollment))
        .componentInstance as MfaEnrollment
      return { ...ctx, enrollment }
    }

    it('hands the session token to the port and emits registered once the codes are acknowledged', async () => {
      const { enrollment, component, port, host } = await enrolling()

      enrollment.completed.emit('session-jwt')

      expect(port.tokens).toEqual(['session-jwt'])
      expect(host.registered).toBe(1)
      expect(component['mfaToken']()).toBeNull()
    })

    describe.each([
      ['backs out with "Back"', (e: MfaEnrollment) => e.cancelled.emit(), false],
      ['lets the pending token expire', (e: MfaEnrollment) => e.expired.emit(), true],
    ])('when the user %s', (_name, leave, expired) => {
      async function left(username?: string) {
        const ctx = await enrolling(username)
        leave(ctx.enrollment)
        await settle(ctx)
        return ctx
      }

      it('says the account was created and MFA setup is finished at the first sign-in, instead of dropping the user', async () => {
        const { el, component, port, host } = await left()

        expect(el.querySelector('h1')?.textContent?.trim()).toBe('Your account has been created')
        expect(el.querySelector('.gbt-auth-panel__status--success')).toBeTruthy()
        const message = el.querySelector('.gbt-empty-state__message')
        const name = el.querySelector('.gbt-auth-register__created-name')
        expect(name?.textContent).toContain('alice')
        // The username comes after the intro sentence, not before.
        expect(
          message!.compareDocumentPosition(name!) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy()
        expect(el.textContent).toContain('finish setting up two-factor authentication')
        expect(el.textContent?.includes('The setup has expired.')).toBe(expired)
        expect(el.querySelector('form')).toBeNull()
        expect(el.querySelector('gbt-mfa-enrollment')).toBeNull()
        expect(component['mfaToken']()).toBeNull()
        expect(host.registered).toBe(0)
        expect(host.signIn).toBe(0)
        expect(port.tokens).toEqual([])
      })

      it('names the account, lower-cased as the server stored it (that is how the user signs in), whatever was typed', async () => {
        const { el } = await left('  Florian_D ')

        expect(
          el
            .querySelector('.gbt-auth-register__created-name')
            ?.textContent?.replace(/\s+/g, ' ')
            .trim(),
        ).toBe('Your username: florian_d')
      })

      it('has a single, primary "Sign in" button, the only way on, and moves the focus to the heading', async () => {
        const { fixture, el, host } = await left()

        const buttons = el.querySelectorAll('button.gbt-button')
        expect(buttons.length).toBe(1)
        expect(buttons[0].classList).toContain('gbt-button--primary')
        expect(buttons[0].textContent?.trim()).toBe('Sign in')
        expect(document.activeElement).toBe(el.querySelector('h1'))
        ;(buttons[0] as HTMLButtonElement).click()
        fixture.detectChanges()

        expect(host.signIn).toBe(1)
      })

      it('has no accessibility violation', async () => {
        const { el } = await left()

        await expectNoA11yViolations(el)
      })
    })
  })

  describe('how a failed registration is worded', () => {
    async function failed(status: number, error: string) {
      const ctx = await open()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').fail(status, { error })
      await settle(ctx)
      return ctx
    }

    it('says "Check the fields" on a 400 that does not name a field, and focuses the alert', async () => {
      const { el, component } = await failed(400, 'something new')

      expect(alertText(el)).toBe('Check the fields')
      expect(component.registration()).toBe('open')
      expect(document.activeElement).toBe(el.querySelector('[id^="gbt-register-"][id$="-alert"]'))
    })

    it.each([
      ['username must start with a letter', 'username'],
      ["username may only contain letters, digits, '-' and '_'", 'username'],
      ['email is not a valid address', 'email'],
      ['password must be at least 8 characters', 'password'],
    ])(
      'says "Check the fields" on the 400 "%s" and focuses the field it names (%s)',
      async (body, focused) => {
        const { el } = await failed(400, body)

        expect(alertText(el)).toBe('Check the fields')
        expect(document.activeElement).toBe(field(el, focused))
      },
    )

    it('says the name is not available for a reserved one, and points at the name', async () => {
      const { el } = await failed(400, 'username is reserved')

      expect(alertText(el)).toBe('This username is not available')
      expect(document.activeElement).toBe(field(el, 'username'))
    })

    it.each([
      ['username already taken', 'username'],
      ['username collides with an existing root group', 'username'],
      ['email already in use', 'email'],
    ])(
      'says the name or address is already used on the 409 "%s", and points at %s',
      async (body, focused) => {
        const { el } = await failed(409, body)

        expect(alertText(el)).toBe('This username or email address is already in use')
        expect(document.activeElement).toBe(field(el, focused))
      },
    )

    it('says to wait on a 429', async () => {
      const { el } = await failed(429, 'too many attempts, try again later')

      expect(alertText(el)).toBe('Too many attempts, try again in a few minutes')
      expect(document.activeElement).toBe(field(el, 'password'))
    })

    it('says the creation failed on a 500, and keeps what was typed', async () => {
      const { el, component } = await failed(500, 'internal error')

      expect(alertText(el)).toBe('The account could not be created, try again.')
      expect(component.username()).toBe('alice')
      expect(component.email()).toBe('alice@example.com')
      expect(component.submitting()).toBe(false)
    })

    it('says the creation failed on a network error', async () => {
      const ctx = await open()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').fail(0)
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe('The account could not be created, try again.')
    })

    it('says the creation failed on a browser error (no status)', async () => {
      const ctx = await open()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').error(new Error('offline'))
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe('The account could not be created, try again.')
    })

    it('switches to the closed state, and drops the password, when the server says registration is disabled', async () => {
      const { el, component } = await failed(400, 'registration is disabled')

      expect(component.registration()).toBe('closed')
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Registration is closed')
      expect(el.querySelector('form')).toBeNull()
      expect(component['password']()).toBe('')
    })

    it('clears the previous error when submitting again', async () => {
      const { fixture, component, port, el } = await failed(500, 'internal error')
      expect(alertText(el)).toBeTruthy()

      component.submit()
      fixture.detectChanges()

      expect(el.querySelector('gbt-alert')).toBeNull()
      port.calls.expectOne('register')
    })

    it('announces the error as an alert', async () => {
      const { el } = await failed(500, 'internal error')

      expect(el.querySelector('gbt-alert [role="alert"]')).toBeTruthy()
    })

    it('has no accessibility violation with the alert shown', async () => {
      const { el } = await failed(409, 'username already taken')

      await expectNoA11yViolations(el)
    })
  })

  describe('localisation', () => {
    it('takes its strings from the labels input', async () => {
      const ctx = await open({
        labels: { heading: 'Créer un compte', submit: 'Créer mon compte', invalid: 'Vérifiez' },
      })

      expect(ctx.el.querySelector('h1')?.textContent?.trim()).toBe('Créer un compte')
      expect(ctx.el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
        'Créer mon compte',
      )
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('register').fail(400, { error: 'something new' })
      await settle(ctx)
      expect(alertText(ctx.el)).toBe('Vérifiez')
    })

    it('takes its strings from provideAuthLabels, the labels input winning string by string', async () => {
      const { el } = await open({
        providers: [
          provideAuthLabels({
            register: { heading: 'Créer un compte', username: "Nom d'utilisateur" },
          }),
        ],
        labels: { heading: 'Inscription' },
      })

      expect(el.querySelector('h1')?.textContent?.trim()).toBe('Inscription')
      expect(
        el.querySelector('label[for^="gbt-register-"][for$="-username"]')?.textContent?.trim(),
      ).toBe("Nom d'utilisateur")
      expect(
        el.querySelector('label[for^="gbt-register-"][for$="-email"]')?.textContent?.trim(),
      ).toBe('Email address')
    })
  })
})
