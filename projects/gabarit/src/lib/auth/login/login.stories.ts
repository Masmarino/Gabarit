import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { NEVER, of } from 'rxjs'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { Button } from '../../components/atoms/button/button'
import type { LoginLabels } from '../auth-labels'
import { AuthFooterLink } from '../auth-footer/auth-footer'
import type { AuthConfig, AuthPort, LoginResponse } from '../ports/auth.port'
import {
  CODE,
  STORY_LOGO,
  atPhoneWidth,
  expectPanelLayout,
  later,
  portError,
  storyAuthPort,
  withAuthPort,
} from '../testing/auth-story-helpers'
import { dismissedPrompt, fakeAssertion, stubPasskeyBrowser } from '../testing/webauthn-testing'
import { AuthLogin } from './login'

const CHALLENGE: LoginResponse = {
  token: null,
  mfaToken: 'pending',
  mfaSetupRequired: false,
  mfaHasTotp: true,
  mfaHasPasskey: false,
}
const SETUP: LoginResponse = {
  token: null,
  mfaToken: 'pending',
  mfaSetupRequired: true,
  mfaHasTotp: false,
  mfaHasPasskey: false,
}
const PASSKEY: LoginResponse = {
  token: null,
  mfaToken: 'pending',
  mfaSetupRequired: false,
  mfaHasTotp: false,
  mfaHasPasskey: true,
}
const BOTH: LoginResponse = {
  token: null,
  mfaToken: 'pending',
  mfaSetupRequired: false,
  mfaHasTotp: true,
  mfaHasPasskey: true,
}

const CLOSED: AuthConfig = { registrationEnabled: false, passkeysAvailable: false }
/** The instance runs passkeys (the browser's prompt is faked by `passkeyBrowser`). */
const PASSKEY_SERVER: AuthConfig = { registrationEnabled: false, passkeysAvailable: true }

/** The sign-in backend of a story: the password step answers `login`, the rest as `overrides` say. */
const backend = (
  login: AuthPort['login'],
  overrides: Partial<AuthPort> = {},
  config: AuthConfig = CLOSED,
) => withAuthPort(storyAuthPort({ login, ...overrides }, config))
const answersWith = (response: LoginResponse) => () => later(() => of(response))

/**
 * The browser of the story, whatever the one running Storybook has: `get` answers what the story
 * needs, `null` is a browser without WebAuthn. Put back after the story.
 */
const passkeyBrowser = (get: (() => Promise<unknown>) | null) => () =>
  stubPasskeyBrowser(get ? { get, create: () => new Promise(() => undefined) } : null)
const answers = () => Promise.resolve(fakeAssertion())
const dismisses = () => Promise.reject(dismissedPrompt())

const rect = (el: Element) => el.getBoundingClientRect()

/** Every tap target of the panel at least 44px high, the "or" divider inside the panel. */
function assertChallengeTargets(canvas: HTMLElement): void {
  const panel = canvas.querySelector('.gbt-auth-panel__panel')
  if (!panel) throw new Error('page not rendered yet')
  if (canvas.ownerDocument.documentElement.clientWidth === 0) return // hidden docs frame
  for (const tap of Array.from(panel.querySelectorAll('a.gbt-button, button.gbt-button'))) {
    if (rect(tap).height < 43.5)
      throw new Error(`tap target under 44px: ${tap.className} ${rect(tap).height}px`)
  }
  for (const divider of Array.from(panel.querySelectorAll('gbt-divider'))) {
    if (rect(divider).left < rect(panel).left || rect(divider).right > rect(panel).right)
      throw new Error('the divider spills out of the panel')
  }
}

async function expectChallengeLayout(context: { canvasElement: HTMLElement }) {
  await expectPanelLayout()(context)
  await waitFor(() => assertChallengeTargets(context.canvasElement), { timeout: 3000 })
}

const signIn = async (canvasElement: HTMLElement) =>
  userEvent.click(await within(canvasElement).findByRole('button', { name: 'Sign in' }))

