import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { type MfaEnrollmentLabels, provideAuthLabels } from '../auth-labels'
import { AuthPanel } from '../auth-panel/auth-panel'
import {
  CODE,
  STORY_LOGO,
  assertPanelLayout,
  atPhoneWidth,
  later,
  portError,
  storyAuthPort,
  withAuthPort,
} from '../testing/auth-story-helpers'
import { dismissedPrompt, fakeAttestation, stubPasskeyBrowser } from '../testing/webauthn-testing'
import { MfaEnrollment } from './mfa-enrollment'

/** "Get started" / "Use an app" fails: the server answers a 500. */
const enrollFails = withAuthPort(
  storyAuthPort({ enrollTotp: () => later(() => portError(500, 'internal error')) }),
)

/**
 * The browser of the story, whatever the one running Storybook has: `create` answers what the story
 * needs (a credential, a dismissed prompt, a prompt that stays open...). Put back after the story.
 */
const passkeyBrowser = (create: () => Promise<unknown>) => () =>
  stubPasskeyBrowser({ create, get: () => new Promise(() => undefined) })
const creates = () => Promise.resolve(fakeAttestation())

const rect = (el: Element) => el.getBoundingClientRect()

/**
 * The panel's own checks (no horizontal overflow, a 16px gutter, everything inside the panel), then
 * the enrolment's: every button of the steps 44px high, the small buttons of the codes and of the
 * secret 44px to tap through their invisible extension, the acknowledgement row 44px, and the QR,
 * the codes and the option cards inside the panel.
 */
function assertEnrollmentLayout(canvas: HTMLElement): void {
  assertPanelLayout(canvas)
  if (canvas.ownerDocument.documentElement.clientWidth === 0) {
    return // hidden docs frame: no layout to measure
  }
  const panel = canvas.querySelector('.gbt-auth-panel__panel')!
  // The extensions (the ::after of the buttons): 7px above and below and 2px aside around the codes'
  // buttons, 8px all around the icon-only copy button of the secret.
  for (const part of Array.from(
    canvas.querySelectorAll(
      '.gbt-backup-codes__actions .gbt-button, .gbt-backup-codes__ack .gbt-checkbox, .gbt-totp-qr__secret .gbt-copy-field__copy .gbt-button',
    ),
  )) {
    const inSecret = !!part.closest('.gbt-totp-qr__secret')
    const hit = part.matches('.gbt-button')
      ? {
          height: rect(part).height + (inSecret ? 16 : 14),
          width: rect(part).width + (inSecret ? 16 : 4),
        }
      : rect(part)
    if (hit.height < 43.5 || hit.width < 43.5)
      throw new Error(`tap target under 44px: ${part.className} ${hit.width}x${hit.height}`)
  }
  for (const button of Array.from(
    canvas.querySelectorAll(
      '.gbt-mfa-enrollment__actions button.gbt-button, .gbt-mfa-enrollment__option button.gbt-button',
    ),
  )) {
    if (rect(button).height < 43.5)
      throw new Error(`button under 44px: ${button.textContent?.trim()} ${rect(button).height}px`)
  }
  for (const part of Array.from(
    canvas.querySelectorAll(
      '.gbt-totp-qr__frame, .gbt-backup-codes__code, gbt-input input, button.gbt-button, .gbt-mfa-enrollment__option .gbt-card',
    ),
  )) {
    if (rect(part).left < rect(panel).left - 0.5 || rect(part).right > rect(panel).right + 0.5)
      throw new Error(`content spills out of the panel: ${part.className}`)
  }
}
const expectLayout = ({ canvasElement }: { canvasElement: HTMLElement }) =>
  waitFor(() => assertEnrollmentLayout(canvasElement), { timeout: 3000 })

/** The page around the component, as `gbt-auth-login` and `gbt-auth-register` draw it. */
const inAuthPanel = (heading: string) => (args: object) => ({
  props: { ...args, heading },
  template: `<gbt-auth-panel wide [heading]="heading">
    ${STORY_LOGO}
    <gbt-mfa-enrollment [mfaToken]="mfaToken" [passkeysAvailable]="passkeysAvailable" [labels]="labels" />
  </gbt-auth-panel>`,
})

