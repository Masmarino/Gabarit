import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { NEVER } from 'rxjs'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../.storybook/preview'
import { Button } from '../button/button'
import type { RegisterLabels } from '../auth/auth-labels'
import { AuthFooterLink } from '../auth/auth-footer/auth-footer'
import { MIN_PASSWORD_LENGTH } from '../auth/shared/account-rules'
import {
  PASSWORD,
  STORY_LOGO,
  atPhoneWidth,
  expectPanelLayout,
  later,
  portError,
  storyAuthPort,
  withAuthPort,
} from '../auth/testing/auth-story-helpers'
import { stubPasskeyBrowser } from '../auth/testing/webauthn-testing'
import { AuthRegister } from './register'

const expectLayout = expectPanelLayout()

/** The page as an application mounts it: its logo and its link to the sign-in page projected. */
const page = (linkText = 'Sign in') => `
  <gbt-auth-register [labels]="labels" [minPasswordLength]="minPasswordLength">
    ${STORY_LOGO}
    <a gbtButton variant="link" gbtAuthFooterLink href="/login" (click)="$event.preventDefault()">${linkText}</a>
  </gbt-auth-register>`

/** Types a valid account (the fake server does not look at it) and presses "Create my account". */
async function fillAndSubmit(canvasElement: HTMLElement, username = 'alice') {
  const canvas = within(canvasElement)
  await userEvent.type(await canvas.findByLabelText('Username'), username)
  await userEvent.type(canvas.getByLabelText('Email address'), 'alice@example.com')
  await userEvent.type(canvas.getByLabelText('Password'), PASSWORD)
  await userEvent.click(canvas.getByRole('button', { name: 'Create my account' }))
  return canvas
}

/**
 * The registration page, outside the app shell, in the sign-in panel: it waits for the instance to
 * say whether registration is open, then shows the form (or the closed state). A created account goes
 * on to the mandatory MFA enrolment, right in the panel. The application projects its logo
 * (`[auth-logo]`) and its link to the sign-in page (`[gbtAuthFooterLink]`), and provides `AUTH_PORT`.
 */
const meta: Meta<AuthRegister> = {
  title: 'Auth/AuthRegister',
  component: AuthRegister,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [Button, AuthFooterLink] })],
  args: { labels: {}, minPasswordLength: MIN_PASSWORD_LENGTH },
  render: (args) => ({ props: args, template: page() }),
}

export default meta
type Story = StoryObj<AuthRegister>

/** The empty form, the username field focused, the rules under the fields. */
export const Default: Story = {
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expect(
      canvas.getByText('3 to 32 characters: letters, digits, - and _. Saved in lower case.'),
    ).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toMatch(
      /\/login$/,
    )
    await expectLayout(context)
  },
}

/** The instance has not answered yet: the shape of the form as a skeleton, no flash of the form. */
export const Loading: Story = {
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER }, 'loading'))],
  play: async (context) => {
    // The status is announced: it sits next to the aria-busy skeleton, never inside it.
    const status = within(context.canvasElement).getByRole('status')
    await expect(status).toHaveTextContent('Loading')
    await expect(status.closest('[aria-busy="true"]')).toBeNull()
    await expect(context.canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull()
    await expect(context.canvasElement.querySelector('form')).toBeNull()
    await expectLayout(context)
  },
}

/** "Create my account" on a wrong form: every wrong field says what the rule is, the first one has the focus. */
export const FieldErrors: Story = {
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await canvas.findByLabelText('Username'), '1a')
    await userEvent.type(canvas.getByLabelText('Email address'), 'nope')
    await userEvent.type(canvas.getByLabelText('Password'), 'short')
    await userEvent.click(canvas.getByRole('button', { name: 'Create my account' }))
    await expect(
      await canvas.findByText('Start with a letter; 3 to 32 characters: letters, digits, - and _'),
    ).toBeVisible()
    await expect(
      canvas.getByText('Enter a valid email address, for example name@example.com'),
    ).toBeVisible()
    await expect(canvas.getByText('At least 8 characters')).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The server refuses: the name or address is already used (409), announced as an alert, the focus on the field. */
export const Errors: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({ register: () => later(() => portError(409, 'username already taken')) }),
    ),
  ],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'This username or email address is already in use',
    )
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The IP rate limiter answers 429: the shared "too many attempts" message. */
export const RateLimited: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        register: () => later(() => portError(429, 'too many attempts, try again later')),
      }),
    ),
  ],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many attempts, try again in a few minutes',
    )
    await expectLayout(context)
  },
}

/** The server fails (5xx): a generic message, what was typed is kept. */
export const ServerError: Story = {
  decorators: [
    withAuthPort(storyAuthPort({ register: () => later(() => portError(500, 'internal error')) })),
  ],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'The account could not be created, try again.',
    )
    await expect(canvas.getByLabelText('Username')).toHaveValue('alice')
    await expectLayout(context)
  },
}

/** The request is in flight: the button shows its spinner and is disabled. */
export const Submitting: Story = {
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER }))],
  play: async (context) => {
    await fillAndSubmit(context.canvasElement)
    await waitFor(() =>
      expect(context.canvasElement.querySelector('.gbt-auth-panel__submit button')).toBeDisabled(),
    )
    await expectLayout(context)
  },
}

/** The administrator closed the sign-ups: an explanation instead of the form, the way back to the sign-in. */
export const Disabled: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort(
        { register: () => NEVER },
        { registrationEnabled: false, passkeysAvailable: false },
      ),
    ),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Registration is closed' }),
    ).toBeVisible()
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Registration is closed' })).toHaveFocus(),
    )
    await expect(canvas.queryByLabelText('Username')).toBeNull()
    await expectLayout(context)
  },
}

