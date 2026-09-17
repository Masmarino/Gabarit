import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component, computed, signal } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { Table } from './table'
import { Pagination } from '../pagination/pagination'

const meta: Meta<Table<{ name: string; size: string }>> = {
  title: 'Molecules/Table',
  component: Table,
}

export default meta
type Story = StoryObj<Table<{ name: string; size: string }>>

const columns = [
  { key: 'name' as const, label: 'Nom' },
  { key: 'size' as const, label: 'Taille' },
]

export const Empty: Story = {
  args: {
    data: [],
    columns,
    caption: 'Paquets',
  },
}

export const Nominal: Story = {
  args: {
    data: [
      { name: 'gabarit', size: '42 ko' },
      { name: 'ferristrace', size: '1,2 Mo' },
    ],
    columns,
    caption: 'Paquets',
  },
}

export const Interactive: Story = {
  args: {
    data: [
      { name: 'gabarit', size: '42 ko' },
      { name: 'ferristrace', size: '1,2 Mo' },
    ],
    columns,
    caption: 'Paquets — sélectionner une ligne',
    clickableRows: true,
  },
}

export const Dense: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({ name: `paquet-${i}`, size: `${i} ko` })),
    columns,
    caption: 'Paquets',
  },
}

const ALL_PACKAGES = Array.from({ length: 50 }, (_, i) => ({ name: `paquet-${i}`, size: `${i} ko` }))
const PAGE_SIZE = 10

@Component({
  selector: 'gbt-story-table-with-pagination',
  standalone: true,
  imports: [Table, Pagination],
  template: `
    <gbt-table [data]="visibleRows()" [columns]="columns" caption="Paquets" />
    <div style="margin-top:1rem">
      <gbt-pagination
        [totalItems]="allRows.length"
        [pageSize]="pageSize()"
        [page]="page()"
        (pageChange)="page.set($event)"
        (pageSizeChange)="pageSize.set($event)"
      />
    </div>
  `,
})
class TableWithPaginationHost {
  columns = columns
  allRows = ALL_PACKAGES
  pageSize = signal(PAGE_SIZE)
  page = signal(1)
  visibleRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize()
    return this.allRows.slice(start, start + this.pageSize())
  })
}

@Component({
  selector: 'gbt-story-table-with-pagination-controls',
  standalone: true,
  imports: [Table, Pagination],
  template: `
    <gbt-table [data]="visibleRows()" [columns]="columns" caption="Paquets" />
    <div style="margin-top:1rem">
      <gbt-pagination
        [totalItems]="allRows.length"
        [pageSize]="pageSize()"
        [page]="page()"
        [pageSizeOptions]="[10, 20, 30, 50, 100]"
        [showItemsSummary]="true"
        (pageChange)="page.set($event)"
        (pageSizeChange)="pageSize.set($event)"
      />
    </div>
  `,
})
class TableWithPaginationControlsHost {
  columns = columns
  allRows = ALL_PACKAGES
  pageSize = signal(PAGE_SIZE)
  page = signal(1)
  visibleRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize()
    return this.allRows.slice(start, start + this.pageSize())
  })
}

export const WithPagination: Story = {
  render: () => ({
    template: `<gbt-story-table-with-pagination />`,
    moduleMetadata: { imports: [TableWithPaginationHost] },
  }),
}

export const WithPaginationControls: Story = {
  render: () => ({
    template: `<gbt-story-table-with-pagination-controls />`,
    moduleMetadata: { imports: [TableWithPaginationControlsHost] },
  }),
}

export const Dark: Story = {
  args: {
    data: [
      {
        name: 'gabarit',
        size: '42 ko',
      },
    ],
    columns,
    caption: 'Paquets',
  },
  decorators: [darkTheme],
}
