import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Switch } from './switch'

const meta: Meta<Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
}

export default meta
type Story = StoryObj<Switch>

export const Unchecked: Story = {
  args: {
    label: 'Recevoir les notifications',
  },
}

export const Checked: Story = {
  render: () => ({
    template: `<gbt-switch label="Recevoir les notifications" [formControl]="control" />`,
    moduleMetadata: { imports: [Switch, ReactiveFormsModule] },
    props: { control: new FormControl(true) },
  }),
}

export const Disabled: Story = {
  args: {
    label: 'Recevoir les notifications',
    disabled: true,
  },
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-switch label="Recevoir les notifications" [formControl]="control" />`,
    moduleMetadata: { imports: [Switch, ReactiveFormsModule] },
    props: { control: new FormControl(true) },
  }),
  decorators: [darkTheme],
}
