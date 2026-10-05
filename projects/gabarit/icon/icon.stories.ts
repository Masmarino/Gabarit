import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { BUILT_IN_ICONS } from './built-in-icons'
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

const GALLERY = `
  <ul role="list" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(8.5rem, 1fr)); gap:0.75rem;
      margin:0; padding:0; list-style:none; color:var(--text-primary)">
    @for (name of names; track name) {
      <li style="display:flex; flex-direction:column; align-items:center; gap:0.5rem;
          padding:0.75rem 0.25rem; border:1px solid var(--border-color); border-radius:0.5rem">
        <gbt-icon [name]="name" style="font-size:1.75rem" />
        <code style="font-size:0.75rem; color:var(--text-secondary)">{{ name }}</code>
      </li>
    }
  </ul>`

export const Gallery: Story = {
  render: () => ({
    template: GALLERY,
    props: { names: Object.keys(BUILT_IN_ICONS) },
    moduleMetadata: { imports: [Icon] },
  }),
}

export const GalleryDark: Story = {
  ...Gallery,
  decorators: [darkTheme],
}

export const Dark: Story = {
  args: {
    name: 'check',
  },
  decorators: [darkTheme],
}
