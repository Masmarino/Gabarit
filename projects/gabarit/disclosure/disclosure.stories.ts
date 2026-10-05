import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { withWidgetIcons } from '../.storybook/widget-story-helpers'
import { GbtInput } from '../input/input'
import { Switch } from '../switch/switch'
import { Disclosure } from './disclosure'

const inColumn = componentWrapperDecorator(
  (story) => `<div style="box-sizing:border-box;max-width:32rem;padding:1rem">${story}</div>`,
)

const meta: Meta<Disclosure> = {
  title: 'Molecules/Disclosure',
  component: Disclosure,
  decorators: [
    withWidgetIcons,
    moduleMetadata({ imports: [Disclosure, GbtInput, Switch] }),
    inColumn,
  ],
  argTypes: {
    appearance: { control: 'inline-radio', options: ['bordered', 'plain'] },
    headingLevel: { control: 'inline-radio', options: [null, 2, 3, 4, 5, 6] },
  },
  args: {
    label: 'Advanced options',
    open: false,
    icon: null,
    appearance: 'bordered',
    headingLevel: null,
  },
}

export default meta
type Story = StoryObj<Disclosure>

const advanced = `
  <div style="display:flex;flex-direction:column;gap:1rem">
    <gbt-switch name="ci" label="CI enabled" />
    <gbt-input name="approvals" label="Approvals required before merge" />
    <gbt-input name="pipeline" label="Pipeline file path" />
  </div>`

/** "Advanced options" of a creation form: closed, the panel is inert. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<gbt-disclosure [label]="label" [(open)]="open" [icon]="icon" [appearance]="appearance" [headingLevel]="headingLevel">${advanced}</gbt-disclosure>`,
  }),
}

export const Open: Story = { args: { open: true }, render: Default.render }

/** With a leading icon: the "Files" toggle of a narrow layout. */
export const WithIcon: Story = {
  args: { label: 'Files', icon: 'folder', open: true },
  render: (args) => ({
    props: args,
    template: `<gbt-disclosure [label]="label" [(open)]="open" [icon]="icon"><ul style="margin:0;padding-left:1.25rem;color:var(--text-primary);font-size:0.875rem;line-height:1.75"><li>src/</li><li>README.md</li><li>Cargo.toml</li></ul></gbt-disclosure>`,
  }),
}

/** The toggle titles a section: it is wrapped in a heading of the chosen level. */
export const AsAHeading: Story = {
  args: { label: 'Danger zone', headingLevel: 3, open: true, icon: 'alert-triangle' },
  render: (args) => ({
    props: args,
    template: `<gbt-disclosure [label]="label" [(open)]="open" [icon]="icon" [headingLevel]="headingLevel"><p style="margin:0;color:var(--text-primary);font-size:0.875rem">Deleting a repository cannot be undone.</p></gbt-disclosure>`,
  }),
}

/** No frame: the toggle sits on the page, the panel follows. */
export const Plain: Story = {
  args: { appearance: 'plain', label: 'Show more details', open: true },
  render: (args) => ({
    props: args,
    template: `<gbt-disclosure [label]="label" [(open)]="open" [appearance]="appearance"><p style="margin:0;color:var(--text-primary);font-size:0.875rem;line-height:1.6">Runners poll the server every 5 seconds and take the oldest pending job that matches their tags.</p></gbt-disclosure>`,
  }),
}

/** Several independent disclosures: each keeps its own state (unlike an accordion's single mode). */
export const Several: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-disclosure label="Build" [open]="true"><p style="margin:0;color:var(--text-primary);font-size:0.875rem">cargo build --release</p></gbt-disclosure>
        <gbt-disclosure label="Test"><p style="margin:0;color:var(--text-primary);font-size:0.875rem">cargo test</p></gbt-disclosure>
        <gbt-disclosure label="Deploy" [open]="true"><p style="margin:0;color:var(--text-primary);font-size:0.875rem">manual</p></gbt-disclosure>
      </div>`,
  }),
}

export const Dark: Story = { decorators: [darkTheme], args: { open: true }, render: Default.render }
