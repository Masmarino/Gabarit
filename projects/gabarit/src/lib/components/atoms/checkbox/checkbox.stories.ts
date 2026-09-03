import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Checkbox } from './checkbox'

const meta: Meta<Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
}

export default meta
type Story = StoryObj<Checkbox>

export const Unchecked: Story = {
  args: {
    label: 'Recevoir les notifications',
  },
}

export const Checked: Story = {
  render: () => ({
    template: `<gbt-checkbox label="Recevoir les notifications" [formControl]="control" />`,
    moduleMetadata: { imports: [Checkbox, ReactiveFormsModule] },
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
  args: {
    label: 'Recevoir les notifications',
  },
  decorators: [darkTheme],
}
