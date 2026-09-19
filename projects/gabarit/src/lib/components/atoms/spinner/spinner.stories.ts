import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Spinner } from './spinner'

const meta: Meta<Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
}

export default meta
type Story = StoryObj<Spinner>

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:1rem">
        <gbt-spinner size="sm" />
        <gbt-spinner size="md" />
        <gbt-spinner size="lg" />
      </div>
    `,
    moduleMetadata: { imports: [Spinner] },
  }),
}

export const InACard: Story = {
  name: 'Loading a panel',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.75rem;width:240px;padding:2rem;border:1px solid var(--border-color);border-radius:8px">
        <gbt-spinner size="lg" label="Chargement des résultats…" />
        <span style="font-size:13px;color:var(--text-secondary)">Chargement…</span>
      </div>
    `,
    moduleMetadata: { imports: [Spinner] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-spinner size="lg" />`,
    moduleMetadata: { imports: [Spinner] },
  }),
  decorators: [darkTheme],
}
