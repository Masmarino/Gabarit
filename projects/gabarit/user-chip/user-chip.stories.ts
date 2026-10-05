import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { UserChip } from './user-chip'

const meta: Meta<UserChip> = {
  title: 'Molecules/UserChip',
  component: UserChip,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: { name: 'Alice Martin', size: 'sm' },
}

export default meta
type Story = StoryObj<UserChip>

/** 24px avatar: rows, banners, meta lines. */
export const Small: Story = {}

/** 32px avatar: panels and headers. */
export const Medium: Story = {
  args: { size: 'md' },
}

/** A single-word login. */
export const Login: Story = {
  args: { name: 'florian' },
}

/** A picture instead of the initials; the initials come back if it fails to load. */
export const WithPicture: Story = {
  args: {
    name: 'Alice Martin',
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23f59e0b'/><circle cx='16' cy='13' r='6' fill='%23fff7ed'/><path d='M4 32c2-8 8-11 12-11s10 3 12 11z' fill='%23fff7ed'/></svg>",
  },
}

/** A long name in a narrow (180px) space truncates with an ellipsis; the full name is in the tooltip. */
export const LongNameTruncated: Story = {
  args: { name: 'Marie-Hélène de La Tour d’Auvergne-Lauraguais' },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="width: 180px; padding: 0.5rem; border: 1px dashed var(--border-color);">${story}</div>`,
    ),
  ],
}

/** Inline in running text, as in a meta line. */
export const InMetaLine: Story = {
  render: (args) => ({
    props: args,
    template: `<p style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; margin: 0; color: var(--text-secondary); font-size: 0.875rem;"><gbt-user-chip [name]="name" [size]="size" /> opened this issue 2 days ago</p>`,
  }),
}

/** In a list of contributors, as in a side panel. */
export const Contributors: Story = {
  args: { size: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <ul style="display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none;">
        <li><gbt-user-chip name="Florian Simon" [size]="size" /></li>
        <li><gbt-user-chip name="Alice Martin" [size]="size" /></li>
        <li><gbt-user-chip name="Bastien Petit" [size]="size" /></li>
      </ul>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  args: { size: 'md' },
}
