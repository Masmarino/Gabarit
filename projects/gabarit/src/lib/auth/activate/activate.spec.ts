import { Component, type Provider, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../testing/expect-no-a11y-violations'
import { Button } from '../../components/atoms/button/button'
import { type ActivateLabels, provideAuthLabels } from '../auth-labels'
import { AuthFooterLink } from '../auth-footer/auth-footer'
import { AUTH_PORT } from '../ports/auth.port'
import { activationToken } from '../shared/activation-link'
import { MIN_PASSWORD_LENGTH } from '../shared/account-rules'
import { fakeAuthPort } from '../testing/fake-ports'
import { AuthActivate } from './activate'

const TOKEN = 'ab12'.repeat(16)

/**
 * The page as an application mounts it: the token it read from its URL, its logo and its link to the
 * sign-in page projected.
 */
@Component({
  standalone: true,
  imports: [AuthActivate, Button, AuthFooterLink],
  template: `<gbt-auth-activate
    [token]="token()"
    [labels]="labels()"
    [minPasswordLength]="minPasswordLength()"
    (activated)="activated = activated + 1"
    (signIn)="signIn = signIn + 1"
  >
    <img auth-logo src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Acme" />
    <a gbtButton variant="link" gbtAuthFooterLink href="/login">Sign in</a>
  </gbt-auth-activate>`,
})
class Host {
  token = signal<string | null>(null)
  labels = signal<Partial<ActivateLabels>>({})
  minPasswordLength = signal(MIN_PASSWORD_LENGTH)
  activated = 0
  signIn = 0
}

interface SetupOptions {
  labels?: Partial<ActivateLabels>
  minPasswordLength?: number
  providers?: Provider[]
}

describe('AuthActivate', () => {
  /** The page given `token` (what the application's `activationToken` read from the link, or null). */
  async function setup(token: string | null = TOKEN, options: SetupOptions = {}) {
    const port = fakeAuthPort()
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_PORT, useValue: port }, ...(options.providers ?? [])],
    })
    const fixture = TestBed.createComponent(Host)
    const host = fixture.componentInstance
    host.token.set(token)
    if (options.labels) host.labels.set(options.labels)
    if (options.minPasswordLength) host.minPasswordLength.set(options.minPasswordLength)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    const component = fixture.debugElement.query(By.directive(AuthActivate))
      .componentInstance as AuthActivate
    return { fixture, host, component, port, el: fixture.nativeElement as HTMLElement }
  }

  /** The page opened from a link: the application reads the token with `activationToken`. */
  const fromLink = (fragment: string | null, query: string | null = null) =>
    setup(activationToken(fragment, query))

  /** A field by the end of its per-instance id (`gbt-activate-<n>-password`). */
  const field = (el: HTMLElement, suffix: string) =>
    el.querySelector<HTMLInputElement>(`input[id^="gbt-activate-"][id$="-${suffix}"]`)!
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
  const heading = (el: HTMLElement) => el.querySelector('h1')?.textContent?.trim()
  const fill = (component: AuthActivate, password = 'a-long-password', confirmation = password) => {
    component['password'].set(password)
    component['confirmation'].set(confirmation)
  }
  const INVALID_LINK =
    'This invitation link is invalid or has expired. Ask an administrator to send you a new one.'

  describe('the link', () => {
    it('sends the token read from the fragment', async () => {
      const { component, port } = await fromLink(`token=${TOKEN}`)
      fill(component)

      component.submit()

      expect(port.calls.expectOne('activate').args).toEqual([TOKEN, 'a-long-password'])
    })

    it('is tolerant of other parameters in the fragment', async () => {
      const { component, port } = await fromLink(`token=${TOKEN}&utm=mail`)
      fill(component)

      component.submit()

      expect(port.calls.expectOne('activate').args).toEqual([TOKEN, 'a-long-password'])
    })

    it('still takes `?token=`, for the links of mails sent before the link moved to the fragment', async () => {
      const { component, port, el } = await fromLink(null, TOKEN)
      fill(component)

      component.submit()

      expect(port.calls.expectOne('activate').args).toEqual([TOKEN, 'a-long-password'])
      expect(el.querySelector('form')).toBeTruthy()
    })

    it('treats a malformed token as a dead link without calling the API', async () => {
      const { port, el } = await fromLink('token=not-a-token')

      port.calls.expectNone('activate')
      expect(el.querySelector('h1')?.textContent?.trim()).toBe('This link does not work')
    })

    it('draws the dead link as an error state: the h1 focusable by script, the text, then the way back to the sign-in', async () => {
      const { el } = await setup(null)

      const state = el.querySelector('gbt-empty-state')!
      expect(state.querySelector('.gbt-empty-state')?.getAttribute('data-tone')).toBe('error')
      const h1 = state.querySelector('h1')!
      expect(h1.getAttribute('tabindex')).toBe('-1')
      expect(state.querySelector('.gbt-empty-state__icon')?.getAttribute('aria-hidden')).toBe(
        'true',
      )
      const order = Array.from(
        state.querySelectorAll('.gbt-empty-state__icon, h1, .gbt-empty-state__message, button'),
      ).map((node) => node.className || node.tagName.toLowerCase())
      expect(order).toEqual([
        'gbt-empty-state__icon',
        'gbt-empty-state__heading',
        'gbt-empty-state__message',
        expect.stringContaining('gbt-button'),
      ])
      expect(state.querySelector('button')?.textContent?.trim()).toBe('Sign in')
    })

    it('starts over with a new token after a spent one', async () => {
      const { fixture, host, component, port, el } = await setup()
      fill(component)
      component.submit()
      port.calls.expectOne('activate').fail(400, { error: 'invalid or expired invitation' })
      fixture.detectChanges()
      expect(heading(el)).toBe('This link does not work')

      host.token.set('cd34'.repeat(16))
      fixture.detectChanges()
      expect(heading(el)).toBe('Activate your account')
      fill(component)
      component.submit()
      expect(port.calls.expectOne('activate').args[0]).toBe('cd34'.repeat(16))
    })
  })

  describe('the form', () => {
    it('shows the heading, the two labelled password fields and the projected sign-in link', async () => {
      const { el } = await setup()

      expect(heading(el)).toBe('Activate your account')
      expect(el.querySelector('.gbt-auth-panel__logo img')?.getAttribute('alt')).toBe('Acme')
      expect(
        el.querySelector('label[for^="gbt-activate-"][for$="-password"]')?.textContent?.trim(),
      ).toBe('New password')
      expect(
        el.querySelector('label[for^="gbt-activate-"][for$="-confirmation"]')?.textContent?.trim(),
      ).toBe('Confirm the password')
      expect(field(el, 'password').type).toBe('password')
      expect(field(el, 'password').getAttribute('autocomplete')).toBe('new-password')
      expect(field(el, 'confirmation').getAttribute('autocomplete')).toBe('new-password')
      expect(describedBy(el, 'password')).toEqual(['At least 8 characters.'])
      expect(describedBy(el, 'confirmation')).toEqual([])
      expect(el.querySelector('gbt-auth-footer')?.textContent).toContain(
        'Is your account already active?',
      )
      const link = el.querySelector<HTMLAnchorElement>('gbt-auth-footer a')!
      expect(link.textContent?.trim()).toBe('Sign in')
      expect(link.getAttribute('href')).toBe('/login')
    })

    it('has a single, primary "Activate my account" button', async () => {
      const { el } = await setup()

      const buttons = el.querySelectorAll('button.gbt-button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].classList).toContain('gbt-button--primary')
      expect(buttons[0].textContent?.trim()).toBe('Activate my account')
    })

    it('starts in the new-password field', async () => {
      const { el } = await setup()

      expect(document.activeElement).toBe(field(el, 'password'))
    })

    it('never displays the token', async () => {
      const { el } = await setup()

      expect(el.innerHTML).not.toContain(TOKEN)
      expect(
        Array.from(el.querySelectorAll('input')).every((input) => !input.value.includes(TOKEN)),
      ).toBe(true)
    })

    it('does not call the server just for opening', async () => {
      const { port } = await setup()

      port.calls.expectNone('activate')
      port.calls.verify()
    })

    it('submits when the form is submitted (Enter in a field)', async () => {
      const { component, el, port } = await setup()
      fill(component)

      el.querySelector('form')!.dispatchEvent(new Event('submit'))

      port.calls.expectOne('activate')
    })

    it('shows no footer when the application projects no sign-in link', async () => {
      TestBed.configureTestingModule({
        providers: [{ provide: AUTH_PORT, useValue: fakeAuthPort() }],
      })
      const fixture = TestBed.createComponent(AuthActivate)
      fixture.componentRef.setInput('token', TOKEN)
      fixture.detectChanges()
      const el = fixture.nativeElement as HTMLElement

      expect(el.querySelector('form')).toBeTruthy()
      expect(el.querySelector('gbt-auth-footer')).toBeNull()
    })

    it('has no accessibility violation', async () => {
      const { el } = await setup()

      await expectNoA11yViolations(el)
    })
  })

  describe('checks before the request', () => {
    it('shows nothing before the first attempt', async () => {
      const { fixture, component, el } = await setup()
      component['password'].set('x')
      fixture.detectChanges()

      expect(fieldErrors(el)).toEqual([])
    })

    it('sends nothing and names both fields after a first attempt with an empty form, focusing the first', async () => {
      const { fixture, component, port, el } = await setup()

      component.submit()
      fixture.detectChanges()
      await fixture.whenStable()

      port.calls.expectNone('activate')
      expect(fieldErrors(el)).toEqual(['Enter a password', 'Confirm your password'])
      expect(document.activeElement).toBe(field(el, 'password'))
    })

    it('refuses a password under 8 characters', async () => {
      const { fixture, component, port, el } = await setup()
      fill(component, 'short')

      component.submit()
      fixture.detectChanges()

      port.calls.expectNone('activate')
      expect(fieldErrors(el)).toEqual(['At least 8 characters'])
    })

    it('refuses a confirmation that differs, says so under the confirmation, and focuses it', async () => {
      const { fixture, component, port, el } = await setup()
      fill(component, 'a-long-password', 'a-long-passwore')

      component.submit()
      fixture.detectChanges()
      await fixture.whenStable()

      port.calls.expectNone('activate')
      expect(fieldErrors(el)).toEqual(['The passwords do not match'])
      expect(document.activeElement).toBe(field(el, 'confirmation'))
    })

    it('keeps checking live once an attempt was made, and lets the fixed form through', async () => {
      const { fixture, component, port, el } = await setup()
      fill(component, 'a-long-password', 'other')
      component.submit()
      fixture.detectChanges()
      expect(fieldErrors(el)).toEqual(['The passwords do not match'])

      component['confirmation'].set('a-long-password')
      fixture.detectChanges()
      expect(fieldErrors(el)).toEqual([])

      component.submit()
      port.calls.expectOne('activate')
    })

    it('checks the password against minPasswordLength, and says so in the hint and the error', async () => {
      const { fixture, component, port, el } = await setup(TOKEN, { minPasswordLength: 12 })

      expect(describedBy(el, 'password')).toEqual(['At least 12 characters.'])
      fill(component, 'eleven-char')
      component.submit()
      fixture.detectChanges()

      port.calls.expectNone('activate')
      expect(fieldErrors(el)).toEqual(['At least 12 characters'])

      fill(component, 'twelve-chars')
      component.submit()
      port.calls.expectOne('activate')
    })

    it('has no accessibility violation with the field errors shown', async () => {
      const { fixture, component, el } = await setup()
      component.submit()
      fixture.detectChanges()

      await expectNoA11yViolations(el)
    })
  })

  describe('activating', () => {
    it('sends the token from the link and the new password, once', async () => {
      const { component, port } = await setup()
      fill(component)

      component.submit()
      const call = port.calls.expectOne('activate')

      expect(call.args).toEqual([TOKEN, 'a-long-password'])
      port.calls.verify()
    })

    it('shows a loading, disabled button while in flight and ignores a second submit', async () => {
      const { fixture, component, port, el } = await setup()
      fill(component)
      const button = fixture.debugElement.query(By.css('form gbt-button')).injector.get(Button)

      component.submit()
      fixture.detectChanges()
      expect(button.loading()).toBe(true)
      expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true)
      expect(el.textContent).toContain('Activating')

      component.submit()
      port.calls.expectOne('activate').fail(500, { error: 'internal error' })
      fixture.detectChanges()

      expect(button.loading()).toBe(false)
    })

    describe('on success', () => {
      async function activated() {
        const ctx = await setup()
        fill(ctx.component)
        ctx.component.submit()
        ctx.port.calls.expectOne('activate').flush()
        ctx.fixture.detectChanges()
        await ctx.fixture.whenStable()
        ctx.fixture.detectChanges()
        return ctx
      }

      it('says the account is activated, with a single primary "Sign in" button that emits signIn', async () => {
        const { fixture, el, host } = await activated()

        expect(heading(el)).toBe('Your account is activated')
        expect(el.querySelector('form')).toBeNull()
        const buttons = el.querySelectorAll('button.gbt-button')
        expect(buttons.length).toBe(1)
        expect(buttons[0].classList).toContain('gbt-button--primary')
        expect(buttons[0].textContent?.trim()).toBe('Sign in')
        expect(host.signIn).toBe(0)
        ;(buttons[0] as HTMLButtonElement).click()
        fixture.detectChanges()

        expect(host.signIn).toBe(1)
      })

      it('emits activated, and does not keep the passwords, nor open a session', async () => {
        const { component, host, port } = await activated()

        expect(host.activated).toBe(1)
        expect(component['password']()).toBe('')
        expect(component['confirmation']()).toBe('')
        expect(port.tokens).toEqual([])
      })

      it('moves the focus to the heading, so the change is announced', async () => {
        const { el } = await activated()

        expect(document.activeElement).toBe(el.querySelector('h1'))
      })

      it('draws the success as a state with the green glyph, the h1 being a focus target that is no tab stop', async () => {
        const { el } = await activated()

        const state = el.querySelector('gbt-empty-state')!
        expect(state.classList).toContain('gbt-auth-panel__status--success')
        expect(state.querySelector('.gbt-empty-state')?.getAttribute('data-tone')).toBeNull()
        expect(state.querySelector('h1')?.getAttribute('tabindex')).toBe('-1')
        expect(state.querySelector('.gbt-empty-state__icon')?.getAttribute('aria-hidden')).toBe(
          'true',
        )
      })

      it('cannot be submitted again: the token was spent', async () => {
        const { component, port } = await activated()

        component.submit()

        port.calls.expectNone('activate')
      })

      it('has no accessibility violation', async () => {
        const { el } = await activated()

        await expectNoA11yViolations(el)
      })
    })
  })

  describe('a link that does not work', () => {
    it.each([[null], ['']])(
      'is invalid, without calling the server, when the token is %j',
      async (token) => {
        const { el, port, component, host } = await setup(token)

        port.calls.expectNone('activate')
        expect(heading(el)).toBe('This link does not work')
        expect(el.textContent).toContain(INVALID_LINK)
        expect(el.querySelector('form')).toBeNull()
        expect(el.querySelector('input')).toBeNull()
        component.submit()
        port.calls.expectNone('activate')
        expect(host.activated).toBe(0)
      },
    )

    it('has a single, primary "Sign in" button that emits signIn', async () => {
      const { fixture, el, host } = await setup(null)

      const buttons = el.querySelectorAll('button.gbt-button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].classList).toContain('gbt-button--primary')
      ;(buttons[0] as HTMLButtonElement).click()
      fixture.detectChanges()

      expect(host.signIn).toBe(1)
    })

    it('moves the focus to the heading', async () => {
      const { el } = await setup(null)

      expect(document.activeElement).toBe(el.querySelector('h1'))
    })

    it('is what an unknown, expired or used token turns the form into, the passwords are dropped and the token is not sent again', async () => {
      const { fixture, component, port, el, host } = await setup()
      fill(component)

      component.submit()
      port.calls.expectOne('activate').fail(400, { error: 'invalid or expired invitation' })
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()

      expect(heading(el)).toBe('This link does not work')
      expect(el.textContent).toContain(INVALID_LINK)
      expect(component['password']()).toBe('')
      expect(component['confirmation']()).toBe('')
      expect(document.activeElement).toBe(el.querySelector('h1'))
      expect(host.activated).toBe(0)
      // The refused token is spent: even with the form's view forced back, it is not sent again.
      component.view.set('form')
      fill(component)
      component.submit()
      port.calls.expectNone('activate')
    })

    it('has no accessibility violation', async () => {
      const { el } = await setup(null)

      await expectNoA11yViolations(el)
    })
  })

  describe('how the other failures are worded', () => {
    async function failed(status: number, error: string) {
      const ctx = await setup()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('activate').fail(status, { error })
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()
      ctx.fixture.detectChanges()
      return ctx
    }

    it('keeps the form and names the rule on a weak-password 400 (the link is still good)', async () => {
      const { el, component } = await failed(400, 'password must be at least 8 characters')

      expect(heading(el)).toBe('Activate your account')
      expect(alertText(el)).toBe('The password must be at least 8 characters long')
      expect(document.activeElement).toBe(field(el, 'password'))
      expect(component.submitting()).toBe(false)
    })

    it('says to wait on a 429, keeps the form, and focuses the password', async () => {
      const { el } = await failed(429, 'too many attempts, try again later')

      expect(heading(el)).toBe('Activate your account')
      expect(alertText(el)).toBe('Too many attempts, try again in a few minutes')
      expect(document.activeElement).toBe(field(el, 'password'))
    })

    it('says the activation failed on a 500, and the same token can be retried', async () => {
      const { fixture, el, component, port } = await failed(500, 'internal error')

      expect(alertText(el)).toBe('Activation failed, try again.')
      component.submit()
      fixture.detectChanges()
      expect(port.calls.expectOne('activate').args).toEqual([TOKEN, 'a-long-password'])
      expect(el.querySelector('gbt-alert')).toBeNull()
    })

    it('says the activation failed on a network error', async () => {
      const ctx = await setup()
      fill(ctx.component)
      ctx.component.submit()
      ctx.port.calls.expectOne('activate').fail(0)
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe('Activation failed, try again.')
    })

    it('has no accessibility violation with the alert shown', async () => {
      const { el } = await failed(429, 'too many attempts, try again later')

      await expectNoA11yViolations(el)
    })
  })

  describe('localisation', () => {
    it('takes its strings from the labels input', async () => {
      const { el } = await setup(TOKEN, {
        labels: { heading: 'Activez votre compte', submit: 'Activer mon compte' },
      })

      expect(heading(el)).toBe('Activez votre compte')
      expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
        'Activer mon compte',
      )
    })

    it('takes its strings from provideAuthLabels, the labels input winning string by string', async () => {
      const { el } = await setup(null, {
        providers: [
          provideAuthLabels({
            activate: { invalidHeading: 'Ce lien ne fonctionne pas', signIn: 'Se connecter' },
          }),
        ],
        labels: { signIn: 'Connexion' },
      })

      expect(heading(el)).toBe('Ce lien ne fonctionne pas')
      expect(el.querySelector('button')?.textContent?.trim()).toBe('Connexion')
      expect(el.textContent).toContain(INVALID_LINK)
    })
  })
})
