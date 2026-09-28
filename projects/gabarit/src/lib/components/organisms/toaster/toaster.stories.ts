import { Component, OnInit, inject, input } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Button } from '../../atoms/button/button'
import { GbtToastService } from './toast.service'
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

// ---- Bound to the application-wide GbtToastService (the `toasts` input is omitted) -----------------

/** What an application does: inject the service anywhere, put one `<gbt-toaster />` in the shell. */
@Component({
  selector: 'gbt-toast-service-demo',
  standalone: true,
  imports: [Button, Toaster],
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;padding:1rem">
      <gbt-button variant="secondary" text="Success" (clicked)="toasts.show('Changes saved.')" />
      <gbt-button
        variant="secondary"
        text="Error, stays"
        (clicked)="toasts.show('The request failed.', 'error', { duration: 0 })"
      />
      <gbt-button
        variant="secondary"
        text="Info, 10 s"
        (clicked)="toasts.show('A new version is available.', 'info', { duration: 10000 })"
      />
      <gbt-button
        variant="secondary"
        text="Warning"
        (clicked)="toasts.show('The quota is almost reached.', 'warning')"
      />
      <gbt-button variant="ghost" text="Clear all" (clicked)="toasts.clear()" />
    </div>
    <gbt-toaster />
  `,
})
class ToastServiceDemo implements OnInit {
  protected readonly toasts = inject(GbtToastService)
  /** Shows a few toasts when the story opens (none dismisses itself, for a stable screenshot). */
  readonly preload = input(true)

  ngOnInit(): void {
    if (this.preload()) {
      this.toasts.show('Changes saved.', 'success', { duration: 0 })
      this.toasts.show('The request failed.', 'error', { duration: 0 })
      this.toasts.show('The quota is almost reached.', 'warning', { duration: 0 })
      this.toasts.show('A new version is available.', 'info', { duration: 0 })
    }
  }
}

/** `<gbt-toaster />` with no `toasts` input reads the service: buttons anywhere can call `show()`. */
export const WithService: Story = {
  render: () => ({
    template: `<gbt-toast-service-demo />`,
    moduleMetadata: { imports: [ToastServiceDemo] },
  }),
}

export const WithServiceDark: Story = {
  ...WithService,
  decorators: [darkTheme],
}
