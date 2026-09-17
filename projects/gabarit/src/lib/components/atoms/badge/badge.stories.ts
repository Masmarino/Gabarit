import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Badge } from './badge'

const meta: Meta<Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
}

export default meta
type Story = StoryObj<Badge>

export const Neutral: Story = {
  render: () => ({
    template: `<gbt-badge>Brouillon</gbt-badge>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge>Neutre</gbt-badge>
        <gbt-badge variant="success">Actif</gbt-badge>
        <gbt-badge variant="warning">Quota à 90%</gbt-badge>
        <gbt-badge variant="error">Désactivé</gbt-badge>
        <gbt-badge variant="info">Bêta</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const WithIcon: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge variant="success" icon="check-circle">Vérifié</gbt-badge>
        <gbt-badge variant="error" icon="alert-triangle">Erreur</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const InContext: Story = {
  render: () => ({
    template: `
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.5rem">
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>ada.lovelace</span>
          <gbt-badge variant="success">Actif</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>alan.turing</span>
          <gbt-badge variant="error">Désactivé</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>grace.hopper</span>
          <gbt-badge>Invité</gbt-badge>
        </li>
      </ul>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge>Neutre</gbt-badge>
        <gbt-badge variant="success">Actif</gbt-badge>
        <gbt-badge variant="warning">Quota à 90%</gbt-badge>
        <gbt-badge variant="error">Désactivé</gbt-badge>
        <gbt-badge variant="info">Bêta</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
  decorators: [darkTheme],
}
