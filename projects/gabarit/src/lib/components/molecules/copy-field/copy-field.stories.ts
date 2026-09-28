import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { CopyField } from './copy-field'

const CLONE_URL = 'https://forge.example.test/atelier/gabarit/design-system.git'

// A field is set in a column: a page, an aside, a modal.
const inColumn = (width: string) =>
  componentWrapperDecorator(
    (story) =>
      `<div style="box-sizing:border-box;max-width:${width};padding:3rem 1rem 1rem">${story}</div>`,
  )

const meta: Meta<CopyField> = {
  title: 'Molecules/CopyField',
  component: CopyField,
  decorators: [inColumn('32rem')],
  argTypes: {
    feedback: { control: 'inline-radio', options: ['bubble', 'inline', 'hidden'] },
  },
  args: {
    value: CLONE_URL,
    label: null,
    copyLabel: 'Copy the clone URL',
    copiedText: 'Copied',
    failedText: 'Copy failed, value selected',
    feedbackMs: 2000,
    feedback: 'bubble',
  },
}

export default meta
type Story = StoryObj<CopyField>

/** A clone URL: wraps after each `/`, one click selects it all, the button copies it. */
export const Default: Story = {}

/** A visible label, which also names the group for screen readers. */
export const WithLabel: Story = { args: { label: 'Clone with HTTPS' } }

/** The confirmation in the flow instead of a floating pill (where a bubble would be clipped). */
export const InlineFeedback: Story = { args: { label: 'Webhook URL', feedback: 'inline' } }

/** A long unbroken token wraps anywhere rather than overflowing or scrolling. */
export const LongToken: Story = {
  args: {
    label: 'Token',
    value: 'frg_pat_9f3c1a7be2d04c58a1b6e0f4d7c83ab2e5d1f09a7c64b83d2e1f5a09c7b3d84e6',
  },
}

/** In a 240 px aside the value wraps between path segments. */
export const NarrowAside: Story = {
  decorators: [inColumn('15rem')],
}

/** No wrap opportunity is added (`wrapAt` is `null`): only `overflow-wrap: anywhere` breaks it. */
export const NoWrapHints: Story = { args: { wrapAt: null } }

export const Dark: Story = {
  decorators: [darkTheme],
  args: { label: 'Clone with HTTPS' },
}
