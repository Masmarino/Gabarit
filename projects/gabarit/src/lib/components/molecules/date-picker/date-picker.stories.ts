import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { DatePicker } from './date-picker'

const meta: Meta<DatePicker> = {
  title: 'Molecules/DatePicker',
  component: DatePicker,
}

export default meta
type Story = StoryObj<DatePicker>

export const Empty: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(null) },
  }),
}

export const WithValue: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
}

export const Clearable: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" [clearable]="true" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
}

export const TwoMonths: Story = {
  name: 'visibleMonths = 2',
  render: () => ({
    template: `<gbt-date-picker label="Séjour" [visibleMonths]="2" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
}

export const SundayStart: Story = {
  name: 'weekStartsOn = 0 (Sunday)',
  render: () => ({
    template: `<gbt-date-picker label="Date" [weekStartsOn]="0" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
}

export const FrenchLocale: Story = {
  name: 'locale = "fr-FR"',
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" locale="fr-FR" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" errorMessage="Une date est requise" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(null) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>({ value: new Date(2024, 5, 18), disabled: true }) },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-date-picker label="Date de rendez-vous" [formControl]="control" />`,
    moduleMetadata: { imports: [DatePicker, ReactiveFormsModule] },
    props: { control: new FormControl<Date | null>(new Date(2024, 5, 18)) },
  }),
  decorators: [darkTheme],
}
