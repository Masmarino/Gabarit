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
