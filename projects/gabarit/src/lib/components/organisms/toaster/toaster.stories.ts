import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Toaster, type ToastItem } from './toaster'

const meta: Meta<Toaster> = {
  title: 'Organisms/Toaster',
  component: Toaster,
}

export default meta
type Story = StoryObj<Toaster>

const SAMPLE_TOASTS: ToastItem[] = [
  { id: '1', variant: 'success', message: 'Modifications enregistrées.' },
  { id: '2', variant: 'error', message: 'Échec de la requête.' },
  { id: '3', variant: 'warning', message: 'Le quota est presque atteint.' },
  { id: '4', variant: 'info', message: 'Une nouvelle version est disponible.' },
]

export const AllVariants: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="bottom-right" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const TopLeft: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="top-left" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const TopRight: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="top-right" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const TopCenter: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="top-center" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const BottomLeft: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="bottom-left" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const BottomCenter: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="bottom-center" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
}

export const Dark: Story = {
  render: () => ({
    props: { toasts: SAMPLE_TOASTS },
    template: `<gbt-toaster [toasts]="toasts" position="bottom-right" />`,
    moduleMetadata: { imports: [Toaster] },
  }),
  decorators: [darkTheme],
}
