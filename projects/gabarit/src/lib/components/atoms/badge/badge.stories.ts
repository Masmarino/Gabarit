import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { withWidgetIcons } from '../../../../../.storybook/widget-story-helpers'
import { Badge } from './badge'

const meta: Meta<Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
}

export default meta
type Story = StoryObj<Badge>

export const Neutral: Story = {
  render: () => ({
    template: `<gbt-badge>Brouillon</gbt-badge>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge>Neutre</gbt-badge>
        <gbt-badge variant="success">Actif</gbt-badge>
        <gbt-badge variant="warning">Quota à 90%</gbt-badge>
        <gbt-badge variant="error">Désactivé</gbt-badge>
        <gbt-badge variant="info">Bêta</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const WithIcon: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge variant="success" icon="check-circle">Vérifié</gbt-badge>
        <gbt-badge variant="error" icon="alert-triangle">Erreur</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const InContext: Story = {
  render: () => ({
    template: `
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.5rem">
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>ada.lovelace</span>
          <gbt-badge variant="success">Actif</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>alan.turing</span>
          <gbt-badge variant="error">Désactivé</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;gap:0.5rem">
          <span>grace.hopper</span>
          <gbt-badge>Invité</gbt-badge>
        </li>
      </ul>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

const row = 'display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center'

export const Outline: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <div style="${row}">
          <gbt-badge appearance="outline">Auteur</gbt-badge>
          <gbt-badge appearance="outline" variant="success">Actif</gbt-badge>
          <gbt-badge appearance="outline" variant="warning">Quota à 90%</gbt-badge>
          <gbt-badge appearance="outline" variant="error">Désactivé</gbt-badge>
          <gbt-badge appearance="outline" variant="info">Bêta</gbt-badge>
          <gbt-badge appearance="outline" variant="success" icon="check-circle">Version actuelle</gbt-badge>
        </div>
        <div style="padding:0.75rem;background:var(--bg-panel);border-radius:var(--site-border-radius-sm);${row}">
          <gbt-badge appearance="outline">Auteur</gbt-badge>
          <gbt-badge appearance="outline" variant="success">Actif</gbt-badge>
          <gbt-badge appearance="outline" variant="warning">Quota à 90%</gbt-badge>
          <gbt-badge appearance="outline" variant="error">Désactivé</gbt-badge>
          <gbt-badge appearance="outline" variant="info">Bêta</gbt-badge>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const Small: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <div style="${row}">
          <gbt-badge>Neutre</gbt-badge>
          <gbt-badge variant="success">Actif</gbt-badge>
          <gbt-badge variant="info" icon="check">Bêta</gbt-badge>
          <gbt-badge appearance="outline">Neutre</gbt-badge>
        </div>
        <div style="${row}">
          <gbt-badge size="sm">Neutre</gbt-badge>
          <gbt-badge size="sm" variant="success">Actif</gbt-badge>
          <gbt-badge size="sm" variant="info" icon="check">Bêta</gbt-badge>
          <gbt-badge size="sm" appearance="outline">Neutre</gbt-badge>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** A count next to a heading: equal-width digits keep the pill from jittering as the number changes. */
export const Counters: Story = {
  render: () => ({
    template: `
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:0.5rem;max-width:16rem">
        <li style="display:flex;align-items:center;justify-content:space-between">
          <span>Ouverts</span><gbt-badge size="sm" tabularNums>11</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;justify-content:space-between">
          <span>Fermés</span><gbt-badge size="sm" tabularNums>1 118</gbt-badge>
        </li>
        <li style="display:flex;align-items:center;justify-content:space-between">
          <span>À traiter</span><gbt-badge size="sm" tabularNums variant="info">7</gbt-badge>
        </li>
      </ul>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** Event chips in a narrow row: without `truncate` the last one overflows, with it the label ellipsises. */
export const Truncate: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1.25rem;overflow-x:clip">
        @for (mode of [false, true]; track mode) {
          <div>
            <p style="margin:0 0 0.375rem;font-size:0.8125rem;color:var(--text-secondary)">
              {{ mode ? 'truncate' : 'défaut (déborde)' }}
            </p>
            <ul style="list-style:none;margin:0;padding:0.5rem;width:12rem;box-sizing:border-box;border:1px dashed var(--border-color);display:flex;flex-wrap:wrap;gap:0.375rem">
              @for (event of events; track event) {
                <li style="display:flex;min-width:0;max-width:100%">
                  <gbt-badge appearance="outline" [truncate]="mode" [attr.title]="event">{{ event }}</gbt-badge>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
    props: {
      events: ['Push', 'Demande de fusion commentée sur une branche protégée', 'Pipeline terminé'],
    },
  }),
}

export const DarkOutline: Story = {
  name: 'Dark, outline and small',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <div style="${row}">
          <gbt-badge appearance="outline">Auteur</gbt-badge>
          <gbt-badge appearance="outline" variant="success">Actif</gbt-badge>
          <gbt-badge appearance="outline" variant="warning">Quota à 90%</gbt-badge>
          <gbt-badge appearance="outline" variant="error">Désactivé</gbt-badge>
          <gbt-badge appearance="outline" variant="info">Bêta</gbt-badge>
        </div>
        <div style="${row}">
          <gbt-badge size="sm" tabularNums>1 118</gbt-badge>
          <gbt-badge size="sm" variant="info" tabularNums>7</gbt-badge>
          <gbt-badge size="sm" appearance="outline" variant="success">Actif</gbt-badge>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
  decorators: [darkTheme],
}

export const Dark: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <gbt-badge>Neutre</gbt-badge>
        <gbt-badge variant="success">Actif</gbt-badge>
        <gbt-badge variant="warning">Quota à 90%</gbt-badge>
        <gbt-badge variant="error">Désactivé</gbt-badge>
        <gbt-badge variant="info">Bêta</gbt-badge>
      </div>
    `,
    moduleMetadata: { imports: [Badge] },
  }),
  decorators: [darkTheme],
}

// --- mono / copyable: merged from the removed `gbt-code-chip` (`Atoms/CodeChip`) ---

const monoRow = 'display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;padding:1rem'

export const MonoDefault: Story = {
  name: 'Mono: default',
  decorators: [withWidgetIcons],
  render: () => ({
    template: `<div style="${monoRow}"><gbt-badge mono>a1b2c3d</gbt-badge></div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** A SHA, a tag, a branch, a repository: with or without an icon. */
export const MonoKinds: Story = {
  name: 'Mono: kinds',
  decorators: [withWidgetIcons],
  render: () => ({
    template: `
      <div style="${monoRow}">
        <gbt-badge mono icon="git-commit">a1b2c3d</gbt-badge>
        <gbt-badge mono icon="tag">v1.2.0</gbt-badge>
        <gbt-badge mono icon="git-branch">feature/copy-widgets</gbt-badge>
        <gbt-badge mono>atelier/gabarit</gbt-badge>
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** Copyable: the button copies the FULL SHA while the chip shows the short one. */
export const MonoCopyable: Story = {
  name: 'Mono: copyable',
  decorators: [withWidgetIcons],
  render: () => ({
    template: `
      <div style="${monoRow}">
        <gbt-badge mono icon="git-commit" copyable copyValue="a1b2c3d4e5f60718293a4b5c6d7e8f9012345678" copyLabel="Copy the commit SHA" fullText="a1b2c3d4e5f60718293a4b5c6d7e8f9012345678">a1b2c3d</gbt-badge>
        <gbt-badge mono icon="git-branch" copyable copyLabel="Copy the branch name">feature/copy-widgets</gbt-badge>
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** In a narrow row the branch name is cut with an ellipsis (`fullText` gives it as a tooltip), never overflowing. */
export const MonoTruncatedInNarrowRow: Story = {
  name: 'Mono: truncated in a narrow row',
  decorators: [withWidgetIcons],
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;padding:1rem">
        <div style="display:flex;align-items:center;gap:0.5rem;width:16rem;padding:0.5rem;border:1px dashed var(--border-color);color:var(--text-primary);font-size:0.875rem">
          <span style="flex:none;font-weight:600">#128</span>
          <gbt-badge mono truncate icon="git-branch" fullText="feature/copy-widgets-for-the-forge-front-end-migration">feature/copy-widgets-for-the-forge-front-end-migration</gbt-badge>
          <gbt-badge variant="success" size="sm">open</gbt-badge>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;width:12rem;padding:0.5rem;border:1px dashed var(--border-color)">
          <gbt-badge mono truncate maxWidth="7rem" fullText="release/2026.09-candidate">release/2026.09-candidate</gbt-badge>
          <span style="color:var(--text-secondary);font-size:0.8125rem">capped at 7rem</span>
        </div>
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** In a sentence, on the line height of the text. */
export const MonoInASentence: Story = {
  name: 'Mono: in a sentence',
  decorators: [
    withWidgetIcons,
    componentWrapperDecorator(
      (story) =>
        `<p style="max-width:28rem;margin:0;padding:1rem;color:var(--text-primary);font-size:0.875rem;line-height:1.6">${story}</p>`,
    ),
  ],
  render: () => ({
    template: `Merged <gbt-badge mono icon="git-branch">feature/copy-widgets</gbt-badge> into <gbt-badge mono icon="git-branch">main</gbt-badge> as <gbt-badge mono>a1b2c3d</gbt-badge>, tagged <gbt-badge mono icon="tag">v1.2.0</gbt-badge>.`,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const MonoDark: Story = {
  name: 'Mono: dark',
  decorators: [withWidgetIcons, darkTheme],
  render: () => ({
    template: `
      <div style="${monoRow}">
        <gbt-badge mono icon="git-commit" copyable copyLabel="Copy the commit SHA">a1b2c3d</gbt-badge>
        <gbt-badge mono icon="tag">v1.2.0</gbt-badge>
        <gbt-badge mono icon="git-branch" maxWidth="8rem">feature/copy-widgets</gbt-badge>
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

// --- value mode: merged from the removed `gbt-counter` (`Atoms/Counter`) ---

const counterRow = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:center;padding:1rem'

export const CounterDefault: Story = {
  name: 'Value: default',
  render: () => ({
    template: `<div style="${counterRow}"><gbt-badge [value]="12" /></div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/**
 * Counter's old `appearance="primary"` (brand-filled) has no direct Badge equivalent — Badge's own
 * `variant`/`appearance`/`size` axes replace it; this story shows the closest looks (see the migration
 * note in README.md).
 */
export const CounterLooks: Story = {
  name: 'Value: composes with variant/appearance/size',
  render: () => ({
    template: `
      <div style="${counterRow}">
        <gbt-badge [value]="4" /> <gbt-badge [value]="4" variant="info" />
        <gbt-badge [value]="4" size="sm" /> <gbt-badge [value]="4" size="sm" variant="info" />
        <gbt-badge [value]="4" appearance="outline" />
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** `max` caps the display; a zero is shown unless `hideZero` is set. */
export const CounterMaxAndZero: Story = {
  name: 'Value: max and zero',
  render: () => ({
    template: `
      <div style="${counterRow}">
        <gbt-badge [value]="7" [max]="99" /> <gbt-badge [value]="99" [max]="99" />
        <gbt-badge [value]="1284" [max]="99" /> <gbt-badge [value]="21" [max]="20" variant="info" />
        <gbt-badge [value]="1284" />
        <span style="color:var(--text-secondary)">zero, shown:</span> <gbt-badge [value]="0" />
        <span style="color:var(--text-secondary)">zero, hidden:</span> <gbt-badge [value]="0" hideZero />
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

/** In the places FerrisGit re-created it: a heading, a tab, a card header. */
export const CounterInContext: Story = {
  name: 'Value: in context (heading, tab, card header)',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1.25rem;padding:1rem;color:var(--text-primary)">
        <h3 style="margin:0;display:flex;align-items:center;gap:0.5rem;font-size:0.9375rem">Pages <gbt-badge [value]="24" label="pages" /></h3>
        <div style="display:flex;gap:1.5rem;font-size:0.875rem;font-weight:600">
          <span style="display:flex;align-items:center;gap:0.375rem">Open <gbt-badge [value]="8" size="sm" /></span>
          <span style="display:flex;align-items:center;gap:0.375rem">Closed <gbt-badge [value]="134" [max]="99" size="sm" /></span>
          <span style="display:flex;align-items:center;gap:0.375rem">Mine <gbt-badge [value]="2" variant="info" size="sm" label="to review" /></span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;color:var(--text-secondary)">For comparison: <gbt-badge size="sm" tabularNums>24</gbt-badge></div>
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}

export const CounterDark: Story = {
  name: 'Value: dark',
  decorators: [darkTheme],
  render: () => ({
    template: `
      <div style="${counterRow}">
        <gbt-badge [value]="4" /> <gbt-badge [value]="4" variant="info" />
        <gbt-badge [value]="1284" [max]="99" size="sm" /> <gbt-badge [value]="9" size="sm" variant="info" />
      </div>`,
    moduleMetadata: { imports: [Badge] },
  }),
}
