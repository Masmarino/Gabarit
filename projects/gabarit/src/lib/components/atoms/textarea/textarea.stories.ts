import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Textarea } from './textarea'

const meta: Meta<Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
}

export default meta
type Story = StoryObj<Textarea>

export const Empty: Story = {
  args: {
    label: 'Description',
  },
}

export const Filled: Story = {
  render: () => ({
    template: `<gbt-textarea label="Description" [formControl]="control" />`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: { control: new FormControl('Un texte un peu plus long sur plusieurs lignes.') },
  }),
}

export const Error: Story = {
  args: {
    label: 'Description',
    errorMessage: 'Ce champ est obligatoire',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Description',
    disabled: true,
  },
}

export const Dark: Story = {
  args: {
    label: 'Description',
  },
  decorators: [darkTheme],
}
