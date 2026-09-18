import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Tag } from './tag'

const meta: Meta<Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
}
export default meta
type Story = StoryObj<Tag>

export const Default: Story = {
  render: () => ({
    template: `<gbt-tag color="#1a1a2e">Bug</gbt-tag>`,
    moduleMetadata: { imports: [Tag] },
  }),
}

export const Removable: Story = {
  render: () => ({
    template: `<gbt-tag color="#0b6e4f" [removable]="true" removeLabel="Retirer Feature">Feature</gbt-tag>`,
    moduleMetadata: { imports: [Tag] },
  }),
}

export const ManyColors: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <gbt-tag color="#dc2626">Critique</gbt-tag>
        <gbt-tag color="#ea580c">Haute</gbt-tag>
        <gbt-tag color="#ca8a04">Moyenne</gbt-tag>
        <gbt-tag color="#16a34a">Basse</gbt-tag>
        <gbt-tag color="#2563eb">Documentation</gbt-tag>
        <gbt-tag color="#7c3aed">UX</gbt-tag>
      </div>
    `,
    moduleMetadata: { imports: [Tag] },
  }),
}

export const InContext: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>#42 Le bouton de connexion ne répond pas</span>
        <gbt-tag color="#dc2626">Bug</gbt-tag>
        <gbt-tag color="#ea580c">Haute</gbt-tag>
      </div>
    `,
    moduleMetadata: { imports: [Tag] },
  }),
}

export const Dark: Story = {
  ...ManyColors,
  decorators: [darkTheme],
}
