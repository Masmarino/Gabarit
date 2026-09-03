import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Menu } from './menu'

const meta: Meta<Menu> = {
  title: 'Molecules/Menu',
  component: Menu,
}

export default meta
type Story = StoryObj<Menu>

const elements = `
  <a role="menuitem" class="gbt-menu__item" href="#">Mon compte</a>
  <button role="menuitem" class="gbt-menu__item" type="button">Déconnexion</button>
`

export const UserAccount: Story = {
  render: () => ({
    template: `<gbt-menu label="Mon compte">${elements}</gbt-menu>`,
    moduleMetadata: { imports: [Menu] },
  }),
}

export const AlignEnd: Story = {
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end">
        <gbt-menu label="Mon compte" align="end">${elements}</gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-menu label="Mon compte">${elements}</gbt-menu>`,
    moduleMetadata: { imports: [Menu] },
  }),
  decorators: [darkTheme],
}