/**
 * The mandatory first enrolment of a second factor, inside the sign-in panel of the login and
 * register pages: an introduction (or, where a passkey can be made, the choice between a passkey and
 * an authenticator), the QR code and secret with a first code or the passkey's name and the
 * browser's prompt, then the backup codes to be acknowledged. Every story is driven through the real
 * component with a fake `AUTH_PORT` (it accepts the code 123456) and a stand-in QR encoder.
 */
const meta: Meta<MfaEnrollment> = {
  title: 'Auth/MfaEnrollment',
  component: MfaEnrollment,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [AuthPanel] }), withAuthPort(storyAuthPort())],
  args: { mfaToken: 'pending', passkeysAvailable: false, labels: {} },
  render: inAuthPanel('Two-factor authentication'),
}

export default meta
type Story = StoryObj<MfaEnrollment>

/** The information and what is going to happen, one primary "Get started". */
export const Intro: Story = {
  play: expectLayout,
}

/** "Get started" fails: the alert, and the keyboard focus is back on the button. */
export const IntroError: Story = {
  decorators: [enrollFails],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Get started' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The setup could not start')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Get started' })).toHaveFocus())
    await expectLayout(context)
  },
}

async function openScan(canvasElement: HTMLElement, begin = 'Get started') {
  const canvas = within(canvasElement)
  await userEvent.click(await canvas.findByRole('button', { name: begin }))
  // The QR is drawn by the application's renderer (here the stand-in one).
  await waitFor(() => expect(canvasElement.querySelector('.gbt-totp-qr__frame img')).toBeTruthy(), {
    timeout: 5000,
  })
  return canvas
}

/** The QR code, the secret to type by hand, and the field for a first code (the heading has the focus: the QR stays in view). */
export const Scan: Story = {
  play: async (context) => {
    await openScan(context.canvasElement)
    await waitFor(() =>
      expect(context.canvasElement.querySelector('gbt-mfa-enrollment h2')).toHaveFocus(),
    )
    await expectLayout(context)
  },
}

/** A wrong code (400): "Incorrect code", the field emptied and refocused. */
export const ScanError: Story = {
  play: async (context) => {
    const canvas = await openScan(context.canvasElement)
    const field = await canvas.findByLabelText('6-digit code')
    await userEvent.type(field, '000000')
    await userEvent.click(canvas.getByRole('button', { name: 'Activate' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Incorrect code')
    await waitFor(() => expect(field).toHaveFocus())
    await expect(field).toHaveValue('')
    await expectLayout(context)
  },
}

async function openCodes(canvasElement: HTMLElement) {
  const canvas = await openScan(canvasElement)
  await userEvent.type(await canvas.findByLabelText('6-digit code'), CODE)
  await userEvent.click(canvas.getByRole('button', { name: 'Activate' }))
  await canvas.findByRole('button', { name: 'Copy codes' })
  return canvas
}

/** The ten backup codes; "Continue" waits for the acknowledgement. */
export const Codes: Story = {
  play: async (context) => {
    const canvas = await openCodes(context.canvasElement)
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await expectLayout(context)
  },
}

/** The codes acknowledged: "Continue" is enabled. */
export const CodesAcknowledged: Story = {
  play: async (context) => {
    const canvas = await openCodes(context.canvasElement)
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I have saved my backup codes' }))
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeEnabled()
    await expectLayout(context)
  },
}

/** A passkey can be made here (a browser with WebAuthn, a server that runs it): the two ways, the passkey advised and the single primary. */
export const Choice: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(creates),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Use a passkey' })).toHaveClass(
      'gbt-button--primary',
    )
    await expect(canvas.getByRole('button', { name: 'Use an app' })).toHaveClass(
      'gbt-button--secondary',
    )
    await expectLayout(context)
  },
}

/** "Use an app" fails: the alert above the cards, the keyboard focus back on the button that was pressed. */
export const ChoiceError: Story = {
  args: { passkeysAvailable: true },
  decorators: [enrollFails],
  beforeEach: passkeyBrowser(creates),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Use an app' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('The setup could not start')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Use an app' })).toHaveFocus())
    await expectLayout(context)
  },
}

async function openPasskey(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  await userEvent.click(await canvas.findByRole('button', { name: 'Use a passkey' }))
  await canvas.findByLabelText('Key name (optional)')
  return canvas
}