/** The French wording FerrisGit ships: proves an application can localise every string. */
const FRENCH: LoginLabels = {
  heading: 'Connexion',
  intro: 'Connectez-vous pour retrouver vos dépôts, tickets et demandes de fusion.',
  challengeHeading: 'Vérification en deux étapes',
  enrollmentHeading: 'Double authentification',
  username: "Nom d'utilisateur",
  password: 'Mot de passe',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  submit: 'Se connecter',
  submitting: 'Connexion en cours',
  registerPrompt: 'Pas encore de compte ?',
  wrongCredentials: "Nom d'utilisateur ou mot de passe incorrect",
  loginFailed: 'La connexion a échoué, réessayez.',
  introBackupCode:
    "Saisissez l'un de vos codes de secours. Chaque code ne fonctionne qu'une seule fois.",
  introPasskeyOrCode:
    "Utilisez votre clé d'accès, ou saisissez le code à 6 chiffres de votre application.",
  introPasskey:
    "Confirmez qu'il s'agit bien de vous avec votre clé d'accès : empreinte, visage, code de l'appareil ou clé de sécurité.",
  introCode: "Saisissez le code à 6 chiffres affiché par votre application d'authentification.",
  blockedByServer:
    "Les clés d'accès ne sont pas disponibles sur ce serveur. Utilisez un code de secours.",
  blockedByBrowser:
    "Ce navigateur ne prend pas en charge les clés d'accès. Utilisez un code de secours.",
  backToPasskeyOrApp: "Utiliser ma clé d'accès ou mon application",
  backToPasskey: "Utiliser ma clé d'accès",
  backToApp: 'Utiliser le code de mon application',
  useBackupCode: 'Utiliser un code de secours',
  back: 'Retour',
  backupCodeLabel: 'Code de secours',
  codeLabel: 'Code à 6 chiffres',
  verify: 'Vérifier',
  verifying: 'Vérification en cours',
  usePasskey: "Utiliser une clé d'accès",
  passkeyValidating: 'Validation en cours',
  or: 'ou',
  passkeyPrompt: 'Validez sur votre appareil pour vous connecter.',
  enterBackupCode: 'Saisissez un code de secours',
  enterCode: 'Saisissez le code à 6 chiffres de votre application',
  wrongCode: 'Code incorrect',
  verifyFailed: 'La vérification a échoué, réessayez.',
  cancelled: 'Opération annulée',
  browserUnsupported: "Ce navigateur ne prend pas en charge les clés d'accès.",
  passkeyRefused: "Clé d'accès refusée",
  passkeysUnavailable: "Les clés d'accès ne sont pas disponibles sur ce serveur.",
  loginExpired: 'Votre connexion a expiré, reconnectez-vous.',
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
}

/**
 * The application's page: its logo and its registration link (the application's own words, and its
 * `routerLink` in a real app) projected into the component.
 */
function page(linkText: string): NonNullable<Meta<AuthLogin>['render']> {
  return (args) => ({
    props: args,
    template: `<gbt-auth-login [labels]="labels">
      ${STORY_LOGO}
      <a gbtButton variant="link" gbtAuthFooterLink href="/register">${linkText}</a>
    </gbt-auth-login>`,
  })
}

/**
 * The sign-in page, outside the app shell: the application's logo, a heading, the two labelled
 * fields and the one "Sign in" button; then the second factor (the challenge, or the mandatory
 * first enrolment). A failed login shows an inline alert and puts the focus back in the password
 * field. Every call goes through `AUTH_PORT`; `loggedIn` tells the application to navigate.
 */
const meta: Meta<AuthLogin> = {
  title: 'Auth/AuthLogin',
  component: AuthLogin,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [Button, AuthFooterLink] })],
  args: { labels: {} },
  render: page('Create an account'),
}

export default meta
type Story = StoryObj<AuthLogin>

/** The empty form, the username field focused. Registration is closed: no footer. */
export const Default: Story = {
  decorators: [backend(() => NEVER)],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expect(context.canvasElement.querySelector('gbt-auth-footer')).toBeNull()
    await expectPanelLayout()(context)
  },
}

/** Registration is open on the instance: "No account yet? Create an account" under the form, a 44px tap target. */
export const WithRegistrationLink: Story = {
  decorators: [backend(() => NEVER, {}, { registrationEnabled: true, passkeysAvailable: false })],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    const link = await canvas.findByRole('link', { name: 'Create an account' })
    await expect(link.getAttribute('href')).toMatch(/\/register$/)
    await waitFor(() => {
      if (context.canvasElement.ownerDocument.documentElement.clientWidth === 0) return
      if (rect(link).height < 43.5) throw new Error(`tap target under 44px: ${rect(link).height}px`)
      const panel = context.canvasElement.querySelector('.gbt-auth-panel__panel')!
      if (rect(link).right > rect(panel).right || rect(link).left < rect(panel).left)
        throw new Error('the link spills out of the panel')
    })
    await expectPanelLayout()(context)
  },
}

