import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../.storybook/preview'
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

export const WithHint: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:22rem">
        <gbt-switch
          label="Publier immédiatement"
          hint="La version sera visible par tous dès l'enregistrement."
          [formControl]="publish"
        />
        <gbt-switch
          label="Envoyer un résumé quotidien"
          hint="Un e-mail par jour, à 8 h, avec l'activité des dépôts que vous suivez."
          [formControl]="digest"
        />
        <gbt-switch label="Sans description" [formControl]="digest" />
      </div>
    `,
    moduleMetadata: { imports: [Switch, ReactiveFormsModule] },
    props: { publish: new FormControl(true), digest: new FormControl(false) },
  }),
}

export const HintDisabled: Story = {
  name: 'Hint, disabled',
  args: {
    label: 'Recevoir les notifications',
    hint: 'Géré par votre administrateur.',
    disabled: true,
  },
}

export const DarkWithHint: Story = {
  name: 'Dark with hint',
  render: () => ({
    template: `
      <div style="max-width:22rem">
        <gbt-switch
          label="Publier immédiatement"
          hint="La version sera visible par tous dès l'enregistrement."
          [formControl]="control"
        />
      </div>
    `,
    moduleMetadata: { imports: [Switch, ReactiveFormsModule] },
    props: { control: new FormControl(true) },
  }),
  decorators: [darkTheme],
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-switch label="Recevoir les notifications" [formControl]="control" />`,
    moduleMetadata: { imports: [Switch, ReactiveFormsModule] },
    props: { control: new FormControl(true) },
  }),
  decorators: [darkTheme],
}
