import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { withMenuIcons } from '../../../../../.storybook/story-icons'
import { Menu } from '../menu/menu'
import { MenuItem } from './menu-item'

const meta: Meta<MenuItem> = {
  title: 'Molecules/MenuItem',
  component: MenuItem,
  decorators: [withMenuIcons],
}

export default meta
type Story = StoryObj<MenuItem>

const imports = { imports: [Menu, MenuItem] }

/** The row menu of a list: actions, a link, a disabled action and a danger action. */
export const RowMenu: Story = {
  name: 'Row menu (icons, link, danger)',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;min-height:15rem">
        <gbt-menu label="Actions du dépôt" triggerIcon="ellipsis-vertical" align="end">
          <a gbtMenuItem icon="external-link" href="#ouvrir">Ouvrir</a>
          <button gbtMenuItem icon="pencil">Renommer</button>
          <button gbtMenuItem icon="archive" [disabled]="true">Archiver</button>
          <button gbtMenuItem variant="danger" icon="trash-2">Supprimer</button>
        </gbt-menu>
      </div>
    `,
    moduleMetadata: imports,
  }),
}

export const TextOnly: Story = {
  name: 'Text only',
  render: () => ({
    template: `
      <gbt-menu label="Mon compte">
        <a gbtMenuItem href="#compte">Mon compte</a>
        <button gbtMenuItem>Déconnexion</button>
      </gbt-menu>
      <div style="min-height:9rem"></div>
    `,
    moduleMetadata: imports,
  }),
}

/** Every state side by side, without a menu (the items are static here). */
export const States: Story = {
  render: () => ({
    template: `
      <div role="menu" aria-label="États" style="display:flex;flex-direction:column;width:14rem;padding:6px;border:1px solid var(--border-color);border-radius:var(--site-border-radius-sm);background:var(--bg-principal);box-shadow:var(--site-shadow-lg)">
        <button gbtMenuItem icon="pencil">Par défaut</button>
        <a gbtMenuItem icon="external-link" href="#lien">Lien</a>
        <button gbtMenuItem icon="archive" [disabled]="true">Désactivé</button>
        <button gbtMenuItem variant="danger" icon="trash-2">Danger</button>
        <button gbtMenuItem variant="danger" icon="trash-2" [disabled]="true">Danger désactivé</button>
      </div>
    `,
    moduleMetadata: imports,
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;min-height:15rem">
        <gbt-menu label="Actions du dépôt" triggerIcon="ellipsis-vertical" align="end">
          <a gbtMenuItem icon="external-link" href="#ouvrir">Ouvrir</a>
          <button gbtMenuItem icon="pencil">Renommer</button>
          <button gbtMenuItem icon="archive" [disabled]="true">Archiver</button>
          <button gbtMenuItem variant="danger" icon="trash-2">Supprimer</button>
        </gbt-menu>
      </div>
    `,
    moduleMetadata: imports,
  }),
  decorators: [darkTheme],
}

export const StatesDark: Story = {
  name: 'States, dark',
  render: States.render,
  decorators: [darkTheme],
}
