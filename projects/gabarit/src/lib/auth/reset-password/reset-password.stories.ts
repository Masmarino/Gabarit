import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { NEVER } from 'rxjs'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { Button } from '../../components/atoms/button/button'
import type { ResetPasswordLabels } from '../auth-labels'
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
import { AuthResetPassword } from './reset-password'

/** What the application's `activationToken` read from `/reset-password#token=…`. */
const TOKEN = 'ab12'.repeat(16)
const expectLayout = expectPanelLayout()

/** The page as an application mounts it: the token it read, its logo and its link to the sign-in page. */
const page = (linkText = 'Sign in') => `
  <gbt-auth-reset-password [token]="token" [labels]="labels" [minPasswordLength]="minPasswordLength">
    ${STORY_LOGO}
    <a gbtButton variant="link" gbtAuthFooterLink href="/login" (click)="$event.preventDefault()">${linkText}</a>
  </gbt-auth-reset-password>`

async function fillAndSubmit(canvasElement: HTMLElement, confirmation = PASSWORD) {
  const canvas = within(canvasElement)
  await userEvent.type(await canvas.findByLabelText('New password'), PASSWORD)
  await userEvent.type(canvas.getByLabelText('Confirm the new password'), confirmation)
  await userEvent.click(canvas.getByRole('button', { name: 'Set new password' }))
  return canvas
}

/**
 * Where the link of a password-reset mail lands, outside the app shell, in the sign-in panel: an
 * administrator reset the account's password, the user chooses a new one, then signs in (through their
 * usual second factor). The application reads the token from its URL (`activationToken`), scrubs it
 * from the address bar and hands it to `token`; the page never shows it.
 */
const meta: Meta<AuthResetPassword> = {
  title: 'Auth/AuthResetPassword',
  component: AuthResetPassword,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [Button, AuthFooterLink] })],
  args: { token: TOKEN, labels: {}, minPasswordLength: MIN_PASSWORD_LENGTH },
  render: (args) => ({ props: args, template: page() }),
}

export default meta
type Story = StoryObj<AuthResetPassword>

/** The empty form, the new-password field focused. */
export const Default: Story = {
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expect(canvas.getByText('At least 8 characters.')).toBeVisible()
    await expectLayout(context)
  },
}

/** The confirmation differs: nothing is sent, the message is under the confirmation and it has the focus. */
export const Mismatch: Story = {
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement, `${PASSWORD}z`)
    await expect(await canvas.findByText('The passwords do not match')).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Confirm the new password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The new password is set: one primary "Sign in". */
export const Success: Story = {
  decorators: [withAuthPort(storyAuthPort())],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Your password has been changed' }),
    ).toBeVisible()
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Your password has been changed' })).toHaveFocus(),
    )
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expectLayout(context)
  },
}

/** No (or a malformed) token in the URL: the dead-link state, without any request. */
export const InvalidLink: Story = {
  args: { token: null },
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'This link does not work' }),
    ).toBeVisible()
    await expect(
      canvas.getByText(/This password reset link is invalid or has expired/),
    ).toBeVisible()
    await expect(canvas.queryByLabelText('New password')).toBeNull()
    await expectLayout(context)
  },
}

/** The server says the token is unknown, expired or used: the form turns into the dead-link state. */
export const ExpiredLink: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        resetPassword: () => later(() => portError(400, 'invalid or expired password reset link')),
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

/** The server refuses the password as too weak: the form stays (the link is still good), the rule is named. */
export const WeakPassword: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        resetPassword: () => later(() => portError(400, 'password must be at least 8 characters')),
      }),
    ),
  ],
  play: async (context) => {
    const canvas = await fillAndSubmit(context.canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'The password must be at least 8 characters long',
    )
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The IP rate limiter answers 429: the form stays, with the shared "too many attempts" message. */
export const RateLimited: Story = {
  decorators: [
    withAuthPort(
      storyAuthPort({
        resetPassword: () => later(() => portError(429, 'too many attempts, try again later')),
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
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
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
  decorators: [darkTheme, withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The dead link in the dark theme: the error tone of the state. */
export const DarkInvalidLink: Story = {
  args: { token: null },
  decorators: [darkTheme, withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
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
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER })), atPhoneWidth],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await waitFor(() => expect(canvas.getByLabelText('New password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** French strings, through the `labels` input: an application localises the page. */
const FRENCH: Partial<ResetPasswordLabels> = {
  heading: 'Choisissez un nouveau mot de passe',
  intro:
    'Un administrateur a réinitialisé le mot de passe de votre compte. Choisissez-en un nouveau pour vous reconnecter.',
  password: 'Nouveau mot de passe',
  passwordHint: (minLength) => `Au moins ${minLength} caractères.`,
  confirmation: 'Confirmez le nouveau mot de passe',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  submit: 'Enregistrer le mot de passe',
  submitting: 'Enregistrement en cours',
  signInPrompt: 'Nouveau mot de passe déjà choisi ?',
  successHeading: 'Votre mot de passe a été modifié',
  successMessage: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
  invalidHeading: 'Ce lien ne fonctionne pas',
  invalidMessage:
    'Ce lien de réinitialisation est invalide ou a expiré. Demandez à un administrateur de vous en envoyer un nouveau.',
  signIn: 'Se connecter',
  passwordEmpty: 'Saisissez un nouveau mot de passe',
  passwordTooShort: (minLength) => `Au moins ${minLength} caractères`,
  confirmationEmpty: 'Confirmez votre nouveau mot de passe',
  mismatch: 'Les mots de passe ne correspondent pas',
  weakPassword: (minLength) => `Le mot de passe doit comporter au moins ${minLength} caractères`,
  failed: "Le nouveau mot de passe n'a pas pu être enregistré, réessayez.",
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
}

/** Localised in French through `labels` (the projected link is the application's own, in French too). */
export const Localised: Story = {
  args: { labels: FRENCH },
  decorators: [withAuthPort(storyAuthPort({ resetPassword: () => NEVER }))],
  render: (args) => ({ props: args, template: page('Se connecter') }),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Choisissez un nouveau mot de passe' }),
    ).toBeVisible()
    await waitFor(() => expect(canvas.getByLabelText('Nouveau mot de passe')).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Enregistrer le mot de passe' }))
    await expect(await canvas.findByText('Saisissez un nouveau mot de passe')).toBeVisible()
    await expect(canvas.getByText('Confirmez votre nouveau mot de passe')).toBeVisible()
    await expect(canvas.getByText('Nouveau mot de passe déjà choisi ?')).toBeVisible()
    await expectLayout(context)
  },
}
