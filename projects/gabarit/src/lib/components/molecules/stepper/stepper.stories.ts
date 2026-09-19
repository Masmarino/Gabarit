import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Stepper } from './stepper'

const meta: Meta<Stepper> = {
  title: 'Molecules/Stepper',
  component: Stepper,
}

export default meta
type Story = StoryObj<Stepper>

const CHECKOUT_STEPS = [{ label: 'Compte' }, { label: 'Livraison' }, { label: 'Paiement' }]

export const FirstStep: Story = {
  name: 'Current: first step',
  args: {
    steps: CHECKOUT_STEPS,
    activeIndex: 0,
  },
}

export const MiddleStep: Story = {
  name: 'Current: middle step (one completed)',
  args: {
    steps: CHECKOUT_STEPS,
    activeIndex: 1,
  },
}

export const LastStep: Story = {
  name: 'Current: last step (two completed)',
  args: {
    steps: CHECKOUT_STEPS,
    activeIndex: 2,
  },
}

export const WithError: Story = {
  name: 'A completed step has an error',
  args: {
    steps: [{ label: 'Compte' }, { label: 'Livraison', hasError: true }, { label: 'Paiement' }],
    activeIndex: 2,
  },
}

export const Vertical: Story = {
  args: {
    steps: CHECKOUT_STEPS,
    activeIndex: 1,
    orientation: 'vertical',
  },
}

export const Dark: Story = {
  args: {
    steps: CHECKOUT_STEPS,
    activeIndex: 1,
  },
  decorators: [darkTheme],
}
