import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { SegmentedControl } from './segmented-control'

const meta: Meta<SegmentedControl> = {
  title: 'Molecules/SegmentedControl',
  component: SegmentedControl,
}

export default meta
type Story = StoryObj<SegmentedControl>

const periodOptions = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export const Nominal: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
  },
}

export const WithDisabledOption: Story = {
  name: 'With a disabled option',
  args: {
    options: [
      { value: 'day', label: 'Jour' },
      { value: 'week', label: 'Semaine', disabled: true },
      { value: 'month', label: 'Mois' },
    ],
    value: 'day',
    ariaLabel: 'Période',
  },
}

export const Disabled: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
    disabled: true,
  },
}

export const Dark: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
  },
  decorators: [darkTheme],
}
