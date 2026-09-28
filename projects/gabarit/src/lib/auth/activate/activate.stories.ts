import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { NEVER } from 'rxjs'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { Button } from '../../components/atoms/button/button'
import type { ActivateLabels } from '../auth-labels'
import { AuthFooterLink } from '../auth-footer/auth-footer'
import { MIN_PASSWORD_LENGTH } from '../shared/account-rules'
import {
  PASSWORD,
  STORY_LOGO,
  atPhoneWidth,
  expectPanelLayout,
  later,
  portError,
  storyAuthPort,
  withAuthPort,
} from '../testing/auth-story-helpers'
import { AuthActivate } from './activate'

/** What the application's `activationToken` read from `/activate#token=…`. */
const TOKEN = 'ab12'.repeat(16)
const expectLayout = expectPanelLayout()

/** The page as an application mounts it: the token it read, its logo and its link to the sign-in page. */
const page = (linkText = 'Sign in') => `
  <gbt-auth-activate [token]="token" [labels]="labels" [minPasswordLength]="minPasswordLength">
    ${STORY_LOGO}
    <a gbtButton variant="link" gbtAuthFooterLink href="/login" (click)="$event.preventDefault()">${linkText}</a>
  </gbt-auth-activate>`

async function fillAndSubmit(canvasElement: HTMLElement, confirmation = PASSWORD) {
  const canvas = within(canvasElement)
  await userEvent.type(await canvas.findByLabelText('New password'), PASSWORD)
  await userEvent.type(canvas.getByLabelText('Confirm the password'), confirmation)
  await userEvent.click(canvas.getByRole('button', { name: 'Activate my account' }))
  return canvas
}

/**
 * Where an invitation mail's link lands, outside the app shell, in the sign-in panel: the invited
 * user chooses a password, then signs in (and is taken through the MFA enrolment). The application
 * reads the token from its URL (`activationToken`), scrubs it from the address bar and hands it to
 * `token`; the page never shows it.
 */
const meta: Meta<AuthActivate> = {
  title: 'Auth/AuthActivate',
  component: AuthActivate,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [Button, AuthFooterLink] })],
  args: { token: TOKEN, labels: {}, minPasswordLength: MIN_PASSWORD_LENGTH },
  render: (args) => ({ props: args, template: page() }),
}

export default meta
type Story = StoryObj<AuthActivate>

/** The empty form, the new-password field focused. */
export const Default: Story = {
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expect(canvas.getByText('At least 8 characters.')).toBeVisible()
    await expectLayout(context)
  },
}

/** The confirmation differs: nothing is sent, the message is under the confirmation and it has the focus. */
export const Mismatch: Story = {
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement, `${PASSWORD}z`)
    await expect(await canvas.findByText('The passwords do not match')).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Confirm the password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The password is set: the account is active, one primary "Sign in". */
export const Success: Story = {
  decorators: [withAuthPort(storyAuthPort())],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Your account is activated' }),
    ).toBeVisible()
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Your account is activated' })).toHaveFocus(),
    )
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expectLayout(context)
  },
}

/** No (or a malformed) token in the URL: the dead-link state, without any request. */
export const InvalidLink: Story = {
  args: { token: null },
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'This link does not work' }),
    ).toBeVisible()
    await expect(canvas.getByText(/This invitation link is invalid or has expired/)).toBeVisible()
    await expect(canvas.queryByLabelText('New password')).toBeNull()
    await expectLayout(context)
  },
}

/** The server says the token is unknown, expired or used: the form turns into the dead-link state. */
export const ExpiredLink: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        activate: () => later(() => portError(400, 'invalid or expired invitation')),
      }),
    ),
  ],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'This link does not work' }),
    ).toBeVisible()
    await expectLayout(context)
  },
}

/** The IP rate limiter answers 429: the form stays, with the shared "too many attempts" message. */
export const RateLimited: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        activate: () => later(() => portError(429, 'too many attempts, try again later')),
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

/** The request is in flight: the button shows its spinner and is disabled. */
export const Submitting: Story = {
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    await fillAndSubmit(context.canvasElement)
    await waitFor(() =>
      expect(context.canvasElement.querySelector('.gbt-auth-panel__submit button')).toBeDisabled(),
    )
    await expectLayout(context)
  },
}

/** The form in the dark theme. */
export const Dark: Story = {
  decorators: [darkTheme, withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The dead link in the dark theme: the error tone of the state. */
export const DarkInvalidLink: Story = {
  args: { token: null },
  decorators: [darkTheme, withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'This link does not work' }),
    ).toBeVisible()
    await expectLayout(context)
  },
}

/** At a phone's width (375 px): the panel keeps its gutter, the fields and the button span it. */
export const Phone: Story = {
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER })), atPhoneWidth],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The French strings of FerrisGit, through the `labels` input: an application localises the page. */
const FRENCH: Partial<ActivateLabels> = {
  heading: 'Activez votre compte',
  intro:
    'Choisissez le mot de passe de votre compte. La double authentification sera configurée à votre première connexion.',
  password: 'Nouveau mot de passe',
  passwordHint: (minLength) => `Au moins ${minLength} caractères.`,
  confirmation: 'Confirmez le mot de passe',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  submit: 'Activer mon compte',
  submitting: 'Activation en cours',
  signInPrompt: 'Votre compte est déjà actif ?',
  successHeading: 'Votre compte est activé',
  successMessage:
    'Vous pouvez maintenant vous connecter. Nous vous guiderons ensuite pour protéger votre compte avec la double authentification.',
  invalidHeading: 'Ce lien ne fonctionne pas',
  invalidMessage:
    "Ce lien d'invitation est invalide ou a expiré. Demandez à un administrateur de vous en envoyer un nouveau.",
  signIn: 'Se connecter',
  passwordEmpty: 'Saisissez un mot de passe',
  passwordTooShort: (minLength) => `Au moins ${minLength} caractères`,
  confirmationEmpty: 'Confirmez votre mot de passe',
  mismatch: 'Les mots de passe ne correspondent pas',
  weakPassword: (minLength) => `Le mot de passe doit comporter au moins ${minLength} caractères`,
  failed: "L'activation a échoué, réessayez.",
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
}

/** Localised in French through `labels` (the projected link is the application's own, in French too). */
export const Localised: Story = {
  args: { labels: FRENCH },
  decorators: [withAuthPort(storyAuthPort({ activate: () => NEVER }))],
  render: (args) => ({ props: args, template: page('Se connecter') }),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Activez votre compte' })).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Nouveau mot de passe')).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Activer mon compte' }))
    await expect(await canvas.findByText('Saisissez un mot de passe')).toBeVisible()
    await expect(canvas.getByText('Confirmez votre mot de passe')).toBeVisible()
    await expect(canvas.getByText('Votre compte est déjà actif ?')).toBeVisible()
    await expectLayout(context)
  },
}
