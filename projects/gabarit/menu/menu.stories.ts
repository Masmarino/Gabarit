import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { withMenuIcons } from '../.storybook/story-icons'
import { Avatar } from '../avatar/avatar'
import { MenuItem } from './menu-item/menu-item'
import { Menu, MenuTrigger } from './menu'

const meta: Meta<Menu> = {
  title: 'Molecules/Menu',
  component: Menu,
  decorators: [withMenuIcons],
}

export default meta
type Story = StoryObj<Menu>

const elements = `
  <a role="menuitem" class="gbt-menu__item" href="#">Mon compte</a>
  <button role="menuitem" class="gbt-menu__item" type="button">Déconnexion</button>
`

export const UserAccount: Story = {
  render: () => ({
    template: `<gbt-menu label="Mon compte">${elements}</gbt-menu>`,
    moduleMetadata: { imports: [Menu] },
  }),
}

export const AlignEnd: Story = {
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end">
        <gbt-menu label="Mon compte" align="end">${elements}</gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu] },
  }),
}

export const IconOnlyKebab: Story = {
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end">
        <gbt-menu label="Actions" triggerIcon="ellipsis-vertical" align="end">${elements}</gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu] },
  }),
}

/**
 * The trigger of a user menu: an avatar and a name. `gbtMenuTrigger` content is projected inside the
 * trigger button; the avatar is hidden from assistive technology because the name is right next to it.
 */
export const CustomTrigger: Story = {
  name: 'Custom trigger (avatar and name)',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;min-height:12rem">
        <gbt-menu label="Compte" align="end">
          <span gbtMenuTrigger style="display:inline-flex;align-items:center;gap:0.5rem">
            <span aria-hidden="true" style="display:inline-flex"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
            <span>ada.lovelace</span>
          </span>
          <a gbtMenuItem icon="user" href="#compte">Mon compte</a>
          <button gbtMenuItem icon="log-out">Déconnexion</button>
        </gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu, MenuTrigger, MenuItem, Avatar] },
  }),
}

/** In a narrow header the name shrinks with an ellipsis; an avatar-only trigger needs `triggerAriaLabel`. */
export const CustomTriggerNarrow: Story = {
  name: 'Custom trigger, narrow and avatar only',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:1rem;min-height:12rem">
        <div style="width:9rem;display:flex;justify-content:flex-end">
          <gbt-menu label="Compte" align="end">
            <span gbtMenuTrigger style="display:flex;align-items:center;gap:0.5rem;min-width:0">
              <span aria-hidden="true" style="display:inline-flex"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">ada.lovelace.the.first</span>
            </span>
            <a gbtMenuItem href="#compte">Mon compte</a>
          </gbt-menu>
        </div>
        <gbt-menu label="Compte" align="end" triggerAriaLabel="Menu du compte" [chevron]="false">
          <span gbtMenuTrigger aria-hidden="true" style="display:inline-flex"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
          <a gbtMenuItem href="#compte">Mon compte</a>
        </gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu, MenuTrigger, MenuItem, Avatar] },
  }),
}

export const DarkCustomTrigger: Story = {
  name: 'Dark, custom trigger',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;min-height:12rem">
        <gbt-menu label="Compte" align="end">
          <span gbtMenuTrigger style="display:inline-flex;align-items:center;gap:0.5rem">
            <span aria-hidden="true" style="display:inline-flex"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
            <span>ada.lovelace</span>
          </span>
          <a gbtMenuItem icon="user" href="#compte">Mon compte</a>
          <button gbtMenuItem icon="log-out">Déconnexion</button>
        </gbt-menu>
      </div>
    `,
    moduleMetadata: { imports: [Menu, MenuTrigger, MenuItem, Avatar] },
  }),
  decorators: [darkTheme],
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-menu label="Mon compte">${elements}</gbt-menu>`,
    moduleMetadata: { imports: [Menu] },
  }),
  decorators: [darkTheme],
}
