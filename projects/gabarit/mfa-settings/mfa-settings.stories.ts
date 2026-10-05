import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../.storybook/preview'
import { type MfaSettingsLabels, provideAuthLabels } from '../auth/auth-labels'
import type { MfaStatus } from '../auth/ports/mfa.port'
import {
  CODE,
  PASSWORD,
  atPhoneWidth,
  daysAgo,
  expectSettingsLayout,
  inSettingsColumn,
  rendered,
  withMfaPort,
} from '../auth/testing/auth-story-helpers'
import { MfaSettings } from './mfa-settings'

const ENABLED: MfaStatus = { totpEnabled: true, backupCodesRemaining: 8, passkeys: [] }
const DISABLED: MfaStatus = { totpEnabled: false, backupCodesRemaining: 0, passkeys: [] }
/** A passkey is the factor; no app. */
const PASSKEY_ONLY: MfaStatus = {
  totpEnabled: false,
  backupCodesRemaining: 10,
  passkeys: [{ id: 'p1', name: 'MacBook Touch ID', createdAt: daysAgo(40), lastUsedAt: null }],
}
/** The app AND a passkey. */
const APP_AND_PASSKEY: MfaStatus = {
  totpEnabled: true,
  backupCodesRemaining: 8,
  passkeys: PASSKEY_ONLY.passkeys,
}

/** Every string of the card in French (FerrisGit's wording): what an application passes to localise it. */
const FRENCH: MfaSettingsLabels = {
  heading: "Application d'authentification",
  enrollingHeading: "Configurer l'application d'authentification",
  codesHeading: 'Codes de secours',
  help: 'Google Authenticator, Authy, 1Password… : toute application TOTP convient.',
  codesHelp: "Conservez-les : ils ne s'affichent qu'une seule fois.",
  loading: 'Chargement de la double authentification…',
  loadFailed: "La double authentification n'a pas pu être chargée.",
  retry: 'Réessayer',
  enrollLead: 'Confirmez votre mot de passe pour commencer la configuration.',
  enrollSubmit: 'Continuer',
  enrollBusy: 'Préparation en cours',
  enrollFailed: "La configuration n'a pas pu démarrer, réessayez.",
  regenerateLead:
    'Confirmez votre mot de passe pour générer 10 nouveaux codes. Les anciens cesseront de fonctionner dès maintenant.',
  regenerateSubmit: 'Régénérer',
  regenerateBusy: 'Régénération en cours',
  regenerateFailed: "Les codes de secours n'ont pas pu être régénérés, réessayez.",
  disableSubmit: 'Continuer',
  disableCheckBusy: 'Vérification en cours',
  disableFailed: "La double authentification n'a pas pu être réinitialisée, réessayez.",
  removeTitle: "Supprimer l'application d'authentification",
  removeHelp:
    "Supprime votre application actuelle. Vous serez déconnecté de tous vos appareils et vous vous reconnecterez avec votre clé d'accès.",
  removeAction: 'Supprimer',
  removeDialogHeading: "Supprimer l'application d'authentification ?",
  removeDialogMessage:
    "Vous serez déconnecté de tous vos appareils. Vous vous reconnecterez avec votre clé d'accès, sans application.",
  removePromptLead:
    "Confirmez votre mot de passe pour supprimer votre application d'authentification.",
  removeBusy: 'Suppression en cours',
  resetTitle: 'Réinitialiser la double authentification',
  resetHelp:
    'Retire votre application actuelle. Vous serez déconnecté de tous vos appareils et devrez en configurer une nouvelle à votre prochaine connexion.',
  resetAction: 'Réinitialiser',
  resetDialogHeading: 'Réinitialiser la double authentification ?',
  resetDialogMessage:
    "Vous serez déconnecté et devrez configurer une nouvelle application d'authentification à votre prochaine connexion.",
  resetPromptLead: 'Confirmez votre mot de passe pour réinitialiser la double authentification.',
  resetBusy: 'Réinitialisation en cours',
  codesLeft: (count) =>
    count === 0
      ? 'Aucun code de secours restant'
      : count === 1
        ? '1 code de secours restant'
        : `${count} codes de secours restants`,
  lowCodes: "Régénérez-en pour ne pas perdre l'accès à votre compte.",
  scanLead:
    "Scannez ce QR code avec votre application d'authentification, puis saisissez le code à 6 chiffres qu'elle affiche.",
  codeLabel: 'Code à 6 chiffres',
  activate: 'Activer',
  verifying: 'Vérification en cours',
  cancel: 'Annuler',
  close: 'Fermer',
  codesLeadEnrolled:
    "La double authentification est activée. Ces codes ne s'afficheront plus : ils vous permettent de vous connecter si vous perdez l'accès à votre application, et chacun ne fonctionne qu'une seule fois.",
  codesLeadRegenerated:
    "Voici vos nouveaux codes de secours. Les anciens codes ne fonctionnent plus. Ces codes ne s'afficheront plus, et chacun ne fonctionne qu'une seule fois.",
  dontLeave: 'Ne quittez pas cette page avant de les avoir enregistrés.',
  done: 'Terminé',
  appConfigured: 'Application configurée',
  enabled: 'Activée',
  appHelpWithPasskey:
    "Un code à 6 chiffres, généré par votre application, peut remplacer votre clé d'accès après votre mot de passe.",
  appHelp:
    'Un code à 6 chiffres, généré par votre application, est demandé après votre mot de passe.',
  noApp: 'Aucune application configurée',
  optional: 'Facultative',
  noAppHelp:
    "Votre clé d'accès suffit pour vous connecter. Ajoutez une application pour disposer d'un second moyen : elle génère un code à 6 chiffres.",
  addApp: 'Ajouter une application',
  backupCodesTitle: 'Codes de secours',
  backupCodesHelp:
    "Chaque code ne fonctionne qu'une fois. En générer de nouveaux invalide les précédents.",
  regenerateCodes: 'Régénérer les codes de secours',
  noFactorWarning:
    'La double authentification est obligatoire : vous devrez la configurer à votre prochaine connexion.',
  setUpNow: 'Configurer maintenant',
  currentPassword: 'Mot de passe actuel',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  enterPassword: 'Saisissez votre mot de passe',
  wrongPassword: 'Mot de passe incorrect',
  enterCode: 'Saisissez le code à 6 chiffres de votre application',
  wrongCode: 'Code incorrect',
  activationFailed: "L'activation a échoué, réessayez.",
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
  signedOut: 'Vous avez été déconnecté. Reconnectez-vous pour continuer.',
}

