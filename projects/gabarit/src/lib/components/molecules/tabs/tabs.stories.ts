import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Tabs } from './tabs'
import { Tab } from '../tab/tab'

const meta: Meta<Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  decorators: [moduleMetadata({ imports: [Tabs, Tab] })],
}

export default meta
type Story = StoryObj<Tabs>

export const Nominal: Story = {
  render: () => ({
    template: `
      <gbt-tabs>
        <gbt-tab label="Vue d'ensemble">Contenu du premier onglet.</gbt-tab>
        <gbt-tab label="Détails">Contenu du second onglet.</gbt-tab>
      </gbt-tabs>`,
  }),
}

export const Empty: Story = {
  render: () => ({
    template: `<gbt-tabs></gbt-tabs>`,
  }),
}

export const Dense: Story = {
  render: () => ({
    template: `
      <gbt-tabs>
        <gbt-tab label="Un">1</gbt-tab><gbt-tab label="Deux">2</gbt-tab>
        <gbt-tab label="Trois">3</gbt-tab><gbt-tab label="Quatre">4</gbt-tab>
        <gbt-tab label="Cinq">5</gbt-tab><gbt-tab label="Six">6</gbt-tab>
        <gbt-tab label="Un libellé nettement plus long que les autres">7</gbt-tab>
      </gbt-tabs>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: () => ({
    template: `
      <gbt-tabs>
        <gbt-tab label="Vue d'ensemble">Contenu du premier onglet.</gbt-tab>
        <gbt-tab label="Détails">Contenu du second onglet.</gbt-tab>
      </gbt-tabs>`,
  }),
}
