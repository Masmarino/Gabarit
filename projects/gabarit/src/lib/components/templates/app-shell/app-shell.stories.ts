import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { AppShell } from './app-shell'
import { Card } from '../../molecules/card/card'
import { GaugeBar } from '../../atoms/gauge-bar/gauge-bar'
import { Icon } from '../../atoms/icon/icon'
import { Menu } from '../../molecules/menu/menu'
import { Modal } from '../../organisms/modal/modal'
import { SearchBar, SearchResultCategory } from '../../organisms/search-bar/search-bar'

interface Repo {
  id: string
  label: string
}

const meta: Meta<AppShell> = {
  title: 'Templates/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        desktop: { name: 'Desktop', styles: { width: '1180px', height: '860px' }, type: 'desktop' },
        mobile: { name: 'Mobile', styles: { width: '375px', height: '700px' }, type: 'mobile' },
      },
    },
  },
  globals: { viewport: { value: 'desktop', isRotated: false } },
}

export default meta
type Story = StoryObj<AppShell>

const labels = `
  navLabel="Navigation principale"
  skipLabel="Aller au contenu principal"
  openMenuLabel="Ouvrir la navigation"
  closeMenuLabel="Fermer la navigation"
  collapseLabel="Réduire la navigation"
  expandLabel="Agrandir la navigation"
`

const brand = `<a shell-brand href="#" style="font-weight:600;text-decoration:none;color:var(--text-primary)">Hangar</a>`

// The app already owns the `collapsed` signal it binds to `[collapsed]`/
// `(collapsedChange)` — it reuses that same state here to hide the brand
// label itself instead of relying on AppShell for anything extra.
const collapsedBrand = `
  <a shell-brand href="#" style="font-weight:600;text-decoration:none;color:var(--text-primary)">
    <gbt-icon name="info" />
    @if (!collapsed) {
      <span>Hangar</span>
    }
  </a>
`

const links = `
  <a shell-nav href="#" class="gbt-app-shell__link" aria-current="page">Tableau de bord</a>
  <a shell-nav href="#" class="gbt-app-shell__link">Dépôts</a>
  <a shell-nav href="#" class="gbt-app-shell__link">Utilisateurs</a>
  <a shell-nav href="#" class="gbt-app-shell__link">Quotas</a>
  <a shell-nav href="#" class="gbt-app-shell__link">Journal d'audit</a>
`

const collapsedLinks = `
  <a shell-nav href="#" class="gbt-app-shell__link" aria-current="page"><gbt-icon name="check-circle" /><span>Tableau de bord</span></a>
  <a shell-nav href="#" class="gbt-app-shell__link"><gbt-icon name="search" /><span>Dépôts</span></a>
  <a shell-nav href="#" class="gbt-app-shell__link"><gbt-icon name="eye" /><span>Utilisateurs</span></a>
`

const account = `
  <div shell-header style="margin-left:auto">
    <gbt-menu label="Mon compte" align="end">
      <a role="menuitem" class="gbt-menu__item" href="#">Mon compte</a>
      <button role="menuitem" class="gbt-menu__item" type="button">Déconnexion</button>
    </gbt-menu>
  </div>
`

const searchAndAccount = `
  <div shell-header style="margin-left:auto">
    <gbt-search-bar
      [groupedResults]="categories" [displayFn]="displayFn"
      ariaLabel="Rechercher un dépôt" placeholder="Rechercher…" />
  </div>
  <div shell-header>
    <gbt-menu label="Mon compte" align="end">
      <a role="menuitem" class="gbt-menu__item" href="#">Mon compte</a>
      <button role="menuitem" class="gbt-menu__item" type="button">Déconnexion</button>
    </gbt-menu>
  </div>
`

const CATEGORIES: SearchResultCategory<Repo>[] = [
  {
    label: 'Dépôts',
    icon: 'search',
    items: [
      { id: 'r1', label: 'gabarit' },
      { id: 'r2', label: 'ferristrace' },
    ],
  },
]

export const Nominal: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Le contenu de la page vient ici.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu] },
  }),
}

export const WithSearch: Story = {
  render: () => ({
    props: { categories: CATEGORIES, displayFn: (item: Repo) => item.label },
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${searchAndAccount}
        <p>Le contenu de la page vient ici.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu, SearchBar] },
  }),
}

