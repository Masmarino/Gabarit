import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { GbtInput } from './input'

const meta: Meta<GbtInput> = {
  title: 'Atoms/Input',
  component: GbtInput,
}

export default meta
type Story = StoryObj<GbtInput>

export const Empty: Story = {
  args: {
    label: 'Nom',
  },
}

export const Filled: Story = {
  render: () => ({
    template: `<gbt-input label="Nom" [formControl]="control" />`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { control: new FormControl('Florian Simon') },
  }),
}

export const Password: Story = {
  args: {
    label: 'Mot de passe',
    type: 'password',
  },
}

export const Email: Story = {
  args: {
    label: 'Adresse électronique',
    type: 'email',
    placeholder: 'prenom.nom@exemple.fr',
  },
}

export const Error: Story = {
  args: {
    label: 'Nom',
    errorMessage: 'Ce champ est obligatoire',
  },
}

export const Dark: Story = {
  args: {
    label: 'Nom',
  },
  decorators: [darkTheme],
}
