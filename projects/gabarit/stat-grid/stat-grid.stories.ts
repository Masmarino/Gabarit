import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { withWidgetIcons } from '../.storybook/widget-story-helpers'
import { StatTile } from '../stat-tile/stat-tile'
import { StatTileLink } from '../stat-tile/stat-tile-link'
import { StatGrid } from './stat-grid'

const inFrame = (width: string) =>
  componentWrapperDecorator(
    (story) =>
      `<div style="box-sizing:border-box;width:${width};max-width:100%;padding:1rem;overflow:auto;resize:horizontal;border:1px dashed var(--border-color);background:var(--bg-panel)">${story}</div>`,
  )

const meta: Meta<StatGrid> = {
  title: 'Molecules/StatGrid',
  component: StatGrid,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withWidgetIcons,
    moduleMetadata({ imports: [StatGrid, StatTile, StatTileLink] }),
    inFrame('56rem'),
  ],
  argTypes: {
    columns: { control: 'inline-radio', options: [2, 3, 4, 5, 6] },
  },
  args: {
    ariaLabel: 'Overview',
    columns: 4,
    loading: false,
    loadingCount: 4,
    loadingLabel: 'Loading…',
  },
}

export default meta
type Story = StoryObj<StatGrid>

const tiles = `
  <gbt-stat-tile label="Users" [value]="120" icon="users" hint="3 new this week" />
  <gbt-stat-tile label="Repositories" value="1,284" icon="folder" trend="up" trendLabel="+12 %" trendTone="success" />
  <gbt-stat-tile label="Pipelines today" [value]="46" icon="activity" hint="2 failed" />
  <gbt-stat-tile label="Storage used" value="3.4 GB" icon="database" hint="of 20 GB" />`

const grid = (attrs: string, content = tiles) =>
  `<gbt-stat-grid ${attrs}>${content}</gbt-stat-grid>`

/** Four columns from 600 px of grid width, two below. Drag the corner of the frame to resize it. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: grid(
      '[ariaLabel]="ariaLabel" [columns]="columns" [loading]="loading" [loadingCount]="loadingCount" [loadingLabel]="loadingLabel"',
    ),
  }),
}

export const ThreeColumns: Story = {
  args: { columns: 3 },
  render: Default.render,
}

/** Placeholders the size of a loaded tile, with a polite status for screen readers. */
export const Loading: Story = {
  args: { loading: true },
  render: Default.render,
}

/** The home dashboard: tiles that are links, the empty categories muted. */
export const Dashboard: Story = {
  render: () => ({
    template: grid(
      'ariaLabel="To do"',
      `
      <gbt-stat-tile [value]="4" icon="git-pull-request"><a gbtStatTileLink href="#mr">Merge requests to review</a></gbt-stat-tile>
      <gbt-stat-tile [value]="12" icon="circle-dot"><a gbtStatTileLink href="#issues">Assigned issues</a></gbt-stat-tile>
      <gbt-stat-tile [value]="0" icon="activity" muted><a gbtStatTileLink href="#pipelines">Failed pipelines</a></gbt-stat-tile>
      <gbt-stat-tile [value]="0" icon="bell" muted><a gbtStatTileLink href="#unread">Unread notifications</a></gbt-stat-tile>`,
    ),
  }),
}

/** A narrow frame (a phone, an aside): two columns. */
export const NarrowFrame: Story = {
  decorators: [inFrame('22rem')],
  render: Default.render,
}

/** The container decides, not the viewport: this grid sits in a 40rem frame on a wide page. */
export const MediumFrame: Story = {
  decorators: [inFrame('40rem')],
  render: Default.render,
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: Default.render,
}
