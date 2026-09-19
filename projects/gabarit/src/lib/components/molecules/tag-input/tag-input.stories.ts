import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { TagInput } from './tag-input'

const meta: Meta<TagInput> = {
  title: 'Molecules/TagInput',
  component: TagInput,
}

export default meta
type Story = StoryObj<TagInput>

export const Empty: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Labels" placeholder="Ajouter un label…" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>([]) },
  }),
}

export const WithValues: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Labels" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>(['bug', 'urgent', 'backend']) },
  }),
}

export const CustomColor: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Destinataires" color="#2563eb" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>(['ada@example.com']) },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Labels" errorMessage="Au moins un label est requis" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>([]) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Labels" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>({ value: ['bug', 'urgent'], disabled: true }) },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-tag-input label="Labels" [formControl]="control" />`,
    moduleMetadata: { imports: [TagInput, ReactiveFormsModule] },
    props: { control: new FormControl<string[]>(['bug', 'urgent']) },
  }),
  decorators: [darkTheme],
}