const rect = (el: Element) => el.getBoundingClientRect()

/**
 * Layout guards the jsdom specs cannot make: the card well formed (no overflow), at most one primary
 * button, and on a phone every button of the section (the small ones of the backup codes carry their own
 * 44px hit area) at least 44px high.
 */
async function expectMfaLayout(canvasElement: HTMLElement) {
  await rendered(canvasElement, 'gbt-card')
  await expectSettingsLayout(canvasElement)
  await expect(
    canvasElement.querySelectorAll('.gbt-button--primary').length,
    'primary buttons',
  ).toBeLessThanOrEqual(1)
  const doc = canvasElement.ownerDocument.documentElement
  if (doc.clientWidth === 0) {
    return // hidden docs frame
  }
  if (doc.clientWidth <= 480) {
    for (const button of Array.from(
      canvasElement.querySelectorAll<HTMLElement>('button.gbt-button'),
    )) {
      // (The confirmation dialog is the shared gbt-confirm-danger-modal, not this section's.)
      if (
        button.closest('gbt-backup-codes, gbt-totp-qr, gbt-confirm-danger-modal') ||
        rect(button).width === 0
      )
        continue
      await expect(
        rect(button).height,
        `"${button.textContent?.trim()}" is a 44px target`,
      ).toBeGreaterThanOrEqual(43.5)
    }
  }
}
const expectLayout = ({ canvasElement }: { canvasElement: HTMLElement }) =>
  expectMfaLayout(canvasElement)

// ---- Driving the real component ------------------------------------------------------------------------

