import { Component, type Provider, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../testing/expect-no-a11y-violations'
import { Button } from '../../components/atoms/button/button'
import { type MfaEnrollmentLabels, provideAuthLabels } from '../auth-labels'
import { BackupCodes } from '../backup-codes/backup-codes'
import { AUTH_PORT } from '../ports/auth.port'
import { FAKE_QR_DATA_URL, fakeAuthPort, fakeQrRenderer } from '../testing/fake-ports'
import {
  CREATION_OPTIONS,
  dismissedPrompt,
  fakeAttestation,
  stubPasskeyBrowser,
} from '../testing/webauthn-testing'
import { TOTP_QR_RENDERER, TotpQr, type TotpQrRenderer } from '../totp-qr/totp-qr'
import { MfaEnrollment } from './mfa-enrollment'

const OTPAUTH = 'otpauth://totp/Acme:admin?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
const CODES = Array.from(
  { length: 10 },
  (_, i) => `${String(i).repeat(8)}abcdef01${'2'.repeat(8)}${'f'.repeat(8)}`,
)

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10))

// The component as the login and register pages embed it: inputs bound, outputs recorded.
@Component({
  standalone: true,
  imports: [MfaEnrollment],
  template: `<gbt-mfa-enrollment
    [mfaToken]="mfaToken()"
    [passkeysAvailable]="passkeysAvailable()"
    [labels]="labels()"
    (completed)="completed.push($event)"
    (cancelled)="cancelled.push(true)"
    (expired)="expired.push(true)"
  />`,
})
class Host {
  mfaToken = signal('pending')
  passkeysAvailable = signal(false)
  labels = signal<Partial<MfaEnrollmentLabels>>({})
  completed: string[] = []
  cancelled: true[] = []
  expired: true[] = []
}

interface SetupOptions {
  /** The application's QR encoder (default: the spec one, answering FAKE_QR_DATA_URL). */
  render?: TotpQrRenderer
  labels?: Partial<MfaEnrollmentLabels>
  providers?: Provider[]
}

