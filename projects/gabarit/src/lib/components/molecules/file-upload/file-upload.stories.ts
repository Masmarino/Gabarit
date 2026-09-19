import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { FileUpload } from './file-upload'

const meta: Meta<FileUpload> = {
  title: 'Molecules/FileUpload',
  component: FileUpload,
}

export default meta
type Story = StoryObj<FileUpload>

export const Empty: Story = {
  render: () => ({
    template: `<gbt-file-upload label="Justificatif de domicile" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>([]) },
  }),
}

export const Multiple: Story = {
  render: () => ({
    template: `<gbt-file-upload label="Pièces jointes" [multiple]="true" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>([]) },
  }),
}

export const WithMaxSize: Story = {
  name: 'maxSizeMb = 1',
  render: () => ({
    template: `<gbt-file-upload label="Logo (max 1 Mo)" [maxSizeMb]="1" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>([]) },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-file-upload label="Justificatif" errorMessage="Un fichier est requis" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>([]) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-file-upload label="Justificatif" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>({ value: [], disabled: true }) },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-file-upload label="Justificatif de domicile" [formControl]="control" />`,
    moduleMetadata: { imports: [FileUpload, ReactiveFormsModule] },
    props: { control: new FormControl<File[]>([]) },
  }),
  decorators: [darkTheme],
}
