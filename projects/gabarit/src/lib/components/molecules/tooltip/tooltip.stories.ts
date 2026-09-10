import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Tooltip } from './tooltip'

const meta: Meta<Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
}

export default meta
type Story = StoryObj<Tooltip>

export const Basic: Story = {
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-tooltip text="Supprimer définitivement">
          <button type="button">Survoler ou tabuler ici</button>
        </gbt-tooltip>
      </div>
    `,
    moduleMetadata: { imports: [Tooltip] },
  }),
}

export const Open: Story = {
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-tooltip text="Supprimer définitivement">
          <button type="button" autofocus>Ouvert au chargement (focus)</button>
        </gbt-tooltip>
      </div>
    `,
    moduleMetadata: { imports: [Tooltip] },
  }),
}

export const Positions: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:4rem;padding:4rem">
        <gbt-tooltip text="En haut" position="top">
          <button type="button" autofocus>top</button>
        </gbt-tooltip>
        <gbt-tooltip text="En bas" position="bottom">
          <button type="button">bottom</button>
        </gbt-tooltip>
        <gbt-tooltip text="À gauche" position="left">
          <button type="button">left</button>
        </gbt-tooltip>
        <gbt-tooltip text="À droite" position="right">
          <button type="button">right</button>
        </gbt-tooltip>
      </div>
    `,
    moduleMetadata: { imports: [Tooltip] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-tooltip text="Supprimer définitivement">
          <button type="button" autofocus>Ouvert au chargement (focus)</button>
        </gbt-tooltip>
      </div>
    `,
    moduleMetadata: { imports: [Tooltip] },
  }),
  decorators: [darkTheme],
}
