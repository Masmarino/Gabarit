import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Card } from './card'

const meta: Meta<Card> = {
  title: 'Molecules/Card',
  component: Card,
}

export default meta
type Story = StoryObj<Card>

export const NoTitle: Story = {
  render: () => ({
    template: `<gbt-card>Contenu sans titre.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const WithTitleAndIcon: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Hoverable: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check" [hoverable]="true">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
  decorators: [darkTheme],
}