/** The password is accepted: the panel now asks for the 6-digit code, the field focused. */
export const Challenge: Story = {
  decorators: [backend(answersWith(CHALLENGE))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Two-step verification' }),
    ).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('6-digit code')).toHaveFocus())
    await expectChallengeLayout(context)
  },
}

/** "Use a backup code": the field is swapped and focused. */
export const ChallengeBackupCode: Story = {
  decorators: [backend(answersWith(CHALLENGE))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Use a backup code' }))
    await waitFor(() => expect(canvas.getByLabelText('Backup code')).toHaveFocus())
    await expectChallengeLayout(context)
  },
}

/** A wrong code (401): "Incorrect code", the field emptied and refocused, the state kept. */
export const ChallengeError: Story = {
  decorators: [backend(answersWith(CHALLENGE))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.type(await canvas.findByLabelText('6-digit code'), '000000')
    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Incorrect code')
    await waitFor(() => expect(canvas.getByLabelText('6-digit code')).toHaveFocus())
    await expect(canvas.getByLabelText('6-digit code')).toHaveValue('')
    await expectChallengeLayout(context)
  },
}

/** The pending token expired: back to the credentials with "Your sign-in has expired, sign in again." */
export const ChallengeExpired: Story = {
  decorators: [
    backend(answersWith(CHALLENGE), {
      verifyMfa: () => later(() => portError(401, 'invalid or expired token')),
    }),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.type(await canvas.findByLabelText('6-digit code'), CODE)
    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Your sign-in has expired, sign in again.',
    )
    await waitFor(() => expect(canvas.getByLabelText('Password')).toHaveFocus())
    await expectPanelLayout()(context)
  },
}

/** The account has a passkey only: the primary is "Use a passkey", the backup code one link away. */
export const ChallengePasskey: Story = {
  decorators: [backend(answersWith(PASSKEY), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Two-step verification' }),
    ).toBeVisible()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Use a passkey' })).toHaveFocus())
    await expectChallengeLayout(context)
  },
}

/** Both factors: the passkey is the primary, the 6-digit code a secondary form under "or". */
export const ChallengeBoth: Story = {
  decorators: [backend(answersWith(BOTH), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await canvas.findByLabelText('6-digit code')
    await expect(canvas.getByRole('button', { name: 'Use a passkey' })).toHaveClass(
      'gbt-button--primary',
    )
    await expect(canvas.getByRole('button', { name: 'Verify' })).toHaveClass(
      'gbt-button--secondary',
    )
    await expectChallengeLayout(context)
  },
}

/** A passkey-only account on a browser without WebAuthn: the reason, and the backup-code form (never a dead end). */
export const ChallengePasskeyUnsupported: Story = {
  decorators: [backend(answersWith(PASSKEY), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(null),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(
      await canvas.findByText('This browser does not support passkeys. Use a backup code.'),
    ).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Backup code')).toHaveFocus())
    await expectChallengeLayout(context)
  },
}

/** The user dismissed the browser's prompt: a quiet "Operation cancelled", the screen kept, the button focused again. */
export const PasskeyCancelled: Story = {
  decorators: [backend(answersWith(PASSKEY), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(dismisses),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Use a passkey' }))
    await expect(await canvas.findByText('Operation cancelled')).toBeVisible()
    await expect(canvas.queryByRole('alert')).toBeNull()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Use a passkey' })).toHaveFocus())
    await expectChallengeLayout(context)
  },
}

/** The server refuses the assertion (401 "invalid code"): "Passkey refused", announced. */
export const PasskeyRefused: Story = {
  decorators: [
    backend(
      answersWith(PASSKEY),
      { finishPasskeyChallenge: () => later(() => portError(401, 'invalid code')) },
      PASSKEY_SERVER,
    ),
  ],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Use a passkey' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Passkey refused')
    await expectChallengeLayout(context)
  },
}

/** The browser's prompt is open: the passkey button shows its spinner, the way out stays open. */
export const PasskeyPrompt: Story = {
  decorators: [backend(answersWith(PASSKEY), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(() => new Promise(() => undefined)),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Use a passkey' }))
    await waitFor(() =>
      expect(
        context.canvasElement.querySelector('[id^="gbt-login-"][id$="-mfa-passkey"] button'),
      ).toHaveAttribute('aria-busy', 'true'),
    )
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Confirm on your device to sign in.',
    )
    await expect(canvas.getByRole('button', { name: 'Back' })).toBeEnabled()
    await expectChallengeLayout(context)
  },
}

/** The account has no second factor yet: the mandatory enrolment (wider panel). */
export const Enrollment: Story = {
  decorators: [backend(answersWith(SETUP))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Protect your account' })).toBeVisible()
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Two-factor authentication' }),
    ).toBeVisible()
    await expect(context.canvasElement.querySelector('.gbt-auth-panel__panel--wide')).not.toBeNull()
    await expectChallengeLayout(context)
  },
}

