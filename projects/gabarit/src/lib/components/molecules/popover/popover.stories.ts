import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Popover } from './popover'

const meta: Meta<Popover> = {
  title: 'Molecules/Popover',
  component: Popover,
}

export default meta
type Story = StoryObj<Popover>

export const Basic: Story = {
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-popover #pop="gbtPopover">
          <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
            Plus d'informations
          </button>
          <div popover-content style="max-width: 240px">
            <p style="margin: 0">
              Un paragraphe de texte plus long qu'un simple tooltip,
              déclenché explicitement au clic plutôt qu'au survol.
            </p>
          </div>
        </gbt-popover>
      </div>
    `,
    moduleMetadata: { imports: [Popover] },
  }),
}

export const ActionsList: Story = {
  name: 'Rich content: list of actions',
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-popover #pop="gbtPopover">
          <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
            Actions
          </button>
          <div popover-content style="display:flex;flex-direction:column;gap:0.5rem;min-width:160px">
            <button type="button" (click)="pop.close()">Dupliquer</button>
            <button type="button" (click)="pop.close()">Archiver</button>
            <button type="button" (click)="pop.close()">Supprimer</button>
          </div>
        </gbt-popover>
      </div>
    `,
    moduleMetadata: { imports: [Popover] },
  }),
}

export const MiniForm: Story = {
  name: 'Rich content: mini-form',
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-popover #pop="gbtPopover">
          <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
            Renommer
          </button>
          <form popover-content style="display:flex;flex-direction:column;gap:0.75rem;min-width:220px" (submit)="pop.close(); $event.preventDefault()">
            <label style="display:flex;flex-direction:column;gap:0.25rem;font-size:13px">
              Nouveau nom
              <input type="text" value="Rapport Q3" />
            </label>
            <button type="submit">Valider</button>
          </form>
        </gbt-popover>
      </div>
    `,
    moduleMetadata: { imports: [Popover] },
  }),
}

export const AlignEnd: Story = {
  name: 'align="end"',
  render: () => ({
    template: `
      <div style="display:flex;justify-content:flex-end;padding: 4rem">
        <gbt-popover #pop="gbtPopover" align="end">
          <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
            Options
          </button>
          <div popover-content style="min-width:160px">
            Le panneau garde son bord droit aligné avec celui du déclencheur.
          </div>
        </gbt-popover>
      </div>
    `,
    moduleMetadata: { imports: [Popover] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="padding: 4rem">
        <gbt-popover #pop="gbtPopover">
          <button type="button" autofocus [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
            Plus d'informations
          </button>
          <div popover-content style="max-width: 240px">
            <p style="margin: 0">Contenu affiché sur fond sombre.</p>
          </div>
        </gbt-popover>
      </div>
    `,
    moduleMetadata: { imports: [Popover] },
  }),
  decorators: [darkTheme],
}
