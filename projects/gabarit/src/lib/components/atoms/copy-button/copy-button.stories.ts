import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { CopyButton } from './copy-button'

const meta: Meta<CopyButton> = {
  title: 'Atoms/CopyButton',
  component: CopyButton,
  decorators: [moduleMetadata({ imports: [CopyButton] })],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost', 'ghost-danger', 'link'],
    },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    feedback: { control: 'inline-radio', options: ['bubble', 'inline', 'hidden'] },
  },
  args: {
    value: 'https://forge.example.test/atelier/gabarit.git',
    text: '',
    ariaLabel: 'Copy the clone URL',
    copiedText: 'Copied',
    failedText: 'Copy failed',
    feedbackMs: 2000,
    variant: 'secondary',
    size: 'small',
    feedback: 'bubble',
    disabled: false,
  },
}

export default meta
type Story = StoryObj<CopyButton>

const row = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;padding:3rem 1rem 1rem'

/** Icon-only, named by `ariaLabel`. The outcome floats above the button and is announced. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="${row}"><gbt-copy-button [value]="value" [ariaLabel]="ariaLabel" [copiedText]="copiedText" [failedText]="failedText" [feedbackMs]="feedbackMs" [variant]="variant" [size]="size" [feedback]="feedback" [disabled]="disabled" /></div>`,
  }),
}

/** With a visible label. */
export const WithText: Story = {
  args: { text: 'Copy codes', ariaLabel: null },
  render: (args) => ({
    props: args,
    template: `<div style="${row}"><gbt-copy-button [value]="value" [text]="text" [ariaLabel]="ariaLabel" [variant]="variant" [size]="size" [feedback]="feedback" /></div>`,
  }),
}

/** Where the message is drawn: a bubble above (default), in the flow, or read out only. */
export const FeedbackPlacement: Story = {
  render: () => ({
    template: `
      <div style="${row}">
        <span>bubble</span><gbt-copy-button value="abc" ariaLabel="Copy (bubble)" />
        <span>inline</span><gbt-copy-button value="abc" ariaLabel="Copy (inline)" feedback="inline" />
        <span>hidden</span><gbt-copy-button value="abc" ariaLabel="Copy (screen readers only)" feedback="hidden" />
      </div>`,
  }),
}

/** The variants and sizes of the underlying button. */
export const VariantsAndSizes: Story = {
  render: () => ({
    template: `
      <div style="${row}">
        <gbt-copy-button value="abc" ariaLabel="Copy" variant="secondary" />
        <gbt-copy-button value="abc" ariaLabel="Copy" variant="ghost" />
        <gbt-copy-button value="abc" ariaLabel="Copy" variant="primary" />
        <gbt-copy-button value="abc" ariaLabel="Copy" size="medium" />
        <gbt-copy-button value="abc" ariaLabel="Copy" size="large" />
        <gbt-copy-button value="abc" text="Copy" variant="secondary" />
        <gbt-copy-button value="abc" text="Copy" size="medium" variant="ghost" />
        <gbt-copy-button value="abc" text="Disabled" disabled />
      </div>`,
  }),
}

/**
 * A page without the Clipboard API (plain HTTP) whose fallback is refused too: the failure message
 * shows, `copyFailed` fires and the target is selected for a manual Ctrl+C. The story stubs both
 * browser APIs and restores them afterwards.
 */
export const CopyRefused: Story = {
  beforeEach: () => {
    const nav = navigator as unknown as Record<string, unknown>
    const doc = document as unknown as Record<string, unknown>
    const clipboard = Object.getOwnPropertyDescriptor(nav, 'clipboard')
    const exec = Object.getOwnPropertyDescriptor(doc, 'execCommand')
    Object.defineProperty(nav, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('NotAllowedError')) },
    })
    Object.defineProperty(doc, 'execCommand', { configurable: true, value: () => false })
    return () => {
      if (clipboard) Object.defineProperty(nav, 'clipboard', clipboard)
      else Reflect.deleteProperty(nav, 'clipboard')
      if (exec) Object.defineProperty(doc, 'execCommand', exec)
      else Reflect.deleteProperty(doc, 'execCommand')
    }
  },
  render: () => ({
    template: `
      <div style="${row}">
        <code #code style="font-family:var(--gbt-font-mono);min-width:0;overflow-wrap:anywhere">git clone https://forge.example.test/atelier/gabarit.git</code>
        <gbt-copy-button value="git clone https://forge.example.test/atelier/gabarit.git" ariaLabel="Copy the clone command" [selectTarget]="code" failedText="Copy failed, press Ctrl+C" />
      </div>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: VariantsAndSizes.render,
}
