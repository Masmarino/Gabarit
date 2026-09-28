import type { Meta, StoryObj } from '@storybook/angular-vite'
import { signal } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { SegmentedControl } from './segmented-control'

const meta: Meta<SegmentedControl> = {
  title: 'Molecules/SegmentedControl',
  component: SegmentedControl,
}

export default meta
type Story = StoryObj<SegmentedControl>

const periodOptions = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export const Nominal: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
  },
}

export const WithDisabledOption: Story = {
  name: 'With a disabled option',
  args: {
    options: [
      { value: 'day', label: 'Jour' },
      { value: 'week', label: 'Semaine', disabled: true },
      { value: 'month', label: 'Mois' },
    ],
    value: 'day',
    ariaLabel: 'Période',
  },
}

export const Disabled: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
    disabled: true,
  },
}

const imports = { imports: [SegmentedControl] }
const panel =
  'padding:1rem;background:var(--bg-panel);border:1px solid var(--border-color);border-radius:var(--site-border-radius-sm)'

export const WithLabel: Story = {
  name: 'With a visible label',
  render: () => ({
    template: `<gbt-segmented-control label="Chiffrement" [options]="options" [(value)]="value" />`,
    moduleMetadata: imports,
    props: {
      options: [
        { value: 'none', label: 'Aucun' },
        { value: 'starttls', label: 'STARTTLS' },
        { value: 'tls', label: 'TLS' },
      ],
      value: signal('starttls'),
    },
  }),
}

export const Small: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;align-items:flex-start">
        <gbt-segmented-control ariaLabel="Affichage" [options]="options" [(value)]="a" />
        <gbt-segmented-control ariaLabel="Affichage" size="sm" [options]="options" [(value)]="b" />
      </div>
    `,
    moduleMetadata: imports,
    props: {
      options: [
        { value: 'code', label: 'Code' },
        { value: 'preview', label: 'Aperçu' },
        { value: 'blame', label: 'Blame' },
      ],
      a: signal('code'),
      b: signal('code'),
    },
  }),
}

export const FullWidth: Story = {
  name: 'Full width',
  render: () => ({
    template: `
      <div style="max-width:24rem;display:flex;flex-direction:column;gap:1rem">
        <gbt-segmented-control fullWidth tinted label="Tri" [options]="options" [(value)]="value" />
        <gbt-segmented-control fullWidth ariaLabel="Ordre" [options]="direction" [(value)]="order" />
      </div>
    `,
    moduleMetadata: imports,
    props: {
      options: [
        { value: 'recent', label: 'Récents' },
        { value: 'name', label: 'Nom' },
        { value: 'stars', label: 'Étoiles' },
      ],
      direction: [
        { value: 'asc', label: 'Croissant' },
        { value: 'desc', label: 'Décroissant' },
      ],
      value: signal('recent'),
      order: signal('desc'),
    },
  }),
}

/** State tabs with counts in a narrow column: the options flow onto a second row instead of overflowing. */
export const Wrap: Story = {
  render: () => ({
    template: `
      <div style="width:17rem">
        <gbt-segmented-control wrap tinted size="sm" ariaLabel="Type de résultat" [options]="options" [(value)]="value" />
      </div>
    `,
    moduleMetadata: imports,
    props: {
      options: [
        { value: 'all', label: 'Tout (48)' },
        { value: 'repos', label: 'Dépôts (12)' },
        { value: 'issues', label: 'Tickets (21)' },
        { value: 'mrs', label: 'Demandes de fusion (9)' },
        { value: 'wiki', label: 'Wiki (6)' },
      ],
      value: signal('all'),
    },
  }),
}

/** The default track (`--bg-panel`) disappears on a panel; `tinted` keeps it visible. */
export const TintedTrack: Story = {
  name: 'Tinted track (on a panel and on the page)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;align-items:flex-start">
        <div style="${panel};display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center">
          <gbt-segmented-control ariaLabel="Défaut" [options]="options" [(value)]="a" />
          <gbt-segmented-control tinted ariaLabel="Teinté" [options]="options" [(value)]="b" />
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center">
          <gbt-segmented-control ariaLabel="Défaut" [options]="options" [(value)]="a" />
          <gbt-segmented-control tinted ariaLabel="Teinté" [options]="options" [(value)]="b" />
        </div>
      </div>
    `,
    moduleMetadata: imports,
    props: { options: periodOptions, a: signal('week'), b: signal('week') },
  }),
}

export const DarkTinted: Story = {
  name: 'Dark, tinted, small and full width',
  render: () => ({
    template: `
      <div style="${panel};max-width:26rem;display:flex;flex-direction:column;gap:1rem">
        <gbt-segmented-control tinted label="Période" [options]="options" [(value)]="a" />
        <gbt-segmented-control tinted fullWidth size="sm" ariaLabel="Période" [options]="options" [(value)]="b" />
      </div>
    `,
    moduleMetadata: imports,
    props: { options: periodOptions, a: signal('week'), b: signal('month') },
  }),
  decorators: [darkTheme],
}

export const Dark: Story = {
  args: {
    options: periodOptions,
    value: 'week',
    ariaLabel: 'Période',
  },
  decorators: [darkTheme],
}
