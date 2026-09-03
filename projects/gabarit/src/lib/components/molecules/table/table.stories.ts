import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Table } from './table'

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
