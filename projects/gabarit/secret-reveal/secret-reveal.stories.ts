import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { SecretReveal } from './secret-reveal'

const SECRET = 'frg_runner_9f3c1a7be2d04c58a1b6e0f4d7c83ab2'

const inColumn = (width: string) =>
  componentWrapperDecorator(
    (story) =>
      `<div style="box-sizing:border-box;max-width:${width};padding:3rem 1rem 1rem">${story}</div>`,
  )

const meta: Meta<SecretReveal> = {
  title: 'Molecules/SecretReveal',
  component: SecretReveal,
  decorators: [inColumn('32rem')],
  argTypes: {
    feedback: { control: 'inline-radio', options: ['bubble', 'inline', 'hidden'] },
  },
  args: {
    value: SECRET,
    revealed: false,
    label: 'Runner token',
    showLabel: 'Show the token',
    hideLabel: 'Hide the token',
    hiddenLabel: 'Token hidden',
    copyLabel: 'Copy the token',
    copiedText: 'Copied',
    failedText: 'Copy failed, token shown and selected',
    maskLength: 24,
    feedback: 'bubble',
  },
}

export default meta
type Story = StoryObj<SecretReveal>

/** Masked: the secret is not in the DOM. Show it, or copy it without ever showing it. */
export const Masked: Story = {}

/** A one-time secret shown on arrival. */
export const Revealed: Story = { args: { revealed: true } }

/** Inside a one-time token card, as for a freshly registered runner. */
export const OneTimeTokenCard: Story = {
  args: { revealed: true },
  render: (args) => ({
    props: args,
    template: `
      <section style="border:1px solid var(--gbt-card-border);border-radius:var(--site-border-radius);background:var(--bg-principal);overflow:hidden">
        <header style="padding:0.75rem 1rem;background:var(--color-warning-bg);color:var(--color-warning-bg-text);font-size:0.875rem;font-weight:600">
          Copy it now: it will never be shown again.
        </header>
        <div style="padding:1rem;display:flex;flex-direction:column;gap:0.75rem;color:var(--text-primary);font-size:0.875rem">
          <p style="margin:0">Give it to the runner in the <code style="font-family:var(--gbt-font-mono)">FERRISGIT_RUNNER_TOKEN</code> variable.</p>
          <gbt-secret-reveal [value]="value" [revealed]="revealed" [label]="label" [showLabel]="showLabel" [hideLabel]="hideLabel" [hiddenLabel]="hiddenLabel" [copyLabel]="copyLabel" [feedback]="feedback" />
        </div>
      </section>`,
  }),
}

/** Copy feedback in the flow, for a footer row. */
export const InlineFeedback: Story = { args: { feedback: 'inline', label: null } }

export const Narrow: Story = { decorators: [inColumn('15rem')], args: { revealed: true } }

export const Dark: Story = { decorators: [darkTheme], args: { revealed: false } }
