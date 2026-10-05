import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { NEVER, type Observable, of, switchMap, throwError, timer } from 'rxjs'
import { expect, waitFor } from 'storybook/test'
import { AUTH_PORT, type AuthConfig, type AuthPort } from '../ports/auth.port'
import { MFA_PORT, type MfaPort, type MfaStatus, type Passkey } from '../ports/mfa.port'
import { MfaSettingsState } from '../shared/mfa-settings-state'
import { TOTP_QR_RENDERER, type TotpQrRenderer } from '../../mfa-enrollment/totp-qr/totp-qr'
import { CREATION_OPTIONS, REQUEST_OPTIONS } from './webauthn-testing'

export const later = <T>(answer: () => Observable<T>, ms = 350): Observable<T> =>
  timer(ms).pipe(switchMap(answer))

export const portError = (status: number, error?: string) =>
  throwError(() => ({ status, statusText: 'x', error: error === undefined ? null : { error } }))

export const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
export const OTPAUTH_URL = `otpauth://totp/Acme:florian.simon?secret=${SECRET}&issuer=Acme`
export const BACKUP_CODES = [
  '3f9a1c07b5d24e8a9c60d1b7e2f4a583',
  '8b2d5e91c47f3a06d9e1b5c8a2f70d34',
  'c40e7a15f9b3d862e1a4c7095bd3f2e6',
  '1d6f3b8a20c9e547f4b1d3a68e05c92b',
  'a7e19c4d5b0f2836e9d1a4c7b3f5082e',
  '5c8b2f6a1d9e4073b8a5c2e1f9d47a06',
  'e93a0d7c4b1f5862a9e3d0c7b5f14a28',
  '2b7f4e1a9c5d0836f1b4e7a2c9d508e3',
  'd05a8c3e7b1f4926a0d5c8e3b7f1a294',
  '6e1c9b4a2f7d0538c1e6b9a4f2d70c85',
]
export const PASSWORD = 'correct-password'
export const CODE = '123456'

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120" viewBox="0 0 480 120"><rect x="8" y="20" width="80" height="80" rx="18" fill="#0f766e"/><path d="M30 78 48 40l18 38" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><text x="108" y="80" font-family="system-ui, sans-serif" font-size="56" font-weight="700" fill="#0f766e">Acme</text></svg>`

export const STORY_LOGO = `<img auth-logo src="data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}" alt="Acme" width="480" height="120" />`

