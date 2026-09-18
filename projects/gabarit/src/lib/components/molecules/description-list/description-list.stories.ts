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
    <gbt-description-list [items]="items()" [layout]="layout()" />
  `,
})
class DescriptionListHost {
  layout = input<'stacked' | 'inline'>('stacked')

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
