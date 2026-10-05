import { LOCALE_ID, type Provider } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import type { Mock } from 'vitest'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Button } from '../button/button'
import { ConfirmDangerModal } from '../confirm-danger-modal/confirm-danger-modal'
import { type PasskeySettingsLabels, provideAuthLabels } from '../auth/auth-labels'
import { AUTH_PORT, type AuthConfig } from '../auth/ports/auth.port'
import { MFA_PORT, type MfaStatus, type Passkey } from '../auth/ports/mfa.port'
import { MfaSettingsState } from '../auth/shared/mfa-settings-state'
import {
  type FakeAuthPort,
  type FakeMfaPort,
  type FakePortController,
  fakeAuthPort,
  fakeMfaPort,
} from '../auth/testing/fake-ports'
import {
  CREATION_OPTIONS,
  dismissedPrompt,
  fakeAttestation,
  stubPasskeyBrowser,
} from '../auth/testing/webauthn-testing'
import { PasskeySettings } from './passkey-settings'

const WRONG_PASSWORD = { error: 'current password is incorrect' }
const AVAILABLE: AuthConfig = { registrationEnabled: false, passkeysAvailable: true }
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim()
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10))

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

const MACBOOK: Passkey = {
  id: 'p1',
  name: 'MacBook Touch ID',
  createdAt: '2025-03-12T09:30:00Z',
  lastUsedAt: ago(2 * HOUR),
}
const YUBIKEY: Passkey = { id: 'p2', name: 'YubiKey', createdAt: ago(3 * DAY), lastUsedAt: null }

const withKeys = (...passkeys: Passkey[]): MfaStatus => ({
  totpEnabled: true,
  backupCodesRemaining: 8,
  passkeys,
})
const KEYS_ONLY = (...passkeys: Passkey[]): MfaStatus => ({
  totpEnabled: false,
  backupCodesRemaining: 10,
  passkeys,
})

/** The strings of the FerrisGit original that the date tests need, to prove the French rendering. */
const FRENCH_DATES: Partial<PasskeySettingsLabels> = {
  added: (absolute) => (absolute ? 'Ajoutée le' : 'Ajoutée'),
  lastUsed: (absolute) => (absolute ? 'Dernière utilisation le' : 'Dernière utilisation'),
  neverUsed: 'Jamais utilisée',
}

type CreateMock = Mock<(options?: unknown) => Promise<unknown>>

interface SetupOptions {
  /** Provide an AUTH_PORT (the public config); false: the card runs without one. */
  authPort?: boolean
  labels?: Partial<PasskeySettingsLabels>
  locale?: string
  providers?: Provider[]
}