export const storyQrRenderer: TotpQrRenderer = (text) => {
  const size = 29
  let seed = 0
  for (const char of text) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  }
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0
    return seed >>> 16
  }
  const finder = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
  let modules = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inFinder(x, y) && next() % 2 === 0) {
        modules += `<rect x="${x}" y="${y}" width="1" height="1"/>`
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${size + 2} ${size + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="#fff"/><g fill="#000">${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}${modules}</g></svg>`
  return Promise.resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
}

const PASSKEY_CHALLENGE_ID = '7b1f7f2e-0000-4000-8000-000000000001'

export function storyAuthPort(
  overrides: Partial<AuthPort> = {},
  config: AuthConfig | 'loading' | 'failed' = {
    registrationEnabled: true,
    passkeysAvailable: false,
  },
): AuthPort {
  return {
    authConfig: () =>
      config === 'loading'
        ? NEVER
        : config === 'failed'
          ? portError(500, 'internal error')
          : of(config),
    login: () => later(() => of({ token: 'session' })),
    register: () => later(() => of({ token: null, mfaToken: 'pending', mfaSetupRequired: true })),
    activate: () => later(() => of(undefined)),
    resetPassword: () => later(() => of(undefined)),
    verifyMfa: (_token, proof) =>
      later(() =>
        'code' in proof && proof.code !== CODE ? portError(401, 'invalid code') : of(undefined),
      ),
    startPasskeyChallenge: () =>
      later(() => of({ challengeId: PASSKEY_CHALLENGE_ID, publicKey: REQUEST_OPTIONS })),
    finishPasskeyChallenge: () => later(() => of(undefined)),
    enrollTotp: () => later(() => of({ secret: SECRET, otpauthUrl: OTPAUTH_URL })),
    confirmTotp: (_token, code) =>
      later(() =>
        code === CODE
          ? of({ token: 'session', backupCodes: BACKUP_CODES })
          : portError(400, 'invalid code'),
      ),
    startPasskeySetup: () =>
      later(() => of({ challengeId: PASSKEY_CHALLENGE_ID, publicKey: CREATION_OPTIONS })),
    finishPasskeySetup: () => later(() => of({ token: 'session', backupCodes: BACKUP_CODES })),
    setToken: () => undefined,
    ...overrides,
  }
}

export const withAuthPort = (port: AuthPort) =>
  moduleMetadata({
    providers: [
      { provide: AUTH_PORT, useValue: port },
      { provide: TOTP_QR_RENDERER, useValue: storyQrRenderer },
    ],
  })

export type StoryMfaStatus = MfaStatus | 'loading' | 'failed'

export function storyMfaPort(status: StoryMfaStatus, overrides: Partial<MfaPort> = {}): MfaPort {
  const checkPassword = <T>(password: string, ok: () => T) =>
    later(() =>
      password === PASSWORD ? of(ok()) : portError(400, 'current password is incorrect'),
    )
  return {
    status: () =>
      status === 'loading' ? NEVER : status === 'failed' ? portError(500) : of(status),
    enroll: (password) =>
      checkPassword(password, () => ({ secret: SECRET, otpauthUrl: OTPAUTH_URL })),
    confirm: (code) =>
      later(() =>
        code === CODE ? of({ backupCodes: BACKUP_CODES }) : portError(400, 'invalid code'),
      ),
    regenerate: (password) => checkPassword(password, () => ({ backupCodes: BACKUP_CODES })),
    disable: (password) => checkPassword(password, () => undefined),
    startPasskeyRegistration: (password) =>
      checkPassword(password, () => ({ challengeId: 'challenge-1', publicKey: CREATION_OPTIONS })),
    finishPasskeyRegistration: (_challengeId, _credential, name) =>
      later(() =>
        of<Passkey>({
          id: `new-${name}`,
          name,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        }),
      ),
    deletePasskey: (_id, password) => checkPassword(password, () => undefined),
    ...overrides,
  }
}

export const withMfaPort = (
  status: StoryMfaStatus,
  options: {
    overrides?: Partial<MfaPort>
    appFlowActive?: boolean
    config?: AuthConfig | 'failed'
  } = {},
) =>
  moduleMetadata({
    providers: [
      { provide: MFA_PORT, useFactory: () => storyMfaPort(status, options.overrides) },
      {
        provide: MfaSettingsState,
        useFactory: () => {
          const state = new MfaSettingsState()
          state.setAppFlowActive(options.appFlowActive ?? false)
          return state
        },
      },
      {
        provide: AUTH_PORT,
        useFactory: () =>
          storyAuthPort(
            {},
            options.config ?? { registrationEnabled: false, passkeysAvailable: true },
          ),
      },
      { provide: TOTP_QR_RENDERER, useValue: storyQrRenderer },
    ],
  })

export const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
export const hoursAgo = (hours: number) => minutesAgo(hours * 60)
export const daysAgo = (days: number) => minutesAgo(days * 24 * 60)

const rect = (el: Element) => el.getBoundingClientRect()
const BLOCK = 'gbt-auth-panel'

export function assertPanelLayout(canvas: HTMLElement): void {
  const panel = canvas.querySelector(`.${BLOCK}__panel`)
  const img = canvas.querySelector<HTMLImageElement>(`.${BLOCK}__logo img`)
  if (!panel || (img && !img.complete)) throw new Error('page not rendered yet')
  const doc = canvas.ownerDocument.documentElement
  if (doc.clientWidth === 0) return
  if (doc.scrollWidth > doc.clientWidth + 1)
    throw new Error(`horizontal overflow: ${doc.scrollWidth}px of content in ${doc.clientWidth}px`)
  if (rect(panel).left < 15.5 || rect(panel).right > doc.clientWidth - 15.5)
    throw new Error('the panel has no 16px gutter')
  const inside = Array.from(
    canvas.querySelectorAll(
      `.${BLOCK}__logo img, .${BLOCK}__panel gbt-input input, .${BLOCK}__panel button, .${BLOCK}__panel a, .${BLOCK}__panel .gbt-alert, .${BLOCK}__panel gbt-skeleton`,
    ),
  )
  for (const part of inside) {
    if (rect(part).left < rect(panel).left - 0.5 || rect(part).right > rect(panel).right + 0.5)
      throw new Error(`content spills out of the panel: ${part.tagName} ${part.className}`)
  }
  for (const tap of Array.from(
    canvas.querySelectorAll(
      `.${BLOCK}__links .gbt-button, .${BLOCK}__submit button, .gbt-auth-footer a`,
    ),
  )) {
    if (rect(tap).height < 43.5)
      throw new Error(`tap target under 44px: ${tap.className} ${rect(tap).height}px`)
  }
  if (doc.clientWidth <= 480) {
    for (const input of Array.from(canvas.querySelectorAll(`.${BLOCK}__panel gbt-input input`))) {
      if (rect(input).height < 43.5) throw new Error(`field under 44px: ${rect(input).height}px`)
    }
  }
  const button = canvas.querySelector(`.${BLOCK}__form .${BLOCK}__submit button`)
  const field = canvas.querySelector(`.${BLOCK}__form .gbt-input`)
  if (button && field && Math.abs(rect(button).width - rect(field).width) > 1)
    throw new Error('the button should span the form')
}

export function expectPanelLayout() {
  return ({ canvasElement }: { canvasElement: HTMLElement }) =>
    waitFor(() => assertPanelLayout(canvasElement), { timeout: 3000 })
}

export const inSettingsColumn = componentWrapperDecorator(
  (story) =>
    `<div style="box-sizing: border-box; min-height: 100vh; padding: 1rem; background: var(--bg-panel);"><div style="max-width: 920px;">${story}</div></div>`,
)

export const atPhoneWidth = componentWrapperDecorator(
  (story) => `<div style="max-width: 375px; margin: 0 auto;">${story}</div>`,
)

export async function rendered<T extends Element = HTMLElement>(
  canvasElement: HTMLElement,
  selector: string,
): Promise<T> {
  return waitFor(() => {
    const element = canvasElement.querySelector<T>(selector)
    if (!element) {
      throw new Error(`${selector} not rendered yet`)
    }
    return element
  })
}

export async function expectSettingsLayout(canvasElement: HTMLElement): Promise<void> {
  const doc = canvasElement.ownerDocument.documentElement
  if (doc.clientWidth === 0) {
    return
  }
  await expect(doc.scrollWidth, 'page scroll width').toBeLessThanOrEqual(doc.clientWidth)
  const cards = Array.from(canvasElement.querySelectorAll<HTMLElement>('gbt-card'))
  let previousBottom = -Infinity
  for (const card of cards) {
    const box = card.getBoundingClientRect()
    const name = card.querySelector('h2')?.textContent?.trim()
    await expect(box.top, `"${name}" below the previous card`).toBeGreaterThanOrEqual(
      previousBottom,
    )
    const parentWidth = card.parentElement!.getBoundingClientRect().width
    await expect(Math.round(box.width), `"${name}" spans its column`).toBe(Math.round(parentWidth))
    const header = card.querySelector<HTMLElement>('.gbt-card__header')
    if (header) {
      await expect(getComputedStyle(header).backgroundColor, `"${name}" header, no band`).toBe(
        'rgba(0, 0, 0, 0)',
      )
      const cardBox = card.querySelector<HTMLElement>(':scope > .gbt-card')!.getBoundingClientRect()
      await expect(
        header.getBoundingClientRect().bottom,
        `"${name}" header above the card's box`,
      ).toBeLessThanOrEqual(cardBox.top + 0.5)
    }
    for (const child of Array.from(card.querySelectorAll<HTMLElement>('.gbt-card__body *'))) {
      const childBox = child.getBoundingClientRect()
      if (
        childBox.width === 0 ||
        getComputedStyle(child).position === 'fixed' ||
        child.closest('.sr-only')
      ) {
        continue
      }
      await expect(
        childBox.right,
        `${child.tagName.toLowerCase()}.${child.className} inside "${name}"`,
      ).toBeLessThanOrEqual(box.right + 0.5)
    }
    previousBottom = box.bottom
  }
  for (const icon of Array.from(canvasElement.querySelectorAll('gbt-icon'))) {
    if (icon.getBoundingClientRect().width > 0) {
      await expect(
        icon.querySelector('svg'),
        `icon in "${icon.parentElement?.textContent?.trim()}"`,
      ).not.toBeNull()
    }
  }
}
