import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../testing/expect-no-a11y-violations'
import { Badge } from '../../components/atoms/badge/badge'
import { Button } from '../../components/atoms/button/button'
import { ConfirmDangerModal } from '../../components/organisms/confirm-danger-modal/confirm-danger-modal'
import { type AuthLabels, type MfaSettingsLabels, provideAuthLabels } from '../auth-labels'
import { BackupCodes } from '../backup-codes/backup-codes'
import { MFA_PORT, type Passkey } from '../ports/mfa.port'
import { MfaSettingsState } from '../shared/mfa-settings-state'
import {
  type FakeMfaPort,
  FAKE_QR_DATA_URL,
  fakeMfaPort,
  fakeQrRenderer,
} from '../testing/fake-ports'
import { TOTP_QR_RENDERER, type TotpQrRenderer } from '../totp-qr/totp-qr'
import { MfaSettings } from './mfa-settings'

const OTPAUTH = 'otpauth://totp/Acme:admin?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
const CODES = Array.from(
  { length: 10 },
  (_, i) => `${String(i).repeat(8)}abcdef01${'2'.repeat(8)}${'f'.repeat(8)}`,
)
const NEW_CODES = CODES.map((code) => code.split('').reverse().join(''))

const WRONG_PASSWORD = { error: 'current password is incorrect' }
const INVALID_CODE = { error: 'invalid code' }
const PASSKEY: Passkey = {
  id: 'p1',
  name: 'MacBook',
  createdAt: '2026-09-01T10:00:00Z',
  lastUsedAt: null,
}
const TOO_MANY_ATTEMPTS = 'Too many attempts, try again in a few minutes'
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim()

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10))

interface SetupStatus {
  totpEnabled: boolean
  backupCodesRemaining: number
  /** The account's passkeys (none by default). */
  passkeys?: Passkey[]
}

interface SetupOptions {
  /** The component's own `labels` input. */
  labels?: Partial<MfaSettingsLabels>
  /** What the application provides with `provideAuthLabels`. */
  provided?: AuthLabels
  lowCodesThreshold?: number
}

