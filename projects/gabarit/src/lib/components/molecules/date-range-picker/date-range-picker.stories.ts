import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { DateRangePicker, type DateRangeValue } from './date-range-picker'

const meta: Meta<DateRangePicker> = {
  title: 'Molecules/DateRangePicker',
  component: DateRangePicker,
}

export default meta
type Story = StoryObj<DateRangePicker>

export const Empty: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: { control: new FormControl<DateRangeValue | null>(null) },
  }),
}

export const WithValue: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        start: new Date(2024, 5, 10),
        end: new Date(2024, 5, 20),
      }),
    },
  }),
}

export const Clearable: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" [clearable]="true" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        start: new Date(2024, 5, 10),
        end: new Date(2024, 5, 20),
      }),
    },
  }),
}

export const OneMonth: Story = {
  name: 'visibleMonths = 1',
  render: () => ({
    template: `<gbt-date-range-picker label="Période" [visibleMonths]="1" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        start: new Date(2024, 5, 10),
        end: new Date(2024, 5, 20),
      }),
    },
  }),
}

export const FrenchLocale: Story = {
  name: 'locale = "fr-FR"',
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" locale="fr-FR" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        start: new Date(2024, 5, 10),
        end: new Date(2024, 5, 20),
      }),
    },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" errorMessage="Une période est requise" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: { control: new FormControl<DateRangeValue | null>(null) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        value: { start: new Date(2024, 5, 10), end: new Date(2024, 5, 20) },
        disabled: true,
      }),
    },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-date-range-picker label="Période d'audit" [formControl]="control" />`,
    moduleMetadata: { imports: [DateRangePicker, ReactiveFormsModule] },
    props: {
      control: new FormControl<DateRangeValue | null>({
        start: new Date(2024, 5, 10),
        end: new Date(2024, 5, 20),
      }),
    },
  }),
  decorators: [darkTheme],
}
