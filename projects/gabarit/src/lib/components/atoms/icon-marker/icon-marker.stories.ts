import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { withWidgetIcons } from '../../../../../.storybook/widget-story-helpers'
import { IconMarker } from './icon-marker'

const meta: Meta<IconMarker> = {
  title: 'Atoms/IconMarker',
  component: IconMarker,
  decorators: [withWidgetIcons],
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'error', 'info'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['disc', 'tile'] },
    appearance: { control: 'inline-radio', options: ['soft', 'outline'] },
  },
  args: {
    icon: 'key',
    tone: 'neutral',
    size: 'md',
    shape: 'disc',
    appearance: 'soft',
    label: null,
  },
}

export default meta
type Story = StoryObj<IconMarker>

const row = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;padding:1rem'
const TONES = [
  ['neutral', 'key'],
  ['primary', 'settings'],
  ['success', 'check'],
  ['warning', 'alert-triangle'],
  ['error', 'alert-circle'],
  ['info', 'info'],
] as const

const markers = (extra: string) =>
  TONES.map(([tone, icon]) => `<gbt-icon-marker icon="${icon}" tone="${tone}" ${extra} />`).join('')

export const Default: Story = {}

/** Soft (default) and outline, in every tone. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;padding:1rem">
        <div style="${row};padding:0">${markers('')}</div>
        <div style="${row};padding:0">${markers('appearance="outline"')}</div>
      </div>`,
  }),
}

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="${row}">
        <gbt-icon-marker icon="key" size="sm" /><gbt-icon-marker icon="key" size="md" />
        <gbt-icon-marker icon="key" size="lg" /><gbt-icon-marker icon="key" size="xl" />
        <gbt-icon-marker icon="key" size="sm" shape="tile" /><gbt-icon-marker icon="key" size="md" shape="tile" />
        <gbt-icon-marker icon="key" size="lg" shape="tile" /><gbt-icon-marker icon="key" size="xl" shape="tile" />
      </div>`,
  }),
}

export const Tiles: Story = {
  render: () => ({ template: `<div style="${row}">${markers('shape="tile"')}</div>` }),
}

/** A marker that carries a meaning alone is named; the others stay decorative. */
export const WithLabel: Story = {
  args: { icon: 'shield-check', tone: 'success', label: 'Approved' },
}

/** The places the FerrisGit front-end drew them by hand: a timeline event, a key, a decision. */
export const InContext: Story = {
  render: () => ({
    template: `
      <ul style="display:flex;flex-direction:column;gap:0.875rem;max-width:26rem;margin:0;padding:1rem;list-style:none;color:var(--text-primary);font-size:0.875rem">
        <li style="display:flex;align-items:center;gap:0.75rem"><gbt-icon-marker icon="git-commit" size="sm" appearance="outline" /> <span><strong>alice</strong> pushed 3 commits</span></li>
        <li style="display:flex;align-items:center;gap:0.75rem"><gbt-icon-marker icon="check" size="sm" tone="success" /> <span><strong>bastien</strong> approved these changes</span></li>
        <li style="display:flex;align-items:center;gap:0.75rem"><gbt-icon-marker icon="alert-triangle" size="sm" tone="warning" /> <span>The pipeline is <strong>blocked</strong></span></li>
        <li style="display:flex;align-items:center;gap:0.75rem"><gbt-icon-marker icon="key" shape="tile" tone="info" /> <span><strong>Passkey</strong> · added 2 days ago</span></li>
      </ul>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;padding:1rem">
        <div style="${row};padding:0">${markers('')}</div>
        <div style="${row};padding:0">${markers('appearance="outline" shape="tile"')}</div>
      </div>`,
  }),
}
