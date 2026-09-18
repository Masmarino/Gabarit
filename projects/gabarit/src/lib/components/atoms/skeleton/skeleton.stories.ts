import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Skeleton } from './skeleton'

const meta: Meta<Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
}

export default meta
type Story = StoryObj<Skeleton>

export const Text: Story = {
  args: {
    variant: 'text',
    width: '240px',
  },
}

export const Circle: Story = {
  args: {
    variant: 'circle',
    width: '40px',
  },
}

export const Rect: Story = {
  args: {
    variant: 'rect',
    width: '240px',
    height: '140px',
  },
}

export const TextLines: Story = {
  name: 'Composition: paragraph of text lines',
  render: () => ({
    template: `
      <div
        role="status"
        aria-label="Chargement en cours"
        style="display:flex;flex-direction:column;gap:0.5rem;width:280px"
      >
        <gbt-skeleton variant="text" width="100%" />
        <gbt-skeleton variant="text" width="100%" />
        <gbt-skeleton variant="text" width="60%" />
      </div>
    `,
    moduleMetadata: { imports: [Skeleton] },
  }),
}

export const ListRow: Story = {
  name: 'Composition: avatar list row',
  render: () => ({
    template: `
      <div
        role="status"
        aria-label="Chargement en cours"
        style="display:flex;align-items:center;gap:0.75rem;width:280px"
      >
        <gbt-skeleton variant="circle" width="40px" />
        <div style="flex:1;display:flex;flex-direction:column;gap:0.375rem">
          <gbt-skeleton variant="text" width="60%" />
          <gbt-skeleton variant="text" width="90%" />
        </div>
      </div>
    `,
    moduleMetadata: { imports: [Skeleton] },
  }),
}

export const Card: Story = {
  name: 'Composition: card',
  render: () => ({
    template: `
      <div
        role="status"
        aria-label="Chargement en cours"
        style="display:flex;flex-direction:column;gap:0.75rem;width:240px"
      >
        <gbt-skeleton variant="rect" width="100%" height="140px" />
        <gbt-skeleton variant="text" width="80%" />
        <gbt-skeleton variant="text" width="50%" />
      </div>
    `,
    moduleMetadata: { imports: [Skeleton] },
  }),
}

export const Dark: Story = {
  name: 'Composition: card (dark)',
  render: () => ({
    template: `
      <div
        role="status"
        aria-label="Chargement en cours"
        style="display:flex;flex-direction:column;gap:0.75rem;width:240px"
      >
        <gbt-skeleton variant="rect" width="100%" height="140px" />
        <gbt-skeleton variant="text" width="80%" />
        <gbt-skeleton variant="text" width="50%" />
      </div>
    `,
    moduleMetadata: { imports: [Skeleton] },
  }),
  decorators: [darkTheme],
}
