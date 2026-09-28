import type { Meta, StoryObj } from '@storybook/angular-vite'
import { signal } from '@angular/core'
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

export const WithHint: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:22rem">
        <gbt-checkbox
          label="Se souvenir de moi"
          hint="Uniquement sur cet appareil, pendant 30 jours."
          [formControl]="remember"
        />
        <gbt-checkbox label="Sans description" [formControl]="remember" />
      </div>
    `,
    moduleMetadata: { imports: [Checkbox, ReactiveFormsModule] },
    props: { remember: new FormControl(true) },
  }),
}

/** Without Angular forms: `[checked]` sets the state, `(checkedChange)` follows it. */
export const CheckedModel: Story = {
  name: 'Checked model (no forms)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-checkbox
          label="Ouvrir dans un nouvel onglet"
          [checked]="on()"
          (checkedChange)="on.set($event)"
        />
        <p style="margin:0;font-size:0.8125rem;color:var(--text-secondary)">
          État du parent : <strong>{{ on() ? 'coché' : 'décoché' }}</strong>
        </p>
      </div>
    `,
    moduleMetadata: { imports: [Checkbox] },
    props: { on: signal(true) },
  }),
}

export const DarkWithHint: Story = {
  name: 'Dark with hint',
  render: () => ({
    template: `
      <div style="max-width:22rem">
        <gbt-checkbox
          label="Se souvenir de moi"
          hint="Uniquement sur cet appareil, pendant 30 jours."
          [formControl]="remember"
        />
      </div>
    `,
    moduleMetadata: { imports: [Checkbox, ReactiveFormsModule] },
    props: { remember: new FormControl(true) },
  }),
  decorators: [darkTheme],
}

export const Dark: Story = {
  args: {
    label: 'Recevoir les notifications',
  },
  decorators: [darkTheme],
}
