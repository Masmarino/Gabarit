import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { RadioGroup, type RadioOption } from './radio-group'

const meta: Meta<RadioGroup> = {
  title: 'Molecules/RadioGroup',
  component: RadioGroup,
}

export default meta
type Story = StoryObj<RadioGroup>

const STATUS_OPTIONS: RadioOption[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé', disabled: true },
]

export const Vertical: Story = {
  render: () => ({
    template: `<gbt-radio-group label="Statut" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [RadioGroup, ReactiveFormsModule] },
    props: { options: STATUS_OPTIONS, control: new FormControl('draft') },
  }),
}

export const Horizontal: Story = {
  render: () => ({
    template: `<gbt-radio-group label="Statut" orientation="horizontal" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [RadioGroup, ReactiveFormsModule] },
    props: { options: STATUS_OPTIONS, control: new FormControl('draft') },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-radio-group label="Statut" errorMessage="Choisissez un statut" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [RadioGroup, ReactiveFormsModule] },
    props: { options: STATUS_OPTIONS, control: new FormControl(null) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-radio-group label="Statut" [disabled]="true" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [RadioGroup, ReactiveFormsModule] },
    props: { options: STATUS_OPTIONS, control: new FormControl('draft') },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-radio-group label="Statut" [options]="options" [formControl]="control" />`,
    moduleMetadata: { imports: [RadioGroup, ReactiveFormsModule] },
    props: { options: STATUS_OPTIONS, control: new FormControl('draft') },
  }),
  decorators: [darkTheme],
}
