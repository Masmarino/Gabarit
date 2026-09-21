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
