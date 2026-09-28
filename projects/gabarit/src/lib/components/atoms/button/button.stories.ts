import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Button } from './button'

const meta: Meta<Button> = {
  title: 'Atoms/Button',
  component: Button,
}

export default meta
type Story = StoryObj<Button>

export const Nominal: Story = {
  args: {
    text: 'Enregistrer',
  },
}

export const Empty: Story = {
  args: {
    text: '',
    iconName: 'check',
    ariaLabel: 'Valider',
  },
}

export const Dense: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap">
        <gbt-button text="Primary" variant="primary" />
        <gbt-button text="Secondary" variant="secondary" />
        <gbt-button text="Danger" variant="danger" />
        <gbt-button text="Chargement" [loading]="true" />
        <gbt-button text="Désactivé" [disabled]="true" />
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap">
        <gbt-button text="Small" size="small" />
        <gbt-button text="Medium" size="medium" />
        <gbt-button text="Large" size="large" />
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

const ROW = 'display:flex; gap:.5rem; align-items:center; flex-wrap:wrap'

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:grid; gap:1rem">
        <div style="${ROW}">
          <gbt-button text="Primary" variant="primary" />
          <gbt-button text="Secondary" variant="secondary" />
          <gbt-button text="Danger" variant="danger" />
          <gbt-button text="Ghost" variant="ghost" />
          <gbt-button text="Ghost danger" variant="ghost-danger" />
          <gbt-button text="Link" variant="link" />
        </div>
        <div style="${ROW}">
          <gbt-button text="Primary" variant="primary" iconName="check" />
          <gbt-button text="Secondary" variant="secondary" iconName="check" />
          <gbt-button text="Danger" variant="danger" iconName="x" />
          <gbt-button text="Ghost" variant="ghost" iconName="folder" />
          <gbt-button text="Ghost danger" variant="ghost-danger" iconName="x" />
          <gbt-button text="Link" variant="link" iconName="chevron-right" />
        </div>
        <div style="${ROW}">
          <gbt-button text="Ghost" variant="ghost" [disabled]="true" />
          <gbt-button text="Ghost danger" variant="ghost-danger" [disabled]="true" />
          <gbt-button text="Link" variant="link" [disabled]="true" />
          <gbt-button text="Chargement" variant="ghost" [loading]="true" />
        </div>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const QuietInContext: Story = {
  name: 'Ghost, ghost-danger and link in a list row',
  render: () => ({
    template: `
      <ul style="list-style:none; margin:0; padding:0; max-width:32rem; border:1px solid var(--border-color); border-radius:var(--site-border-radius-sm); background:var(--bg-principal); color:var(--text-primary); font-family:var(--font-family)">
        @for (row of rows; track row; let first = $first) {
          <li style="display:flex; align-items:center; gap:.5rem; padding:.5rem .75rem" [style.border-top]="first ? 'none' : '1px solid var(--border-color)'">
            <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ row }}</span>
            <gbt-button variant="link" size="small" text="Détails" />
            <gbt-button variant="ghost" size="small" iconName="folder" [iconOnly]="true" ariaLabel="Ouvrir {{ row }}" />
            <gbt-button variant="ghost-danger" size="small" iconName="x" [iconOnly]="true" ariaLabel="Supprimer {{ row }}" />
          </li>
        }
      </ul>`,
    moduleMetadata: { imports: [Button] },
    props: { rows: ['ci-variables', 'webhook-deploy', 'release-notes.md'] },
  }),
}

export const IconOnly: Story = {
  name: 'Icon-only squares',
  render: () => ({
    template: `
      <div style="display:grid; gap:1rem">
        @for (variant of variants; track variant) {
          <div style="${ROW}">
            <gbt-button [variant]="variant" size="small" iconName="check" [iconOnly]="true" ariaLabel="Valider" />
            <gbt-button [variant]="variant" size="medium" iconName="check" [iconOnly]="true" ariaLabel="Valider" />
            <gbt-button [variant]="variant" size="large" iconName="check" [iconOnly]="true" ariaLabel="Valider" />
            <span style="font:12px var(--font-family); color:var(--text-secondary)">{{ variant }}</span>
          </div>
        }
      </div>`,
    moduleMetadata: { imports: [Button] },
    props: { variants: ['primary', 'secondary', 'danger', 'ghost', 'ghost-danger'] },
  }),
}

export const Toggle: Story = {
  name: 'Toggle (pressed)',
  render: () => ({
    template: `
      <div style="${ROW}">
        <gbt-button
          variant="secondary"
          iconName="check"
          [text]="on ? 'Suivi' : 'Suivre'"
          [pressed]="on"
          (clicked)="on = !on"
        />
        <gbt-button variant="ghost" iconName="check" [pressed]="on" (clicked)="on = !on" [iconOnly]="true" ariaLabel="Suivre" />
        <gbt-button variant="primary" text="Filtre actif" [pressed]="on" (clicked)="on = !on" />
        <span style="font:12px var(--font-family); color:var(--text-secondary)">aria-pressed="{{ on }}"</span>
      </div>`,
    moduleMetadata: { imports: [Button] },
    props: { on: true },
  }),
}

