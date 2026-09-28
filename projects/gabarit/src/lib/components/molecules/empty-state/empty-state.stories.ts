import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { EmptyState } from './empty-state'

const meta: Meta<EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
}

export default meta
type Story = StoryObj<EmptyState>

export const Folder: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="folder" heading="Aucun dépôt pour l'instant" message="Créez votre premier dépôt pour commencer."><button type="button">Nouveau dépôt</button></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Star: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="star" heading="Aucun favori" message="Étoilez un dépôt pour le retrouver ici."></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Checklist: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="checklist" heading="Aucune issue pour l'instant"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Merge: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="merge" heading="Aucune demande de fusion"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Pipeline: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="pipeline" heading="Aucun pipeline"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Tag: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="tag" heading="Aucune release"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Book: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="book" heading="Aucune page de wiki"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Server: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="server" heading="Aucun runner enregistré"></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-empty-state illustration="folder" heading="Aucun dépôt pour l'instant" message="Créez votre premier dépôt pour commencer."><button type="button">Nouveau dépôt</button></gbt-empty-state>`,
    moduleMetadata: { imports: [EmptyState] },
  }),
  decorators: [darkTheme],
}

// ---- 1.2.0: icon, compact, tone, heading level -------------------------------------------------------

const CARD =
  'border:1px solid var(--border-color);border-radius:12px;background:var(--bg-principal)'

export const WithIcon: Story = {
  render: () => ({
    template: `
      <gbt-empty-state icon="search" heading="Aucun résultat" message="Essayez avec d'autres mots-clés ou retirez un filtre.">
        <button type="button">Effacer les filtres</button>
      </gbt-empty-state>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const CompactInCard: Story = {
  render: () => ({
    template: `
      <div style="${CARD};max-width:32rem">
        <gbt-empty-state size="compact" icon="folder" heading="Aucune variable définie"
          message="Les variables sont injectées dans chaque job de pipeline." />
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const CompactWithAction: Story = {
  render: () => ({
    template: `
      <div style="${CARD};max-width:32rem">
        <gbt-empty-state size="compact" icon="file" heading="Aucun jeton" message="Générez un jeton pour appeler l'API.">
          <button type="button">Générer un jeton</button>
        </gbt-empty-state>
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const CompactIllustration: Story = {
  render: () => ({
    template: `
      <div style="${CARD};max-width:32rem">
        <gbt-empty-state size="compact" illustration="tag" heading="Aucune release" message="Publiez une release depuis un tag." />
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const HeadingOnly: Story = {
  name: 'No illustration, no icon',
  render: () => ({
    template: `
      <div style="${CARD};max-width:32rem">
        <gbt-empty-state size="compact" heading="Introuvable." />
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const ErrorTone: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:1rem;max-width:32rem">
        <div style="${CARD}">
          <gbt-empty-state size="compact" tone="error" icon="alert-triangle" heading="Chargement impossible"
            message="Le serveur ne répond pas. Réessayez dans un instant.">
            <button type="button">Réessayer</button>
          </gbt-empty-state>
        </div>
        <div style="${CARD}">
          <gbt-empty-state tone="error" illustration="server" heading="Le runner est injoignable" />
        </div>
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const HeadingLevel: Story = {
  render: () => ({
    template: `
      <section aria-labelledby="empty-title" style="${CARD};max-width:32rem">
        <gbt-empty-state headingLevel="2" headingId="empty-title" illustration="folder"
          heading="Ce dépôt est vide" message="Poussez un premier commit pour commencer." />
      </section>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const FocusableHeading: Story = {
  name: 'Result page: h1, focusable',
  render: () => ({
    template: `
      <div style="max-width:24rem">
        <gbt-empty-state #state headingLevel="1" [headingFocusable]="true" icon="check"
          heading="Compte activé" message="Vous pouvez maintenant vous connecter.">
          <button type="button" (click)="state.focusHeading()">Placer le focus sur le titre</button>
        </gbt-empty-state>
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
}

export const DarkNew: Story = {
  name: 'Dark (icon, compact, error tone, heading level)',
  render: () => ({
    template: `
      <div style="display:grid;gap:1rem;max-width:32rem">
        <gbt-empty-state icon="search" heading="Aucun résultat" message="Essayez avec d'autres mots-clés." />
        <div style="${CARD}">
          <gbt-empty-state size="compact" icon="folder" heading="Aucune variable définie"
            message="Les variables sont injectées dans chaque job." />
        </div>
        <div style="${CARD}">
          <gbt-empty-state size="compact" tone="error" icon="alert-triangle" heading="Chargement impossible"
            message="Le serveur ne répond pas.">
            <button type="button">Réessayer</button>
          </gbt-empty-state>
        </div>
        <div style="${CARD}">
          <gbt-empty-state tone="error" illustration="server" heading="Le runner est injoignable" />
        </div>
      </div>
    `,
    moduleMetadata: { imports: [EmptyState] },
  }),
  decorators: [darkTheme],
}
