import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Icon } from './icon'

const meta: Meta<Icon> = {
  title: 'Atoms/Icon',
  component: Icon,
}

export default meta
type Story = StoryObj<Icon>

export const Nominal: Story = {
  args: {
    name: 'check',
  },
}

export const Unknown: Story = {
  args: {
    name: 'inexistante',
  },
}

export const Dense: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:1rem; font-size:2rem">
        <gbt-icon name="search" /><gbt-icon name="x" /><gbt-icon name="eye" />
        <gbt-icon name="eye-off" /><gbt-icon name="chevron-down" /><gbt-icon name="check" />
      </div>`,
    moduleMetadata: { imports: [Icon] },
  }),
}

export const Dark: Story = {
  args: {
    name: 'check',
  },
  decorators: [darkTheme],
}
