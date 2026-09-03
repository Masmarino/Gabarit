import type { Meta, StoryObj } from '@storybook/angular-vite'
import { GaugeBar } from './gauge-bar'

const meta: Meta<GaugeBar> = { title: 'Atoms/Dataviz/GaugeBar', component: GaugeBar }
export default meta
type Story = StoryObj<GaugeBar>

const template = `
  <gbt-gauge-bar [label]="label" [value]="value" [max]="max"
    [formattedValue]="formattedValue" warningLabel="Avertissement"
    criticalLabel="Critique" />
`

export const Nominal: Story = {
  render: () => ({
    props: {
      value: 257,
      max: 500,
      label: 'Quota du registre Docker',
      formattedValue: '257 Gio / 500 Gio',
    },
    template: template,
    moduleMetadata: { imports: [GaugeBar] },
  }),
}

export const Warning: Story = {
  render: () => ({
    props: {
      value: 355,
      max: 500,
      label: 'Quota du registre Docker',
      formattedValue: '355 Gio / 500 Gio',
    },
    template: template,
    moduleMetadata: { imports: [GaugeBar] },
  }),
}

export const Critical: Story = {
  render: () => ({
    props: {
      value: 465,
      max: 500,
      label: 'Quota du registre Docker',
      formattedValue: '465 Gio / 500 Gio',
    },
    template: template,
    moduleMetadata: { imports: [GaugeBar] },
  }),
}

export const Dense: Story = {
  render: () => ({
    props: {
      value: 481,
      max: 500,
      label: 'Quota du registre npm — organisation acme-corporate-platform-engineering',
      formattedValue: '481 Gio / 500 Gio',
    },
    template: template,
    moduleMetadata: { imports: [GaugeBar] },
  }),
}
