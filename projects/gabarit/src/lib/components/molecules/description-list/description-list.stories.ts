import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component, TemplateRef, input, viewChild } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { DescriptionList, DescriptionListEntry } from './description-list'
import { Badge } from '../../atoms/badge/badge'

const meta: Meta<DescriptionList> = {
  title: 'Molecules/DescriptionList',
  component: DescriptionList,
}

export default meta
type Story = StoryObj<DescriptionList>

@Component({
  selector: 'gbt-story-description-list-host',
  standalone: true,
  imports: [DescriptionList, Badge],
  template: `
    <ng-template #statusValue>
      <gbt-badge variant="success">Actif</gbt-badge>
    </ng-template>
    <gbt-description-list
      [items]="items()"
      [layout]="layout()"
      [valueAlign]="valueAlign()"
      [responsive]="responsive()"
    />
  `,
})
class DescriptionListHost {
  layout = input<'stacked' | 'inline'>('stacked')
  valueAlign = input<'start' | 'end'>('start')
  responsive = input<'viewport' | 'container'>('viewport')

  private readonly statusValue = viewChild.required<TemplateRef<unknown>>('statusValue')

  items(): DescriptionListEntry[] {
    return [
      { term: 'Propriétaire', value: 'Ada Lovelace' },
      { term: 'Créé le', value: '12 mars 2024' },
      { term: 'Taille', value: '1,2 Mo' },
      { term: 'Statut', value: this.statusValue() },
    ]
  }
}

export const Stacked: Story = {
  render: () => ({
    template: `<gbt-story-description-list-host />`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
}

export const Inline: Story = {
  render: () => ({
    template: `<gbt-story-description-list-host [layout]="'inline'" />`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-story-description-list-host />`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
  decorators: [darkTheme],
}

/** `valueAlign="end"`: a fact sheet, the value on the far edge of its row. */
export const ValuesAtTheEnd: Story = {
  render: () => ({
    template: `
      <div style="max-width: 26rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
        <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" />
      </div>`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
}

/**
 * `responsive="container"`: each list stacks by its own width, not the viewport's. Both boxes are
 * inline lists; the narrow one stacks (with values back on the start edge), the wide one keeps two
 * columns.
 */
export const ContainerResponsive: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start">
        <div style="width: 22rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
          <p style="margin: 0 0 .75rem; font-size: .75rem; color: var(--text-secondary)">22rem : empilée</p>
          <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" [responsive]="'container'" />
        </div>
        <div style="width: 32rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
          <p style="margin: 0 0 .75rem; font-size: .75rem; color: var(--text-secondary)">32rem : deux colonnes</p>
          <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" [responsive]="'container'" />
        </div>
      </div>`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
}

export const ValuesAtTheEndDark: Story = {
  render: () => ({
    template: `
      <div style="max-width: 26rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
        <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" />
      </div>`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
  decorators: [darkTheme],
}

export const ContainerResponsiveDark: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start">
        <div style="width: 22rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
          <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" [responsive]="'container'" />
        </div>
        <div style="width: 32rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--site-border-radius)">
          <gbt-story-description-list-host [layout]="'inline'" [valueAlign]="'end'" [responsive]="'container'" />
        </div>
      </div>`,
    moduleMetadata: { imports: [DescriptionListHost] },
  }),
  decorators: [darkTheme],
}