/** The account is created: the panel widens for the mandatory MFA enrolment. */
export const Enrollment: Story = {
  decorators: [withAuthPort(storyAuthPort())],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Protect your account' })).toBeVisible()
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Two-factor authentication' }),
    ).toBeVisible()
    await expectLayout(context)
  },
}

/** The browser of the story supports WebAuthn whatever the one running Storybook is; put back after the story. */
const passkeyBrowser = () =>
  stubPasskeyBrowser({
    create: () => new Promise(() => undefined),
    get: () => new Promise(() => undefined),
  })

/** The instance runs passkeys (and the browser can): a new account is offered a passkey next to the authenticator, the passkey advised. */
export const EnrollmentWithPasskeys: Story = {
  decorators: [
    withAuthPort(storyAuthPort({}, { registrationEnabled: true, passkeysAvailable: true })),
  ],
  beforeEach: passkeyBrowser,
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Use a passkey' })).toHaveClass(
      'gbt-button--primary',
    )
    await expect(canvas.getByRole('button', { name: 'Use an app' })).toBeVisible()
    await expectLayout(context)
  },
}

/** The browser can, but the instance cannot run passkeys (`passkeysAvailable: false`): the authenticator introduction. */
export const EnrollmentWithoutPasskeys: Story = {
  decorators: [
    withAuthPort(storyAuthPort({}, { registrationEnabled: true, passkeysAvailable: false })),
  ],
  beforeEach: passkeyBrowser,
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Get started' })).toHaveClass(
      'gbt-button--primary',
    )
    await expect(canvas.queryByRole('button', { name: 'Use a passkey' })).toBeNull()
    await expectLayout(context)
  },
}

/** "Back" on the enrolment (or its expiry): the account exists, the page says so, names it (lower-cased, as stored) and offers the sign-in. */
export const Created: Story = {
  decorators: [withAuthPort(storyAuthPort())],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement, 'Alice')
    await userEvent.click(await canvas.findByRole('button', { name: 'Back' }))
    await expect(
      await canvas.findByRole('heading', { name: 'Your account has been created' }),
    ).toBeVisible()
    await expect(
      context.canvasElement.querySelector('.gbt-auth-register__created-name'),
    ).toHaveTextContent('Your username: alice')
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Your account has been created' })).toHaveFocus(),
    )
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expectLayout(context)
  },
}

/** The form in the dark theme. */
export const Dark: Story = {
  decorators: [darkTheme, withAuthPort(storyAuthPort({ register: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expectLayout(context)
  },
}

/** At a phone's width (375 px): the panel keeps its gutter, the fields and the button span it. */
export const Phone: Story = {
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER })), atPhoneWidth],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('Username')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The French strings of FerrisGit, through the `labels` input: an application localises the page. */
const FRENCH: Partial<RegisterLabels> = {
  heading: 'Créer un compte',
  intro: 'Rejoignez FerrisGit pour héberger vos dépôts, tickets et demandes de fusion.',
  enrollmentHeading: 'Double authentification',
  loading: 'Chargement en cours',
  closedHeading: 'Les inscriptions sont fermées',
  closedMessage:
    "Cette instance n'accepte pas les inscriptions libres. Demandez une invitation à un administrateur : vous recevrez un lien par e-mail pour activer votre compte.",
  signIn: 'Se connecter',
  createdHeading: 'Votre compte est créé',
  createdMessage:
    'Connectez-vous avec votre mot de passe pour terminer la configuration de la double authentification, obligatoire avant de commencer.',
  enrollmentExpired: 'La configuration a expiré. ',
  createdName: "Votre nom d'utilisateur :",
  username: "Nom d'utilisateur",
  usernameHint: '3 à 32 caractères, lettres, chiffres, - et _. Enregistré en minuscules.',
  email: 'Adresse e-mail',
  password: 'Mot de passe',
  passwordHint: (minLength) => `Au moins ${minLength} caractères.`,
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  submit: 'Créer mon compte',
  submitting: 'Création du compte en cours',
  signInPrompt: 'Vous avez déjà un compte ?',
  usernameEmpty: "Saisissez un nom d'utilisateur",
  usernameInvalid: 'Commencez par une lettre ; 3 à 32 caractères : lettres, chiffres, - et _',
  emailEmpty: 'Saisissez votre adresse e-mail',
  emailInvalid: 'Saisissez une adresse e-mail valide, par exemple nom@exemple.fr',
  passwordEmpty: 'Saisissez un mot de passe',
  passwordTooShort: (minLength) => `Au moins ${minLength} caractères`,
  invalid: 'Vérifiez les champs',
  reserved: "Ce nom d'utilisateur n'est pas disponible",
  taken: "Ce nom d'utilisateur ou cette adresse e-mail est déjà utilisé",
  failed: 'La création du compte a échoué, réessayez.',
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
}

/** Localised in French through `labels` (the projected link is the application's own, in French too). */
export const Localised: Story = {
  args: { labels: FRENCH },
  decorators: [withAuthPort(storyAuthPort({ register: () => NEVER }))],
  render: (args) => ({ props: args, template: page('Se connecter') }),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Créer un compte' })).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText("Nom d'utilisateur")).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Créer mon compte' }))
    await expect(await canvas.findByText("Saisissez un nom d'utilisateur")).toBeVisible()
    await expect(canvas.getByText('Vous avez déjà un compte ?')).toBeVisible()
    await expectLayout(context)
  },
}