type Canvas = ReturnType<typeof within>

const buttonNamed = (canvas: Canvas, name: string) => canvas.findByRole('button', { name })

async function openPrompt(canvas: Canvas, opener: string, label = 'Current password') {
  await userEvent.click(await buttonNamed(canvas, opener))
  return canvas.findByLabelText(label)
}

async function toScan(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  await userEvent.type(await openPrompt(canvas, 'Set up now'), PASSWORD)
  await userEvent.click(await buttonNamed(canvas, 'Continue'))
  // The QR is drawn by the application's renderer (a stand-in here).
  await waitFor(() => expect(canvasElement.querySelector('.gbt-totp-qr__frame img')).toBeTruthy(), {
    timeout: 5000,
  })
  return canvas
}

async function toCodes(canvasElement: HTMLElement) {
  const canvas = await toScan(canvasElement)
  await userEvent.type(await canvas.findByLabelText('6-digit code'), CODE)
  await userEvent.click(await buttonNamed(canvas, 'Activate'))
  await canvas.findByRole('button', { name: 'Copy codes' })
  return canvas
}

/**
 * Account → Security: the authenticator app (TOTP) and its backup codes, next to the passkeys card.
 * Every story is driven through the real component with a fake `MFA_PORT` (password
 * `correct-password`, code `123456`).
 */
const meta: Meta<MfaSettings> = {
  title: 'Auth/MfaSettings',
  component: MfaSettings,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [withMfaPort(ENABLED), inSettingsColumn],
}

export default meta
type Story = StoryObj<MfaSettings>

/** The status is being fetched: the rows' shapes. */
export const Loading: Story = {
  decorators: [withMfaPort('loading')],
  play: expectLayout,
}

/** The status could not be fetched: the sentence and "Retry". */
export const Failed: Story = {
  decorators: [withMfaPort('failed')],
  play: async (context) => {
    await within(context.canvasElement).findByRole('button', { name: 'Retry' })
    await expectLayout(context)
  },
}

/** The factor is on: the "On" badge, 8 codes left, "Regenerate backup codes" and "Reset". */
export const Enabled: Story = {
  play: async (context) => {
    await within(context.canvasElement).findByText('On')
    await expectLayout(context)
  },
}

/** 3 codes or fewer (`lowCodesThreshold`): the count turns to a warning (icon and words). */
export const FewCodesLeft: Story = {
  decorators: [withMfaPort({ ...ENABLED, backupCodesRemaining: 2 })],
  play: async (context) => {
    await within(context.canvasElement).findByText(/Regenerate some/)
    await expectLayout(context)
  },
}

export const NoCodesLeft: Story = {
  decorators: [withMfaPort({ ...ENABLED, backupCodesRemaining: 0 })],
  play: async (context) => {
    await within(context.canvasElement).findByText(/No backup codes left/)
    await expectLayout(context)
  },
}

/** "Regenerate backup codes" opens the password prompt in place, focused. */
export const RegeneratePrompt: Story = {
  play: async (context) => {
    const field = await openPrompt(within(context.canvasElement), 'Regenerate backup codes')
    await waitFor(() => expect(field).toHaveFocus())
    await expectLayout(context)
  },
}

/** A wrong password (400): "Incorrect password" under the field, the form stays. */
export const RegenerateWrongPassword: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Regenerate backup codes'), 'not-the-one')
    await userEvent.click(await buttonNamed(canvas, 'Regenerate'))
    await canvas.findByText('Incorrect password')
    await waitFor(() => expect(canvas.getByLabelText('Current password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The ten new codes, shown once, with copy/download and the acknowledgement that unlocks "Done". */
export const RegeneratedCodes: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Regenerate backup codes'), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Regenerate'))
    await canvas.findByRole('button', { name: 'Copy codes' })
    await expect(canvas.getByRole('button', { name: 'Done' })).toBeDisabled()
    await expectLayout(context)
  },
}

export const RegeneratedCodesAcknowledged: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Regenerate backup codes'), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Regenerate'))
    await userEvent.click(await canvas.findByLabelText('I have saved my backup codes'))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Done' })).toBeEnabled())
    await expectLayout(context)
  },
}

