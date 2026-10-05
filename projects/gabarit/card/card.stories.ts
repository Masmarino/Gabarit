import type { Meta, StoryObj } from '@storybook/angular-vite'
import { expect, within } from 'storybook/test'
import { darkTheme } from '../.storybook/preview'
import { Badge } from '../badge/badge'
import { Button } from '../button/button'
import { Icon } from '../icon/icon'
import { Checkbox } from '../checkbox/checkbox'
import { Switch } from '../switch/switch'
import { Card, CardHeader } from './card'
import { CardLink } from './card-link'

const meta: Meta<Card> = {
  title: 'Molecules/Card',
  component: Card,
}

export default meta
type Story = StoryObj<Card>

export const NoTitle: Story = {
  render: () => ({
    template: `<gbt-card>Contenu sans titre.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const WithTitleAndIcon: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Hoverable: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check" [hoverable]="true">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-card heading="Serveur mail" icon="check">Contenu de la carte.</gbt-card>`,
    moduleMetadata: { imports: [Card] },
  }),
  decorators: [darkTheme],
}

// ---- 1.2.0: variants, header, flush, tone, selected, custom header, link mode -----------------------

// The box's own edge closes the first row: the separators go between rows only.
const ROWS = `
  <ul style="margin:0;padding:0;list-style:none;font-size:0.875rem">
    <li style="display:flex;justify-content:space-between;gap:1rem;padding:0.75rem 1.25rem">
      <span>CI_REGISTRY</span><span>Masqué</span>
    </li>
    <li style="display:flex;justify-content:space-between;gap:1rem;padding:0.75rem 1.25rem;border-top:1px solid var(--border-color)">
      <span>DEPLOY_ENV</span><span>production</span>
    </li>
    <li style="display:flex;justify-content:space-between;gap:1rem;padding:0.75rem 1.25rem;border-top:1px solid var(--border-color)">
      <span>SENTRY_DSN</span><span>Masqué</span>
    </li>
  </ul>`

const GRID = 'display:grid;gap:1rem;max-width:36rem'

export const Outlined: Story = {
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" heading="Serveur mail" icon="check">Contenu de la carte.</gbt-card>
        <gbt-card variant="outlined">Sans titre.</gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const DescriptionAndCount: Story = {
  name: 'Header: description and count',
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" heading="Variables CI" icon="file"
          description="Injectées dans chaque job de pipeline." [count]="3">
          <p style="margin:0">Un formulaire ou n'importe quel contenu, dans le padding de la carte.</p>
        </gbt-card>
        <gbt-card heading="Elevated" icon="file" description="Le titre reste au-dessus de l'ombre." [count]="12">
          <p style="margin:0">Contenu de la carte.</p>
        </gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const HeaderActions: Story = {
  name: 'Header: actions on the right',
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" heading="Collaborateurs" icon="folder" [count]="0"
          description="Qui peut accéder à ce dépôt.">
          <gbt-button card-header-actions size="small" text="Inviter" />
          <p style="margin:0">Personne pour l'instant.</p>
        </gbt-card>
        <gbt-card variant="outlined" heading="Un titre bien plus long que la place qui lui reste à côté de l'action"
          icon="folder">
          <gbt-button card-header-actions size="small" variant="secondary" text="Modifier" />
          <p style="margin:0">Le titre passe à la ligne, l'action garde sa taille.</p>
        </gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card, Button] },
  }),
}

