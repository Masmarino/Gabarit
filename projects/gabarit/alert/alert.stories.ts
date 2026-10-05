import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { Button } from '../button/button'
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

// ---- 1.2.0: heading, actions, sizes, appearance, neutral, live ---------------------------------------

const RETRY = `<gbt-button alert-actions variant="secondary" size="small" text="Réessayer" />`

export const WithHeading: Story = {
  render: () => ({
    template: `
      <gbt-alert variant="error" heading="Impossible de charger le tableau de bord">
        Le service de métriques ne répond pas. Vos dépôts ne sont pas affectés.
        ${RETRY}
      </gbt-alert>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
}

export const WithActions: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert variant="error">
          Les variables n'ont pas pu être chargées.
          ${RETRY}
        </gbt-alert>
        <gbt-alert variant="warning" [dismissible]="true" closeLabel="Fermer">
          Le quota du dépôt est presque atteint (92 %).
          <gbt-button alert-actions variant="secondary" size="small" text="Gérer le quota" />
        </gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
}

export const ActionsWrapOnNarrow: Story = {
  render: () => ({
    template: `
      <div style="max-width:19rem">
        <gbt-alert variant="error">
          Les variables n'ont pas pu être chargées pour ce dépôt.
          ${RETRY}
        </gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
}

export const Small: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:24rem">
        <gbt-alert size="sm" variant="info">La révision est verrouillée jusqu'à la fin du pipeline.</gbt-alert>
        <gbt-alert size="sm" variant="success">Vous avez approuvé cette demande de fusion.</gbt-alert>
        <gbt-alert size="sm" variant="warning">Un pipeline est encore en cours.</gbt-alert>
        <gbt-alert size="sm" variant="error" [dismissible]="true">Le déploiement a échoué.</gbt-alert>
        <gbt-alert size="sm" variant="neutral">Aucune approbation requise.</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Subtle: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert appearance="subtle" variant="info" live="off">Résultats limités aux 100 plus récents.</gbt-alert>
        <gbt-alert appearance="subtle" variant="success" live="off">Configuration enregistrée.</gbt-alert>
        <gbt-alert appearance="subtle" variant="warning" live="off">La classe de stockage détectée n'autorise pas l'extension de volume.</gbt-alert>
        <gbt-alert appearance="subtle" variant="error" live="off">Le certificat expire dans 3 jours.</gbt-alert>
        <gbt-alert appearance="subtle" variant="neutral" live="off">Dernière synchronisation il y a 4 minutes.</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const Neutral: Story = {
  render: () => ({
    template: `
      <gbt-alert variant="neutral">
        Cette demande de fusion attend 1 approbation avant de pouvoir être fusionnée.
        <span alert-actions style="display:flex;gap:0.5rem">
          <gbt-button variant="secondary" size="small" text="Demander des modifications" />
          <gbt-button size="small" text="Approuver" />
        </span>
      </gbt-alert>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
}

export const StaticNotes: Story = {
  name: 'Live: off (static notes)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert variant="warning" live="off" appearance="subtle">
          Présent dès l'ouverture de la page : pas de région live, le lecteur d'écran ne l'interrompt pas.
        </gbt-alert>
        <gbt-alert variant="info" live="polite">Annoncé poliment quand il apparaît (role="status").</gbt-alert>
        <gbt-alert variant="info" live="assertive">Annoncé immédiatement quand il apparaît (role="alert").</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const IconAlignment: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:30rem">
        <gbt-alert variant="warning">
          Auto, sans titre ni action : l'icône reste centrée sur le bloc, comme avant 1.2.0. Ce texte est volontairement assez long pour passer sur plusieurs lignes.
        </gbt-alert>
        <gbt-alert variant="warning" iconAlign="start">
          <code>iconAlign="start"</code> : l'icône se cale sur la première ligne du message. Ce texte est volontairement assez long pour passer sur plusieurs lignes.
        </gbt-alert>
        <gbt-alert variant="warning" heading="Avec un titre">
          L'icône passe en haut toute seule dès qu'il y a un titre ou des actions.
        </gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert] },
  }),
}

export const HeadingDismissible: Story = {
  render: () => ({
    template: `
      <gbt-alert variant="info" heading="Nouvelle version disponible" [dismissible]="true" closeLabel="Fermer">
        La version 2.4 apporte le tri par colonne dans les tableaux et corrige le focus des menus.
        <gbt-button alert-actions variant="secondary" size="small" text="Voir les nouveautés" />
      </gbt-alert>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
}

export const DarkNew: Story = {
  name: 'Dark (heading, actions, sizes, subtle, neutral)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <gbt-alert variant="error" heading="Impossible de charger le tableau de bord">
          Le service de métriques ne répond pas.
          ${RETRY}
        </gbt-alert>
        <gbt-alert variant="error">Les variables n'ont pas pu être chargées. ${RETRY}</gbt-alert>
        <gbt-alert variant="neutral" size="sm">Aucune approbation requise.</gbt-alert>
        <gbt-alert variant="warning" size="sm" [dismissible]="true">Un pipeline est en cours.</gbt-alert>
        <gbt-alert variant="info" appearance="subtle" live="off">Résultats limités aux 100 plus récents.</gbt-alert>
        <gbt-alert variant="success" appearance="subtle" live="off">Configuration enregistrée.</gbt-alert>
        <gbt-alert variant="warning" appearance="subtle" live="off">Le stockage n'autorise pas l'extension.</gbt-alert>
        <gbt-alert variant="neutral" appearance="subtle" live="off">Dernière synchronisation il y a 4 minutes.</gbt-alert>
      </div>
    `,
    moduleMetadata: { imports: [Alert, Button] },
  }),
  decorators: [darkTheme],
}
