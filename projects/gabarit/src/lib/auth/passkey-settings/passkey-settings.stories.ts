import type { Meta, StoryObj } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import type { PasskeySettingsLabels } from '../auth-labels'
import type { MfaStatus, Passkey } from '../ports/mfa.port'
import {
  PASSWORD,
  atPhoneWidth,
  daysAgo,
  expectSettingsLayout,
  hoursAgo,
  inSettingsColumn,
  withMfaPort,
} from '../testing/auth-story-helpers'
import { dismissedPrompt, fakeAttestation, stubPasskeyBrowser } from '../testing/webauthn-testing'
import { PasskeySettings } from './passkey-settings'

const MACBOOK: Passkey = {
  id: 'p1',
  name: 'MacBook Touch ID',
  createdAt: '2025-03-12T09:30:00Z',
  lastUsedAt: hoursAgo(3),
}
const YUBIKEY: Passkey = {
  id: 'p2',
  name: 'YubiKey 5C NFC',
  createdAt: daysAgo(3),
  lastUsedAt: null,
}
const LONG_NAME: Passkey = {
  id: 'p3',
  name: "The infrastructure team's shared work phone passkey, kept in the safe",
  createdAt: daysAgo(40),
  lastUsedAt: daysAgo(1),
}

const withApp = (...passkeys: Passkey[]): MfaStatus => ({
  totpEnabled: true,
  backupCodesRemaining: 8,
  passkeys,
})
const passkeysOnly = (...passkeys: Passkey[]): MfaStatus => ({
  totpEnabled: false,
  backupCodesRemaining: 10,
  passkeys,
})

/** The story browsers are faked (`beforeEach`): the stories look the same in any real browser. */
const passkeyBrowser = (create: (() => Promise<unknown>) | null) => () =>
  stubPasskeyBrowser(create ? { create, get: () => Promise.reject(new Error('unused')) } : null)
const creates = () => Promise.resolve(fakeAttestation())

/** The French wording of the FerrisGit original, handed through the `labels` input. */
const LAST_FACTOR_FR =
  "C'est votre dernier facteur : vous devrez en configurer un nouveau à la prochaine connexion."
const FRENCH: PasskeySettingsLabels = {
  heading: "Clés d'accès",
  description:
    "Validez votre connexion avec l'empreinte digitale, le visage ou le code de votre appareil, ou avec une clé de sécurité.",
  loading: "Chargement des clés d'accès…",
  loadFailed: "Les clés d'accès n'ont pas pu être chargées.",
  retry: 'Réessayer',
  browserBlocked:
    "Ce navigateur ne prend pas en charge les clés d'accès : vous ne pouvez pas en ajouter ici, mais vous pouvez supprimer celles que vous avez déjà.",
  serverBlocked:
    "Les clés d'accès ne sont pas disponibles sur ce serveur. Vous ne pouvez pas en ajouter, mais vous pouvez supprimer celles que vous avez déjà.",
  emptyHeading: "Aucune clé d'accès",
  emptyMessage: "Ajoutez-en une pour valider votre connexion d'un geste, sans code à recopier.",
  listLabel: "Clés d'accès enregistrées",
  added: (absolute) => (absolute ? 'Ajoutée le' : 'Ajoutée'),
  lastUsed: (absolute) => (absolute ? 'Dernière utilisation le' : 'Dernière utilisation'),
  neverUsed: 'Jamais utilisée',
  delete: 'Supprimer',
  deleteKey: (name) => `Supprimer la clé ${name}`,
  passkeyAdded: (name) => `Clé d'accès « ${name} » ajoutée.`,
  passkeyGone: (name) => `La clé d'accès « ${name} » n'existe plus.`,
  addPasskey: "Ajouter une clé d'accès",
  finishAppFirst: "Terminez d'abord la configuration de l'application d'authentification.",
  deleteDialogHeading: "Supprimer cette clé d'accès ?",
  deleteDialogMessage: (name, lastFactor) =>
    `« ${name} » ne permettra plus de vous connecter. Vous serez déconnecté de tous vos appareils et devrez vous reconnecter.` +
    (lastFactor ? ` ${LAST_FACTOR_FR}` : ''),
  deleteConfirm: 'Supprimer',
  cancel: 'Annuler',
  close: 'Fermer',
  deleting: 'Suppression en cours',
  addLead:
    'Nommez cette clé et confirmez votre mot de passe : votre appareil vous demandera ensuite de valider.',
  promptOpen: 'Validez sur votre appareil pour créer la clé.',
  nameLabel: 'Nom de la clé (facultatif)',
  defaultPasskeyName: "Clé d'accès",
  currentPassword: 'Mot de passe actuel',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  create: "Créer la clé d'accès",
  creating: 'Création en cours',
  deleteLead: (name) => `Confirmez votre mot de passe pour supprimer « ${name} ».`,
  lastFactorWarning: LAST_FACTOR_FR,
  continue: 'Continuer',
  checking: 'Vérification en cours',
  nameTooLong: (max) => `Le nom ne doit pas dépasser ${max} caractères`,
  nameControlCharacters: 'Le nom ne peut pas contenir de caractères de contrôle',
  enterPassword: 'Saisissez votre mot de passe',
  wrongPassword: 'Mot de passe incorrect',
  tooManyPasskeys:
    "Vous avez atteint le nombre maximal de clés d'accès : supprimez-en une avant d'en ajouter.",
  alreadyRegistered: 'Cette clé est déjà enregistrée',
  passkeysUnavailable: "Les clés d'accès ne sont pas disponibles sur ce serveur.",
  addFailed: "La clé d'accès n'a pas pu être créée, réessayez.",
  cancelled: 'Opération annulée',
  browserUnsupported: "Ce navigateur ne prend pas en charge les clés d'accès.",
  deleteFailed: "La clé d'accès n'a pas pu être supprimée, réessayez.",
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
  signedOut: 'Vous avez été déconnecté. Reconnectez-vous pour continuer.',
}

