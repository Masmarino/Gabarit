import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Button } from './button'

const meta: Meta<Button> = {
  title: 'Atoms/Button',
  component: Button,
}

export default meta
type Story = StoryObj<Button>

export const Nominal: Story = {
  args: {
    text: 'Enregistrer',
  },
}

export const Empty: Story = {
  args: {
    text: '',
    iconName: 'check',
    ariaLabel: 'Valider',
  },
}

export const Dense: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap">
        <gbt-button text="Primary" variant="primary" />
        <gbt-button text="Secondary" variant="secondary" />
        <gbt-button text="Danger" variant="danger" />
        <gbt-button text="Chargement" [loading]="true" />
        <gbt-button text="Désactivé" [disabled]="true" />
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const Dark: Story = {
  args: {
    text: 'Enregistrer',
  },
  decorators: [darkTheme],
}