/** "Reset": the password prompt with a quiet "Continue" (the red confirmation is the dialog's). */
export const DisablePrompt: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Reset'), PASSWORD)
    await expectLayout(context)
  },
}

/** The confirmation before anything is sent. */
export const DisableConfirmation: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Reset'), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Continue'))
    const dialog = await within(context.canvasElement.ownerDocument.body).findByRole('dialog')
    await expect(dialog).toHaveTextContent('Reset two-factor authentication?')
    await expectLayout(context)
  },
}

/** A wrong password at the confirmation: back to the form, "Incorrect password". */
export const DisableWrongPassword: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Reset'), 'not-the-one')
    await userEvent.click(await buttonNamed(canvas, 'Continue'))
    const body = within(context.canvasElement.ownerDocument.body)
    await userEvent.click(
      await within(await body.findByRole('dialog')).findByRole('button', { name: 'Reset' }),
    )
    await canvas.findByText('Incorrect password')
    await expectLayout(context)
  },
}

/**
 * Confirmed with the right password: the server revoked the session with the factor, and the card
 * emits `sessionRevoked` (here the story shows a line; an application signs out and leaves). The card
 * itself turns inert meanwhile: "You have been signed out", nothing left to press.
 */
export const DisableRevokesSession: Story = {
  render: (args) => ({
    props: { ...args, revoked: false },
    template: `<gbt-mfa-settings [labels]="labels" [lowCodesThreshold]="lowCodesThreshold" (sessionRevoked)="revoked = true" />
      @if (revoked) { <p role="status">sessionRevoked: the application signs out.</p> }`,
  }),
  args: { labels: {}, lowCodesThreshold: 3 },
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Reset'), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Continue'))
    const body = within(context.canvasElement.ownerDocument.body)
    await userEvent.click(
      await within(await body.findByRole('dialog')).findByRole('button', { name: 'Reset' }),
    )
    await canvas.findByText('sessionRevoked: the application signs out.')
    await canvas.findByText('You have been signed out. Sign in again to continue.')
    await expect(context.canvasElement.querySelector('gbt-mfa-settings button')).toBeNull()
    await expectLayout(context)
  },
}

/** Defensive state (a live session without a factor should not exist any more: resetting signs the user out): the mandatory-MFA warning and "Set up now". */
export const Disabled: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    await within(context.canvasElement).findByText(/Two-factor authentication is required/)
    await expectLayout(context)
  },
}

export const EnrollPrompt: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    const field = await openPrompt(within(context.canvasElement), 'Set up now')
    await waitFor(() => expect(field).toHaveFocus())
    await expectLayout(context)
  },
}

/** The QR, the secret and the first code. */
export const EnrollScan: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    await toScan(context.canvasElement)
    await expectLayout(context)
  },
}

export const EnrollWrongCode: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    const canvas = await toScan(context.canvasElement)
    await userEvent.type(await canvas.findByLabelText('6-digit code'), '000000')
    await userEvent.click(await buttonNamed(canvas, 'Activate'))
    await canvas.findByText('Incorrect code')
    await expectLayout(context)
  },
}

export const EnrollCodes: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    await toCodes(context.canvasElement)
    await expectLayout(context)
  },
}

/** Acknowledged: "Done" is the primary action; it goes back to the enabled state. */
export const EnrollCodesAcknowledged: Story = {
  decorators: [withMfaPort(DISABLED)],
  play: async (context) => {
    const canvas = await toCodes(context.canvasElement)
    await userEvent.click(await canvas.findByLabelText('I have saved my backup codes'))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Done' })).toBeEnabled())
    await expectLayout(context)
  },
}

// ---- A passkey is on the account: the app is optional -----------------------------------------------------

/** A passkey is the factor: no mandatory warning, the app is "Optional" and can be added; the codes work. */
export const PasskeyOnly: Story = {
  decorators: [withMfaPort(PASSKEY_ONLY)],
  play: async (context) => {
    await within(context.canvasElement).findByText('No app configured')
    await expectLayout(context)
  },
}