/** The passkey path: an optional name (its default as the placeholder), then the browser's prompt. */
export const PasskeyName: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(creates),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await expect(canvas.getByLabelText('Key name (optional)')).toHaveAttribute(
      'placeholder',
      'Passkey',
    )
    await waitFor(() =>
      expect(context.canvasElement.querySelector('gbt-mfa-enrollment h2')).toHaveFocus(),
    )
    await expectLayout(context)
  },
}

/** The browser's prompt is open: a spinner on the button and a line telling the user where to look. */
export const PasskeyBusy: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(() => new Promise(() => undefined)),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await userEvent.type(canvas.getByLabelText('Key name (optional)'), 'MacBook de Florian')
    await userEvent.click(canvas.getByRole('button', { name: 'Create the passkey' }))
    await waitFor(() =>
      expect(context.canvasElement.querySelector('gbt-alert [role="status"]')).toHaveTextContent(
        'Confirm on your device',
      ),
    )
    await expect(canvas.getByRole('button', { name: 'Back' })).toBeEnabled()
    await expectLayout(context)
  },
}

/** The credential could not be made (an unexpected browser error): the alert and a retry. */
export const PasskeyError: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(() => Promise.reject(new DOMException('x', 'SecurityError'))),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Create the passkey' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'The passkey could not be created',
    )
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Create the passkey' })).toHaveFocus(),
    )
    await expectLayout(context)
  },
}

/** The user dismissed the prompt: a quiet "Operation cancelled" (no alert role), ready to retry. */
export const PasskeyCancelled: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(() => Promise.reject(dismissedPrompt())),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Create the passkey' }))
    await expect(await canvas.findByText('Operation cancelled')).toBeVisible()
    await expect(canvas.queryByRole('alert')).toBeNull()
    await expectLayout(context)
  },
}

/** This authenticator already holds the credential: "This key is already registered". */
export const PasskeyAlreadyRegistered: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(() => Promise.reject(new DOMException('x', 'InvalidStateError'))),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Create the passkey' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'This key is already registered',
    )
    await expectLayout(context)
  },
}

