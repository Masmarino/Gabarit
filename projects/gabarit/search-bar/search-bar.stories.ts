import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
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

// ---- Compact mode (`collapsible`), as a mobile header uses it -------------------------------------

const mobileViewport = {
  viewport: {
    options: {
      mobile: { name: 'Mobile', styles: { width: '375px', height: '700px' }, type: 'mobile' },
    },
  },
}

/** A header mock: the title and the account chip give the row back while the search is open. */
const header = (attributes: string) => `
  <header style="display:flex;align-items:center;gap:0.75rem;box-sizing:border-box;min-height:4rem;padding:0.75rem 1rem;border-bottom:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-primary)">
    @if (!open) {
      <strong style="flex:1;font-size:1rem">Dashboard</strong>
    }
    <gbt-search-bar
      ${attributes}
      [style.flex]="open ? '1' : 'none'"
      [(expanded)]="open"
      [groupedResults]="categories"
      [displayFn]="displayFn"
      ariaLabel="Search repositories"
      placeholder="Search…"
    />
    @if (!open) {
      <span style="display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:50%;background:var(--bg-hover);font-size:0.75rem;font-weight:600">FS</span>
    }
  </header>
  <p style="padding:0 1rem;font-size:0.875rem">The icon button expands the field over the whole row; Escape, or leaving the empty field, folds it back.</p>
`

const collapsibleStory = (attributes: string, open: boolean): Story => ({
  parameters: mobileViewport,
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => ({
    template: header(attributes),
    moduleMetadata: { imports: [SearchBar] },
    props: { open, categories: CATEGORIES, displayFn: (item: Repo) => item.label },
  }),
})

/** `collapsible`: an icon button (44 px) that expands the field. */
export const Collapsible: Story = collapsibleStory('collapsible', false)

/** Expanded: the field takes the row, the header's other items step aside. */
export const CollapsibleExpanded: Story = collapsibleStory('collapsible', true)

/** `collapsible="narrow"`: compact up to 768 px only; on a desktop viewport the full field shows. */
export const CollapsibleNarrow: Story = collapsibleStory('collapsible="narrow"', false)

export const CollapsibleDark: Story = {
  ...collapsibleStory('collapsible', true),
  decorators: [darkTheme],
}
