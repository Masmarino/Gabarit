import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { withWidgetIcons } from '../.storybook/widget-story-helpers'
import { StatGrid } from '../stat-grid/stat-grid'
import { StatTile } from './stat-tile'
import { StatTileLink } from './stat-tile-link'

// A tile is shown at the width it has in a 4-column grid.
const inCell = (width: string) =>
  componentWrapperDecorator(
    (story) => `<div style="box-sizing:border-box;width:${width};padding:1rem">${story}</div>`,
  )

const meta: Meta<StatTile> = {
  title: 'Molecules/StatTile',
  component: StatTile,
  decorators: [
    withWidgetIcons,
    moduleMetadata({ imports: [StatTile, StatTileLink, StatGrid] }),
    inCell('14rem'),
  ],
  argTypes: {
    iconTone: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'error', 'info'],
    },
    trend: { control: 'inline-radio', options: [null, 'up', 'down', 'flat'] },
    trendTone: { control: 'inline-radio', options: ['neutral', 'success', 'error'] },
  },
  args: {
    label: 'Open issues',
    value: 12,
    icon: 'circle-dot',
    iconTone: 'info',
    hint: null,
    trend: null,
    trendLabel: null,
    trendTone: 'neutral',
    href: null,
    muted: false,
  },
}

export default meta
type Story = StoryObj<StatTile>

export const Default: Story = {}

export const WithHintAndTrend: Story = {
  args: {
    label: 'Repositories',
    value: '1,284',
    icon: 'folder',
    hint: 'last 30 days',
    trend: 'up',
    trendLabel: '+12 %',
    trendTone: 'success',
  },
}

export const TrendDown: Story = {
  args: {
    label: 'Failed pipelines',
    value: 7,
    icon: 'alert-triangle',
    iconTone: 'error',
    trend: 'down',
    trendLabel: '-3 this week',
    trendTone: 'success',
  },
}

/** A category with nothing in it steps back so the tiles that need attention stand out. */
export const Muted: Story = { args: { label: 'Merge requests to review', value: 0, muted: true } }

export const NoIcon: Story = { args: { icon: null, label: 'Storage used', value: '3.4 GB' } }

/** The whole tile is the link: the label is its text, keyboard focus outlines the tile. */
export const AsALink: Story = {
  args: { href: '#issues' },
}

/** With a router: project the anchor (`<a gbtStatTileLink [routerLink]="…">`). */
export const ProjectedLink: Story = {
  render: () => ({
    template: `<gbt-stat-tile [value]="12" icon="circle-dot"><a gbtStatTileLink href="#issues">Open issues</a></gbt-stat-tile>`,
  }),
}

/** A long label wraps on two lines; a long figure is cut, never overflowing. */
export const LongLabelAndFigure: Story = {
  decorators: [inCell('10rem')],
  args: {
    label: 'Merge requests waiting for your review',
    value: '1,234,567,890',
    icon: 'git-pull-request',
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
  args: {
    label: 'Repositories',
    value: '1,284',
    icon: 'folder',
    hint: 'last 30 days',
    trend: 'up',
    trendLabel: '+12 %',
    trendTone: 'success',
  },
}
