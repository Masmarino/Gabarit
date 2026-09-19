import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Divider } from './divider'

const meta: Meta<Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
}

export default meta
type Story = StoryObj<Divider>

export const Horizontal: Story = {
  render: () => ({
    template: `
      <div style="width: 320px">
        <p style="margin:0">Section one</p>
        <gbt-divider style="margin: 1rem 0" />
        <p style="margin:0">Section two</p>
      </div>
    `,
    moduleMetadata: { imports: [Divider] },
  }),
}

export const WithLabel: Story = {
  name: 'With a centered label',
  render: () => ({
    template: `
      <div style="width: 320px">
        <button type="button" style="width:100%">Continuer avec Google</button>
        <gbt-divider label="OU" style="margin: 1rem 0" />
        <button type="button" style="width:100%">Continuer avec un email</button>
      </div>
    `,
    moduleMetadata: { imports: [Divider] },
  }),
}

export const Vertical: Story = {
  render: () => ({
    template: `
      <div style="display:flex; align-items:center; gap:0.75rem; height:24px">
        <span>Profil</span>
        <gbt-divider orientation="vertical" />
        <span>Paramètres</span>
        <gbt-divider orientation="vertical" />
        <span>Déconnexion</span>
      </div>
    `,
    moduleMetadata: { imports: [Divider] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="width: 320px">
        <p style="margin:0">Section one</p>
        <gbt-divider label="OU" style="margin: 1rem 0" />
        <p style="margin:0">Section two</p>
      </div>
    `,
    moduleMetadata: { imports: [Divider] },
  }),
  decorators: [darkTheme],
}