describe('MfaSettings', () => {
  let port: FakeMfaPort | undefined

  function setup(
    status: SetupStatus | 'failed' | 'pending' = { totpEnabled: true, backupCodesRemaining: 8 },
    options: SetupOptions = {},
  ) {
    const mfa = fakeMfaPort()
    port = mfa
    const render = vi.fn<TotpQrRenderer>(fakeQrRenderer)
    TestBed.configureTestingModule({
      providers: [
        { provide: MFA_PORT, useValue: mfa },
        { provide: TOTP_QR_RENDERER, useValue: render },
        ...(options.provided ? [provideAuthLabels(options.provided)] : []),
      ],
    })
    const fixture = TestBed.createComponent(MfaSettings)
    if (options.labels) {
      fixture.componentRef.setInput('labels', options.labels)
    }
    if (options.lowCodesThreshold !== undefined) {
      fixture.componentRef.setInput('lowCodesThreshold', options.lowCodesThreshold)
    }
    let revoked = 0
    fixture.componentInstance.sessionRevoked.subscribe(() => revoked++)
    fixture.detectChanges()
    const ctx = {
      fixture,
      component: fixture.componentInstance,
      port: mfa,
      render,
      /** The coordination state the two security cards share (root-provided: fresh for each test). */
      state: TestBed.inject(MfaSettingsState),
      el: fixture.nativeElement as HTMLElement,
      /** How many times `sessionRevoked` fired (the application then signs out and goes to its sign-in page). */
      get revoked() {
        return revoked
      },
      /** Renders, waits for ngModel's asynchronous writes and the focus scheduled after render, renders again. */
      async refresh() {
        fixture.detectChanges()
        await fixture.whenStable()
        await settle()
        fixture.detectChanges()
      },
    }
    if (status === 'failed') {
      mfa.calls.expectOne('status').fail(500)
    } else if (status !== 'pending') {
      mfa.calls.expectOne('status').flush({ passkeys: [], ...status })
    }
    fixture.detectChanges()
    return ctx
  }
  type Ctx = ReturnType<typeof setup>

  const button = (el: HTMLElement, label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => text(b) === label)
  const buttons = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).map((b) => text(b))
  const primary = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button.gbt-button--primary'))
  // The fields by the end of their per-instance id (`gbt-mfa-settings-<n>-password`).
  const password = (el: HTMLElement) =>
    el.querySelector<HTMLInputElement>('input[id^="gbt-mfa-settings-"][id$="-password"]')
  const codeField = (el: HTMLElement) =>
    el.querySelector<HTMLInputElement>('input[id^="gbt-mfa-settings-"][id$="-code"]')
  const fieldError = (el: HTMLElement) => text(el.querySelector('.gbt-input__error'))
  const anchor = (el: HTMLElement) => el.querySelector('[data-mfa-anchor]')
  const alertText = (el: HTMLElement) => text(el.querySelector('gbt-alert [role="alert"]'))
  const badge = (el: HTMLElement) => text(el.querySelector('gbt-badge'))
  const dialogOf = (ctx: Ctx) =>
    ctx.fixture.debugElement.query(By.directive(ConfirmDangerModal))
      .componentInstance as ConfirmDangerModal
  const submitButton = (ctx: Ctx, label: string) =>
    ctx.fixture.debugElement
      .queryAll(By.directive(Button))
      .find((b) => (b.componentInstance as Button).text() === label)!.componentInstance as Button
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input'))
  }

  /** Opens a password prompt of the enabled view and types the password. */
  async function openPrompt(ctx: Ctx, opener: string, value = 'hunter22') {
    button(ctx.el, opener)!.click()
    await ctx.refresh()
    type(password(ctx.el)!, value)
    await ctx.refresh()
  }
  async function submit(ctx: Ctx) {
    ctx.el.querySelector('form')!.dispatchEvent(new Event('submit'))
    await ctx.refresh()
  }

  /** From the disabled view to the scan step. */
  async function toScan(ctx: Ctx) {
    await openPrompt(ctx, 'Set up now')
    await submit(ctx)
    ctx.port.calls.expectOne('enroll').flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
    await ctx.refresh()
  }
  /** From the disabled view to the codes step. */
  async function toEnrolledCodes(ctx: Ctx) {
    await toScan(ctx)
    type(codeField(ctx.el)!, '123456')
    await ctx.refresh()
    await submit(ctx)
    ctx.port.calls.expectOne('confirm').flush({ backupCodes: CODES })
    await ctx.refresh()
  }

  afterEach(() => {
    port?.calls.verify()
    port = undefined
  })

  describe('loading and failing', () => {
    it('asks for the status and shows a busy placeholder meanwhile', () => {
      const ctx = setup('pending')

      expect(ctx.el.querySelector('[aria-busy="true"]')).toBeTruthy()
      expect(text(ctx.el.querySelector('[role="status"]'))).toBe(
        'Loading two-factor authentication…',
      )
      ctx.port.calls.expectOne('status')
    })

    it('announces the loading from a status that no aria-busy element contains (it would be kept quiet)', () => {
      const ctx = setup('pending')

      const statuses = Array.from(ctx.el.querySelectorAll('[role="status"]'))
      expect(statuses.map((status) => text(status))).toContain('Loading two-factor authentication…')
      for (const status of statuses) {
        expect(status.closest('[aria-busy="true"]')).toBeNull()
      }
      ctx.port.calls.expectOne('status')
    })

    it('says it could not be loaded and retries on "Retry"', async () => {
      const ctx = setup('failed')

      const failed = ctx.el.querySelector('gbt-alert .gbt-alert')
      expect(text(failed)).toContain('Two-factor authentication could not be loaded.')
      expect(failed?.getAttribute('data-variant')).toBe('error')
      // Nothing else announces this failure (no toast): the alert is the one live region, announced once.
      expect(failed?.getAttribute('role')).toBe('alert')
      expect(failed?.getAttribute('aria-live')).toBeNull()
      expect(failed?.querySelector('button')?.textContent?.trim()).toBe('Retry')
      expect(ctx.el.querySelectorAll('[role="alert"]')).toHaveLength(1)
      button(ctx.el, 'Retry')!.click()
      ctx.fixture.detectChanges()
      expect(ctx.el.querySelector('[aria-busy="true"]')).toBeTruthy()
      ctx.port.calls
        .expectOne('status')
        .flush({ totpEnabled: true, backupCodesRemaining: 10, passkeys: [] })
      ctx.fixture.detectChanges()

      expect(badge(ctx.el)).toBe('On')
    })
  })

  describe('enabled', () => {
    it('shows the success badge "On" and how many backup codes are left', () => {
      const { el, fixture } = setup({ totpEnabled: true, backupCodesRemaining: 8 })

      const found = fixture.debugElement.query(By.directive(Badge))
      expect(text(found.nativeElement)).toBe('On')
      expect((found.componentInstance as Badge).variant()).toBe('success')
      expect(text(el.querySelector('.gbt-mfa-settings__codes-left'))).toContain(
        '8 backup codes left',
      )
      expect(el.querySelector('[data-tone="warning"]')).toBeNull()
    })

    it.each([
      [3, '3 backup codes left'],
      [1, '1 backup code left'],
      [0, 'No backup codes left'],
    ])(
      'warns (with words and icon, not colour alone) when %i codes are left',
      (remaining, expected) => {
        const { el } = setup({ totpEnabled: true, backupCodesRemaining: remaining })

        const line = el.querySelector('.gbt-mfa-settings__codes-left')!
        expect(line.getAttribute('data-tone')).toBe('warning')
        expect(text(line)).toContain(expected)
        expect(text(line)).toContain(
          'Regenerate some so that you do not lose access to your account.',
        )
        expect(line.querySelector('gbt-icon')).toBeTruthy()
      },
    )

    it('does not warn with 4 codes left', () => {
      const { el } = setup({ totpEnabled: true, backupCodesRemaining: 4 })

      expect(
        el.querySelector('.gbt-mfa-settings__codes-left')?.getAttribute('data-tone'),
      ).toBeNull()
    })

    it('offers "Regenerate backup codes" and "Reset" (both quiet secondary: the red belongs to the dialog), and no primary button', () => {
      const { el } = setup()

      expect(button(el, 'Regenerate backup codes')!.classList).toContain('gbt-button--secondary')
      expect(button(el, 'Reset')!.classList).toContain('gbt-button--secondary')
      expect(el.querySelector('.gbt-button--danger')).toBeNull()
      expect(primary(el)).toHaveLength(0)
      expect(el.querySelector('form')).toBeNull()
    })
  })

  describe('the low-codes threshold (lowCodesThreshold input)', () => {
    it('warns from the given count down', () => {
      const { el } = setup({ totpEnabled: true, backupCodesRemaining: 5 }, { lowCodesThreshold: 5 })

      expect(el.querySelector('.gbt-mfa-settings__codes-left')?.getAttribute('data-tone')).toBe(
        'warning',
      )
    })

    it('does not warn above it', () => {
      const { el } = setup({ totpEnabled: true, backupCodesRemaining: 3 }, { lowCodesThreshold: 2 })

      const line = el.querySelector('.gbt-mfa-settings__codes-left')!
      expect(line.getAttribute('data-tone')).toBeNull()
      expect(line.querySelector('gbt-icon')).toBeNull()
      expect(text(line)).not.toContain('Regenerate some')
    })
  })

  describe('regenerating the backup codes', () => {
    it('opens a password prompt with a labelled current-password field, and focuses it', async () => {
      const ctx = setup()

      button(ctx.el, 'Regenerate backup codes')!.click()
      await ctx.refresh()

      const field = password(ctx.el)!
      expect(field.type).toBe('password')
      expect(field.getAttribute('autocomplete')).toBe('current-password')
      expect(text(ctx.el.querySelector(`label[for="${field.id}"]`))).toBe('Current password')
      expect(document.activeElement).toBe(field)
      // The opener gives way to the form's own buttons: one submit, one "Cancel", one primary.
      expect(buttons(ctx.el)).toEqual(expect.arrayContaining(['Regenerate', 'Cancel']))
      expect(button(ctx.el, 'Regenerate backup codes')).toBeUndefined()
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Regenerate'])
    })

    it('does not send an empty password', async () => {
      const ctx = setup()
      button(ctx.el, 'Regenerate backup codes')!.click()
      await ctx.refresh()

      await submit(ctx)

      ctx.port.calls.expectNone('regenerate')
      expect(fieldError(ctx.el)).toBe('Enter your password')
      expect(document.activeElement).toBe(password(ctx.el))
    })

    it('sends the password, then shows the ten new codes, dropping the password', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes', 'hunter22')

      await submit(ctx)
      const call = ctx.port.calls.expectOne('regenerate')
      expect(call.args).toEqual(['hunter22'])
      call.flush({ backupCodes: NEW_CODES })
      await ctx.refresh()

      const codes = ctx.fixture.debugElement.query(By.directive(BackupCodes))
        .componentInstance as BackupCodes
      expect(codes.codes()).toEqual(NEW_CODES)
      expect(text(ctx.el)).toContain('The old codes no longer work')
      expect(document.activeElement).toBe(anchor(ctx.el))
      expect(ctx.component['password']()).toBe('')
      expect(ctx.el.querySelector('form')).toBeNull()
    })

    it('shows a spinner and ignores a second submit while the request runs', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes')

      await submit(ctx)
      await submit(ctx)

      ctx.port.calls.expectOne('regenerate')
      expect(submitButton(ctx, 'Regenerate').loading()).toBe(true)
    })

    it('says "Incorrect password" under the field on a 400, keeps the form and the focus, and rolls the spinner back', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes', 'nope')

      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      expect(fieldError(ctx.el)).toBe('Incorrect password')
      expect(ctx.el.querySelector('form')).toBeTruthy()
      expect(ctx.el.querySelector('gbt-backup-codes')).toBeNull()
      expect(document.activeElement).toBe(password(ctx.el))
      expect(submitButton(ctx, 'Regenerate').loading()).toBe(false)
    })

    it('clears the wrong-password message as soon as the user types again', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes', 'nope')
      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      type(password(ctx.el)!, 'nope2')
      await ctx.refresh()

      expect(fieldError(ctx.el)).toBeUndefined()
    })

    it('says to wait on a 429 and gives a generic message on any other failure, keeping the form', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes')

      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').fail(429, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe(TOO_MANY_ATTEMPTS)
      expect(fieldError(ctx.el)).toBeUndefined()

      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').fail(500, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe('The backup codes could not be regenerated, try again.')
      expect(ctx.el.querySelector('form')).toBeTruthy()
    })

    it('"Cancel" closes the prompt, drops the password and gives the focus back to the opener', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes', 'hunter22')

      button(ctx.el, 'Cancel')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
      expect(ctx.component['password']()).toBe('')
      expect(document.activeElement).toBe(button(ctx.el, 'Regenerate backup codes'))
    })

    it('needs the acknowledgement before "Done", which then goes back to the enabled state with ten codes left, without asking the server again', async () => {
      const ctx = setup({ totpEnabled: true, backupCodesRemaining: 2 })
      await openPrompt(ctx, 'Regenerate backup codes')
      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').flush({ backupCodes: NEW_CODES })
      await ctx.refresh()

      expect(button(ctx.el, 'Done')!.disabled).toBe(true)
      button(ctx.el, 'Done')!.click()
      await ctx.refresh()
      expect(ctx.el.querySelector('gbt-backup-codes')).toBeTruthy()

      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      button(ctx.el, 'Done')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-backup-codes')).toBeNull()
      expect(text(ctx.el.querySelector('.gbt-mfa-settings__codes-left'))).toContain(
        '10 backup codes left',
      )
      expect(ctx.el.querySelector('[data-tone="warning"]')).toBeNull()
      expect(document.activeElement, 'the enabled state opens on its status line').toBe(
        anchor(ctx.el),
      )
      expect(ctx.component['backupCodes']()).toEqual([])
      ctx.port.calls.expectNone('status')
    })
  })

  describe("resetting the factor (the port's disable)", () => {
    it('opens the password prompt with a quiet "Continue" (the dialog carries the red one) and no primary button', async () => {
      const ctx = setup()

      button(ctx.el, 'Reset')!.click()
      await ctx.refresh()

      expect(document.activeElement).toBe(password(ctx.el))
      expect(button(ctx.el, 'Continue')!.classList).toContain('gbt-button--secondary')
      expect(ctx.el.querySelector('.gbt-button--danger')).toBeNull()
      expect(primary(ctx.el)).toHaveLength(0)
    })

    it('asks for a confirmation before sending anything, and "Cancel" in the dialog keeps the form and the password', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset', 'hunter22')

      await submit(ctx)
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeTruthy()
      ctx.port.calls.expectNone('disable')

      dialogOf(ctx).closed.emit()
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(password(ctx.el)?.value).toBe('hunter22')
      ctx.port.calls.expectNone('disable')
    })

    it('does not open the dialog for an empty password', async () => {
      const ctx = setup()
      button(ctx.el, 'Reset')!.click()
      await ctx.refresh()

      await submit(ctx)

      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(fieldError(ctx.el)).toBe('Enter your password')
    })

    it('says honestly what will happen in the confirmation', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset')

      await submit(ctx)

      const dialog = dialogOf(ctx)
      expect(dialog.heading()).toBe('Reset two-factor authentication?')
      expect(dialog.message()).toBe(
        'You will be signed out and will have to set up a new authenticator app the next time you sign in.',
      )
      expect(dialog.confirmLabel()).toBe('Reset')
    })

    it('sends the password on confirmation, then emits sessionRevoked (the application signs out and leaves)', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset', 'hunter22')
      await submit(ctx)

      const dialog = dialogOf(ctx)
      dialog.confirmed.emit()
      ctx.fixture.detectChanges()
      expect(dialog.busy()).toBe(true)
      const call = ctx.port.calls.expectOne('disable')
      expect(call.args).toEqual(['hunter22'])
      expect(ctx.revoked).toBe(0)
      call.flush()
      await ctx.refresh()

      expect(ctx.revoked).toBe(1)
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(ctx.el.querySelector('form')).toBeNull()
      expect(ctx.component['password']()).toBe('')
      expect(ctx.component['busy']()).toBe(false)
    })

    it('turns inert once the session is revoked (it does not count on sessionRevoked being bound): only "signed out", nothing to press', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset', 'hunter22')
      await submit(ctx)
      dialogOf(ctx).confirmed.emit()
      ctx.port.calls.expectOne('disable').flush()
      await ctx.refresh()

      expect(text(ctx.el.querySelector('gbt-alert'))).toBe(
        'You have been signed out. Sign in again to continue.',
      )
      // No password prompt, no "Regenerate", no "Set up now": nothing to press against a dead session.
      expect(ctx.el.querySelectorAll('button')).toHaveLength(0)
      expect(ctx.el.querySelector('form, input')).toBeNull()
      expect(text(ctx.el)).not.toContain('App configured')
      expect(document.activeElement).toBe(anchor(ctx.el))
      await expectNoA11yViolations(ctx.el)
    })

    it('a wrong password (400) closes the dialog, says so under the field and keeps the form; the session is not revoked', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset', 'nope')
      await submit(ctx)
      dialogOf(ctx).confirmed.emit()

      ctx.port.calls.expectOne('disable').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(fieldError(ctx.el)).toBe('Incorrect password')
      expect(ctx.el.querySelector('form')).toBeTruthy()
      expect(document.activeElement).toBe(password(ctx.el))
      expect(ctx.revoked).toBe(0)
      expect(badge(ctx.el)).toBe('On')
    })

    it('rolls the busy state back on a server failure and keeps the form, with a generic message (429: wait)', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset')

      await submit(ctx)
      dialogOf(ctx).confirmed.emit()
      ctx.port.calls.expectOne('disable').fail(500, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe('Two-factor authentication could not be reset, try again.')
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(ctx.component['busy']()).toBe(false)

      await submit(ctx)
      dialogOf(ctx).confirmed.emit()
      ctx.port.calls.expectOne('disable').fail(429, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe(TOO_MANY_ATTEMPTS)
      expect(ctx.revoked).toBe(0)
    })

    it('sends the request once even if the dialog confirms twice', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset')
      await submit(ctx)
      const dialog = dialogOf(ctx)

      dialog.confirmed.emit()
      dialog.confirmed.emit()

      ctx.port.calls.expectOne('disable')
    })
  })

  describe('enrolling from the account', () => {
    it('shows the mandatory warning and a single primary "Set up now" when there is no factor', () => {
      const { el } = setup({ totpEnabled: false, backupCodesRemaining: 0 })

      expect(text(el)).toContain(
        'Two-factor authentication is required: you will have to set it up the next time you sign in.',
      )
      // A warning that is on the page from the start is a static note, not an assertive live region.
      const warning = el.querySelector('gbt-alert .gbt-alert')!
      expect(warning.getAttribute('data-variant')).toBe('warning')
      expect(warning.hasAttribute('role')).toBe(false)
      expect(warning.hasAttribute('aria-live')).toBe(false)
      expect(primary(el).map((b) => text(b))).toEqual(['Set up now'])
      expect(el.querySelector('.gbt-mfa-settings__codes-left')).toBeNull()
    })

    it('asks for the password first, then shows the QR, the secret and a code field', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await openPrompt(ctx, 'Set up now', 'hunter22')
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Continue'])

      await submit(ctx)
      const call = ctx.port.calls.expectOne('enroll')
      expect(call.args).toEqual(['hunter22'])
      call.flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
      expect(
        document.activeElement,
        'the scan step opens on its instruction line, not on the code field',
      ).toBe(anchor(ctx.el))
      expect(ctx.el.querySelector('gbt-totp-qr img')?.getAttribute('src')).toBe(FAKE_QR_DATA_URL)
      expect(ctx.render.mock.calls[0][0]).toBe(OTPAUTH)
      expect(ctx.component['password']()).toBe('')
      expect(text(ctx.el.querySelector('label[for^="gbt-mfa-settings-"][for$="-code"]'))).toBe(
        '6-digit code',
      )
      expect(codeField(ctx.el)!.getAttribute('autocomplete')).toBe('one-time-code')
      expect(codeField(ctx.el)!.getAttribute('inputmode')).toBe('numeric')
      expect(codeField(ctx.el)!.getAttribute('spellcheck')).toBe('false')
      expect(codeField(ctx.el)!.getAttribute('autocapitalize')).toBe('off')
      expect(codeField(ctx.el)!.getAttribute('enterkeyhint')).toBe('go')
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Activate'])
    })

    it('a wrong password at the start is shown under the field and the form is kept', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await openPrompt(ctx, 'Set up now', 'nope')

      await submit(ctx)
      ctx.port.calls.expectOne('enroll').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      expect(fieldError(ctx.el)).toBe('Incorrect password')
      expect(ctx.el.querySelector('gbt-totp-qr')).toBeNull()
      expect(document.activeElement).toBe(password(ctx.el))
    })

    it('a server failure at the start keeps the form with a generic message', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await openPrompt(ctx, 'Set up now')

      await submit(ctx)
      ctx.port.calls.expectOne('enroll').fail(500, {})
      await ctx.refresh()

      expect(alertText(ctx.el)).toBe('The setup could not start, try again.')
      expect(ctx.component['busy']()).toBe(false)
    })

    it('does not send an empty code', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)

      await submit(ctx)

      ctx.port.calls.expectNone('confirm')
      expect(fieldError(ctx.el)).toBe('Enter the 6-digit code from your app')
      expect(document.activeElement).toBe(codeField(ctx.el))
    })

    it('sends the code without its spaces and shows the codes, dropping the secret and the code', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)
      type(codeField(ctx.el)!, '123 456')
      await ctx.refresh()

      await submit(ctx)
      const call = ctx.port.calls.expectOne('confirm')
      expect(call.args).toEqual(['123456'])
      call.flush({ backupCodes: CODES })
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-totp-qr')).toBeNull()
      expect(ctx.component['secret']()).toBe('')
      expect(ctx.component['otpauthUrl']()).toBe('')
      expect(ctx.component['code']()).toBe('')
      const codes = ctx.fixture.debugElement.query(By.directive(BackupCodes))
        .componentInstance as BackupCodes
      expect(codes.codes()).toEqual(CODES)
      expect(text(ctx.el)).toContain('Two-factor authentication is on')
      expect(document.activeElement).toBe(anchor(ctx.el))
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Done'])
      expect(ctx.state.totpEnabled(), 'the passkeys card learns the app is on').toBe(true)
    })

    it('a refused code (400 "invalid code") says "Incorrect code" under the field, empties it and keeps the scan', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)
      type(codeField(ctx.el)!, '000000')
      await ctx.refresh()

      await submit(ctx)
      ctx.port.calls.expectOne('confirm').fail(400, INVALID_CODE)
      await ctx.refresh()

      expect(fieldError(ctx.el)).toBe('Incorrect code')
      expect(codeField(ctx.el)!.value).toBe('')
      expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
      expect(document.activeElement).toBe(codeField(ctx.el))
      expect(ctx.component['busy']()).toBe(false)
    })

    it('says to wait on a 429 (code kept) and gives a generic message on any other failure', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)
      type(codeField(ctx.el)!, '123456')
      await ctx.refresh()

      await submit(ctx)
      ctx.port.calls.expectOne('confirm').fail(429, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe(TOO_MANY_ATTEMPTS)
      expect(codeField(ctx.el)!.value).toBe('123456')

      await submit(ctx)
      ctx.port.calls.expectOne('confirm').fail(400, { error: 'no TOTP enrolment to confirm' })
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe('Activation failed, try again.')
    })

    it('"Cancel" on the scan drops the secret and goes back to the disabled state', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)

      button(ctx.el, 'Cancel')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-totp-qr')).toBeNull()
      expect(ctx.component['secret']()).toBe('')
      expect(button(ctx.el, 'Set up now')).toBeTruthy()
      expect(document.activeElement).toBe(button(ctx.el, 'Set up now'))
    })

    it('after the acknowledgement, "Done" shows the enabled state with the ten codes', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)

      expect(button(ctx.el, 'Done')!.disabled).toBe(true)
      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      button(ctx.el, 'Done')!.click()
      await ctx.refresh()

      expect(badge(ctx.el)).toBe('On')
      expect(text(ctx.el.querySelector('.gbt-mfa-settings__codes-left'))).toContain(
        '10 backup codes left',
      )
      expect(ctx.component['backupCodes']()).toEqual([])
      expect(document.activeElement).toBe(anchor(ctx.el))
    })
  })

  describe('with a passkey on the account (the app becomes optional)', () => {
    const PASSKEY_ONLY: SetupStatus = {
      totpEnabled: false,
      backupCodesRemaining: 10,
      passkeys: [PASSKEY],
    }
    const BOTH: SetupStatus = { totpEnabled: true, backupCodesRemaining: 8, passkeys: [PASSKEY] }

    it('does not say two-factor authentication is missing: no mandatory warning, no "Set up now"', () => {
      const { el } = setup(PASSKEY_ONLY)

      expect(text(el)).not.toContain('Two-factor authentication is required')
      expect(button(el, 'Set up now')).toBeUndefined()
      expect(el.querySelector('gbt-alert')).toBeNull()
    })

    it('says no app is set up, that it is optional, and offers to add one (secondary: the passkeys card owns the primary)', () => {
      const { el, fixture } = setup(PASSKEY_ONLY)

      expect(text(el)).toContain('No app configured')
      expect(text(fixture.debugElement.query(By.directive(Badge)).nativeElement)).toBe('Optional')
      expect(text(el)).toContain('Your passkey is enough to sign in.')
      expect(button(el, 'Add an app')!.classList).toContain('gbt-button--secondary')
      expect(primary(el)).toHaveLength(0)
    })

    it('still shows the backup codes (they work with any factor), warns when few are left, and offers no reset of an app that is not there', () => {
      const { el } = setup({ ...PASSKEY_ONLY, backupCodesRemaining: 2 })

      const line = el.querySelector('.gbt-mfa-settings__codes-left')!
      expect(text(line)).toContain('2 backup codes left')
      expect(line.getAttribute('data-tone')).toBe('warning')
      expect(button(el, 'Regenerate backup codes')).toBeTruthy()
      expect(button(el, 'Reset')).toBeUndefined()
      expect(button(el, 'Remove')).toBeUndefined()
    })

    it('can regenerate the codes with the password, as ever', async () => {
      const ctx = setup(PASSKEY_ONLY)
      await openPrompt(ctx, 'Regenerate backup codes')

      await submit(ctx)
      ctx.port.calls.expectOne('regenerate').flush({ backupCodes: NEW_CODES })
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-backup-codes')).toBeTruthy()
    })

    it('adds an app: password, scan, code, backup codes, then the app is "On" beside the passkey', async () => {
      const ctx = setup(PASSKEY_ONLY)
      await openPrompt(ctx, 'Add an app', 'hunter22')
      expect(document.activeElement).toBe(password(ctx.el))

      await submit(ctx)
      ctx.port.calls.expectOne('enroll').flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
      await ctx.refresh()
      type(codeField(ctx.el)!, '123456')
      await ctx.refresh()
      await submit(ctx)
      ctx.port.calls.expectOne('confirm').flush({ backupCodes: CODES })
      await ctx.refresh()
      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      button(ctx.el, 'Done')!.click()
      await ctx.refresh()

      expect(badge(ctx.el)).toBe('On')
      expect(button(ctx.el, 'Remove')).toBeTruthy()
      expect(text(ctx.el)).not.toContain('No app configured')
    })

    it('cancelling the scan goes back to the ordinary state, not to the mandatory warning', async () => {
      const ctx = setup(PASSKEY_ONLY)
      await openPrompt(ctx, 'Add an app')
      await submit(ctx)
      ctx.port.calls.expectOne('enroll').flush({ secret: 'JBSWY3DPEHPK3PXP', otpauthUrl: OTPAUTH })
      await ctx.refresh()

      button(ctx.el, 'Cancel')!.click()
      await ctx.refresh()

      expect(text(ctx.el)).toContain('No app configured')
      expect(text(ctx.el)).not.toContain('Two-factor authentication is required')
      expect(document.activeElement).toBe(button(ctx.el, 'Add an app'))
    })

    it('leaves the mandatory warning as soon as a passkey is added elsewhere on the page (no factor before)', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      expect(text(ctx.el)).toContain('Two-factor authentication is required')

      // The passkeys card adds one: the shared state is the one place both cards read the count from.
      ctx.state.passkeyAdded()
      await ctx.refresh()

      expect(text(ctx.el)).not.toContain('Two-factor authentication is required')
      expect(text(ctx.el)).toContain('No app configured')
    })

    it('with the app AND a passkey, removing the app says the passkey stays the way in (still signs out everywhere)', async () => {
      const ctx = setup(BOTH)

      expect(text(ctx.el)).toContain('Remove the authenticator app')
      expect(button(ctx.el, 'Reset')).toBeUndefined()
      await openPrompt(ctx, 'Remove')
      expect(text(ctx.el.querySelector('.gbt-mfa-settings__prompt-lead'))).toBe(
        'Confirm your password to remove your authenticator app.',
      )
      await submit(ctx)

      const dialog = dialogOf(ctx)
      expect(dialog.heading()).toBe('Remove the authenticator app?')
      expect(dialog.message()).toBe(
        'You will be signed out of all your devices. You will sign in again with your passkey, without an app.',
      )
      expect(dialog.confirmLabel()).toBe('Remove')
      dialog.confirmed.emit()
      const call = ctx.port.calls.expectOne('disable')
      expect(call.args).toEqual(['hunter22'])
      call.flush()
      await ctx.refresh()
      expect(ctx.revoked).toBe(1)
    })

    it('keeps the "required" wording of the reset when the app is the only factor', () => {
      const { el } = setup({ totpEnabled: true, backupCodesRemaining: 8 })

      expect(text(el)).toContain('Reset two-factor authentication')
      expect(text(el)).toContain('will have to set up a new one the next time you sign in')
      expect(button(el, 'Reset')).toBeTruthy()
    })

    it('has at most one primary button, in every state', async () => {
      const ctx = setup(PASSKEY_ONLY)
      expect(primary(ctx.el).length).toBeLessThanOrEqual(1)
      await openPrompt(ctx, 'Add an app')
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Continue'])
    })
  })

  describe('one prompt at a time across the two cards', () => {
    it('claims the form for the app card when a prompt opens', async () => {
      const ctx = setup()

      button(ctx.el, 'Regenerate backup codes')!.click()
      await ctx.refresh()

      expect(ctx.state.formOwner()).toBe('app')
    })

    it('closes an open prompt quietly (password dropped, dialog gone) when the passkeys card takes the ownership', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset', 'hunter22')
      await submit(ctx)
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeTruthy()

      ctx.state.claimForm('passkeys')
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeNull()
      expect(ctx.component['password']()).toBe('')
      expect(button(ctx.el, 'Reset')).toBeTruthy()
    })

    it('never interrupts the enrolment on screen', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)

      ctx.state.claimForm('passkeys')
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-totp-qr')).toBeTruthy()
    })

    it('tells the shared state while it is in its enrolment or showing its codes, and when it is done or destroyed', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await ctx.refresh()
      expect(ctx.state.appFlowActive()).toBe(false)

      await toScan(ctx)
      expect(ctx.state.appFlowActive()).toBe(true)
      type(codeField(ctx.el)!, '123456')
      await ctx.refresh()
      await submit(ctx)
      ctx.port.calls.expectOne('confirm').flush({ backupCodes: CODES })
      await ctx.refresh()
      expect(ctx.state.appFlowActive(), 'the codes step too').toBe(true)
      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      button(ctx.el, 'Done')!.click()
      await ctx.refresh()
      expect(ctx.state.appFlowActive()).toBe(false)

      await toScan(ctx).catch(() => undefined)
      ctx.fixture.destroy()
      expect(ctx.state.appFlowActive()).toBe(false)
    })

    it('titles the running app "App configured", beside "On"', () => {
      const { el } = setup()

      expect(text(el.querySelector('.gbt-mfa-settings__row-title'))).toBe('App configured')
      expect(text(el.querySelector('gbt-badge'))).toBe('On')
    })

    it('shares what it read with the passkeys card', () => {
      const ctx = setup({ totpEnabled: true, backupCodesRemaining: 8, passkeys: [PASSKEY] })

      expect(ctx.state.passkeyCount()).toBe(1)
      expect(ctx.state.totpEnabled()).toBe(true)
    })
  })

  describe('leaving the codes step', () => {
    const leaves = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }

    it('warns on the page (until acknowledged) that the codes must be saved before leaving', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)

      expect(text(ctx.el)).toContain('Do not leave this page before you have saved them')
      const warning = ctx.el.querySelector('gbt-alert .gbt-alert')!
      expect(warning.getAttribute('data-variant')).toBe('warning')
      expect(warning.hasAttribute('role')).toBe(false) // read with the codes, not shouted over them
      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      expect(text(ctx.el)).not.toContain('Do not leave this page')
    })

    it('asks the browser to confirm closing or reloading while the codes are not acknowledged, and stops once they are', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      expect(leaves()).toBe(false)
      await toEnrolledCodes(ctx)
      expect(leaves()).toBe(true)

      ctx.component['acknowledged'].set(true)
      await ctx.refresh()
      expect(leaves()).toBe(false)
    })

    it('removes the browser prompt when the component is destroyed on the codes step', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)
      expect(leaves()).toBe(true)

      ctx.fixture.destroy()

      expect(leaves()).toBe(false)
    })
  })

  describe('robustness', () => {
    it('opens one prompt at a time: opening another closes the first and drops its password', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Regenerate backup codes', 'hunter22')
      expect(button(ctx.el, 'Reset')).toBeTruthy()

      button(ctx.el, 'Reset')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelectorAll('form')).toHaveLength(1)
      expect(password(ctx.el)!.value).toBe('')
      expect(button(ctx.el, 'Regenerate backup codes')).toBeTruthy()
      expect(button(ctx.el, 'Continue')).toBeTruthy()
    })

    it('has at most one primary button in each state', async () => {
      const enabled = setup()
      expect(primary(enabled.el).length).toBeLessThanOrEqual(1)
      await openPrompt(enabled, 'Regenerate backup codes')
      expect(primary(enabled.el).length).toBeLessThanOrEqual(1)
    })

    it('keeps the same references for what it binds to its children across change detection (no fresh literals)', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)

      const codes = () =>
        (
          ctx.fixture.debugElement.query(By.directive(BackupCodes)).componentInstance as BackupCodes
        ).codes()
      const first = codes()
      ctx.fixture.detectChanges()
      ctx.fixture.detectChanges()

      expect(codes()).toBe(first)
    })

    it('empties every secret when it is destroyed', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)
      ctx.component['password'].set('leftover')

      ctx.fixture.destroy()

      expect(ctx.component['password']()).toBe('')
      expect(ctx.component['backupCodes']()).toEqual([])
      expect(ctx.component['code']()).toBe('')
      expect(ctx.component['secret']()).toBe('')
    })
  })

  describe('labels', () => {
    it('takes its strings from the labels input', async () => {
      const ctx = setup(
        { totpEnabled: true, backupCodesRemaining: 8 },
        {
          labels: {
            enabled: 'Activée',
            regenerateCodes: 'Régénérer les codes de secours',
            codesLeft: (count) => `${count} codes de secours restants`,
            currentPassword: 'Mot de passe actuel',
          },
        },
      )

      expect(badge(ctx.el)).toBe('Activée')
      expect(text(ctx.el.querySelector('.gbt-mfa-settings__codes-left'))).toContain(
        '8 codes de secours restants',
      )
      button(ctx.el, 'Régénérer les codes de secours')!.click()
      await ctx.refresh()
      expect(text(ctx.el.querySelector(`label[for="${password(ctx.el)!.id}"]`))).toBe(
        'Mot de passe actuel',
      )
      // The strings not given keep their English default.
      expect(button(ctx.el, 'Cancel')).toBeTruthy()
    })

    it('takes the strings the application provides with provideAuthLabels, under its own labels input', () => {
      const ctx = setup(
        { totpEnabled: true, backupCodesRemaining: 8 },
        {
          provided: {
            mfaSettings: {
              heading: "Application d'authentification",
              enabled: 'Activée',
              resetAction: 'Réinitialiser',
            },
          },
          labels: { resetAction: 'Tout réinitialiser' },
        },
      )

      expect(text(ctx.el.querySelector('h2'))).toBe("Application d'authentification")
      expect(badge(ctx.el)).toBe('Activée')
      expect(button(ctx.el, 'Tout réinitialiser')).toBeTruthy()
      expect(button(ctx.el, 'Réinitialiser')).toBeUndefined()
    })

    it('words the confirmation dialog and its failures from the labels', async () => {
      const ctx = setup(
        { totpEnabled: true, backupCodesRemaining: 8 },
        {
          labels: {
            resetDialogHeading: 'Réinitialiser la double authentification ?',
            wrongPassword: 'Mot de passe incorrect',
          },
        },
      )
      await openPrompt(ctx, 'Reset', 'nope')
      await submit(ctx)
      expect(dialogOf(ctx).heading()).toBe('Réinitialiser la double authentification ?')

      dialogOf(ctx).confirmed.emit()
      ctx.port.calls.expectOne('disable').fail(400, WRONG_PASSWORD)
      await ctx.refresh()
      expect(fieldError(ctx.el)).toBe('Mot de passe incorrect')
    })
  })

  describe('accessibility (axe)', () => {
    it('has no violation while loading', async () => {
      const ctx = setup('pending')
      await expectNoA11yViolations(ctx.el)
      ctx.port.calls.expectOne('status')
    })

    it('has no violation when the status could not be loaded', async () => {
      const ctx = setup('failed')
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation with the app on, and with its password prompt open', async () => {
      const ctx = setup()
      await expectNoA11yViolations(ctx.el)
      await openPrompt(ctx, 'Regenerate backup codes')
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation with a passkey only', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 2, passkeys: [PASSKEY] })
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation without any factor', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation on the scan step, with a refused code', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toScan(ctx)
      await expectNoA11yViolations(ctx.el)
      type(codeField(ctx.el)!, '000000')
      await ctx.refresh()
      await submit(ctx)
      ctx.port.calls.expectOne('confirm').fail(400, INVALID_CODE)
      await ctx.refresh()
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation on the backup codes step', async () => {
      const ctx = setup({ totpEnabled: false, backupCodesRemaining: 0 })
      await toEnrolledCodes(ctx)
      await expectNoA11yViolations(ctx.el)
    })

    it('has no violation with the confirmation dialog open', async () => {
      const ctx = setup()
      await openPrompt(ctx, 'Reset')
      await submit(ctx)
      expect(ctx.el.querySelector('gbt-confirm-danger-modal')).toBeTruthy()
      await expectNoA11yViolations(ctx.el)
    })
  })
})