const rect = (el: Element) => el.getBoundingClientRect()

/**
 * Layout guards the jsdom specs cannot make: the card well formed (no overflow), at most one primary
 * button, no row or line sticking out of its card, and on a phone-sized window every button of the
 * card (the confirmation dialog is the shared one) at least 44px high.
 */
async function expectPasskeyLayout(canvasElement: HTMLElement) {
  await waitFor(() => {
    if (!canvasElement.querySelector('gbt-card')) throw new Error('not rendered yet')
  })
  await expectSettingsLayout(canvasElement)
  await expect(
    canvasElement.querySelectorAll('.gbt-button--primary').length,
    'primary buttons',
  ).toBeLessThanOrEqual(1)
  const doc = canvasElement.ownerDocument.documentElement
  if (doc.clientWidth === 0) {
    return // hidden docs frame
  }
  // The card's box: its body wrapper is `display: contents` (no box of its own) unless flush.
  const body = canvasElement.querySelector('gbt-card .gbt-card')!
  for (const row of Array.from(
    canvasElement.querySelectorAll<HTMLElement>('.gbt-passkey-settings__row'),
  )) {
    const head = rect(row.querySelector('.gbt-passkey-settings__row-head')!)
    await expect(
      head.right,
      `row "${row.querySelector('.gbt-passkey-settings__name')?.textContent?.trim()}" inside the card`,
    ).toBeLessThanOrEqual(rect(body).right + 0.5)
    const name = row.querySelector<HTMLElement>('.gbt-passkey-settings__name')!
    await expect(rect(name).height, 'the name is one line').toBeLessThanOrEqual(24.5)
  }
  if (doc.clientWidth <= 480) {
    for (const button of Array.from(
      canvasElement.querySelectorAll<HTMLElement>('button.gbt-button'),
    )) {
      if (button.closest('gbt-confirm-danger-modal') || rect(button).width === 0) continue
      await expect(
        rect(button).height,
        `"${button.textContent?.trim() || button.getAttribute('aria-label')}" is a 44px target`,
      ).toBeGreaterThanOrEqual(43.5)
    }
  }
}
const expectLayout = ({ canvasElement }: { canvasElement: HTMLElement }) =>
  expectPasskeyLayout(canvasElement)

// ---- Driving the real component -----------------------------------------------------------------------

const buttonNamed = (canvas: ReturnType<typeof within>, name: string | RegExp) =>
  canvas.findByRole('button', { name })

async function openAdd(canvas: ReturnType<typeof within>) {
  await userEvent.click(await buttonNamed(canvas, 'Add a passkey'))
  return canvas.findByLabelText('Current password')
}

async function openDelete(canvas: ReturnType<typeof within>, name: string) {
  await userEvent.click(await buttonNamed(canvas, `Delete the key ${name}`))
  return canvas.findByLabelText('Current password')
}

/** The password typed and "Continue" pressed: the confirmation dialog is open. */
async function toDeleteDialog(canvasElement: HTMLElement, name: string, password = PASSWORD) {
  const canvas = within(canvasElement)
  await userEvent.type(await openDelete(canvas, name), password)
  await userEvent.click(await buttonNamed(canvas, 'Continue'))
  return within(canvasElement.ownerDocument.body).findByRole('dialog')
}

