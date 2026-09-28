import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { ConfirmDangerModal } from './confirm-danger-modal'

const meta: Meta<ConfirmDangerModal> = {
  title: 'Organisms/ConfirmDangerModal',
  component: ConfirmDangerModal,
}

export default meta
type Story = StoryObj<ConfirmDangerModal>

export const Open: Story = {
  args: {
    isOpen: true,
    heading: 'Supprimer le dépôt',
    message: 'Cette action supprimera définitivement le dépôt et tout son contenu.',
    confirmText: 'widget',
    confirmInputLabel: 'Tapez le nom du dépôt pour confirmer',
    confirmLabel: 'Supprimer',
    cancelLabel: 'Annuler',
    closeLabel: 'Fermer',
  },
}

export const Dark: Story = {
  args: {
    isOpen: true,
    heading: 'Supprimer le dépôt',
    message: 'Cette action supprimera définitivement le dépôt et tout son contenu.',
    confirmText: 'widget',
    confirmInputLabel: 'Tapez le nom du dépôt pour confirmer',
    confirmLabel: 'Supprimer',
    cancelLabel: 'Annuler',
    closeLabel: 'Fermer',
  },
  decorators: [darkTheme],
}

const light = {
  isOpen: true,
  heading: 'Supprimer le webhook',
  message: 'Le webhook cessera de recevoir des événements. Vous pourrez le recréer à tout moment.',
  confirmLabel: 'Supprimer',
  cancelLabel: 'Annuler',
  closeLabel: 'Fermer',
}

/** No `confirmText`: a light confirmation, no typing gate. */
export const LightConfirmation: Story = { args: light }

/** `busy`: spinner on the confirm button, everything else ignored until the request ends. */
export const LightBusy: Story = {
  args: { ...light, busy: true, busyLabel: 'Suppression en cours' },
}

const warning = {
  ...light,
  heading: 'Réinitialiser les clés',
  message: 'Les clés actuelles cesseront de fonctionner immédiatement.',
  confirmLabel: 'Réinitialiser',
  tone: 'warning' as const,
}

export const WarningTone: Story = { args: warning }

const neutral = {
  ...light,
  heading: 'Publier la version',
  message: 'La version sera visible de tous les membres du groupe.',
  confirmLabel: 'Publier',
  confirmIcon: 'upload',
  tone: 'neutral' as const,
}

export const NeutralTone: Story = { args: neutral }

export const TypedBusy: Story = {
  args: {
    isOpen: true,
    heading: 'Supprimer le dépôt',
    message: 'Cette action supprimera définitivement le dépôt et tout son contenu.',
    confirmText: 'widget',
    confirmInputLabel: 'Tapez le nom du dépôt pour confirmer',
    confirmLabel: 'Supprimer',
    cancelLabel: 'Annuler',
    closeLabel: 'Fermer',
    busy: true,
    busyLabel: 'Suppression en cours',
  },
}

export const LightConfirmationDark: Story = { args: light, decorators: [darkTheme] }

export const WarningToneDark: Story = { args: warning, decorators: [darkTheme] }

export const NeutralToneDark: Story = { args: neutral, decorators: [darkTheme] }

export const LightBusyDark: Story = {
  args: { ...light, busy: true, busyLabel: 'Suppression en cours' },
  decorators: [darkTheme],
}