export const Disclosure: Story = {
  name: 'Disclosure (aria-expanded / aria-controls / aria-haspopup)',
  render: () => ({
    template: `
      <div style="display:grid; gap:.5rem; max-width:22rem; font-family:var(--font-family); color:var(--text-primary)">
        <div style="${ROW}">
          <gbt-button
            variant="secondary"
            text="Options avancées"
            iconName="chevron-down"
            [ariaExpanded]="open"
            ariaControls="story-advanced"
            (clicked)="open = !open"
          />
          <gbt-button
            variant="ghost"
            text="Menu"
            ariaHaspopup="menu"
            [ariaExpanded]="false"
            ariaControls="story-menu"
          />
        </div>
        @if (open) {
          <div id="story-advanced" style="padding:.75rem; border:1px solid var(--border-color); border-radius:var(--site-border-radius-sm); background:var(--bg-panel)">
            Le panneau contrôlé par le bouton : <code>aria-controls="story-advanced"</code>.
          </div>
        }
      </div>`,
    moduleMetadata: { imports: [Button] },
    props: { open: true },
  }),
}

export const Block: Story = {
  name: 'Block (full width)',
  render: () => ({
    template: `
      <div style="display:grid; gap:.5rem; max-width:20rem; padding:1rem; border:1px solid var(--border-color); border-radius:var(--site-border-radius-sm); background:var(--bg-principal)">
        <gbt-button text="Se connecter" [block]="true" size="large" type="submit" />
        <gbt-button text="Créer un compte" variant="secondary" [block]="true" />
        <gbt-button text="Mot de passe oublié ?" variant="link" [block]="true" />
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LargeTouchTarget: Story = {
  name: 'Large size reaches 44px',
  render: () => ({
    template: `
      <div style="${ROW}">
        <gbt-button text="Continuer" size="large" />
        <gbt-button text="Continuer" size="large" variant="secondary" />
        <gbt-button iconName="check" size="large" [iconOnly]="true" ariaLabel="Valider" />
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const VariantsDark: Story = {
  render: Variants.render,
  decorators: [darkTheme],
}

export const ToggleDark: Story = {
  render: Toggle.render,
  decorators: [darkTheme],
}

export const Dark: Story = {
  args: {
    text: 'Enregistrer',
  },
  decorators: [darkTheme],
}

// --- Anchor form: a real <a gbtButton>, formerly the separate `ButtonLink` component/story file. ---

export const LinkNominal: Story = {
  name: 'Anchor: nominal',
  render: () => ({
    template: `<a gbtButton href="#/groups">Voir les groupes</a>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LinkVariants: Story = {
  name: 'Anchor: variants',
  render: () => ({
    template: `
      <div style="display:grid; gap:1rem">
        <div style="${ROW}">
          <a gbtButton href="#/x" variant="primary">Primary</a>
          <a gbtButton href="#/x" variant="secondary">Secondary</a>
          <a gbtButton href="#/x" variant="danger">Danger</a>
          <a gbtButton href="#/x" variant="ghost">Ghost</a>
          <a gbtButton href="#/x" variant="ghost-danger">Ghost danger</a>
          <a gbtButton href="#/x" variant="link">Link</a>
        </div>
        <div style="${ROW}">
          <a gbtButton href="#/x" variant="primary" iconName="upload">Envoyer</a>
          <a gbtButton href="#/x" variant="secondary" iconName="folder">Ouvrir</a>
          <a gbtButton href="#/x" variant="ghost" iconName="chevron-right">Suite</a>
          <a gbtButton href="#/x" variant="secondary" iconName="check" [iconOnly]="true" aria-label="Valider"></a>
        </div>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LinkSizes: Story = {
  name: 'Anchor: sizes',
  render: () => ({
    template: `
      <div style="${ROW}">
        <a gbtButton href="#/x" size="small">Small</a>
        <a gbtButton href="#/x" size="medium">Medium</a>
        <a gbtButton href="#/x" size="large">Large (44px)</a>
        <a gbtButton href="#/x" size="large" variant="secondary" iconName="check" [iconOnly]="true" aria-label="Valider"></a>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LinkDisabled: Story = {
  name: 'Anchor: disabled (aria-disabled, no navigation)',
  render: () => ({
    template: `
      <div style="${ROW}">
        <a gbtButton href="#/never" [disabled]="true">Primary</a>
        <a gbtButton href="#/never" variant="secondary" [disabled]="true">Secondary</a>
        <a gbtButton href="#/never" variant="ghost" [disabled]="true">Ghost</a>
        <a gbtButton href="#/never" variant="link" [disabled]="true">Link</a>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LinkBlock: Story = {
  name: 'Anchor: block (full width)',
  render: () => ({
    template: `
      <div style="display:grid; gap:.5rem; max-width:20rem; padding:1rem; border:1px solid var(--border-color); border-radius:var(--site-border-radius-sm); background:var(--bg-principal)">
        <a gbtButton href="#/new" [block]="true" size="large" iconName="folder">Nouveau dépôt</a>
        <a gbtButton href="#/import" variant="secondary" [block]="true">Importer un projet</a>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const NextToButtons: Story = {
  name: 'Anchor beside a gbt-button (same box)',
  render: () => ({
    template: `
      <div style="${ROW}">
        <gbt-button variant="secondary" text="Bouton" />
        <a gbtButton href="#/x" variant="secondary">Lien</a>
        <gbt-button text="Bouton" />
        <a gbtButton href="#/x">Lien</a>
        <gbt-button variant="ghost" text="Bouton" />
        <a gbtButton href="#/x" variant="ghost">Lien</a>
      </div>`,
    moduleMetadata: { imports: [Button] },
  }),
}

export const LinkDark: Story = {
  name: 'Anchor: dark',
  render: LinkVariants.render,
  decorators: [darkTheme],
}