/**
 * Account → Security: the passkeys (WebAuthn) card. Every story is driven through the real component
 * with a fake server (`withMfaPort`, password `correct-password`) and a fake browser, so each looks
 * the same anywhere. Deleting a key emits `sessionRevoked` (see the Actions panel): the application
 * signs out.
 */
const meta: Meta<PasskeySettings> = {
  title: 'Auth/PasskeySettings',
  component: PasskeySettings,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  beforeEach: passkeyBrowser(creates),
  decorators: [withMfaPort(withApp(MACBOOK, YUBIKEY)), inSettingsColumn],
}

export default meta
type Story = StoryObj<PasskeySettings>

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

/** Two keys: name, when it was added, when it was last used (or never). */
export const List: Story = {
  play: async (context) => {
    await within(context.canvasElement).findByText('MacBook Touch ID')
    await expectLayout(context)
  },
}

/** A very long name is cut on one line (its full text on hover). */
export const LongName: Story = {
  decorators: [withMfaPort(withApp(LONG_NAME, YUBIKEY))],
  play: async (context) => {
    await within(context.canvasElement).findByText(/shared work phone/)
    await expectLayout(context)
  },
}

/** No key yet: an invitation, and the button to add one. */
export const Empty: Story = {
  decorators: [withMfaPort(withApp())],
  play: async (context) => {
    await within(context.canvasElement).findByText('No passkeys')
    await expectLayout(context)
  },
}

/** A browser without WebAuthn: why nothing can be added, the keys stay listed and removable. */
export const Unsupported: Story = {
  beforeEach: passkeyBrowser(null),
  play: async (context) => {
    await within(context.canvasElement).findByText(/This browser does not support passkeys/)
    await expect(await buttonNamed(within(context.canvasElement), 'Add a passkey')).toBeDisabled()
    await expectLayout(context)
  },
}

/** A server that cannot run WebAuthn (`passkeysAvailable: false`): same, with the server's reason. */
export const Unavailable: Story = {
  decorators: [
    withMfaPort(withApp(), { config: { registrationEnabled: false, passkeysAvailable: false } }),
  ],
  play: async (context) => {
    await within(context.canvasElement).findByText(/not available on this server/)
    await expect(await buttonNamed(within(context.canvasElement), 'Add a passkey')).toBeDisabled()
    await expectLayout(context)
  },
}

/** "Add a passkey": the name and the current password, in place, the name focused. */
export const AddForm: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.click(await buttonNamed(canvas, 'Add a passkey'))
    await waitFor(() => expect(canvas.getByLabelText('Key name (optional)')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The same form when there is no key yet. */
export const AddFormFirstKey: Story = {
  decorators: [withMfaPort(withApp())],
  play: async (context) => {
    await openAdd(within(context.canvasElement))
    await expectLayout(context)
  },
}

/** The server accepted the password: the browser's prompt is open, "Confirm on your device". */
export const Busy: Story = {
  beforeEach: passkeyBrowser(() => new Promise(() => {})),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openAdd(canvas), PASSWORD)
    await userEvent.type(canvas.getByLabelText('Key name (optional)'), 'Phone')
    await userEvent.click(await buttonNamed(canvas, 'Create the passkey'))
    await canvas.findByText('Confirm on your device to create the key.')
    await expectLayout(context)
  },
}

/** A wrong password: under the field, the form stays, the browser is never asked. */
export const WrongPassword: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openAdd(canvas), 'not-the-one')
    await userEvent.click(await buttonNamed(canvas, 'Create the passkey'))
    await canvas.findByText('Incorrect password')
    await waitFor(() => expect(canvas.getByLabelText('Current password')).toHaveFocus())
    await expectLayout(context)
  },
}

/** The user dismissed the browser's prompt: a quiet blue note, one click to retry. */
export const AddCancelled: Story = {
  beforeEach: passkeyBrowser(() => Promise.reject(dismissedPrompt())),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openAdd(canvas), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Create the passkey'))
    await canvas.findByText('Operation cancelled')
    await expectLayout(context)
  },
}

/** The authenticator is already registered on the account. */
export const AlreadyRegistered: Story = {
  beforeEach: passkeyBrowser(() => Promise.reject(new DOMException('x', 'InvalidStateError'))),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openAdd(canvas), PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Create the passkey'))
    await canvas.findByText('This key is already registered')
    await expectLayout(context)
  },
}