/** The passkey is made: the same ten backup codes to acknowledge, worded for a lost passkey. */
export const PasskeyCodes: Story = {
  args: { passkeysAvailable: true },
  beforeEach: passkeyBrowser(creates),
  play: async (context) => {
    const canvas = await openPasskey(context.canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Create the passkey' }))
    await canvas.findByRole('button', { name: 'Copy codes' })
    await expect(canvas.getByText(/lose access to your passkey/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await expectLayout(context)
  },
}

/** The choice on the dark theme: the advised card keeps its accent outline. */
export const Dark: Story = {
  args: { passkeysAvailable: true },
  decorators: [darkTheme],
  beforeEach: passkeyBrowser(creates),
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await canvas.findByRole('button', { name: 'Use a passkey' })
    await expectLayout(context)
  },
}

/** The backup codes at a phone's width (375px): two columns of codes, nothing runs off the panel. */
export const Phone: Story = {
  decorators: [atPhoneWidth],
  play: async (context) => {
    await openCodes(context.canvasElement)
    await expectLayout(context)
  },
}

/** FerrisGit's French wording, as an application localises the component. */
const FRENCH: Partial<MfaEnrollmentLabels> = {
  step: (current, total) => `Étape ${current} sur ${total}`,
  choiceHeading: 'Protégez votre compte',
  scanHeading: 'Configurez votre application',
  passkeyHeading: "Créez votre clé d'accès",
  codesHeading: 'Conservez vos codes de secours',
  mandatory: 'La double authentification est obligatoire pour sécuriser votre compte.',
  choiceLead: 'Choisissez comment vous confirmerez votre identité à chaque connexion.',
  passkeyOption: "Clé d'accès",
  recommended: 'Recommandé',
  passkeyOptionText:
    'Touch ID, Windows Hello, un code PIN ou une clé de sécurité : rien à saisir, et impossible à hameçonner.',
  usePasskey: "Utiliser une clé d'accès",
  appOption: "Application d'authentification",
  appOptionText:
    'Google Authenticator, Authy, 1Password… : un code à 6 chiffres à saisir à chaque connexion.',
  useApp: 'Utiliser une application',
  preparing: 'Préparation en cours',
  back: 'Retour',
  todoInstall:
    "Installez une application d'authentification (Google Authenticator, Authy, 1Password…).",
  todoScan: "Scannez le QR code affiché à l'étape suivante et saisissez le code à 6 chiffres.",
  todoKeep: 'Conservez vos codes de secours : ils vous serviront si vous perdez votre téléphone.',
  begin: 'Commencer',
  scanLead:
    "Scannez ce QR code avec votre application d'authentification, puis saisissez le code à 6 chiffres qu'elle affiche.",
  codeLabel: 'Code à 6 chiffres',
  activate: 'Activer',
  verifying: 'Vérification en cours',
  passkeyLead:
    'Donnez un nom à cette clé pour la reconnaître plus tard, puis validez avec votre appareil : Touch ID, Windows Hello, code PIN ou clé de sécurité.',
  passkeyNameLabel: 'Nom de la clé (facultatif)',
  defaultPasskeyName: "Clé d'accès",
  createPasskey: "Créer la clé d'accès",
  creating: 'Création en cours',
  promptOpen: 'Validez sur votre appareil pour créer la clé.',
  codesLead: (factor) =>
    `La double authentification est activée. Ces codes ne s'afficheront plus : ils vous permettent de vous connecter si vous perdez l'accès à ${factor === 'passkey' ? "votre clé d'accès" : 'votre application'}, et chacun ne fonctionne qu'une seule fois.`,
  continue: 'Continuer',
  enterCode: 'Saisissez le code à 6 chiffres de votre application',
  wrongCode: 'Code incorrect',
  startFailed: "La configuration n'a pas pu démarrer, réessayez.",
  activationFailed: "L'activation a échoué, réessayez.",
  passkeyFailed: "La clé d'accès n'a pas pu être créée, réessayez.",
  alreadyRegistered: 'Cette clé est déjà enregistrée',
  cancelled: 'Opération annulée',
  browserUnsupported: "Ce navigateur ne prend pas en charge les clés d'accès.",
  passkeysUnavailable: "Les clés d'accès ne sont pas disponibles sur ce serveur.",
  loginExpired: 'Votre connexion a expiré, reconnectez-vous.',
  alreadySetUp: 'La double authentification est déjà configurée, reconnectez-vous.',
  tooManyAttempts: 'Trop de tentatives, réessayez dans quelques minutes',
  nameTooLong: (max) => `Le nom ne doit pas dépasser ${max} caractères`,
  nameControlCharacters: 'Le nom ne peut pas contenir de caractères de contrôle',
}

/**
 * The French wording through the `labels` input. The QR and the backup codes are separate
 * components: their strings come from `provideAuthLabels({ totpQr, backupCodes })`.
 */
export const Localised: Story = {
  args: { labels: FRENCH },
  render: inAuthPanel('Double authentification'),
  decorators: [
    moduleMetadata({
      providers: [
        provideAuthLabels({
          totpQr: {
            fallback:
              "Le QR code n'a pas pu être affiché : saisissez la clé ci-dessous dans votre application.",
            imageAlt: "QR code à scanner avec votre application d'authentification",
            secretLabel: 'Ou saisissez cette clé dans votre application',
            fallbackSecretLabel: 'Clé de configuration',
            copyLabel: 'Copier la clé de configuration',
            copied: 'Copié',
            copyFailed: 'Copie impossible, clé sélectionnée',
          },
          backupCodes: {
            listLabel: 'Codes de secours',
            copy: 'Copier les codes',
            copied: 'Codes copiés',
            copyFailed: 'Copie impossible, codes sélectionnés',
            download: 'Télécharger',
            acknowledge: "J'ai enregistré mes codes de secours",
            fileName: 'codes-de-secours.txt',
            fileTitle: 'Codes de secours',
            fileNotice:
              "Chaque code ne peut être utilisé qu'une seule fois. Conservez-les dans un endroit sûr.",
          },
        }),
      ],
    }),
  ],
  play: async (context) => {
    const canvas = within(context.canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Protégez votre compte' }),
    ).toBeVisible()
    await expect(canvas.getByText('Étape 1 sur 3')).toBeVisible()
    await openScan(context.canvasElement, 'Commencer')
    await expect(
      await canvas.findByRole('heading', { name: 'Configurez votre application' }),
    ).toBeVisible()
    await expect(canvas.getByLabelText('Code à 6 chiffres')).toBeVisible()
    await expect(canvas.getByText('Ou saisissez cette clé dans votre application')).toBeVisible()
    await expectLayout(context)
  },
}
