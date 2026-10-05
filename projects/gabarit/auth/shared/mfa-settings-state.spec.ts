import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { MfaSettings } from '../../mfa-settings/mfa-settings'
import { PasskeySettings } from '../../passkey-settings/passkey-settings'
import { AUTH_PORT } from '../ports/auth.port'
import { MFA_PORT, type MfaStatus, type Passkey } from '../ports/mfa.port'
import { fakeAuthPort, fakeMfaPort, fakeQrRenderer } from '../testing/fake-ports'
import { CREATION_OPTIONS, fakeAttestation, stubPasskeyBrowser } from '../testing/webauthn-testing'
import { TOTP_QR_RENDERER } from '../../mfa-enrollment/totp-qr/totp-qr'
import { MfaSettingsState } from './mfa-settings-state'

const PASSKEY: Passkey = {
  id: 'p1',
  name: 'MacBook',
  createdAt: '2025-03-12T09:30:00Z',
  lastUsedAt: null,
}

describe('MfaSettingsState', () => {
  const state = () => TestBed.inject(MfaSettingsState)

  it('knows nothing before a first read', () => {
    expect(state().passkeyCount()).toBeNull()
    expect(state().totpEnabled()).toBeNull()
    expect(state().formOwner()).toBeNull()
    expect(state().appFlowActive()).toBe(false)
  })

  it('remembers whether the app is on, as read and as confirmed', () => {
    state().statusLoaded({ totpEnabled: false, backupCodesRemaining: 10, passkeys: [PASSKEY] })
    expect(state().totpEnabled()).toBe(false)
    expect(state().passkeyCount()).toBe(1)

    state().totpConfirmed()

    expect(state().totpEnabled()).toBe(true)
  })

  it('tracks which card owns the open form, and whether the app card is mid-flow', () => {
    state().claimForm('passkeys')
    state().setAppFlowActive(true)

    expect(state().formOwner()).toBe('passkeys')
    expect(state().appFlowActive()).toBe(true)
  })

  it('counts a passkey as gone, never below zero and never before the first read', () => {
    state().passkeyGone()
    expect(state().passkeyCount()).toBeNull()
    state().statusLoaded({ totpEnabled: true, backupCodesRemaining: 10, passkeys: [PASSKEY] })

    state().passkeyGone()
    state().passkeyGone()

    expect(state().passkeyCount()).toBe(0)
  })

  it('counts an added passkey, but only once a count is known', () => {
    state().passkeyAdded()
    expect(state().passkeyCount()).toBeNull()
    state().statusLoaded({ totpEnabled: true, backupCodesRemaining: 10, passkeys: [] })

    state().passkeyAdded()

    expect(state().passkeyCount()).toBe(1)
  })
})

// The two cards side by side, as an account's security page shows them: one state, two ports' worth
// of calls (one status read each), one open form at a time.
@Component({
  standalone: true,
  imports: [MfaSettings, PasskeySettings],
  template: `<gbt-passkey-settings /><gbt-mfa-settings />`,
})
class SecurityPage {}