/** The key was created: it joins the list and the change is announced. */
export const Added: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.type(await openAdd(canvas), PASSWORD)
    await userEvent.type(canvas.getByLabelText('Key name (optional)'), 'Phone')
    await userEvent.click(await buttonNamed(canvas, 'Create the passkey'))
    await canvas.findByText('Passkey “Phone” added.', undefined, { timeout: 5000 })
    await expectLayout(context)
  },
}

/** "Delete": the password prompt opens under that key. */
export const DeletePrompt: Story = {
  play: async (context) => {
    const canvas = within(context.canvasElement)
    const field = await openDelete(canvas, 'YubiKey 5C NFC')
    await waitFor(() => expect(field).toHaveFocus())
    await expectLayout(context)
  },
}

/** The confirmation says everyone is signed out (honest copy) before anything is sent. */
export const DeleteConfirm: Story = {
  play: async (context) => {
    const dialog = await toDeleteDialog(context.canvasElement, 'YubiKey 5C NFC')
    await expect(dialog).toHaveTextContent('You will be signed out of all your devices')
    await expect(dialog).not.toHaveTextContent('last factor')
    await expectLayout(context)
  },
}

/** The last key of an account without an app: a warning under the password field, before "Continue", and again in the dialog. */
export const LastFactorWarning: Story = {
  decorators: [withMfaPort(passkeysOnly(MACBOOK))],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    const field = await openDelete(canvas, 'MacBook Touch ID')
    await expect(context.canvasElement.querySelector('gbt-alert')).toHaveTextContent(
      'This is your last factor',
    )
    await expectLayout(context)
    await userEvent.type(field, PASSWORD)
    await userEvent.click(await buttonNamed(canvas, 'Continue'))
    const dialog = await within(context.canvasElement.ownerDocument.body).findByRole('dialog')
    await expect(dialog).toHaveTextContent('This is your last factor')
  },
}

/** The same, before the dialog: the warning sits between the sentence and the password field. */
export const LastFactorPrompt: Story = {
  decorators: [withMfaPort(passkeysOnly(MACBOOK))],
  play: async (context) => {
    await openDelete(within(context.canvasElement), 'MacBook Touch ID')
    await expect(context.canvasElement.querySelector('gbt-alert')).toHaveTextContent(
      'This is your last factor',
    )
    await expectLayout(context)
  },
}

/** The app card is mid-enrolment (its own primary button is on screen): adding a key waits, and says so. */
export const AddHeldBack: Story = {
  decorators: [withMfaPort(withApp(MACBOOK), { appFlowActive: true })],
  play: async (context) => {
    await within(context.canvasElement).findByText(/Finish setting up the authenticator app first/)
    await expect(await buttonNamed(within(context.canvasElement), 'Add a passkey')).toBeDisabled()
    await expectLayout(context)
  },
}

/** A wrong password at the confirmation: back to the prompt, "Incorrect password". */
export const DeleteWrongPassword: Story = {
  play: async (context) => {
    const dialog = await toDeleteDialog(context.canvasElement, 'YubiKey 5C NFC', 'not-the-one')
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Delete' }))
    await within(context.canvasElement).findByText('Incorrect password')
    await expectLayout(context)
  },
}

/** The list in the dark theme. */
export const Dark: Story = {
  decorators: [darkTheme],
  play: async (context) => {
    await within(context.canvasElement).findByText('MacBook Touch ID')
    await expectLayout(context)
  },
}

/** A phone's width (375px): the rows, then the add form, stay inside the card. */
export const PhoneWidth: Story = {
  decorators: [atPhoneWidth],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByText('MacBook Touch ID')
    await expectLayout(context)
    await openAdd(canvas)
    await expectLayout(context)
  },
}

/**
 * Localised by the application: the French wording of the original, through the `labels` input
 * (or once for the whole kit with `provideAuthLabels({ passkeySettings: … })`), and the dates in
 * French through the `locale` input.
 */
export const Localised: Story = {
  args: { labels: FRENCH, locale: 'fr' },
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByText('MacBook Touch ID')
    await expect(canvas.getByRole('list', { name: "Clés d'accès enregistrées" })).toBeVisible()
    await expect(canvas.getByText(/Ajoutée le/)).toBeVisible()
    await expect(canvas.getByText('Jamais utilisée')).toBeVisible()
    await userEvent.click(await buttonNamed(canvas, "Ajouter une clé d'accès"))
    await waitFor(() => expect(canvas.getByLabelText('Nom de la clé (facultatif)')).toHaveFocus())
    await expect(canvas.getByLabelText('Mot de passe actuel')).toBeVisible()
    await expectLayout(context)
  },
}
