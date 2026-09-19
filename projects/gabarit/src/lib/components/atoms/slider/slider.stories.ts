import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Slider } from './slider'

const meta: Meta<Slider> = {
  title: 'Atoms/Slider',
  component: Slider,
}

export default meta
type Story = StoryObj<Slider>

export const Nominal: Story = {
  render: () => ({
    template: `<gbt-slider label="Volume" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: { control: new FormControl<number>(40) },
  }),
}

export const CustomFormat: Story = {
  name: 'Custom formatValue',
  render: () => ({
    template: `<gbt-slider label="Budget" [min]="0" [max]="1000" [step]="50" [formatValue]="format" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: {
      control: new FormControl<number>(450),
      format: (v: number) => `${v.toLocaleString('fr-FR')} €`,
    },
  }),
}

export const NoValueReadout: Story = {
  name: 'showValue = false',
  render: () => ({
    template: `<gbt-slider label="Contraste" [showValue]="false" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: { control: new FormControl<number>(60) },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `<gbt-slider label="Volume" errorMessage="Hors plage autorisée" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: { control: new FormControl<number>(95) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-slider label="Volume" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: { control: new FormControl<number>({ value: 40, disabled: true }) },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-slider label="Volume" [formControl]="control" />`,
    moduleMetadata: { imports: [Slider, ReactiveFormsModule] },
    props: { control: new FormControl<number>(40) },
  }),
  decorators: [darkTheme],
}
