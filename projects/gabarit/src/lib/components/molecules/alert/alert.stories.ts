import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Alert } from './alert'

const meta: Meta<Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
}

export default meta
type Story = StoryObj<Alert>

export const Info: Story = {
  render: () => ({
    template: `<gbt-alert variant="info">Une mise à jour de la plateforme est prévue dimanche à 2h.</gbt-alert>`,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Success: Story = {
  render: () => ({
    template: `<gbt-alert variant="success">Le dépôt a été créé avec succès.</gbt-alert>`,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Warning: Story = {
  render: () => ({
    template: `<gbt-alert variant="warning">Le quota du dépôt est presque atteint (92%).</gbt-alert>`,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const ErrorVariant: Story = {
  name: 'Error',
  render: () => ({
    template: `<gbt-alert variant="error">Impossible de supprimer le dépôt : des images y sont encore rattachées.</gbt-alert>`,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Dismissible: Story = {
  render: () => ({
    template: `<gbt-alert variant="warning" [dismissible]="true" closeLabel="Fermer" (dismissed)="dismissed = true">
      @if (!dismissed) {
        Le quota du dépôt est presque atteint (92%).
      } @else {
        Alerte fermée — rouvrez la story pour la revoir.
      }
    </gbt-alert>`,
    moduleMetadata: { imports: [Alert] },
    props: { dismissed: false },
  }),
}

export const WithAction: Story = {
  render: () => ({
    template: `
      <gbt-alert variant="error">
        Le paiement a échoué. <a href="#" style="color:inherit;font-weight:600">Mettre à jour le moyen de paiement</a>
      </gbt-alert>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert variant="info">Information : une mise à jour est prévue dimanche.</gbt-alert>
        <gbt-alert variant="success">Succès : le dépôt a été créé.</gbt-alert>
        <gbt-alert variant="warning">Avertissement : quota presque atteint.</gbt-alert>
        <gbt-alert variant="error">Erreur : la suppression a échoué.</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert variant="info">Information : une mise à jour est prévue dimanche.</gbt-alert>
        <gbt-alert variant="success">Succès : le dépôt a été créé.</gbt-alert>
        <gbt-alert variant="warning">Avertissement : quota presque atteint.</gbt-alert>
        <gbt-alert variant="error">Erreur : la suppression a échoué.</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
  decorators: [darkTheme],
}