describe('the two security cards together', () => {
  const ENABLED: MfaStatus = { totpEnabled: true, backupCodesRemaining: 8, passkeys: [] }
  let restoreBrowser: () => void

  beforeEach(() => {
    // jsdom has no WebAuthn: give the page a browser that has, and put the real one back.
    restoreBrowser = stubPasskeyBrowser({
      create: vi.fn(() => Promise.resolve(fakeAttestation())),
      get: vi.fn(),
    })
  })
  afterEach(() => restoreBrowser())

  async function setup(status: MfaStatus = ENABLED) {
    const mfa = fakeMfaPort()
    const auth = fakeAuthPort()
    TestBed.configureTestingModule({
      providers: [
        { provide: MFA_PORT, useValue: mfa },
        { provide: AUTH_PORT, useValue: auth },
        { provide: TOTP_QR_RENDERER, useValue: fakeQrRenderer },
      ],
    })
    const fixture = TestBed.createComponent(SecurityPage)
    fixture.detectChanges()
    const statuses = mfa.calls.match('status')
    for (const call of statuses) {
      call.flush(status)
    }
    auth.calls
      .expectOne('authConfig')
      .flush({ registrationEnabled: false, passkeysAvailable: true })
    const settle = async () => {
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
    }
    await settle()
    const el = fixture.nativeElement as HTMLElement
    const button = (label: string) =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
        (b) => b.textContent?.trim() === label,
      )
    /** Types into the field whose per-instance id is `<prefix>-<n>-<suffix>`. */
    const type = (prefix: string, suffix: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[id^="${prefix}-"][id$="-${suffix}"]`)!
      input.value = value
      input.dispatchEvent(new Event('input'))
    }
    return { fixture, el, mfa, auth, settle, button, type, statuses }
  }

  it('reads the status once per card', async () => {
    const { statuses } = await setup()

    expect(statuses).toHaveLength(2)
  })

  it('has one primary button at most when a form is opened in each card: the second closes the first', async () => {
    const { el, settle, button } = await setup()
    const primaries = () => el.querySelectorAll('button.gbt-button--primary').length

    button('Add a passkey')!.click()
    await settle()
    expect(primaries()).toBe(1)
    button('Regenerate backup codes')!.click()
    await settle()

    expect(primaries()).toBeLessThanOrEqual(1)
    expect(el.querySelector('gbt-passkey-settings form')).toBeNull()
    expect(el.querySelector('gbt-mfa-settings form')).toBeTruthy()

    button('Add a passkey')!.click()
    await settle()

    expect(el.querySelector('gbt-mfa-settings form')).toBeNull()
    expect(el.querySelector('gbt-passkey-settings form')).toBeTruthy()
  })

  it('makes the app optional as soon as the passkeys card adds a first key', async () => {
    const { el, mfa, settle, button, type } = await setup({
      totpEnabled: false,
      backupCodesRemaining: 0,
      passkeys: [],
    })
    // No factor at all: the app card asks for a new enrolment.
    expect(el.querySelector('gbt-mfa-settings')?.textContent).toContain('Set up now')

    button('Add a passkey')!.click()
    await settle()
    type('gbt-passkey-settings', 'password', 'secret')
    el.querySelector<HTMLFormElement>('gbt-passkey-settings form')!.dispatchEvent(
      new Event('submit'),
    )
    mfa.calls
      .expectOne('startPasskeyRegistration')
      .flush({ challengeId: 'c1', publicKey: CREATION_OPTIONS })
    await settle()
    mfa.calls.expectOne('finishPasskeyRegistration').flush({ ...PASSKEY, name: 'Passkey' })
    await settle()

    const appCard = el.querySelector('gbt-mfa-settings')!
    expect(appCard.textContent).toContain('No app configured')
    expect(appCard.textContent).toContain('Optional')
    expect(TestBed.inject(MfaSettingsState).passkeyCount()).toBe(1)
  })

  it('holds the passkeys card back while the app card shows its enrolment', async () => {
    const { el, mfa, settle, button, type } = await setup({
      totpEnabled: false,
      backupCodesRemaining: 10,
      passkeys: [PASSKEY],
    })

    button('Add an app')!.click()
    await settle()
    type('gbt-mfa-settings', 'password', 'secret')
    el.querySelector<HTMLFormElement>('gbt-mfa-settings form')!.dispatchEvent(new Event('submit'))
    mfa.calls
      .expectOne('enroll')
      .flush({ secret: 'ABC', otpauthUrl: 'otpauth://totp/x?secret=ABC' })
    await settle()

    expect(TestBed.inject(MfaSettingsState).appFlowActive()).toBe(true)
    expect(button('Add a passkey')!.disabled).toBe(true)
    expect(el.querySelector('gbt-passkey-settings')?.textContent).toContain(
      'Finish setting up the authenticator app first.',
    )
  })

  it('calls the only key the last factor only while no app is on', async () => {
    const withApp = await setup({ totpEnabled: true, backupCodesRemaining: 8, passkeys: [PASSKEY] })
    withApp.el.querySelector<HTMLButtonElement>('[data-opener="delete"] button')!.click()
    await withApp.settle()
    expect(withApp.el.querySelector('gbt-passkey-settings')?.textContent).not.toContain(
      'This is your last factor',
    )
  })

  it('calls the only key the last factor when the app is off', async () => {
    const withoutApp = await setup({
      totpEnabled: false,
      backupCodesRemaining: 8,
      passkeys: [PASSKEY],
    })
    withoutApp.el.querySelector<HTMLButtonElement>('[data-opener="delete"] button')!.click()
    await withoutApp.settle()
    expect(withoutApp.el.querySelector('gbt-passkey-settings')?.textContent).toContain(
      'This is your last factor',
    )
  })
})
