import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { SearchBar, SearchResultCategory } from './search-bar'

interface Repo {
  id: string
  label: string
}

const meta: Meta<SearchBar<Repo>> = {
  title: 'Organisms/SearchBar',
  component: SearchBar,
}

export default meta
type Story = StoryObj<SearchBar<Repo>>

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

export const Empty: Story = {
  args: {},
}

export const WithResults: Story = {
  render: () => ({
    template: `<gbt-search-bar [groupedResults]="categories" [displayFn]="displayFn" />`,
    moduleMetadata: { imports: [SearchBar] },
    props: {
      categories: CATEGORIES,
      displayFn: (item: Repo) => item.label,
    },
  }),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('.gbt-sb-trigger__input')
    if (input) {
      input.value = 'g'
      input.dispatchEvent(new Event('input'))
    }
  },
}

export const NoResults: Story = {
  render: () => ({
    template: `<gbt-search-bar [groupedResults]="categories" [displayFn]="displayFn" />`,
    moduleMetadata: { imports: [SearchBar] },
    props: {
      categories: [{ label: 'Dépôts', items: [] }] as SearchResultCategory<Repo>[],
      displayFn: (item: Repo) => item.label,
    },
  }),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('.gbt-sb-trigger__input')
    if (input) {
      input.value = 'introuvable'
      input.dispatchEvent(new Event('input'))
    }
  },
}

export const Dark: Story = {
  render: () => ({
    template: `<gbt-search-bar [groupedResults]="categories" [displayFn]="displayFn" />`,
    moduleMetadata: { imports: [SearchBar] },
    props: {
      categories: CATEGORIES,
      displayFn: (item: Repo) => item.label,
    },
  }),
  decorators: [darkTheme],
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('.gbt-sb-trigger__input')
    if (input) {
      input.value = 'g'
      input.dispatchEvent(new Event('input'))
    }
  },
}
