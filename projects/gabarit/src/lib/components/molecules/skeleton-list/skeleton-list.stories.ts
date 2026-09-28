import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { SkeletonList } from './skeleton-list'

// The rows sit in a bordered card, as in a list page.
const inCard = componentWrapperDecorator(
  (story) =>
    `<div style="box-sizing:border-box;max-width:36rem;margin:1rem;border:1px solid var(--gbt-card-border);border-radius:var(--site-border-radius);background:var(--bg-principal);overflow:hidden">${story}</div>`,
)

const meta: Meta<SkeletonList> = {
  title: 'Molecules/SkeletonList',
  component: SkeletonList,
  decorators: [inCard],
  argTypes: {
    leading: { control: 'inline-radio', options: ['circle', 'square', 'none'] },
    lines: { control: 'inline-radio', options: [1, 2, 3] },
  },
  args: {
    rows: 4,
    leading: 'circle',
    leadingSize: '1rem',
    lines: 2,
    loadingLabel: 'Loading…',
    divided: true,
    padded: true,
  },
}

export default meta
type Story = StoryObj<SkeletonList>

/** A status dot and two lines: an issue, a pipeline, a runner. */
export const Default: Story = {}

/** Avatars and two lines: a list of people. */
export const Avatars: Story = { args: { leadingSize: '2.25rem', rows: 3 } }

/** Square blocks: files, repositories. */
export const Squares: Story = { args: { leading: 'square', leadingSize: '1.5rem' } }

/** One line and nothing before it: a settings section, a table. */
export const SingleLine: Story = { args: { leading: 'none', lines: 1, rows: 5 } }

export const ThreeLines: Story = { args: { lines: 3, leadingSize: '2rem', rows: 3 } }

/** Bare: no side padding and no hairlines, for a list that has its own frame. */
export const Bare: Story = { args: { padded: false, divided: false } }

export const Dark: Story = { decorators: [darkTheme] }