export const PasskeyOnlyFewCodes: Story = {
  decorators: [withMfaPort({ ...PASSKEY_ONLY, backupCodesRemaining: 2 })],
  play: async (context) => {
    await within(context.canvasElement).findByText(/Regenerate some/)
    await expectLayout(context)
  },
}

/** "Add an app" opens the password prompt in place, focused. */
export const PasskeyOnlyEnrollPrompt: Story = {
  decorators: [withMfaPort(PASSKEY_ONLY)],
  play: async (context) => {
    const field = await openPrompt(within(context.canvasElement), 'Add an app')
    await waitFor(() => expect(field).toHaveFocus())
    await expectLayout(context)
  },
}

/** The app AND a passkey: "Remove" instead of "Reset", and the way in that stays is named. */
export const AppAndPasskey: Story = {
  decorators: [withMfaPort(APP_AND_PASSKEY)],
  play: async (context) => {
    await within(context.canvasElement).findByText('Remove the authenticator app')
    await expectLayout(context)
  },
}

export const AppAndPasskeyRemoveConfirmation: Story = {
  decorators: [withMfaPort(APP_AND_PASSKEY)],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openPrompt(canvas, 'Remove'), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Continue'))
    const dialog = await within(context.canvasElement.ownerDocument.body).findByRole('dialog')
    await expect(dialog).toHaveTextContent('Remove the authenticator app?')
    await expectLayout(context)
  },
}

// ---- Theme, width, language ---------------------------------------------------------------------------------

/** The dark theme: the warning-toned count (few codes left) and the regenerate prompt. */
export const Dark: Story = {
  decorators: [darkTheme, withMfaPort({ ...ENABLED, backupCodesRemaining: 2 })],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByText(/Regenerate some/)
    await openPrompt(canvas, 'Regenerate backup codes')
    await expectLayout(context)
  },
}

/** A phone's width (375px): the rows stack their action under the text, nothing overflows the card. */
export const Phone: Story = {
  decorators: [atPhoneWidth],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByText('On')
    await openPrompt(canvas, 'Regenerate backup codes')
    await expectLayout(context)
  },
}

/** The scan step at a phone's width: the QR above the code field. */
export const PhoneEnrollScan: Story = {
  decorators: [atPhoneWidth, withMfaPort(DISABLED)],
  play: async (context) => {
    await toScan(context.canvasElement)
    await expectLayout(context)
  },
}

/**
 * Localised: the card's French strings through its `labels` input; the backup codes and the QR it
 * contains are localised by the application once, with `provideAuthLabels({ backupCodes, totpQr })`.
 */
export const Localised: Story = {
  args: { labels: FRENCH },
  decorators: [
    moduleMetadata({
      providers: [
        provideAuthLabels({
          backupCodes: {
            listLabel: 'Codes de secours',
            copy: 'Copier les codes',
            copied: 'Codes copiés',
            copyFailed: 'Copie impossible, codes sélectionnés',
            download: 'Télécharger',
            acknowledge: "J'ai enregistré mes codes de secours",
          },
          totpQr: {
            imageAlt: "QR code à scanner avec votre application d'authentification",
            secretLabel: 'Ou saisissez cette clé dans votre application',
            fallbackSecretLabel: 'Clé de configuration',
            copyLabel: 'Copier la clé de configuration',
            copied: 'Copié',
            copyFailed: 'Copie impossible, clé sélectionnée',
          },
        }),
      ],
    }),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByText('Activée')
    await canvas.findByText(/8 codes de secours restants/)
    await userEvent.type(
      await openPrompt(canvas, 'Régénérer les codes de secours', 'Mot de passe actuel'),
      PASSWORD,
    )
    await userEvent.click(await buttonNamed(canvas, 'Régénérer'))
    await canvas.findByRole('button', { name: 'Copier les codes' })
    await expect(canvas.getByRole('button', { name: 'Terminé' })).toBeDisabled()
    await expectLayout(context)
  },
}