describe('PasskeySettings', () => {
  let restoreBrowser: (() => void) | null = null
  let createCredential: CreateMock
  let controllers: FakePortController[] = []

  /** Installs a browser with WebAuthn (its `create` is `createCredential`), or one without (null). */
  function browser(create: CreateMock | null = createCredential) {
    restoreBrowser?.()
    restoreBrowser = stubPasskeyBrowser(create ? { create, get: vi.fn() } : null)
  }

  beforeEach(() => {
    createCredential = vi
      .fn<(options?: unknown) => Promise<unknown>>()
      .mockResolvedValue(fakeAttestation())
    browser()
  })
  // The real `navigator.credentials` and `PublicKeyCredential` come back after every test.
  afterEach(() => {
    restoreBrowser?.()
    restoreBrowser = null
    try {
      for (const calls of controllers) {
        calls.verify()
      }
    } finally {
      controllers = []
      TestBed.resetTestingModule()
    }
  })

  function setup(
    status: MfaStatus | 'failed' | 'pending' = withKeys(MACBOOK, YUBIKEY),
    config: AuthConfig | 'unreadable' = AVAILABLE,
    options: SetupOptions = {},
  ) {
    const mfa: FakeMfaPort = fakeMfaPort()
    const auth: FakeAuthPort | null = options.authPort === false ? null : fakeAuthPort()
    controllers = [mfa.calls, ...(auth ? [auth.calls] : [])]
    TestBed.configureTestingModule({
      providers: [
        { provide: MFA_PORT, useValue: mfa },
        ...(auth ? [{ provide: AUTH_PORT, useValue: auth }] : []),
        ...(options.providers ?? []),
      ],
    })
    const fixture = TestBed.createComponent(PasskeySettings)
    if (options.labels) {
      fixture.componentRef.setInput('labels', options.labels)
    }
    if (options.locale) {
      fixture.componentRef.setInput('locale', options.locale)
    }
    let revoked = 0
    fixture.componentInstance.sessionRevoked.subscribe(() => revoked++)
    fixture.detectChanges()
    const ctx = {
      fixture,
      component: fixture.componentInstance,
      mfa,
      auth,
      state: TestBed.inject(MfaSettingsState),
      el: fixture.nativeElement as HTMLElement,
      /** How many times `sessionRevoked` fired (FerrisGit: signed out and sent to /login). */
      revoked: () => revoked,
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
      // forkJoin gave up on the config along with the failed status.
      if (auth) {
        expect(auth.calls.expectOne('authConfig').cancelled).toBe(true)
      }
    } else if (status !== 'pending') {
      mfa.calls.expectOne('status').flush(status)
      if (auth) {
        const read = auth.calls.expectOne('authConfig')
        if (config === 'unreadable') {
          read.fail(0)
        } else {
          read.flush(config)
        }
      }
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
  /** A field by its per-instance id, `gbt-passkey-settings-<n>-<suffix>` (exactly: `-password` is not `-delete-password`). */
  const fieldById = (el: HTMLElement, suffix: string) =>
    Array.from(el.querySelectorAll<HTMLInputElement>('input')).find((input) =>
      new RegExp(`^gbt-passkey-settings-\\d+-${suffix}$`).test(input.id),
    ) ?? null
  const nameField = (el: HTMLElement) => fieldById(el, 'name')
  const passwordField = (el: HTMLElement) => fieldById(el, 'password')
  const deleteField = (el: HTMLElement) => fieldById(el, 'delete-password')
  const fieldError = (el: HTMLElement) => text(el.querySelector('.gbt-input__error'))
  const alertText = (el: HTMLElement) => text(el.querySelector('gbt-alert [role="alert"]'))
  const rows = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>('.gbt-passkey-settings__row'))
  const row = (el: HTMLElement, id: string) =>
    el.querySelector<HTMLElement>(`[data-passkey-id="${id}"]`)!
  const names = (el: HTMLElement) =>
    rows(el).map((r) => text(r.querySelector('.gbt-passkey-settings__name')))
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value
    input.dispatchEvent(new Event('input'))
  }
  const submitButton = (ctx: Ctx) =>
    ctx.fixture.debugElement
      .queryAll(By.directive(Button))
      .find((b) => (b.componentInstance as Button).text() === 'Create the passkey')!
      .componentInstance as Button

  async function openAdd(ctx: Ctx, { name = '', password = 'hunter22' } = {}) {
    button(ctx.el, 'Add a passkey')!.click()
    await ctx.refresh()
    if (name) {
      type(nameField(ctx.el)!, name)
    }
    if (password) {
      type(passwordField(ctx.el)!, password)
    }
    await ctx.refresh()
  }
  async function submitAdd(ctx: Ctx) {
    ctx.el.querySelector('form')!.dispatchEvent(new Event('submit'))
    await ctx.refresh()
  }
  /** Fills the form, submits it and answers the server's start, leaving the browser's prompt open. */
  async function toPrompt(ctx: Ctx, options?: { name?: string; password?: string }) {
    await openAdd(ctx, options)
    await submitAdd(ctx)
    ctx.mfa.calls
      .expectOne('startPasskeyRegistration')
      .flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
    await ctx.refresh()
  }
  async function openDelete(ctx: Ctx, id: string, password = 'hunter22') {
    ;(row(ctx.el, id).querySelector('[data-opener="delete"] button') as HTMLButtonElement).click()
    await ctx.refresh()
    if (password) {
      type(deleteField(ctx.el)!, password)
    }
    await ctx.refresh()
  }
  async function submitDelete(ctx: Ctx) {
    ctx.el.querySelector('form')!.dispatchEvent(new Event('submit'))
    await ctx.refresh()
  }
  const dialog = (ctx: Ctx) =>
    ctx.fixture.debugElement.query(By.directive(ConfirmDangerModal))?.componentInstance as
      ConfirmDangerModal | undefined

  describe('loading and failing', () => {
    it('asks for the status and shows a busy placeholder meanwhile', () => {
      const ctx = setup('pending')

      expect(ctx.el.querySelectorAll('gbt-skeleton-list .gbt-skeleton-list__row')).toHaveLength(2)
      // One polite status, never inside an aria-busy region (a busy ancestor can hold the announcement back).
      expect(text(ctx.el.querySelector('gbt-skeleton-list [role="status"]'))).toBe(
        'Loading passkeys…',
      )
      expect(ctx.el.querySelector('[aria-busy="true"]')).toBeNull()
      ctx.mfa.calls.expectOne('status')
      // The public config is read alongside, through the optional AUTH_PORT.
      ctx.auth!.calls.expectOne('authConfig')
    })

    it('says it could not be loaded and retries on "Retry"', () => {
      const ctx = setup('failed')

      const failed = ctx.el.querySelector('gbt-alert .gbt-alert')
      expect(text(failed)).toContain('Passkeys could not be loaded.')
      expect(failed?.getAttribute('data-variant')).toBe('error')
      // Nothing else announces this failure (no toast): the alert is the one live region, announced once.
      expect(failed?.getAttribute('role')).toBe('alert')
      expect(failed?.getAttribute('aria-live')).toBeNull()
      expect(failed?.querySelector('button')?.textContent?.trim()).toBe('Retry')
      expect(ctx.el.querySelectorAll('[role="alert"]')).toHaveLength(1)
      expect(ctx.el.querySelector('.gbt-passkey-settings__rows')).toBeNull()
      button(ctx.el, 'Retry')!.click()
      ctx.fixture.detectChanges()
      expect(ctx.el.querySelector('gbt-skeleton-list')).toBeTruthy()
      ctx.mfa.calls.expectOne('status').flush(withKeys(MACBOOK))
      ctx.auth!.calls.expectOne('authConfig').flush(AVAILABLE)
      ctx.fixture.detectChanges()

      expect(rows(ctx.el)).toHaveLength(1)
    })
  })

  describe('the list', () => {
    it('lists each key by name, with the count next to the card heading', () => {
      const { el } = setup()

      expect(names(el)).toEqual(['MacBook Touch ID', 'YubiKey'])
      expect(text(el.querySelector('.gbt-card__count'))).toBe('2')
      expect(el.querySelector('ul')?.getAttribute('aria-label')).toBe('Registered passkeys')
    })

    it('marks each key with a decorative key tile (the name says what it is)', () => {
      const { el } = setup()

      const markers = rows(el).map((r) => r.querySelector('gbt-icon-marker .gbt-icon-marker'))
      expect(markers).toHaveLength(2)
      for (const marker of markers) {
        expect(marker?.getAttribute('data-shape')).toBe('tile')
        expect(marker?.getAttribute('aria-hidden')).toBe('true')
      }
    })

    it('says when a key was added (a date once it is old, a relative time when it is recent) and when it was last used', () => {
      const { el } = setup()

      const [macbook, yubikey] = rows(el)
      expect(text(macbook.querySelector('.gbt-passkey-settings__meta'))).toBe(
        'Added on 03/12/2025 Last used 2 hr. ago',
      )
      expect(text(yubikey.querySelector('.gbt-passkey-settings__meta'))).toBe(
        'Added 3 days ago Never used',
      )
    })

    it('words the dates in the locale input, with the prefixes of the labels (the FerrisGit French rendering)', () => {
      const { el } = setup(undefined, undefined, { locale: 'fr', labels: FRENCH_DATES })

      const [macbook, yubikey] = rows(el)
      expect(text(macbook.querySelector('.gbt-passkey-settings__meta'))).toBe(
        'Ajoutée le 12/03/2025 Dernière utilisation il y a 2 h',
      )
      expect(text(yubikey.querySelector('.gbt-passkey-settings__meta'))).toBe(
        'Ajoutée il y a 3 j Jamais utilisée',
      )
    })

    it("falls back to Angular's LOCALE_ID when there is no locale input", () => {
      const { el } = setup(undefined, undefined, {
        providers: [{ provide: LOCALE_ID, useValue: 'fr' }],
      })

      expect(text(row(el, 'p1').querySelector('.gbt-passkey-settings__meta'))).toBe(
        'Added on 12/03/2025 Last used il y a 2 h',
      )
    })

    it('hands the prefixes whether the date is shown as a date (30 days and more) or as a relative time', () => {
      const added = vi.fn((absolute: boolean) => (absolute ? '[added on]' : '[added]'))
      const lastUsed = vi.fn((absolute: boolean) => (absolute ? '[used on]' : '[used]'))
      const OLD: Passkey = {
        id: 'p3',
        name: 'Old',
        createdAt: ago(30 * DAY + HOUR),
        lastUsedAt: ago(29 * DAY),
      }
      const { el } = setup(withKeys(OLD), undefined, { labels: { added, lastUsed } })

      expect(text(row(el, 'p3').querySelector('.gbt-passkey-settings__meta'))).toMatch(
        /^\[added on\] \d{2}\/\d{2}\/\d{4} \[used\] 29 days ago$/,
      )
    })

    it('gives the exact date and time on hover', () => {
      const { el } = setup()

      const added = row(el, 'p1').querySelector('time')!
      expect(added.getAttribute('datetime')).toBe(MACBOOK.createdAt)
      expect(added.getAttribute('title')).toMatch(/^03\/12\/2025, \d{2}:\d{2} [AP]M$/)
      const lastUsed = row(el, 'p1').querySelectorAll('time')[1]
      expect(lastUsed.getAttribute('datetime')).toBe(MACBOOK.lastUsedAt)
      expect(lastUsed.getAttribute('title')).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} [AP]M$/)
    })

    it('gives the exact date and time on hover in the locale input', () => {
      const { el } = setup(undefined, undefined, { locale: 'fr' })

      expect(row(el, 'p1').querySelector('time')!.getAttribute('title')).toMatch(
        /^12\/03\/2025 \d{2}:\d{2}$/,
      )
    })

    it('names the key in each delete button, so that a screen reader can tell them apart', () => {
      const { el } = setup()

      const labels = rows(el).map((r) =>
        r.querySelector('[data-opener="delete"] button')?.getAttribute('aria-label'),
      )
      expect(labels).toEqual(['Delete the key MacBook Touch ID', 'Delete the key YubiKey'])
    })

    it('has no primary button while nothing is being added', () => {
      const { el } = setup()

      expect(primary(el)).toHaveLength(0)
      expect(button(el, 'Add a passkey')!.classList).toContain('gbt-button--secondary')
    })

    it('says "No passkeys" when there is none, and still offers to add one', () => {
      const { el } = setup(withKeys())

      expect(text(el.querySelector('gbt-empty-state .gbt-empty-state__heading'))).toBe(
        'No passkeys',
      )
      expect(el.querySelector('.gbt-card__count'), 'no "0" beside the heading').toBeNull()
      expect(el.querySelector('.gbt-passkey-settings__rows')).toBeNull()
      expect(button(el, 'Add a passkey')!.disabled).toBe(false)
    })

    it('shares what it read with the sibling card (MfaSettingsState)', () => {
      const ctx = setup(KEYS_ONLY(MACBOOK, YUBIKEY))

      expect(ctx.state.passkeyCount()).toBe(2)
      expect(ctx.state.totpEnabled()).toBe(false)
    })
  })

  describe('where a key cannot be added', () => {
    it('explains it in a browser without WebAuthn, disables adding and still lists and removes the keys', () => {
      browser(null)
      const { el } = setup()

      expect(text(el.querySelector('gbt-alert'))).toContain(
        'This browser does not support passkeys',
      )
      // The reason is there from the start: an information note, no live region.
      const reason = el.querySelector('gbt-alert .gbt-alert')!
      expect(reason.getAttribute('data-variant')).toBe('info')
      expect(reason.hasAttribute('role')).toBe(false)
      expect(reason.hasAttribute('aria-live')).toBe(false)
      expect(button(el, 'Add a passkey')!.disabled).toBe(true)
      expect(rows(el)).toHaveLength(2)
      expect(
        (row(el, 'p1').querySelector('[data-opener="delete"] button') as HTMLButtonElement)
          .disabled,
      ).toBe(false)
    })

    it('explains it when the server cannot run WebAuthn (passkeysAvailable: false), and the keys stay manageable', () => {
      const { el } = setup(withKeys(MACBOOK), {
        registrationEnabled: false,
        passkeysAvailable: false,
      })

      expect(text(el.querySelector('gbt-alert'))).toContain(
        'Passkeys are not available on this server.',
      )
      expect(button(el, 'Add a passkey')!.disabled).toBe(true)
      expect(rows(el)).toHaveLength(1)
    })

    it('does not take an unreadable server configuration for "unavailable"', () => {
      const { el } = setup(withKeys(MACBOOK), 'unreadable')

      expect(el.querySelector('gbt-alert')).toBeNull()
      expect(button(el, 'Add a passkey')!.disabled).toBe(false)
    })

    it('loads without any AUTH_PORT: the availability is unknown, so adding is not blocked', () => {
      const { el } = setup(withKeys(MACBOOK), undefined, { authPort: false })

      expect(rows(el)).toHaveLength(1)
      expect(el.querySelector('gbt-alert')).toBeNull()
      expect(button(el, 'Add a passkey')!.disabled).toBe(false)
    })

    it('does not open the form when adding is blocked', async () => {
      browser(null)
      const ctx = setup(withKeys())

      button(ctx.el, 'Add a passkey')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
    })
  })

  describe('adding a key', () => {
    it('opens a form with the optional name (default as its placeholder) and the current password, and focuses the name', async () => {
      const ctx = setup()

      button(ctx.el, 'Add a passkey')!.click()
      await ctx.refresh()

      expect(text(ctx.el.querySelector(`label[for="${nameField(ctx.el)!.id}"]`))).toBe(
        'Key name (optional)',
      )
      expect(nameField(ctx.el)!.placeholder).toBe('Passkey')
      expect(passwordField(ctx.el)!.type).toBe('password')
      expect(passwordField(ctx.el)!.getAttribute('autocomplete')).toBe('current-password')
      expect(text(ctx.el.querySelector(`label[for="${passwordField(ctx.el)!.id}"]`))).toBe(
        'Current password',
      )
      expect(document.activeElement).toBe(nameField(ctx.el))
      // The opener gives way to the form: ONE primary button in the view.
      expect(button(ctx.el, 'Add a passkey')).toBeUndefined()
      expect(primary(ctx.el).map((b) => text(b))).toEqual(['Create the passkey'])
    })

    it('sends the CURRENT PASSWORD with the start request (the server refuses a registration without it)', async () => {
      const ctx = setup()
      await openAdd(ctx, { password: 'hunter22' })

      await submitAdd(ctx)

      const start = ctx.mfa.calls.expectOne('startPasskeyRegistration')
      expect(start.args).toEqual(['hunter22'])
      expect(createCredential).not.toHaveBeenCalled()
      start.flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
      await ctx.refresh()
      ctx.mfa.calls.expectOne('finishPasskeyRegistration').flush(YUBIKEY)
    })

    it('runs the ceremony: start, the browser with the server options, finish with the credential and the name; then lists the key', async () => {
      const created: Passkey = { id: 'p3', name: 'Phone', createdAt: ago(1000), lastUsedAt: null }
      const ctx = setup(withKeys(MACBOOK))
      await toPrompt(ctx, { name: 'Phone' })

      expect(createCredential).toHaveBeenCalledTimes(1)
      const options = createCredential.mock.calls[0][0] as {
        publicKey: { challenge: ArrayBuffer; user: { id: ArrayBuffer } }
      }
      expect(new Uint8Array(options.publicKey.challenge)).toEqual(new Uint8Array([1, 2, 3, 4]))
      const finish = ctx.mfa.calls.expectOne('finishPasskeyRegistration')
      expect(finish.args).toEqual([
        'c1',
        {
          id: 'credential-id',
          rawId: 'AQID',
          type: 'public-key',
          response: { attestationObject: 'BAU', clientDataJSON: 'Bgc' },
        },
        'Phone',
      ])
      finish.flush(created)
      await ctx.refresh()

      expect(names(ctx.el)).toEqual(['MacBook Touch ID', 'Phone'])
      expect(text(ctx.el.querySelector('.gbt-card__count'))).toBe('2')
      expect(text(ctx.el.querySelector('.gbt-passkey-settings__result'))).toBe(
        'Passkey “Phone” added.',
      )
      // Said politely, shown (not the visually hidden idle line), with the "saved" look.
      expect(
        ctx.el.querySelector('.gbt-passkey-settings__result')?.classList.contains('sr-only'),
      ).toBe(false)
      expect(
        ctx.el
          .querySelector('.gbt-passkey-settings__result [role="status"]')
          ?.getAttribute('data-state'),
      ).toBe('saved')
      expect(ctx.el.querySelector('form')).toBeNull()
      expect(button(ctx.el, 'Add a passkey')).toBeTruthy()
      expect(document.activeElement, 'the new key is announced').toBe(row(ctx.el, 'p3'))
      expect(primary(ctx.el)).toHaveLength(0)
      // The sibling card learns there is one more key.
      expect(ctx.state.passkeyCount()).toBe(2)
    })

    it('drops the password once done', async () => {
      const ctx = setup()
      await toPrompt(ctx, { password: 'hunter22' })
      ctx.mfa.calls.expectOne('finishPasskeyRegistration').flush(YUBIKEY)
      await ctx.refresh()

      expect(ctx.component['password']()).toBe('')
      expect(ctx.component['name']()).toBe('')
    })

    it.each([
      ['', 'Passkey'],
      ['   ', 'Passkey'],
      ['  My phone  ', 'My phone'],
    ])('names the key %j "%s"', async (typed, expected) => {
      const ctx = setup()
      await toPrompt(ctx, { name: typed })

      expect(ctx.mfa.calls.expectOne('finishPasskeyRegistration').args[2]).toBe(expected)
    })

    it('names an unnamed key with the defaultPasskeyName label', async () => {
      const ctx = setup(undefined, undefined, { labels: { defaultPasskeyName: "Clé d'accès" } })
      await toPrompt(ctx, { name: '' })

      expect(ctx.mfa.calls.expectOne('finishPasskeyRegistration').args[2]).toBe("Clé d'accès")
    })

    it('does not send an empty password', async () => {
      const ctx = setup()
      await openAdd(ctx, { password: '' })

      await submitAdd(ctx)

      ctx.mfa.calls.expectNone('startPasskeyRegistration')
      expect(fieldError(ctx.el)).toBe('Enter your password')
      expect(document.activeElement).toBe(passwordField(ctx.el))
    })

    it('refuses a name that is too long or holds a control character before any request', async () => {
      const ctx = setup()
      await openAdd(ctx, { name: 'a'.repeat(41) })
      await submitAdd(ctx)
      expect(fieldError(ctx.el)).toBe('The name must not be longer than 40 characters')
      expect(document.activeElement).toBe(nameField(ctx.el))

      type(nameField(ctx.el)!, 'a\u0007b')
      await ctx.refresh()
      await submitAdd(ctx)
      expect(fieldError(ctx.el)).toBe('The name cannot contain control characters')
      ctx.mfa.calls.expectNone('startPasskeyRegistration')
    })

    it('counts the length of the name in characters, not UTF-16 units (40 emoji are accepted)', async () => {
      const ctx = setup()
      await toPrompt(ctx, { name: '😀'.repeat(40) })

      expect(ctx.mfa.calls.expectOne('finishPasskeyRegistration').args[2]).toBe('😀'.repeat(40))
    })

    it('accepts a name of exactly 40 characters', async () => {
      const ctx = setup()
      await toPrompt(ctx, { name: 'é'.repeat(40) })

      expect(ctx.mfa.calls.expectOne('finishPasskeyRegistration').args[2]).toBe('é'.repeat(40))
    })

    it('shows a spinner, says what to do on the device while the prompt is open, and ignores a second submit', async () => {
      let answer: (credential: unknown) => void = () => undefined
      createCredential.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      const ctx = setup()
      await openAdd(ctx)

      await submitAdd(ctx)
      await submitAdd(ctx)
      expect(submitButton(ctx).loading()).toBe(true)
      ctx.mfa.calls
        .expectOne('startPasskeyRegistration')
        .flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
      await ctx.refresh()

      expect(text(ctx.el.querySelector('gbt-alert'))).toBe(
        'Confirm on your device to create the key.',
      )
      expect(ctx.el.querySelector('gbt-alert [role="status"]')).toBeTruthy()
      expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull()
      await submitAdd(ctx)
      ctx.mfa.calls.expectNone('startPasskeyRegistration')
      answer(fakeAttestation())
      await ctx.refresh()
      ctx.mfa.calls.expectOne('finishPasskeyRegistration').flush(YUBIKEY)
      await ctx.refresh()

      expect(ctx.el.querySelector('gbt-alert')).toBeNull()
      expect(ctx.component['busy']()).toBe(false)
    })

    describe('failing', () => {
      it('says "Incorrect password" under the field on a 400, keeps the form, asks the browser for nothing and refocuses the field', async () => {
        const ctx = setup()
        await openAdd(ctx, { password: 'nope' })

        await submitAdd(ctx)
        ctx.mfa.calls.expectOne('startPasskeyRegistration').fail(400, WRONG_PASSWORD)
        await ctx.refresh()

        expect(fieldError(ctx.el)).toBe('Incorrect password')
        expect(ctx.el.querySelector('form')).toBeTruthy()
        expect(createCredential).not.toHaveBeenCalled()
        expect(document.activeElement).toBe(passwordField(ctx.el))
        expect(submitButton(ctx).loading()).toBe(false)
        // The user corrects and retries.
        type(passwordField(ctx.el)!, 'hunter22')
        await ctx.refresh()
        expect(fieldError(ctx.el)).toBeUndefined()
        await submitAdd(ctx)
        expect(ctx.mfa.calls.expectOne('startPasskeyRegistration').args).toEqual(['hunter22'])
      })

      it.each([
        [429, {}, 'Too many attempts, try again in a few minutes'],
        [
          503,
          { error: 'passkeys are not available on this server' },
          'Passkeys are not available on this server.',
        ],
        [500, {}, 'The passkey could not be created, try again.'],
        [
          400,
          { error: 'too many passkeys' },
          'You have reached the maximum number of passkeys: delete one before adding another.',
        ],
      ])(
        'answers %i to the start with a message and keeps the form',
        async (status, body, message) => {
          const ctx = setup()
          await openAdd(ctx)

          await submitAdd(ctx)
          ctx.mfa.calls.expectOne('startPasskeyRegistration').fail(status, body)
          await ctx.refresh()

          expect(alertText(ctx.el)).toBe(message)
          expect(fieldError(ctx.el)).toBeUndefined()
          expect(ctx.el.querySelector('form')).toBeTruthy()
          expect(createCredential).not.toHaveBeenCalled()
          expect(document.activeElement, 'the button that was busy gets the focus back').toBe(
            ctx.el.querySelector('.gbt-passkey-settings__submit button'),
          )
        },
      )

      it('takes a dismissed prompt for a quiet note (announced politely, not an alert) and lets the user retry with one click', async () => {
        createCredential.mockRejectedValueOnce(dismissedPrompt())
        const ctx = setup()
        await toPrompt(ctx)

        expect(text(ctx.el.querySelector('gbt-alert'))).toBe('Operation cancelled')
        expect(ctx.el.querySelector('gbt-alert [role="alert"]')).toBeNull()
        expect(ctx.el.querySelector('gbt-alert [role="status"]')).toBeTruthy()
        ctx.mfa.calls.expectNone('finishPasskeyRegistration')
        expect(ctx.el.querySelector('form')).toBeTruthy()

        // The password was kept: no need to type it again, but the server is asked afresh.
        await submitAdd(ctx)
        expect(ctx.mfa.calls.expectOne('startPasskeyRegistration').args).toEqual(['hunter22'])
      })

      it('says the key is already registered when the browser refuses a duplicate (InvalidStateError)', async () => {
        createCredential.mockRejectedValueOnce(new DOMException('x', 'InvalidStateError'))
        const ctx = setup()
        await toPrompt(ctx)

        expect(alertText(ctx.el)).toBe('This key is already registered')
        ctx.mfa.calls.expectNone('finishPasskeyRegistration')
      })

      it('says the key is already registered when the server answers 409 at the end', async () => {
        const ctx = setup()
        await toPrompt(ctx)

        ctx.mfa.calls
          .expectOne('finishPasskeyRegistration')
          .fail(409, { error: 'this passkey is already registered' })
        await ctx.refresh()

        expect(alertText(ctx.el)).toBe('This key is already registered')
        expect(rows(ctx.el)).toHaveLength(2)
      })

      it.each([
        [400, { error: 'invalid passkey' }],
        [500, {}],
      ])(
        'says the key could not be created when the finish answers %i, and a retry works',
        async (status, body) => {
          const ctx = setup()
          await toPrompt(ctx)

          ctx.mfa.calls.expectOne('finishPasskeyRegistration').fail(status, body)
          await ctx.refresh()

          expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')
          expect(rows(ctx.el)).toHaveLength(2)
          expect(submitButton(ctx).loading()).toBe(false)
          await submitAdd(ctx)
          ctx.mfa.calls.expectOne('startPasskeyRegistration')
        },
      )

      it('takes any other browser error for a failure (never leaves the form spinning)', async () => {
        createCredential.mockRejectedValueOnce(new DOMException('x', 'SecurityError'))
        const ctx = setup()
        await toPrompt(ctx)

        expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')
        expect(submitButton(ctx).loading()).toBe(false)
      })

      it("takes a start answer that is not the server's options for a failure (the browser is never called)", async () => {
        const ctx = setup()
        await openAdd(ctx)
        await submitAdd(ctx)

        ctx.mfa.calls
          .expectOne('startPasskeyRegistration')
          .flush({ challengeId: 'c1', publicKey: {} })
        await ctx.refresh()

        expect(alertText(ctx.el)).toBe('The passkey could not be created, try again.')
        expect(createCredential).not.toHaveBeenCalled()
      })
    })

    describe('leaving the form', () => {
      it('"Cancel" closes it, drops the password and the name, and gives the focus back to the opener', async () => {
        const ctx = setup()
        await openAdd(ctx, { name: 'Phone' })

        button(ctx.el, 'Cancel')!.click()
        await ctx.refresh()

        expect(ctx.el.querySelector('form')).toBeNull()
        expect(ctx.component['password']()).toBe('')
        expect(ctx.component['name']()).toBe('')
        expect(document.activeElement).toBe(button(ctx.el, 'Add a passkey'))
      })

      it('opens no prompt at all when the form is closed before the server answered the start', async () => {
        const ctx = setup()
        await openAdd(ctx)
        await submitAdd(ctx)

        button(ctx.el, 'Cancel')!.click()
        ctx.mfa.calls
          .expectOne('startPasskeyRegistration')
          .flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
        await ctx.refresh()

        expect(createCredential).not.toHaveBeenCalled()
        expect(ctx.component['busy']()).toBe(false)
        expect(ctx.el.querySelector('form')).toBeNull()
      })

      it("drops the browser's late answer when the form was closed meanwhile: nothing is finished, nothing is listed", async () => {
        let answer: (credential: unknown) => void = () => undefined
        createCredential.mockReturnValue(new Promise((resolve) => (answer = resolve)))
        const ctx = setup()
        await toPrompt(ctx)

        button(ctx.el, 'Cancel')!.click()
        await ctx.refresh()
        answer(fakeAttestation())
        await ctx.refresh()

        ctx.mfa.calls.expectNone('finishPasskeyRegistration')
        expect(rows(ctx.el)).toHaveLength(2)
        expect(ctx.el.querySelector('form')).toBeNull()
        expect(text(ctx.el.querySelector('.gbt-passkey-settings__result'))).toBe('')
        // Nothing to say: the live region is still in the DOM (a change is only announced if it was there), taking no room.
        expect(
          ctx.el
            .querySelector('.gbt-passkey-settings__result [role="status"]')
            ?.getAttribute('data-state'),
        ).toBe('idle')
        expect(
          ctx.el.querySelector('.gbt-passkey-settings__result')?.classList.contains('sr-only'),
        ).toBe(true)
      })

      it('still counts a key whose finish answered after the form was left (it exists on the server), without listing it', async () => {
        const ctx = setup()
        await toPrompt(ctx)
        const finish = ctx.mfa.calls.expectOne('finishPasskeyRegistration')

        button(ctx.el, 'Cancel')!.click()
        await ctx.refresh()
        finish.flush({ id: 'p3', name: 'Passkey', createdAt: ago(1000), lastUsedAt: null })
        await ctx.refresh()

        expect(rows(ctx.el)).toHaveLength(2)
        expect(ctx.state.passkeyCount()).toBe(3)
      })

      it('drops a late browser refusal when the form was closed meanwhile', async () => {
        let refuse: (error: unknown) => void = () => undefined
        createCredential.mockReturnValue(new Promise((_, reject) => (refuse = reject)))
        const ctx = setup()
        await toPrompt(ctx)

        button(ctx.el, 'Cancel')!.click()
        await ctx.refresh()
        refuse(dismissedPrompt())
        await ctx.refresh()

        expect(ctx.el.querySelector('gbt-alert')).toBeNull()
      })

      it('never keeps the password once the component is destroyed', async () => {
        const ctx = setup()
        await openAdd(ctx, { password: 'hunter22' })

        ctx.fixture.destroy()

        expect(ctx.component['password']()).toBe('')
      })
    })
  })

  describe('one prompt at a time across the two cards', () => {
    it('claims the form for the passkeys card when adding or deleting', async () => {
      const ctx = setup()

      await openAdd(ctx)
      expect(ctx.state.formOwner()).toBe('passkeys')
      ctx.state.claimForm('app')
      await ctx.refresh()
      await openDelete(ctx, 'p1')

      expect(ctx.state.formOwner()).toBe('passkeys')
    })

    it('closes the add form quietly (password dropped, ceremony dropped) when the app card takes the ownership', async () => {
      const ctx = setup()
      await openAdd(ctx, { password: 'hunter22' })

      ctx.state.claimForm('app')
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
      expect(ctx.component['password']()).toBe('')
      expect(button(ctx.el, 'Add a passkey')).toBeTruthy()
    })

    it('closes the delete prompt and its dialog when the app card takes the ownership', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')
      await submitDelete(ctx)

      ctx.state.claimForm('app')
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
      expect(dialog(ctx)).toBeUndefined()
      expect(ctx.component['deletePassword']()).toBe('')
    })

    it('holds "Add a passkey" back, and says why, while the app card is in its enrolment or its codes', async () => {
      const ctx = setup()

      ctx.state.setAppFlowActive(true)
      await ctx.refresh()

      expect(button(ctx.el, 'Add a passkey')!.disabled).toBe(true)
      expect(text(ctx.el.querySelector('.gbt-passkey-settings__hint'))).toBe(
        'Finish setting up the authenticator app first.',
      )
      button(ctx.el, 'Add a passkey')!.click()
      await ctx.refresh()
      expect(ctx.el.querySelector('form')).toBeNull()

      ctx.state.setAppFlowActive(false)
      await ctx.refresh()
      expect(button(ctx.el, 'Add a passkey')!.disabled).toBe(false)
      expect(ctx.el.querySelector('.gbt-passkey-settings__hint')).toBeNull()
    })
  })

  describe('deleting a key', () => {
    it('opens a password prompt under that key only, with a quiet "Continue", and focuses the field', async () => {
      const ctx = setup()

      ;(
        row(ctx.el, 'p2').querySelector('[data-opener="delete"] button') as HTMLButtonElement
      ).click()
      await ctx.refresh()

      expect(row(ctx.el, 'p2').querySelector('form')).toBeTruthy()
      expect(row(ctx.el, 'p1').querySelector('form')).toBeNull()
      expect(deleteField(ctx.el)!.type).toBe('password')
      expect(deleteField(ctx.el)!.getAttribute('autocomplete')).toBe('current-password')
      expect(document.activeElement).toBe(deleteField(ctx.el))
      expect(text(row(ctx.el, 'p2').querySelector('.gbt-passkey-settings__form-lead'))).toBe(
        'Confirm your password to delete “YubiKey”.',
      )
      expect(button(ctx.el, 'Continue')!.classList).toContain('gbt-button--secondary')
      expect(primary(ctx.el)).toHaveLength(0)
      // The opener of that key gives way to its prompt.
      expect(row(ctx.el, 'p2').querySelector('[data-opener="delete"]')).toBeNull()
      expect(row(ctx.el, 'p1').querySelector('[data-opener="delete"]')).toBeTruthy()
    })

    it('does not open the dialog for an empty password', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', '')

      await submitDelete(ctx)

      expect(dialog(ctx)).toBeUndefined()
      expect(fieldError(ctx.el)).toBe('Enter your password')
      expect(document.activeElement).toBe(deleteField(ctx.el))
    })

    it('asks for a confirmation before sending anything, and says honestly that everyone is signed out', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1')

      await submitDelete(ctx)

      ctx.mfa.calls.expectNone('deletePasskey')
      expect(dialog(ctx)!.heading()).toBe('Delete this passkey?')
      expect(dialog(ctx)!.message()).toBe(
        '“MacBook Touch ID” will no longer let you sign in. You will be signed out of all your devices and will have to sign in again.',
      )
      expect(dialog(ctx)!.confirmLabel()).toBe('Delete')
    })

    it('sets the last-factor warning apart, in a warning alert shown BEFORE "Continue"', async () => {
      const ctx = setup(KEYS_ONLY(MACBOOK))

      await openDelete(ctx, 'p1', '')

      const alert = row(ctx.el, 'p1').querySelector('gbt-alert')!
      expect(text(alert)).toBe(
        'This is your last factor: you will have to set up a new one the next time you sign in.',
      )
      expect(alert.querySelector('[role="alert"]')).toBeTruthy()
      expect(alert.querySelector('[data-variant="warning"]')).toBeTruthy()
    })

    it.each([
      ['another key remains', KEYS_ONLY(MACBOOK, YUBIKEY)],
      ['an authenticator app remains', withKeys(MACBOOK)],
    ])('shows no warning alert when %s', async (_, status) => {
      const ctx = setup(status)

      await openDelete(ctx, 'p1', '')

      expect(ctx.el.querySelector('gbt-alert')).toBeNull()
    })

    it('does not claim "last factor" once the app was enrolled from the sibling card after the load', async () => {
      const ctx = setup(KEYS_ONLY(MACBOOK))
      // The app card confirms an enrolment: the shared state is where both cards read the app's state.
      ctx.state.totpConfirmed()
      await ctx.refresh()
      await openDelete(ctx, 'p1')

      await submitDelete(ctx)

      expect(dialog(ctx)!.message()).not.toContain('last factor')
      expect(ctx.el.querySelector('gbt-alert')).toBeNull()
    })

    it('warns that it is the last factor when the account has no other key and no app', async () => {
      const ctx = setup(KEYS_ONLY(MACBOOK))
      await openDelete(ctx, 'p1')

      await submitDelete(ctx)

      expect(dialog(ctx)!.message()).toContain(
        'This is your last factor: you will have to set up a new one the next time you sign in.',
      )
    })

    it.each([
      ['another key remains', KEYS_ONLY(MACBOOK, YUBIKEY)],
      ['an authenticator app remains', withKeys(MACBOOK)],
    ])('does not claim it is the last factor when %s', async (_, status) => {
      const ctx = setup(status)
      await openDelete(ctx, 'p1')

      await submitDelete(ctx)

      expect(dialog(ctx)!.message()).not.toContain('last factor')
    })

    it('"Cancel" in the dialog keeps the prompt and the password, and refocuses the field', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')
      await submitDelete(ctx)

      dialog(ctx)!.closed.emit()
      await ctx.refresh()

      expect(dialog(ctx)).toBeUndefined()
      expect(deleteField(ctx.el)!.value).toBe('hunter22')
      expect(document.activeElement).toBe(deleteField(ctx.el))
      ctx.mfa.calls.expectNone('deletePasskey')
    })

    it('sends the password on confirmation, then emits sessionRevoked; no token is handed over, the password is dropped', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')
      await submitDelete(ctx)

      dialog(ctx)!.confirmed.emit()
      ctx.fixture.detectChanges()
      expect(dialog(ctx)!.busy()).toBe(true)
      const request = ctx.mfa.calls.expectOne('deletePasskey')
      expect(request.args).toEqual(['p1', 'hunter22'])
      expect(ctx.revoked()).toBe(0)
      request.flush()
      await ctx.refresh()

      expect(ctx.revoked()).toBe(1)
      expect(ctx.auth!.tokens).toEqual([])
      expect(dialog(ctx)).toBeUndefined()
      expect(ctx.component['deletePassword']()).toBe('')
      expect(ctx.component['deleteBusy']()).toBe(false)
      expect(ctx.state.passkeyCount()).toBe(1)
    })

    it('turns inert once the session is revoked (it does not count on sessionRevoked being bound): only "signed out", nothing to press', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')
      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()
      ctx.mfa.calls.expectOne('deletePasskey').flush()
      await ctx.refresh()

      expect(text(ctx.el.querySelector('gbt-alert'))).toBe(
        'You have been signed out. Sign in again to continue.',
      )
      // Neither the deleted key nor any other action is left: nothing to press against a dead session.
      expect(rows(ctx.el)).toHaveLength(0)
      expect(ctx.el.querySelectorAll('button')).toHaveLength(0)
      expect(ctx.el.querySelector('form, input')).toBeNull()
      expect(ctx.el.querySelector('.gbt-card__count')).toBeNull()
      expect(document.activeElement).toBe(ctx.el.querySelector('[data-passkeys-anchor]'))
      await expectNoA11yViolations(ctx.el)
    })

    it('escapes the server id of a key in the selectors it focuses (a quote or a backslash does not break them)', async () => {
      const odd: Passkey = { ...YUBIKEY, id: 'p"2\\x' }
      const ctx = setup(withKeys(MACBOOK))
      await toPrompt(ctx, { name: 'YubiKey' })
      ctx.mfa.calls.expectOne('finishPasskeyRegistration').flush(odd)
      await ctx.refresh()

      const added = ctx.el.querySelector<HTMLElement>(`[data-passkey-id="${CSS.escape(odd.id)}"]`)!
      expect(added).toBeTruthy()
      expect(document.activeElement).toBe(added)

      ;(added.querySelector('[data-opener="delete"] button') as HTMLButtonElement).click()
      await ctx.refresh()
      button(added, 'Cancel')!.click()
      await ctx.refresh()

      expect(document.activeElement).toBe(added.querySelector('[data-opener="delete"] button'))
    })

    it('sends the request once even if the dialog confirms twice', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1')
      await submitDelete(ctx)

      dialog(ctx)!.confirmed.emit()
      dialog(ctx)!.confirmed.emit()

      ctx.mfa.calls.expectOne('deletePasskey')
    })

    it('a wrong password (400) closes the dialog, says so under the field and keeps the prompt; nothing is signed out', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'nope')
      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()

      ctx.mfa.calls.expectOne('deletePasskey').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      expect(dialog(ctx)).toBeUndefined()
      expect(fieldError(ctx.el)).toBe('Incorrect password')
      expect(row(ctx.el, 'p1').querySelector('form')).toBeTruthy()
      expect(document.activeElement).toBe(deleteField(ctx.el))
      expect(ctx.revoked()).toBe(0)
      expect(rows(ctx.el)).toHaveLength(2)
    })

    it('rolls the busy state back on a server failure or a 429, with a message, keeping the prompt', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1')
      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()
      ctx.mfa.calls.expectOne('deletePasskey').fail(500, {})
      await ctx.refresh()
      expect(alertText(ctx.el)).toBe('The passkey could not be deleted, try again.')
      expect(ctx.component['deleteBusy']()).toBe(false)

      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()
      ctx.mfa.calls.expectOne('deletePasskey').fail(429, {})
      await ctx.refresh()

      expect(alertText(ctx.el)).toBe('Too many attempts, try again in a few minutes')
      expect(ctx.revoked()).toBe(0)
    })

    it('takes a key that is already gone (404) off the list without signing anyone out', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1')
      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()

      ctx.mfa.calls.expectOne('deletePasskey').fail(404, { error: 'passkey not found' })
      await ctx.refresh()

      expect(names(ctx.el)).toEqual(['YubiKey'])
      expect(text(ctx.el.querySelector('.gbt-passkey-settings__result'))).toBe(
        'The passkey “MacBook Touch ID” no longer exists.',
      )
      expect(ctx.revoked()).toBe(0)
      expect(ctx.component['deletePassword']()).toBe('')
      expect(document.activeElement).toBe(ctx.el.querySelector('[data-passkeys-anchor]'))
    })

    it('takes a key that is already gone (404) off the shared count too, so the app card stops believing in it', async () => {
      const ctx = setup(withKeys(MACBOOK, YUBIKEY))
      expect(ctx.state.passkeyCount()).toBe(2)
      await openDelete(ctx, 'p1')
      await submitDelete(ctx)
      dialog(ctx)!.confirmed.emit()

      ctx.mfa.calls.expectOne('deletePasskey').fail(404, { error: 'passkey not found' })
      await ctx.refresh()

      expect(ctx.state.passkeyCount()).toBe(1)
    })

    it('"Cancel" closes the prompt, drops the password and gives the focus back to that key\'s button', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p2', 'hunter22')

      button(row(ctx.el, 'p2'), 'Cancel')!.click()
      await ctx.refresh()

      expect(ctx.el.querySelector('form')).toBeNull()
      expect(ctx.component['deletePassword']()).toBe('')
      expect(document.activeElement).toBe(
        row(ctx.el, 'p2').querySelector('[data-opener="delete"] button'),
      )
    })

    it('opening the delete prompt closes the add form and drops its password (one prompt at a time)', async () => {
      const ctx = setup()
      await openAdd(ctx, { password: 'hunter22' })

      ;(
        row(ctx.el, 'p1').querySelector('[data-opener="delete"] button') as HTMLButtonElement
      ).click()
      await ctx.refresh()

      expect(nameField(ctx.el)).toBeNull()
      expect(ctx.component['password']()).toBe('')
      expect(ctx.el.querySelectorAll('form')).toHaveLength(1)
    })

    it('opening the add form closes the delete prompt and drops its password', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')

      button(ctx.el, 'Add a passkey')!.click()
      await ctx.refresh()

      expect(deleteField(ctx.el)).toBeNull()
      expect(ctx.component['deletePassword']()).toBe('')
      expect(ctx.el.querySelectorAll('form')).toHaveLength(1)
      expect(buttons(ctx.el)).toContain('Create the passkey')
    })

    it('drops the delete password when the component is destroyed', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1', 'hunter22')

      ctx.fixture.destroy()

      expect(ctx.component['deletePassword']()).toBe('')
    })
  })

  describe('labels', () => {
    it('takes its strings from the labels input', async () => {
      const ctx = setup(undefined, undefined, {
        labels: {
          heading: "Clés d'accès",
          addPasskey: "Ajouter une clé d'accès",
          deleteKey: (name) => `Supprimer la clé ${name}`,
        },
      })

      expect(
        text(ctx.el.querySelector('.gbt-card__header h2')),
        'the heading, then its count',
      ).toBe("Clés d'accès 2")
      expect(button(ctx.el, "Ajouter une clé d'accès")).toBeTruthy()
      expect(
        row(ctx.el, 'p1')
          .querySelector('[data-opener="delete"] button')
          ?.getAttribute('aria-label'),
      ).toBe('Supprimer la clé MacBook Touch ID')
    })

    it('takes the application-wide strings of provideAuthLabels, under its own labels input', () => {
      const ctx = setup(undefined, undefined, {
        providers: [
          provideAuthLabels({
            passkeySettings: { heading: "Clés d'accès", addPasskey: 'Ajouter une clé' },
          }),
        ],
        labels: { addPasskey: "Ajouter une clé d'accès" },
      })

      expect(
        text(ctx.el.querySelector('.gbt-card__header h2')),
        'the heading, then its count',
      ).toBe("Clés d'accès 2")
      expect(button(ctx.el, "Ajouter une clé d'accès")).toBeTruthy()
      expect(button(ctx.el, 'Ajouter une clé')).toBeUndefined()
    })

    it('words the failures from its labels too', async () => {
      const ctx = setup(undefined, undefined, {
        labels: { wrongPassword: 'Mot de passe incorrect' },
      })
      await openAdd(ctx, { password: 'nope' })
      await submitAdd(ctx)
      ctx.mfa.calls.expectOne('startPasskeyRegistration').fail(400, WRONG_PASSWORD)
      await ctx.refresh()

      expect(fieldError(ctx.el)).toBe('Mot de passe incorrect')
    })
  })

  describe('accessibility', () => {
    it('has no axe violations while loading', async () => {
      const ctx = setup('pending')
      await expectNoA11yViolations(ctx.el)
      ctx.mfa.calls.expectOne('status')
      ctx.auth!.calls.expectOne('authConfig')
    })

    it('has no axe violations when the load failed', async () => {
      const ctx = setup('failed')
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations with a list of keys', async () => {
      const ctx = setup()
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations without any key', async () => {
      const ctx = setup(withKeys())
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations when adding is blocked', async () => {
      browser(null)
      const ctx = setup()
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations with the add form open, a field in error and the prompt open', async () => {
      const ctx = setup()
      await openAdd(ctx, { password: '' })
      await submitAdd(ctx)
      await expectNoA11yViolations(ctx.el)

      createCredential.mockReturnValue(new Promise(() => undefined))
      type(passwordField(ctx.el)!, 'hunter22')
      await ctx.refresh()
      await submitAdd(ctx)
      ctx.mfa.calls
        .expectOne('startPasskeyRegistration')
        .flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
      await ctx.refresh()
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations with the delete prompt and its last-factor warning', async () => {
      const ctx = setup(KEYS_ONLY(MACBOOK))
      await openDelete(ctx, 'p1')
      await expectNoA11yViolations(ctx.el)
    })

    it('has no axe violations with the confirmation dialog open', async () => {
      const ctx = setup()
      await openDelete(ctx, 'p1')
      await submitDelete(ctx)
      await expectNoA11yViolations(ctx.el)
    })
  })
})