/** The login is rejected: the inline alert, the focus back in the password field. */
export const LoginFailure: Story = {
  decorators: [backend(() => later(() => portError(401, 'invalid username or password')))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Incorrect username or password',
    )
    await waitFor(() => expect(canvas.getByLabelText('Password')).toHaveFocus())
    await expectPanelLayout()(context)
  },
}

/** The server fails (5xx, network): not a wrong password, so it does not say so. */
export const LoginServerError: Story = {
  decorators: [backend(() => later(() => portError(500, 'internal error')))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Sign-in failed, try again.')
    await expectPanelLayout()(context)
  },
}

/** The IP rate limiter answers 429: the shared "too many attempts" message. */
export const LoginRateLimited: Story = {
  decorators: [backend(() => later(() => portError(429, 'too many attempts, try again later')))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many attempts, try again in a few minutes',
    )
    await expectPanelLayout()(context)
  },
}

/** The login is in flight: the button shows its spinner and is disabled. */
export const Submitting: Story = {
  decorators: [backend(() => NEVER)],
  play: async (context) => {
    await signIn(context.canvasElement)
    await waitFor(() =>
      expect(context.canvasElement.querySelector('.gbt-auth-panel__submit button')).toBeDisabled(),
    )
    await expectPanelLayout()(context)
  },
}

/** A phone (375px): the credentials with the registration link and a failed login. */
export const Phone: Story = {
  decorators: [
    atPhoneWidth,
    backend(
      () => later(() => portError(401, 'invalid username or password')),
      {},
      { registrationEnabled: true, passkeysAvailable: false },
    ),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByRole('link', { name: 'Create an account' })
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Incorrect username or password',
    )
    await expectPanelLayout()(context)
  },
}

/** A phone (375px): the challenge offering both factors. */
export const PhoneChallenge: Story = {
  decorators: [atPhoneWidth, backend(answersWith(BOTH), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await canvas.findByLabelText('6-digit code')
    await expectChallengeLayout(context)
  },
}

/** The dark theme: the credentials with the registration link and a failed login. */
export const Dark: Story = {
  decorators: [
    darkTheme,
    backend(
      () => later(() => portError(401, 'invalid username or password')),
      {},
      { registrationEnabled: true, passkeysAvailable: false },
    ),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Incorrect username or password',
    )
    await expectPanelLayout()(context)
  },
}

/** The dark theme: the challenge offering both factors. */
export const DarkChallenge: Story = {
  decorators: [darkTheme, backend(answersWith(BOTH), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await signIn(context.canvasElement)
    await canvas.findByLabelText('6-digit code')
    await expectChallengeLayout(context)
  },
}

/**
 * Localised through the `labels` input (FerrisGit's French wording): every string of the page is
 * the application's, the projected link included. Here the login fails, then the page is read back.
 */
export const Localised: Story = {
  args: { labels: FRENCH },
  render: page('Créer un compte'),
  decorators: [
    backend(
      () => later(() => portError(401, 'invalid username or password')),
      {},
      { registrationEnabled: true, passkeysAvailable: false },
    ),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Connexion' })).toBeVisible()
    await expect(canvas.getByLabelText("Nom d'utilisateur")).toBeVisible()
    await expect(canvas.getByLabelText('Mot de passe')).toBeVisible()
    await expect(await canvas.findByRole('link', { name: 'Créer un compte' })).toBeVisible()
    await expect(canvas.getByText('Pas encore de compte ?')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Se connecter' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      "Nom d'utilisateur ou mot de passe incorrect",
    )
    await expectPanelLayout()(context)
  },
}

/** Localised: the challenge of a user with both factors, in French. */
export const LocalisedChallenge: Story = {
  args: { labels: FRENCH },
  render: page('Créer un compte'),
  decorators: [backend(answersWith(BOTH), {}, PASSKEY_SERVER)],
  beforeEach: passkeyBrowser(answers),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Se connecter' }))
    await expect(
      await canvas.findByRole('heading', { name: 'Vérification en deux étapes' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: "Utiliser une clé d'accès" })).toBeVisible()
    await expect(canvas.getByLabelText('Code à 6 chiffres')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Vérifier' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Utiliser un code de secours' })).toBeVisible()
    await expectChallengeLayout(context)
  },
}
