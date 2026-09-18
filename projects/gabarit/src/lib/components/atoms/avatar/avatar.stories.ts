import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Avatar } from './avatar'

const meta: Meta<Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
}

export default meta
type Story = StoryObj<Avatar>

export const Initials: Story = {
  args: {
    name: 'Ada Lovelace',
  },
}

export const WithImage: Story = {
  args: {
    name: 'Grace Hopper',
    src: 'https://i.pravatar.cc/150?img=47',
  },
}

export const BrokenImage: Story = {
  name: 'Broken image falls back to initials',
  args: {
    name: 'Katherine Johnson',
    src: 'https://example.com/does-not-exist.jpg',
  },
}

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:1rem">
        <gbt-avatar name="Ada Lovelace" size="sm" />
        <gbt-avatar name="Ada Lovelace" size="md" />
        <gbt-avatar name="Ada Lovelace" size="lg" />
      </div>
    `,
    moduleMetadata: { imports: [Avatar] },
  }),
}

export const InAList: Story = {
  render: () => ({
    template: `
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.75rem">
        <li style="display:flex;align-items:center;gap:0.625rem">
          <gbt-avatar name="Ada Lovelace" size="sm" />
          <span>Ada Lovelace</span>
        </li>
        <li style="display:flex;align-items:center;gap:0.625rem">
          <gbt-avatar name="Alan Turing" size="sm" src="https://i.pravatar.cc/150?img=12" />
          <span>Alan Turing</span>
        </li>
        <li style="display:flex;align-items:center;gap:0.625rem">
          <gbt-avatar name="Grace Hopper" size="sm" />
          <span>Grace Hopper</span>
        </li>
      </ul>
    `,
    moduleMetadata: { imports: [Avatar] },
  }),
}

export const Dark: Story = {
  args: {
    name: 'Ada Lovelace',
  },
  decorators: [darkTheme],
}