describe('MfaEnrollment', () => {
  function setup(passkeysAvailable = false, options: SetupOptions = {}) {
    const port = fakeAuthPort()
    const render = vi.fn<TotpQrRenderer>(options.render ?? fakeQrRenderer)
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_PORT, useValue: port },
        { provide: TOTP_QR_RENDERER, useValue: render },
        ...(options.providers ?? []),
      ],
    })
    const fixture = TestBed.createComponent(Host)
    const host = fixture.componentInstance
    host.passkeysAvailable.set(passkeysAvailable)
    if (options.labels) {
      host.labels.set(options.labels)
    }
    fixture.detectChanges()
    return {
      fixture,
      component: fixture.debugElement.query(By.directive(MfaEnrollment))
        .componentInstance as MfaEnrollment,
      port,
      render,
      el: fixture.nativeElement as HTMLElement,
      completed: host.completed,
      cancelled: host.cancelled,
      expired: host.expired,
    }
  }
  type Ctx = ReturnType<typeof setup>

  const primary = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button.gbt-button--primary'))
  const buttonByText = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === text,
    )!
  const buttonComponent = (ctx: Ctx, text: string) =>
    ctx.fixture.debugElement
      .queryAll(By.directive(Button))
      .map((d) => d.componentInstance as Button)
      .find((b) => b.text() === text)!
  const alertText = (el: HTMLElement) =>
    el.querySelector('gbt-alert [role="alert"], gbt-alert[role="alert"]')?.textContent?.trim()
  const field = (el: HTMLElement) =>
    el.querySelector<HTMLInputElement>('[id^="gbt-mfa-enrollment-"][id$="-code"]')!
  const EXPIRED = { error: 'invalid or expired token' }

  async function toScan(ctx: Ctx, begin = 'Get started') {
    buttonByText(ctx.el, begin).click()
    ctx.port.calls
      .expectOne('enrollTotp')
      .flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
    ctx.fixture.detectChanges()
    await settle()
    ctx.fixture.detectChanges()
  }
  async function toCodes(ctx: Ctx) {
    await toScan(ctx)
    ctx.component['code'].set('123456')
    ctx.fixture.detectChanges()
    buttonByText(ctx.el, 'Activate').click()
    ctx.port.calls.expectOne('confirmTotp').flush({ token: 'session-jwt', backupCodes: CODES })
    ctx.fixture.detectChanges()
    await ctx.fixture.whenStable()
    ctx.fixture.detectChanges()
  }

  describe('intro step', () => {
    it('explains that two-factor authentication is required and offers a single primary button', () => {
      const { el } = setup()

      expect(el.textContent).toContain(
        'Two-factor authentication is required to secure your account.',
      )
      // The mandatory-2FA note is on the page from the start: an information note, no live region.
      const note = el.querySelector('gbt-alert .gbt-alert')!
      expect(note.getAttribute('data-variant')).toBe('info')
      expect(note.hasAttribute('role')).toBe(false)
      expect(note.hasAttribute('aria-live')).toBe(false)
      expect(primary(el).map((b) => b.textContent?.trim())).toEqual(['Get started'])
      expect(el.textContent).toContain('Step 1 of 3')
    })

    it('does not ask the server anything before "Get started"', () => {
      const { port } = setup()

      port.calls.expectNone('enrollTotp')
      port.calls.verify()
    })

    it('starts the enrolment with the mfaToken, then shows the scan step', async () => {
      const ctx = setup()

      buttonByText(ctx.el, 'Get started').click()
      const call = ctx.port.calls.expectOne('enrollTotp')
      expect(call.args).toEqual(['pending'])
      call.flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
      ctx.fixture.detectChanges()

      expect(ctx.el.textContent).toContain('Step 2 of 3')
      expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
    })

    it('shows a spinner and ignores a second click while the request is in flight', () => {
      const ctx = setup()
      const button = ctx.fixture.debugElement.query(By.directive(Button))
        .componentInstance as Button

      ctx.component.begin()
      ctx.fixture.detectChanges()
      ctx.component.begin()

      expect(button.loading()).toBe(true)
      ctx.port.calls.expectOne('enrollTotp')
    })

    it('says the sign-in expired on an invalid-or-expired-token 401 and tells the host', () => {
      const ctx = setup()

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(401, EXPIRED)
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe('Your sign-in has expired, sign in again.')
      expect(ctx.expired.length).toBe(1)
      const button = ctx.fixture.debugElement.query(By.directive(Button))
        .componentInstance as Button
      expect(button.loading()).toBe(false)
    })

    it('says to wait on a 429, and gives a generic message on any other failure', () => {
      const ctx = setup()

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(429, {})
      ctx.fixture.detectChanges()
      expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(500, {})
      ctx.fixture.detectChanges()
      expect(alertText(ctx.el)).toBe('The setup could not start, try again.')

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(0)
      ctx.fixture.detectChanges()
      expect(alertText(ctx.el)).toBe('The setup could not start, try again.')
      expect(ctx.expired.length).toBe(0)
    })

    it('sends the user back to the credentials when the account already has a factor (400 "MFA is already set up")', () => {
      const ctx = setup()

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(400, { error: 'MFA is already set up' })
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe('Two-factor authentication is already set up, sign in again.')
      expect(ctx.expired.length).toBe(1)
    })

    it('gives the keyboard focus back to "Get started" after a failure (the button was disabled while loading)', async () => {
      const ctx = setup()
      await ctx.fixture.whenStable()

      ctx.component.begin()
      ctx.fixture.detectChanges()
      ctx.port.calls.expectOne('enrollTotp').fail(500, {})
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()

      expect(document.activeElement).toBe(buttonByText(ctx.el, 'Get started'))
    })

    it('offers "Back", which emits `cancelled`', () => {
      const { el, cancelled } = setup()

      buttonByText(el, 'Back').click()

      expect(cancelled.length).toBe(1)
    })

    it('moves the focus to the step heading when it opens', async () => {
      const { fixture, el } = setup()
      await fixture.whenStable()

      expect(document.activeElement).toBe(el.querySelector('h2'))
    })

    it('has no accessibility violations', async () => {
      const { el } = setup()

      await expectNoA11yViolations(el)
    })

    it('has no accessibility violations with an error shown', async () => {
      const ctx = setup()
      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(500, {})
      ctx.fixture.detectChanges()

      await expectNoA11yViolations(ctx.el)
    })
  })

  describe('scan step', () => {
    it('shows the QR of the otpauth URL and the secret, through gbt-totp-qr', async () => {
      const ctx = setup()
      await toScan(ctx)

      const qr = ctx.fixture.debugElement.query(By.directive(TotpQr)).componentInstance as TotpQr
      expect(qr.otpauthUrl()).toBe(OTPAUTH)
      expect(qr.secret()).toBe('JBSWY3DPEHPK3PXP')
      expect(ctx.el.querySelector('img')?.getAttribute('src')).toBe(FAKE_QR_DATA_URL)
      expect(ctx.render).toHaveBeenCalledTimes(1)
      expect(ctx.render.mock.calls[0][0]).toBe(OTPAUTH)
    })

    it('still shows the secret when the QR cannot be drawn', async () => {
      const ctx = setup(false, { render: () => Promise.reject(new Error('no canvas')) })
      await toScan(ctx)

      expect(ctx.el.querySelector('img')).toBeNull()
      expect(ctx.el.querySelector('code')?.textContent?.trim()).toBe('JBSWY3DPEHPK3PXP')
    })

    it('has a labelled one-time-code field and one primary "Activate"', async () => {
      const ctx = setup()
      await toScan(ctx)
      await ctx.fixture.whenStable()

      expect(
        ctx.el
          .querySelector('label[for^="gbt-mfa-enrollment-"][for$="-code"]')
          ?.textContent?.trim(),
      ).toBe('6-digit code')
      expect(field(ctx.el).getAttribute('autocomplete')).toBe('one-time-code')
      expect(field(ctx.el).getAttribute('inputmode')).toBe('numeric')
      expect(field(ctx.el).getAttribute('spellcheck')).toBe('false')
      expect(field(ctx.el).getAttribute('autocapitalize')).toBe('off')
      expect(field(ctx.el).getAttribute('enterkeyhint')).toBe('go')
      expect(primary(ctx.el).map((b) => b.textContent?.trim())).toEqual(['Activate'])
    })

    it('opens on the step heading, NOT in the code field: the QR stays in view and no keyboard covers it', async () => {
      const ctx = setup()
      await toScan(ctx)
      await ctx.fixture.whenStable()

      expect(document.activeElement).toBe(ctx.el.querySelector('h2'))
      expect(document.activeElement).not.toBe(field(ctx.el))
    })

    it('confirms with the typed code stripped of spaces', async () => {
      const ctx = setup()
      await toScan(ctx)
      ctx.component['code'].set(' 123 456 ')

      ctx.el.querySelector('form')!.dispatchEvent(new Event('submit'))
      const call = ctx.port.calls.expectOne('confirmTotp')

      expect(call.args).toEqual(['pending', '123456'])
    })

    it('does not ask the server when the field is empty, and says what is missing', async () => {
      const ctx = setup()
      await toScan(ctx)

      ctx.el.querySelector('form')!.dispatchEvent(new Event('submit'))
      ctx.fixture.detectChanges()

      ctx.port.calls.expectNone('confirmTotp')
      expect(alertText(ctx.el)).toBe('Enter the 6-digit code from your app')
    })

    it('shows "Incorrect code" on a wrong code (400), clears the field and refocuses it', async () => {
      const ctx = setup()
      await toScan(ctx)
      ctx.component['code'].set('000000')

      ctx.component.confirm()
      ctx.port.calls.expectOne('confirmTotp').fail(400, { error: 'invalid code' })
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()

      expect(alertText(ctx.el)).toBe('Incorrect code')
      expect(ctx.component['code']()).toBe('')
      expect(document.activeElement).toBe(field(ctx.el))
      expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
    })

    it('says to wait on a 429 and that the sign-in expired on an expired-token 401, telling the host', async () => {
      const ctx = setup()
      await toScan(ctx)
      ctx.component['code'].set('111111')

      ctx.component.confirm()
      ctx.port.calls.expectOne('confirmTotp').fail(429, {})
      ctx.fixture.detectChanges()
      expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')

      ctx.component['code'].set('111111')
      ctx.component.confirm()
      ctx.port.calls.expectOne('confirmTotp').fail(401, EXPIRED)
      ctx.fixture.detectChanges()
      expect(alertText(ctx.el)).toBe('Your sign-in has expired, sign in again.')
      expect(ctx.expired.length).toBe(1)
    })

    it('rolls the busy state back on failure and ignores a second submit while in flight', async () => {
      const ctx = setup()
      await toScan(ctx)
      ctx.component['code'].set('123456')
      const button = buttonComponent(ctx, 'Activate')

      ctx.component.confirm()
      ctx.fixture.detectChanges()
      ctx.component.confirm()
      expect(button.loading()).toBe(true)
      ctx.port.calls.expectOne('confirmTotp').fail(500, {})
      ctx.fixture.detectChanges()

      expect(button.loading()).toBe(false)
      expect(alertText(ctx.el)).toBe('Activation failed, try again.')
    })

    it('"Back" emits `cancelled`', async () => {
      const ctx = setup()
      await toScan(ctx)

      buttonByText(ctx.el, 'Back').click()

      expect(ctx.cancelled.length).toBe(1)
    })

    it('has no accessibility violations, with the QR and with a refused code', async () => {
      const ctx = setup()
      await toScan(ctx)
      await expectNoA11yViolations(ctx.el)

      ctx.component['code'].set('000000')
      ctx.component.confirm()
      ctx.port.calls.expectOne('confirmTotp').fail(400, { error: 'invalid code' })
      ctx.fixture.detectChanges()
      await expectNoA11yViolations(ctx.el)
    })
  })

  describe('codes step', () => {
    it('shows the ten codes and does NOT hand out the session token yet', async () => {
      const ctx = setup()
      await toCodes(ctx)

      const list = ctx.fixture.debugElement.query(By.directive(BackupCodes))
        .componentInstance as BackupCodes
      expect(list.codes()).toEqual(CODES)
      expect(ctx.el.textContent).toContain('Step 3 of 3')
      expect(ctx.port.tokens).toEqual([])
      expect(ctx.completed).toEqual([])
    })

    it('drops the secret and the code once the factor is confirmed', async () => {
      const ctx = setup()
      await toCodes(ctx)

      expect(ctx.el.querySelector('gbt-totp-qr')).toBeNull()
      expect(ctx.component['code']()).toBe('')
      expect(ctx.component['secret']()).toBe('')
      expect(ctx.component['otpauthUrl']()).toBe('')
    })

    it('has one primary "Continue", disabled until the codes are acknowledged', async () => {
      const ctx = setup()
      await toCodes(ctx)
      const buttons = primary(ctx.el)

      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Continue'])
      expect(buttons[0].disabled).toBe(true)

      ctx.el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click()
      ctx.fixture.detectChanges()

      expect(primary(ctx.el)[0].disabled).toBe(false)
    })

    it('does not complete when "Continue" is forced before the acknowledgement', async () => {
      const ctx = setup()
      await toCodes(ctx)

      ctx.component.finish()

      expect(ctx.completed).toEqual([])
    })

    it('emits the SESSION token once the codes are acknowledged and "Continue" is pressed', async () => {
      const ctx = setup()
      await toCodes(ctx)
      ctx.el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click()
      ctx.fixture.detectChanges()

      primary(ctx.el)[0].click()

      expect(ctx.completed).toEqual(['session-jwt'])
      // The host (login or register page) hands it to AuthPort.setToken: the component itself never does.
      expect(ctx.port.tokens).toEqual([])
    })

    it('moves the focus to the step heading', async () => {
      const ctx = setup()
      await toCodes(ctx)
      await ctx.fixture.whenStable()

      expect(document.activeElement).toBe(ctx.el.querySelector('h2'))
      expect(ctx.el.querySelector('h2')?.textContent).toContain('backup codes')
    })

    it('has no "Back": once confirmed, the codes are not shown again', async () => {
      const ctx = setup()
      await toCodes(ctx)

      expect(
        Array.from(ctx.el.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Back'),
      ).toBe(false)
    })

    it('words the codes for a lost app on the authenticator path', async () => {
      const ctx = setup()
      await toCodes(ctx)

      expect(ctx.el.querySelector('.gbt-mfa-enrollment__lead')?.textContent).toContain(
        'lose access to your app',
      )
    })

    it('has no accessibility violations', async () => {
      const ctx = setup()
      await toCodes(ctx)

      await expectNoA11yViolations(ctx.el)
    })
  })

  describe('leaving the codes step', () => {
    const leaves = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }

    it('asks the browser to confirm closing or reloading while the codes are not acknowledged, and stops once they are', async () => {
      const ctx = setup()
      expect(leaves()).toBe(false)
      await toCodes(ctx)
      expect(leaves()).toBe(true)

      ctx.component['acknowledged'].set(true)
      ctx.fixture.detectChanges()
      expect(leaves()).toBe(false)
    })

    it('removes the browser prompt when the component is destroyed on the codes step', async () => {
      const ctx = setup()
      await toCodes(ctx)
      expect(leaves()).toBe(true)

      ctx.fixture.destroy()

      expect(leaves()).toBe(false)
    })
  })

  describe('the choice of a factor', () => {
    it('reads passkeysAvailable as a boolean attribute (a bare attribute means true)', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: AUTH_PORT, useValue: fakeAuthPort() }],
      })
      const fixture = TestBed.createComponent(MfaEnrollment)
      fixture.componentRef.setInput('mfaToken', 'pending')

      fixture.componentRef.setInput('passkeysAvailable', '')
      expect(fixture.componentInstance.passkeysAvailable()).toBe(true)
      fixture.componentRef.setInput('passkeysAvailable', 'false')
      expect(fixture.componentInstance.passkeysAvailable()).toBe(false)
    })

    const CHALLENGE_ID = '7b1f7f2e-0000-4000-8000-000000000001'

    let restoreBrowser: (() => void) | null = null
    afterEach(() => {
      restoreBrowser?.()
      restoreBrowser = null
    })
    const browser = (create?: () => Promise<unknown>) => {
      restoreBrowser?.()
      restoreBrowser = stubPasskeyBrowser(create ? { create, get: vi.fn() } : null)
    }
    const buttons = (el: HTMLElement) =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button.gbt-button')).map(
        (b) =>
          `${b.classList.contains('gbt-button--primary') ? 'primary' : 'secondary'}:${b.textContent?.trim()}`,
      )
    const nameField = (el: HTMLElement) =>
      el.querySelector<HTMLInputElement>('[id^="gbt-mfa-enrollment-"][id$="-passkey-name"]')!
    const quiet = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('gbt-alert')).map((a) => a.textContent?.trim())

    async function toPasskey(ctx: Ctx) {
      buttonByText(ctx.el, 'Use a passkey').click()
      ctx.fixture.detectChanges()
      await ctx.fixture.whenStable()
      ctx.fixture.detectChanges()
    }
    /** Submits the passkey step and lets the server and the browser answer up to the finish call. */
    async function create(ctx: Ctx) {
      ctx.component.createPasskey()
      ctx.port.calls
        .expectOne('startPasskeySetup')
        .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
      await settle()
      ctx.fixture.detectChanges()
    }

    describe('which factors are offered', () => {
      it('offers both, the passkey as the single primary, on a browser and a server that can', () => {
        browser(vi.fn())
        const { el } = setup(true)

        expect(buttons(el)).toEqual([
          'primary:Use a passkey',
          'secondary:Use an app',
          'secondary:Back',
        ])
        expect(el.textContent).toContain('Passkey')
        expect(el.textContent).toContain('Authenticator app')
        expect(el.textContent).toContain('Recommended')
        expect(el.textContent).toContain('Step 1 of 3')
      })

      it('offers the authenticator alone (the "Get started" introduction) when the server cannot run passkeys', () => {
        browser(vi.fn())
        const { el } = setup(false)

        expect(buttons(el)).toEqual(['primary:Get started', 'secondary:Back'])
        expect(el.textContent?.toLowerCase()).not.toContain('passkey')
      })

      it('offers the authenticator alone when the browser has no WebAuthn', () => {
        browser()
        const { el } = setup(true)

        expect(buttons(el)).toEqual(['primary:Get started', 'secondary:Back'])
        expect(el.textContent?.toLowerCase()).not.toContain('passkey')
      })

      it('does not ask the server anything before a choice is made', () => {
        browser(vi.fn())
        const { port } = setup(true)

        port.calls.expectNone('enrollTotp')
        port.calls.expectNone('startPasskeySetup')
        port.calls.verify()
      })

      it('"Use an app" starts the existing TOTP path', async () => {
        browser(vi.fn())
        const ctx = setup(true)

        buttonByText(ctx.el, 'Use an app').click()
        const call = ctx.port.calls.expectOne('enrollTotp')
        expect(call.args).toEqual(['pending'])
        call.flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
        ctx.fixture.detectChanges()

        expect(ctx.el.textContent).toContain('Step 2 of 3')
        expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
      })

      it('"Back" of the scan step comes back to the choice when there is one, and drops the secret', async () => {
        browser(vi.fn())
        const ctx = setup(true)
        buttonByText(ctx.el, 'Use an app').click()
        ctx.port.calls
          .expectOne('enrollTotp')
          .flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
        ctx.fixture.detectChanges()
        await settle()

        buttonByText(ctx.el, 'Back').click()
        ctx.fixture.detectChanges()

        expect(ctx.cancelled.length).toBe(0)
        expect(ctx.el.textContent).toContain('Step 1 of 3')
        expect(ctx.component['secret']()).toBe('')
        expect(ctx.el.querySelector('gbt-totp-qr')).toBeNull()
      })

      it('"Back" of the choice emits `cancelled`', () => {
        browser(vi.fn())
        const ctx = setup(true)

        buttonByText(ctx.el, 'Back').click()

        expect(ctx.cancelled.length).toBe(1)
      })

      it('has no accessibility violations', async () => {
        browser(vi.fn())
        const { el } = setup(true)

        await expectNoA11yViolations(el)
      })
    })

    describe('the passkey step', () => {
      it('asks for an optional name, shows the default as its placeholder, and has one primary button', async () => {
        browser(vi.fn())
        const ctx = setup(true)

        await toPasskey(ctx)

        expect(ctx.el.textContent).toContain('Step 2 of 3')
        expect(
          ctx.el
            .querySelector('label[for^="gbt-mfa-enrollment-"][for$="-passkey-name"]')
            ?.textContent?.trim(),
        ).toBe('Key name (optional)')
        expect(nameField(ctx.el).placeholder).toBe('Passkey')
        expect(nameField(ctx.el).value).toBe('')
        expect(buttons(ctx.el)).toEqual(['primary:Create the passkey', 'secondary:Back'])
        ctx.port.calls.expectNone('startPasskeySetup')
      })

      it('opens on its heading', async () => {
        browser(vi.fn())
        const ctx = setup(true)

        await toPasskey(ctx)

        expect(document.activeElement).toBe(ctx.el.querySelector('h2'))
      })

      it('"Back" comes back to the choice without asking anything', async () => {
        browser(vi.fn())
        const ctx = setup(true)
        await toPasskey(ctx)

        buttonByText(ctx.el, 'Back').click()
        ctx.fixture.detectChanges()

        expect(ctx.el.textContent).toContain('Step 1 of 3')
        expect(ctx.cancelled.length).toBe(0)
        ctx.port.calls.expectNone('startPasskeySetup')
      })

      it('starts with the mfaToken, hands the options to the browser, and finishes with the attestation and the trimmed name', async () => {
        const createCredential = vi.fn().mockResolvedValue(fakeAttestation())
        browser(createCredential)
        const ctx = setup(true)
        await toPasskey(ctx)
        ctx.component['passkeyName'].set('  MacBook de Florian  ')

        ctx.component.createPasskey()
        const start = ctx.port.calls.expectOne('startPasskeySetup')
        expect(start.args).toEqual(['pending'])
        start.flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()

        expect(createCredential).toHaveBeenCalledTimes(1)
        const finish = ctx.port.calls.expectOne('finishPasskeySetup')
        expect(finish.args).toEqual([
          'pending',
          CHALLENGE_ID,
          {
            id: 'credential-id',
            rawId: 'AQID',
            type: 'public-key',
            response: { attestationObject: 'BAU', clientDataJSON: 'Bgc' },
          },
          'MacBook de Florian',
        ])
      })

      it('names the key "Passkey" when the field is left empty or blank', async () => {
        browser(vi.fn().mockResolvedValue(fakeAttestation()))
        const ctx = setup(true)
        await toPasskey(ctx)
        ctx.component['passkeyName'].set('   ')

        ctx.component.createPasskey()
        ctx.port.calls
          .expectOne('startPasskeySetup')
          .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()

        expect(ctx.port.calls.expectOne('finishPasskeySetup').args[3]).toBe('Passkey')
      })

      it('refuses a name of more than 40 characters, or with control characters, before asking the server', async () => {
        browser(vi.fn())
        const ctx = setup(true)
        await toPasskey(ctx)

        ctx.component['passkeyName'].set('x'.repeat(41))
        ctx.component.createPasskey()
        ctx.fixture.detectChanges()
        expect(alertText(ctx.el)).toBe('The name must not be longer than 40 characters')

        ctx.component['passkeyName'].set('bad\nname')
        ctx.component.createPasskey()
        ctx.fixture.detectChanges()
        expect(alertText(ctx.el)).toBe('The name cannot contain control characters')
        ctx.port.calls.expectNone('startPasskeySetup')
        await ctx.fixture.whenStable()
        expect(document.activeElement).toBe(nameField(ctx.el))
      })

      it('accepts a name of exactly 40 characters', async () => {
        browser(vi.fn())
        const ctx = setup(true)
        await toPasskey(ctx)
        ctx.component['passkeyName'].set('x'.repeat(40))

        ctx.component.createPasskey()

        ctx.port.calls.expectOne('startPasskeySetup')
      })

      it('goes on to the backup codes with the session token held back, like the authenticator path', async () => {
        browser(vi.fn().mockResolvedValue(fakeAttestation()))
        const ctx = setup(true)
        await toPasskey(ctx)

        ctx.component.createPasskey()
        ctx.port.calls
          .expectOne('startPasskeySetup')
          .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()
        ctx.port.calls
          .expectOne('finishPasskeySetup')
          .flush({ token: 'session-jwt', backupCodes: CODES })
        ctx.fixture.detectChanges()
        await ctx.fixture.whenStable()
        ctx.fixture.detectChanges()

        const list = ctx.fixture.debugElement.query(By.directive(BackupCodes))
          .componentInstance as BackupCodes
        expect(list.codes()).toEqual(CODES)
        expect(ctx.el.textContent).toContain('Step 3 of 3')
        expect(ctx.el.textContent).toContain('your passkey')
        expect(ctx.port.tokens).toEqual([])
        expect(ctx.completed).toEqual([])
        expect(document.activeElement).toBe(ctx.el.querySelector('h2'))
      })

      it('emits the session token only once the codes are acknowledged', async () => {
        browser(vi.fn().mockResolvedValue(fakeAttestation()))
        const ctx = setup(true)
        await toPasskey(ctx)
        ctx.component.createPasskey()
        ctx.port.calls
          .expectOne('startPasskeySetup')
          .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()
        ctx.port.calls
          .expectOne('finishPasskeySetup')
          .flush({ token: 'session-jwt', backupCodes: CODES })
        ctx.fixture.detectChanges()
        await ctx.fixture.whenStable()
        ctx.fixture.detectChanges()
        expect(primary(ctx.el)[0].disabled).toBe(true)
        ctx.component.finish()
        expect(ctx.completed).toEqual([])

        ctx.el.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click()
        ctx.fixture.detectChanges()
        primary(ctx.el)[0].click()

        expect(ctx.completed).toEqual(['session-jwt'])
        expect(ctx.port.tokens).toEqual([])
      })

      it('completes at once, with the session token, when the server issues no backup codes', async () => {
        browser(vi.fn().mockResolvedValue(fakeAttestation()))
        const ctx = setup(true)
        await toPasskey(ctx)
        ctx.component.createPasskey()
        ctx.port.calls
          .expectOne('startPasskeySetup')
          .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()
        ctx.port.calls
          .expectOne('finishPasskeySetup')
          .flush({ token: 'session-jwt', backupCodes: [] })
        ctx.fixture.detectChanges()

        expect(ctx.completed).toEqual(['session-jwt'])
        expect(ctx.fixture.debugElement.query(By.directive(BackupCodes))).toBeNull()
        expect(ctx.port.tokens).toEqual([])
      })

      it('shows a spinner with a note about the prompt while the browser waits, and ignores a second submit', async () => {
        browser(() => new Promise(() => undefined))
        const ctx = setup(true)
        await toPasskey(ctx)
        const button = buttonComponent(ctx, 'Create the passkey')

        ctx.component.createPasskey()
        ctx.port.calls
          .expectOne('startPasskeySetup')
          .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
        await settle()
        ctx.fixture.detectChanges()
        ctx.component.createPasskey()

        expect(button.loading()).toBe(true)
        expect(ctx.el.querySelector('[role="status"]')?.textContent).toContain('device')
        // The prompt hint is read politely...
        expect(
          ctx.el.querySelector('gbt-alert [role="status"]')?.getAttribute('data-variant'),
        ).toBe('info')
        // ...never as an error.
        expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull()
        ctx.port.calls.expectNone('startPasskeySetup')
        // The prompt can be lost behind another window for minutes: the way out stays open.
        expect(
          Array.from(ctx.el.querySelectorAll<HTMLButtonElement>('button')).find(
            (b) => b.textContent?.trim() === 'Back',
          )?.disabled,
        ).toBe(false)
      })

      it('has no accessibility violations, with the name field and with the prompt open', async () => {
        browser(() => new Promise(() => undefined))
        const ctx = setup(true)
        await toPasskey(ctx)
        await expectNoA11yViolations(ctx.el)

        await create(ctx)
        await expectNoA11yViolations(ctx.el)
      })

      describe('when it does not work out', () => {
        const failedCreate = (name: string) =>
          vi.fn().mockRejectedValue(new DOMException('x', name))

        it('a dismissed prompt is a quiet note, not an error: the step stays, the button is back and focused', async () => {
          browser(vi.fn().mockRejectedValue(dismissedPrompt()))
          const ctx = setup(true)
          await toPasskey(ctx)

          await create(ctx)
          await ctx.fixture.whenStable()

          expect(quiet(ctx.el)).toEqual(['Operation cancelled'])
          // Not an error...
          expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull()
          // ...but read politely.
          expect(ctx.el.querySelector('gbt-alert [role="status"]')?.textContent?.trim()).toBe(
            'Operation cancelled',
          )
          ctx.port.calls.expectNone('finishPasskeySetup')
          expect(ctx.el.textContent).toContain('Step 2 of 3')
          expect(document.activeElement).toBe(buttonByText(ctx.el, 'Create the passkey'))
          expect(ctx.expired.length).toBe(0)
        })

        it('an authenticator that already holds a credential says "This key is already registered"', async () => {
          browser(failedCreate('InvalidStateError'))
          const ctx = setup(true)
          await toPasskey(ctx)

          await create(ctx)

          expect(alertText(ctx.el)).toBe('This key is already registered')
        })

        it('an authenticator that cannot make the key says the browser does not support passkeys', async () => {
          browser(failedCreate('NotSupportedError'))
          const ctx = setup(true)
          await toPasskey(ctx)

          await create(ctx)

          expect(alertText(ctx.el)).toBe('This browser does not support passkeys.')
        })

        it('a duplicate credential refused by the server (409) says so too', async () => {
          browser(vi.fn().mockResolvedValue(fakeAttestation()))
          const ctx = setup(true)
          await toPasskey(ctx)
          await create(ctx)

          ctx.port.calls
            .expectOne('finishPasskeySetup')
            .fail(409, { error: 'this passkey is already registered' })
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe('This key is already registered')
        })

        it('any other browser error is a generic failure with a retry, and the retry works', async () => {
          const createCredential = vi
            .fn()
            .mockRejectedValueOnce(new DOMException('x', 'SecurityError'))
            .mockResolvedValue(fakeAttestation())
          browser(createCredential)
          const ctx = setup(true)
          await toPasskey(ctx)

          await create(ctx)
          expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')

          ctx.component.createPasskey()
          ctx.fixture.detectChanges()
          expect(ctx.el.querySelector('gbt-alert')).toBeNull()
          ctx.port.calls
            .expectOne('startPasskeySetup')
            .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
          await settle()
          ctx.port.calls
            .expectOne('finishPasskeySetup')
            .flush({ token: 'session-jwt', backupCodes: CODES })
          ctx.fixture.detectChanges()

          expect(ctx.el.textContent).toContain('Step 3 of 3')
        })

        it('a refused ceremony at the finish (400 "invalid passkey") is the same generic failure', async () => {
          browser(vi.fn().mockResolvedValue(fakeAttestation()))
          const ctx = setup(true)
          await toPasskey(ctx)
          await create(ctx)

          ctx.port.calls.expectOne('finishPasskeySetup').fail(400, { error: 'invalid passkey' })
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')
          expect(ctx.expired.length).toBe(0)
        })

        it('says the sign-in expired, telling the host, on an expired-token 401 at the start and at the finish', async () => {
          browser(vi.fn().mockResolvedValue(fakeAttestation()))
          const ctx = setup(true)
          await toPasskey(ctx)

          ctx.component.createPasskey()
          ctx.port.calls.expectOne('startPasskeySetup').fail(401, EXPIRED)
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Your sign-in has expired, sign in again.')
          expect(ctx.expired.length).toBe(1)

          await create(ctx)
          ctx.port.calls.expectOne('finishPasskeySetup').fail(401, EXPIRED)
          ctx.fixture.detectChanges()
          expect(ctx.expired.length).toBe(2)
        })

        it('says to wait on a 429 and that passkeys are unavailable on a 503', async () => {
          browser(vi.fn())
          const ctx = setup(true)
          await toPasskey(ctx)

          ctx.component.createPasskey()
          ctx.port.calls.expectOne('startPasskeySetup').fail(429, {})
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')

          ctx.component.createPasskey()
          ctx.port.calls
            .expectOne('startPasskeySetup')
            .fail(503, { error: 'passkeys are not available on this server' })
          ctx.fixture.detectChanges()
          expect(alertText(ctx.el)).toBe('Passkeys are not available on this server.')
        })

        it('sends the user back to the credentials when the account already has a factor (400 "MFA is already set up")', async () => {
          browser(vi.fn())
          const ctx = setup(true)
          await toPasskey(ctx)

          ctx.component.createPasskey()
          ctx.port.calls
            .expectOne('startPasskeySetup')
            .fail(400, { error: 'MFA is already set up' })
          ctx.fixture.detectChanges()

          expect(alertText(ctx.el)).toBe(
            'Two-factor authentication is already set up, sign in again.',
          )
          expect(ctx.expired.length).toBe(1)
        })

        it('rolls the busy state back on a server failure', async () => {
          browser(vi.fn())
          const ctx = setup(true)
          await toPasskey(ctx)
          const button = buttonComponent(ctx, 'Create the passkey')

          ctx.component.createPasskey()
          ctx.fixture.detectChanges()
          expect(button.loading()).toBe(true)
          ctx.port.calls.expectOne('startPasskeySetup').fail(500, {})
          ctx.fixture.detectChanges()

          expect(button.loading()).toBe(false)
          expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')
        })

        it('opens no prompt at all when the user left before the server answered the start', async () => {
          const createCredential = vi.fn().mockResolvedValue(fakeAttestation())
          browser(createCredential)
          const ctx = setup(true)
          await toPasskey(ctx)
          ctx.component.createPasskey()
          const start = ctx.port.calls.expectOne('startPasskeySetup')

          buttonByText(ctx.el, 'Back').click()
          start.flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
          await settle()

          expect(createCredential).not.toHaveBeenCalled()
          ctx.port.calls.expectNone('finishPasskeySetup')
          expect(ctx.component['promptOpen']()).toBe(false)
        })

        it('drops a late browser answer once the user has left the step', async () => {
          let answer!: (value: unknown) => void
          browser(() => new Promise((resolve) => (answer = resolve)))
          const ctx = setup(true)
          await toPasskey(ctx)
          ctx.component.createPasskey()
          ctx.port.calls
            .expectOne('startPasskeySetup')
            .flush({ challengeId: CHALLENGE_ID, publicKey: CREATION_OPTIONS })
          await settle()

          ctx.component['back']()
          answer(fakeAttestation())
          await settle()
          ctx.fixture.detectChanges()

          ctx.port.calls.expectNone('finishPasskeySetup')
          expect(ctx.el.textContent).toContain('Step 1 of 3')
        })

        it('has no accessibility violations with an error and with the quiet note', async () => {
          browser(
            vi
              .fn()
              .mockRejectedValueOnce(new DOMException('x', 'SecurityError'))
              .mockRejectedValueOnce(dismissedPrompt()),
          )
          const ctx = setup(true)
          await toPasskey(ctx)

          await create(ctx)
          await expectNoA11yViolations(ctx.el)

          await create(ctx)
          await expectNoA11yViolations(ctx.el)
        })
      })
    })
  })

  describe('labels', () => {
    it('takes its strings from the `labels` input', async () => {
      const ctx = setup(false, {
        labels: {
          step: (current, total) => `Étape ${current} sur ${total}`,
          choiceHeading: 'Protégez votre compte',
          begin: 'Commencer',
        },
      })
      await ctx.fixture.whenStable()

      expect(ctx.el.querySelector('.gbt-mfa-enrollment__step')?.textContent?.trim()).toBe(
        'Étape 1 sur 3',
      )
      expect(ctx.el.querySelector('h2')?.textContent?.trim()).toBe('Protégez votre compte')
      expect(primary(ctx.el).map((b) => b.textContent?.trim())).toEqual(['Commencer'])
      // What was not overridden keeps its English default.
      expect(buttonByText(ctx.el, 'Back')).toBeTruthy()
    })

    it('words its failures from the `labels` input too', () => {
      const ctx = setup(false, { labels: { startFailed: "La configuration n'a pas pu démarrer." } })

      ctx.component.begin()
      ctx.port.calls.expectOne('enrollTotp').fail(500, {})
      ctx.fixture.detectChanges()

      expect(alertText(ctx.el)).toBe("La configuration n'a pas pu démarrer.")
    })

    it('takes the application-wide strings of provideAuthLabels, for itself and its QR and codes', async () => {
      const ctx = setup(false, {
        providers: [
          provideAuthLabels({
            mfaEnrollment: {
              begin: 'Commencer',
              activate: 'Activer',
              codeLabel: 'Code à 6 chiffres',
            },
            totpQr: { secretLabel: 'Ou saisissez cette clé dans votre application' },
            backupCodes: { acknowledge: "J'ai enregistré mes codes de secours" },
          }),
        ],
      })
      expect(primary(ctx.el).map((b) => b.textContent?.trim())).toEqual(['Commencer'])

      await toScan(ctx, 'Commencer')
      expect(
        ctx.el
          .querySelector('label[for^="gbt-mfa-enrollment-"][for$="-code"]')
          ?.textContent?.trim(),
      ).toBe('Code à 6 chiffres')
      expect(ctx.el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe(
        'Ou saisissez cette clé dans votre application',
      )

      ctx.component['code'].set('123456')
      buttonByText(ctx.el, 'Activer').click()
      ctx.port.calls.expectOne('confirmTotp').flush({ token: 'session-jwt', backupCodes: CODES })
      ctx.fixture.detectChanges()
      expect(ctx.el.querySelector('.gbt-backup-codes__ack')?.textContent?.trim()).toBe(
        "J'ai enregistré mes codes de secours",
      )
    })

    it('lets its own `labels` input win over provideAuthLabels', () => {
      const ctx = setup(false, {
        providers: [provideAuthLabels({ mfaEnrollment: { begin: 'Commencer', back: 'Retour' } })],
        labels: { begin: 'Démarrer' },
      })

      expect(
        Array.from(ctx.el.querySelectorAll('button')).map((b) => b.textContent?.trim()),
      ).toEqual(['Démarrer', 'Retour'])
    })
  })
})
