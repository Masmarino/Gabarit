import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Select, SelectOption } from './select'

const meta: Meta<Select> = {
  title: 'Molecules/Select',
  component: Select,
}

export default meta
type Story = StoryObj<Select>

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'read', label: 'Lecture', icon: 'eye' },
  { value: 'write', label: 'Écriture' },
  { value: 'admin', label: 'Administration' },
]

export const Empty: Story = {
  args: {
    label: 'Rôle',
    options: [],
  },
}

export const Options: Story = {
  args: {
    label: 'Rôle',
    options: ROLE_OPTIONS,
  },
}

export const OptionSelected: Story = {
  render: () => ({
    template: `<gbt-select label="Rôle" [options]="options" [formControl]="control" />`,
    moduleMetadata: {
      imports: [Select, ReactiveFormsModule],
    },
    props: {
      options: ROLE_OPTIONS,
      control: new FormControl('write'),
    },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-select label="Rôle" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: {
      options: ROLE_OPTIONS,
      control: new FormControl({ value: 'write', disabled: true }),
    },
  }),
}

export const Multiple: Story = {
  render: () => ({
    template: `<gbt-select label="Rôle" [options]="options" [multiple]="true" [formControl]="control" />`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: {
      options: ROLE_OPTIONS,
      control: new FormControl(['read', 'write']),
    },
  }),
}

export const Error: Story = {
  args: {
    label: 'Rôle',
    options: ROLE_OPTIONS,
    errorMessage: 'Choisissez un rôle',
  },
}

export const Chips: Story = {
  render: () => ({
    template: `
      <gbt-select
        [options]="options"
        [multiple]="true"
        [chips]="true"
        placeholder="Filtrer par label"
      />
    `,
    moduleMetadata: { imports: [Select] },
    props: {
      options: [
        { value: 'bug', label: 'Bug', color: '#dc2626' },
        { value: 'feature', label: 'Feature', color: '#16a34a' },
        { value: 'docs', label: 'Documentation', color: '#2563eb' },
      ],
    },
  }),
}

export const Dark: Story = {
  args: {
    label: 'Rôle',
    options: ROLE_OPTIONS,
  },
  decorators: [darkTheme],
}