export const Flush: Story = {
  render: () => ({
    template: `
      <gbt-card style="max-width:36rem" variant="outlined" heading="Variables"
        icon="file" description="Injectées dans chaque job." [count]="3" [flush]="true">
        ${ROWS}
      </gbt-card>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const FlushElevated: Story = {
  render: () => ({
    template: `
      <gbt-card style="max-width:36rem" heading="Variables" [flush]="true">
        ${ROWS}
      </gbt-card>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Tones: Story = {
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" tone="error" heading="Registre"
          description="Le sous-système ne répond plus.">Dernier signe de vie il y a 12 minutes.</gbt-card>
        <gbt-card variant="outlined" tone="success" heading="Jeton généré" icon="check"
          description="Copiez-le maintenant, il ne sera plus affiché.">ghp_xxxxxxxxxxxxxxxxxxxx</gbt-card>
        <gbt-card variant="outlined" tone="warning" heading="Quota" [count]="3">
          Sans icône donnée : celle du ton. 92 % utilisés.
        </gbt-card>
        <gbt-card tone="error" heading="Elevated + tone">Seuls l'icône et le titre prennent le ton, pas la boîte.</gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const Selected: Story = {
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" [selected]="true" selectedLabel="Recommandé, sélectionné" heading="Application d'authentification">
          Code à 6 chiffres renouvelé toutes les 30 secondes.
        </gbt-card>
        <gbt-card variant="outlined" heading="Clé de sécurité">Une clé physique ou biométrique.</gbt-card>
        <gbt-card [selected]="true" heading="Elevated, sélectionné">Anneau plus épais, pas seulement une couleur.</gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const CustomHeader: Story = {
  render: () => ({
    template: `
      <gbt-card style="max-width:36rem" variant="outlined" heading="Ignoré">
        <div card-header style="display:flex;align-items:center;gap:0.5rem;min-width:0">
          <gbt-icon name="file" />
          <strong style="font-size:0.9375rem;overflow-wrap:anywhere">src/app/components/button/button.component.ts</strong>
          <gbt-badge variant="success">+12 −3</gbt-badge>
        </div>
        <gbt-button card-header-actions size="small" variant="secondary" text="Ouvrir" />
        <pre style="margin:0;font-size:0.8125rem">&#64;Component(&#123; selector: 'gbt-button' &#125;)</pre>
      </gbt-card>
    `,
    moduleMetadata: { imports: [Card, CardHeader, Button, Badge, Icon] },
  }),
}

export const LinkHref: Story = {
  name: 'Link mode: href',
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:1rem;max-width:44rem">
        <gbt-card variant="outlined" heading="Guide de démarrage" href="#/demarrage" description="Installer et configurer le projet.">
          Mis à jour il y a 2 jours
        </gbt-card>
        <gbt-card variant="outlined" heading="Architecture" href="#/architecture" description="Les grandes briques.">
          Mis à jour il y a 3 semaines
        </gbt-card>
        <gbt-card heading="Elevated" href="#/elevated">La carte entière est cliquable.</gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
}

export const LinkProjected: Story = {
  name: 'Link mode: projected <a> with a separate action',
  render: () => ({
    template: `
      <div style="max-width:24rem">
        <gbt-card variant="outlined">
          <h3 card-header style="margin:0;font-size:0.9375rem"><a gbtCardLink href="#/releases/1.2.0">Release 1.2.0</a></h3>
          <gbt-button card-header-actions size="small" variant="secondary" text="Télécharger" />
          <p style="margin:0 0 0.75rem">Cliquer n'importe où sur la carte ouvre la release ; « Télécharger » reste un bouton à part.</p>
          <a href="#/releases/1.2.0/notes" style="color:var(--primary)">Notes de version</a>
        </gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card, CardHeader, CardLink, Button] },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: 'Release 1.2.0' })
    const action = canvas.getByRole('button', { name: 'Télécharger' })
    const hitAtCentre = (el: Element): Element | null => {
      const r = el.getBoundingClientRect()
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    }
    // The box's centre is the link's stretched overlay (its ::after hit-tests as the anchor).
    await expect(hitAtCentre(canvasElement.querySelector('.gbt-card')!)).toBe(link)
    // The header action stays its own target, above the overlay.
    await expect(action.contains(hitAtCentre(action))).toBe(true)

    // Same check with the host's own grid layout lost (a consumer overriding `display`, or an
    // engine that ignores `grid-area` on the overlay): the action must still hit itself and not
    // the link, which is what the header-controls lift rule (not the grid-area mechanism alone)
    // guarantees. Without that rule this assertion fails.
    const host = canvasElement.querySelector('gbt-card') as HTMLElement
    const previousDisplay = host.style.display
    host.style.display = 'block'
    await expect(action.contains(hitAtCentre(action))).toBe(true)
    host.style.display = previousDisplay
  },
}

export const LinkWithSwitchAndCheckbox: Story = {
  name: 'Link mode: a switch and a checkbox stay operable',
  render: () => ({
    template: `
      <div style="max-width:24rem">
        <gbt-card variant="outlined" heading="Notifications" href="#/settings/notifications">
          <gbt-switch label="Courriel" hint="Un message par événement." />
          <gbt-checkbox label="Résumé hebdomadaire" />
        </gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card, Switch, Checkbox] },
  }),
}

export const FlexColumnWithGap: Story = {
  name: 'Consumer layout: flex column with a gap on the card',
  render: () => ({
    template: `
      <style>
        .flex-card ::ng-deep .gbt-card { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; }
      </style>
      <div class="flex-card" style="max-width:24rem">
        <gbt-card variant="outlined">
          <p style="margin:0">Le texte et le bouton restent des enfants directs de la carte : le gap s'applique.</p>
          <gbt-button text="Continuer" size="small" />
        </gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card, Button] },
  }),
}

export const DarkNew: Story = {
  name: 'Dark (outlined, header, tone, selected, link)',
  render: () => ({
    template: `
      <div style="${GRID}">
        <gbt-card variant="outlined" heading="Variables" icon="file"
          description="Injectées dans chaque job." [count]="3" [flush]="true">${ROWS}</gbt-card>
        <gbt-card variant="outlined" tone="error" heading="Registre"
          description="Le sous-système ne répond plus.">Dernier signe de vie il y a 12 minutes.</gbt-card>
        <gbt-card variant="outlined" tone="success" heading="Jeton généré" icon="check">ghp_xxxxxxxx</gbt-card>
        <gbt-card variant="outlined" [selected]="true" heading="Application d'authentification">Code à 6 chiffres.</gbt-card>
        <gbt-card variant="outlined" heading="Guide de démarrage" href="#/demarrage">Mis à jour il y a 2 jours</gbt-card>
        <gbt-card tone="warning" heading="Elevated + tone">Quota à 92 %.</gbt-card>
      </div>
    `,
    moduleMetadata: { imports: [Card] },
  }),
  decorators: [darkTheme],
}