export const WithContent: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Quotas</h1>
        ${account}
        <div class="gbt-container" style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
          <gbt-card heading="Registre Docker" [headingLevel]="2">
            <gbt-gauge-bar
              [value]="257" [max]="500"
              label="Quota du registre Docker"
              formattedValue="257 Gio / 500 Gio"
              warningLabel="Avertissement" criticalLabel="Critique" />
          </gbt-card>
          <gbt-card heading="Registre npm" [headingLevel]="2">
            <gbt-gauge-bar
              [value]="481" [max]="500"
              label="Quota du registre npm"
              formattedValue="481 Gio / 500 Gio"
              warningLabel="Avertissement" criticalLabel="Critique" />
          </gbt-card>
        </div>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Card, GaugeBar, Menu] },
  }),
}

export const LongNavigation: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${Array.from(
          { length: 14 },
          (_, i) =>
            `<a shell-nav href="#" class="gbt-app-shell__link"${i === 0 ? ' aria-current="page"' : ''}>Section de navigation ${i + 1}</a>`,
        ).join('\n')}
        <h1 shell-header style="margin:0;font-size:1rem">Section de navigation 1</h1>
        <p>Quatorze entrées : le tiroir défile, et le lien d'évitement reste le chemin court vers le contenu.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell] },
  }),
}

export const NoHeader: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <p>Aucun contenu projeté dans l'en-tête : seul le bouton de navigation y reste, et il ne se montre qu'en dessous de 768 px.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell] },
  }),
}

export const NotCollapsible: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell
        navLabel="Navigation principale"
        skipLabel="Aller au contenu principal"
        openMenuLabel="Ouvrir la navigation"
        closeMenuLabel="Fermer la navigation"
        [collapsible]="false"
      >
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Le bouton de réduction est omis : <code>collapseLabel</code>/<code>expandLabel</code> ne sont pas nécessaires ici.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu] },
  }),
}

export const Collapsed: Story = {
  render: () => ({
    props: { collapsed: true },
    template: `
      <gbt-app-shell ${labels} [collapsed]="collapsed" (collapsedChange)="collapsed = $event">
        ${collapsedBrand}
        ${collapsedLinks}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Le rail repose sur des liens icône + libellé ; survolez ou donnez le focus à une icône pour révéler son libellé.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu, Icon] },
  }),
}

export const Dark: Story = {
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Le contenu de la page vient ici.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu] },
  }),
  decorators: [darkTheme],
}

export const CollapsedDark: Story = {
  render: () => ({
    props: { collapsed: true },
    template: `
      <gbt-app-shell ${labels} [collapsed]="collapsed" (collapsedChange)="collapsed = $event">
        ${collapsedBrand}
        ${collapsedLinks}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Le rail repose sur des liens icône + libellé ; survolez ou donnez le focus à une icône pour révéler son libellé.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu, Icon] },
  }),
  decorators: [darkTheme],
}

export const MobileOpen: Story = {
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => ({
    props: {},
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Tableau de bord</h1>
        ${account}
        <p>Sous 768 px, le tiroir de navigation est masqué par défaut et s'ouvre par-dessus le contenu, avec une trame (scrim) pour le refermer au clic.</p>
      </gbt-app-shell>
    `,
    moduleMetadata: { imports: [AppShell, Menu] },
  }),
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector<HTMLButtonElement>('.gbt-app-shell__toggle')
    toggle?.click()
  },
}

export const WithOpenModal: Story = {
  render: () => ({
    props: { categories: CATEGORIES, displayFn: (item: Repo) => item.label },
    template: `
      <gbt-app-shell ${labels}>
        ${brand}
        ${links}
        <h1 shell-header style="margin:0;font-size:1rem">Dépôts</h1>
        ${searchAndAccount}
        <p>Le contenu de la page vient ici.</p>
      </gbt-app-shell>
      <gbt-modal [isOpen]="true" heading="Nouveau dépôt" closeLabel="Fermer">
        <p>Le fond doit s'assombrir jusque sous la barre de recherche et le menu du compte, dans l'en-tête.</p>
      </gbt-modal>
    `,
    moduleMetadata: { imports: [AppShell, Menu, SearchBar, Modal] },
  }),
}
