import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../.storybook/preview'
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

const COLUMN = 'display:grid; gap:1rem; max-width:26rem'

export const WithHint: Story = {
  args: {
    label: 'Rôle',
    options: ROLE_OPTIONS,
    hint: 'Le rôle peut être changé plus tard.',
  },
}

export const HintReplacedByError: Story = {
  name: 'Hint gives way to the error',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-select label="Rôle" hint="Le rôle peut être changé plus tard." [options]="options" [formControl]="a" />
        <gbt-select label="Rôle" hint="Le rôle peut être changé plus tard." errorMessage="Choisissez un rôle" [options]="options" [formControl]="b" />
      </div>`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: { options: ROLE_OPTIONS, a: new FormControl('write'), b: new FormControl(null) },
  }),
}

export const HiddenLabel: Story = {
  name: 'Hidden label (still names the field)',
  render: () => ({
    template: `
      <div style="display:flex; gap:.75rem; align-items:flex-end; flex-wrap:wrap">
        <gbt-select label="Trier par" [hideLabel]="true" size="sm" [options]="options" [formControl]="a" />
        <gbt-select label="Trier par" size="sm" [options]="options" [formControl]="a" />
      </div>`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: {
      options: [
        { value: 'name', label: 'Nom' },
        { value: 'updated', label: 'Dernière activité' },
        { value: 'stars', label: 'Étoiles' },
      ],
      a: new FormControl('updated'),
    },
  }),
}

export const FullWidth: Story = {
  name: 'Full width',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; align-items:flex-start; gap:1rem; max-width:26rem; padding:1rem; border:1px solid var(--border-color); border-radius:var(--site-border-radius-sm); background:var(--bg-principal)">
        <gbt-select label="Visibilité" [fullWidth]="true" [options]="options" [formControl]="a" hint="Qui peut voir ce dépôt." />
        <gbt-select label="Rôle par défaut" [fullWidth]="true" size="sm" [options]="options" [formControl]="b" />
        <gbt-select label="Sans fullWidth" [options]="options" [formControl]="b" />
      </div>`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: { options: ROLE_OPTIONS, a: new FormControl('read'), b: new FormControl('write') },
  }),
}

export const Dark: Story = {
  args: {
    label: 'Rôle',
    options: ROLE_OPTIONS,
  },
  decorators: [darkTheme],
}

export const DarkFields: Story = {
  name: 'Dark — hint, error, full width',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-select label="Rôle" hint="Le rôle peut être changé plus tard." [fullWidth]="true" [options]="options" [formControl]="a" />
        <gbt-select label="Rôle" hint="Le rôle peut être changé plus tard." errorMessage="Choisissez un rôle" [fullWidth]="true" [options]="options" [formControl]="b" />
      </div>`,
    moduleMetadata: { imports: [Select, ReactiveFormsModule] },
    props: { options: ROLE_OPTIONS, a: new FormControl('write'), b: new FormControl(null) },
  }),
  decorators: [darkTheme],
}
