import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Modal } from './modal'

const meta: Meta<Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
}

export default meta
type Story = StoryObj<Modal>

export const Closed: Story = {
  args: {
    isOpen: false,
    heading: 'Nouveau dépôt',
  },
}

export const Open: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Nouveau dépôt">
        <p>Contenu de la boîte de dialogue.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
}

export const LongTitle: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Confirmer la suppression définitive de ce dépôt et de tout son historique">
        <p>Cette action est irréversible.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Nouveau dépôt">
        <p>Contenu de la boîte de dialogue.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
  decorators: [darkTheme],
}
