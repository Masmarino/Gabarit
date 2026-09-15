import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { darkTheme } from '../../../../../.storybook/preview'
import { Autocomplete } from './autocomplete'

interface User {
  id: string
  name: string
  email: string
}

const USERS: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: '2', name: 'Alan Turing', email: 'alan@example.com' },
  { id: '3', name: 'Grace Hopper', email: 'grace@example.com' },
  { id: '4', name: 'Katherine Johnson', email: 'katherine@example.com' },
  { id: '5', name: 'Margaret Hamilton', email: 'margaret@example.com' },
]

function simulatedSearch(query: string): Promise<User[]> {
  const matches = USERS.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()))
  return new Promise((resolve) => setTimeout(() => resolve(matches), 600))
}

function failingSearch(): Promise<User[]> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 600))
}

function observableSearch(query: string): Observable<User[]> {
  return new Observable((subscriber) => {
    const timeout = setTimeout(() => {
      subscriber.next(USERS.filter((user) => user.name.toLowerCase().includes(query.toLowerCase())))
      subscriber.complete()
    }, 600)
    return () => clearTimeout(timeout)
  })
}

const meta: Meta<Autocomplete<User>> = {
  title: 'Molecules/Autocomplete',
  component: Autocomplete,
}

export default meta
type Story = StoryObj<Autocomplete<User>>

export const Default: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Rechercher un utilisateur…"
        [search]="search"
        [displayFn]="displayFn"
        [formControl]="control"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
      control: new FormControl<User | null>(null),
    },
  }),
}

export const CustomItemTemplate: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Rechercher un utilisateur…"
        [search]="search"
        [displayFn]="displayFn"
        [itemTemplate]="userTemplate"
        [formControl]="control"
      />
      <ng-template #userTemplate let-user>
        <div style="display:flex;flex-direction:column;line-height:1.3">
          <strong>{{ user.name }}</strong>
          <span style="font-size:0.75rem;color:var(--text-secondary)">{{ user.email }}</span>
        </div>
      </ng-template>
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
      control: new FormControl<User | null>(null),
    },
  }),
}

export const ObservableSearch: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur (Observable)"
        placeholder="Rechercher un utilisateur…"
        [search]="search"
        [displayFn]="displayFn"
        [formControl]="control"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: observableSearch,
      displayFn: (user: User) => user.name,
      control: new FormControl<User | null>(null),
    },
  }),
}

export const NoResults: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Essayez « xyz »…"
        [search]="search"
        [displayFn]="displayFn"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
    },
  }),
}

export const SearchError: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Tapez pour déclencher l'erreur…"
        [search]="search"
        [displayFn]="displayFn"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: failingSearch,
      displayFn: (user: User) => user.name,
    },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Rechercher un utilisateur…"
        [search]="search"
        [displayFn]="displayFn"
        [formControl]="control"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
      control: new FormControl<User | null>({ value: null, disabled: true }),
    },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Rechercher un utilisateur…"
        errorMessage="Sélectionnez un utilisateur"
        [search]="search"
        [displayFn]="displayFn"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
    },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-autocomplete
        label="Utilisateur"
        placeholder="Rechercher un utilisateur…"
        [search]="search"
        [displayFn]="displayFn"
        [formControl]="control"
      />
    `,
    moduleMetadata: { imports: [Autocomplete, ReactiveFormsModule] },
    props: {
      search: simulatedSearch,
      displayFn: (user: User) => user.name,
      control: new FormControl<User | null>(null),
    },
  }),
  decorators: [darkTheme],
}
