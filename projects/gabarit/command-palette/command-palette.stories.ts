import type { Meta, StoryObj } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../.storybook/preview'
import { CommandPalette, type CommandGroup } from './command-palette'
import { CommandPaletteTrigger } from './command-palette-trigger'

const GROUPS: CommandGroup[] = [
  {
    label: 'Récents',
    items: [
      { id: 'r-gabarit', label: 'gabarit', description: 'florian/gabarit', icon: 'folder' },
      {
        id: 'r-ferristrace',
        label: 'ferristrace',
        description: 'florian/ferristrace',
        icon: 'folder',
      },
    ],
  },
  {
    label: 'Aller à',
    items: [
      { id: 'home', label: 'Accueil', icon: 'home', shortcut: ['G', 'H'] },
      { id: 'repos', label: 'Dépôts', icon: 'folder', keywords: ['projets'], shortcut: ['G', 'R'] },
      { id: 'account', label: 'Mon compte', icon: 'user' },
      { id: 'settings', label: "Réglages de l'instance", icon: 'settings' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { id: 'new-repo', label: 'Nouveau dépôt', icon: 'plus' },
      { id: 'logout', label: 'Se déconnecter', icon: 'log-out' },
    ],
  },
]

const FRENCH = `
  placeholder="Rechercher ou aller à…"
  ariaLabel="Recherche et commandes"
  emptyMessage="Aucun résultat"
  loadingLabel="Recherche en cours…"
  navigateHint="Naviguer"
  selectHint="Ouvrir"
  closeHint="Fermer"
  closeLabel="Fermer la recherche"
`

/**
 * ⌘K (Ctrl+K on Windows and Linux) opens it from anywhere; its trigger sits where a header's search field would.
 */
const meta: Meta<CommandPalette> = {
  title: 'Organisms/CommandPalette',
  component: CommandPalette,
  render: (args) => ({
    template: `
      <div style="max-width: 22rem; padding: 1rem">
        <gbt-command-palette-trigger [palette]="palette" label="Rechercher ou aller à…" />
      </div>
      <gbt-command-palette #palette [(open)]="open" [groups]="groups" [loading]="loading" ${FRENCH} />
    `,
    moduleMetadata: { imports: [CommandPalette, CommandPaletteTrigger] },
    props: { groups: GROUPS, loading: false, open: true, ...args },
  }),
}
export default meta

type Story = StoryObj<CommandPalette>

const field = (canvasElement: HTMLElement) =>
  within(canvasElement.ownerDocument.body).findByRole('combobox', {
    name: 'Recherche et commandes',
  })

/** Opened with an empty query: recent pages, where to go, what to do. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(async () => expect(await field(canvasElement)).toHaveFocus())
  },
}

/** Typing keeps what matches, accents and keywords included. */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(await field(canvasElement), 'depot')
    const labels = Array.from(
      canvasElement.ownerDocument.querySelectorAll('[role="option"] .gbt-cp__item-label'),
    ).map((label) => label.textContent?.trim())
    await expect(labels).toEqual(['Dépôts', 'Nouveau dépôt'])
  },
}

/** Results still on their way from a server. */
export const Searching: Story = {
  args: { loading: true },
  render: (args) => ({
    template: `<gbt-command-palette [(open)]="open" [groups]="[]" [loading]="loading" ${FRENCH} />`,
    moduleMetadata: { imports: [CommandPalette] },
    props: { open: true, ...args },
  }),
}

export const NoResults: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(await field(canvasElement), 'zzzz')
    const message = await within(canvasElement.ownerDocument.body).findByText('Aucun résultat')
    // The dialog fades in: typing can finish before the animation does.
    await waitFor(() => expect(message).toBeVisible())
  },
}

/** Closed: the trigger, as a header shows it, with the shortcut for this system. */
export const Trigger: Story = {
  args: { open: false },
}

export const Dark: Story = {
  decorators: [darkTheme],
}

export const Phone: Story = {
  parameters: {
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '700px' }, type: 'mobile' },
      },
    },
  },
  globals: { viewport: { value: 'mobile', isRotated: false } },
}
