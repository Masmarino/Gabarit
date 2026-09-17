import type { Meta, StoryObj } from '@storybook/angular-vite'
import { signal } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { ListToolbar } from './list-toolbar'

const meta: Meta<ListToolbar> = {
  title: 'Molecules/ListToolbar',
  component: ListToolbar,
}

export default meta
type Story = StoryObj<ListToolbar>

const SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date de création' },
]

export const Default: Story = {
  render: () => {
    const search = signal('')
    const sort = signal('name')
    const direction = signal<'asc' | 'desc'>('asc')
    return {
      props: { search, sort, direction, sortOptions: SORT_OPTIONS },
      template: `
        <gbt-list-toolbar
          searchLabel="Rechercher"
          searchPlaceholder="Filtrer par nom…"
          [searchValue]="search()"
          [sortOptions]="sortOptions"
          [sortValue]="sort()"
          [sortDirection]="direction()"
          (searchValueChange)="search.set($event)"
          (sortValueChange)="sort.set($event)"
          (sortDirectionChange)="direction.set($event)"
        />
      `,
      moduleMetadata: { imports: [ListToolbar] },
    }
  },
}

export const Dark: Story = {
  ...Default,
  decorators: [darkTheme],
}
