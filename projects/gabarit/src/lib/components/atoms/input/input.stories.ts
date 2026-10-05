import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { GbtInput } from './input'

const meta: Meta<GbtInput> = {
  title: 'Atoms/Input',
  component: GbtInput,
}

export default meta
type Story = StoryObj<GbtInput>

export const Empty: Story = {
  args: {
    label: 'Nom',
  },
}

export const Filled: Story = {
  render: () => ({
    template: `<gbt-input label="Nom" [formControl]="control" />`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { control: new FormControl('Florian Simon') },
  }),
}

export const Password: Story = {
  args: {
    label: 'Mot de passe',
    type: 'password',
  },
}

export const Email: Story = {
  args: {
    label: 'Adresse électronique',
    type: 'email',
    placeholder: 'prenom.nom@exemple.fr',
  },
}

export const Error: Story = {
  args: {
    label: 'Nom',
    errorMessage: 'Ce champ est obligatoire',
  },
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-input label="Nom" [formControl]="control" />`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { control: new FormControl({ value: 'Florian Simon', disabled: true }) },
  }),
}

const COLUMN = 'display:grid; gap:1rem; max-width:22rem'

export const WithHint: Story = {
  args: {
    label: 'Nom du dépôt',
    hint: 'Lettres, chiffres, - et _ uniquement.',
    placeholder: 'mon-projet',
  },
}

export const HintReplacedByError: Story = {
  name: 'Hint gives way to the error',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-input label="Nom du dépôt" hint="Lettres, chiffres, - et _ uniquement." [formControl]="ok" />
        <gbt-input
          label="Nom du dépôt"
          hint="Lettres, chiffres, - et _ uniquement."
          errorMessage="Ce nom est déjà utilisé dans ce groupe."
          [formControl]="taken"
        />
      </div>`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { ok: new FormControl('mon-projet'), taken: new FormControl('ferrisgit') },
  }),
}

export const HiddenLabel: Story = {
  name: 'Hidden label (still names the field)',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-input label="Rechercher un dépôt" [hideLabel]="true" placeholder="Rechercher un dépôt…" leadingIcon="search" type="search" />
        <gbt-input label="Rechercher un dépôt" placeholder="Rechercher un dépôt…" leadingIcon="search" type="search" />
      </div>`,
    moduleMetadata: { imports: [GbtInput] },
  }),
}

export const Small: Story = {
  name: 'Size sm',
  render: () => ({
    template: `
      <div style="display:flex; gap:.75rem; align-items:flex-end; flex-wrap:wrap">
        <gbt-input label="Medium" style="width:11rem" [formControl]="a" />
        <gbt-input label="Small" size="sm" style="width:11rem" [formControl]="b" />
        <gbt-input label="Small, icon" size="sm" leadingIcon="search" type="search" style="width:11rem" placeholder="Filtrer…" />
        <gbt-input label="Filtrer" [hideLabel]="true" size="sm" leadingIcon="search" type="search" style="width:11rem" placeholder="Filtrer…" />
      </div>`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { a: new FormControl('Valeur'), b: new FormControl('Valeur') },
  }),
}

export const Mono: Story = {
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-input label="Empreinte (SHA)" [mono]="true" [formControl]="sha" hint="40 caractères hexadécimaux." [spellcheck]="false" />
        <gbt-input label="Jeton d'accès" [mono]="true" size="sm" [formControl]="token" />
      </div>`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: {
      sha: new FormControl('9fceb02d0ae598e95dc970b74767f19372d61af8'),
      token: new FormControl('glpat-3f9c2a71b6'),
    },
  }),
}

export const LeadingIcon: Story = {
  args: {
    label: 'Rechercher',
    type: 'search',
    leadingIcon: 'search',
    placeholder: 'Rechercher…',
  },
}

export const Combobox: Story = {
  name: 'Combobox of a list of suggestions',
  render: () => ({
    template: `
      <div style="position: relative; max-width: 24rem">
        <gbt-input
          label="Rechercher un paquet"
          [hideLabel]="true"
          type="search"
          leadingIcon="search"
          placeholder="Rechercher un paquet…"
          [combobox]="{ expanded: true, controls: 'story-suggestions', activeDescendant: 'story-suggestion-1' }"
        />
        <ul id="story-suggestions" role="listbox" aria-label="Suggestions" style="list-style: none; margin: 0.25rem 0 0; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 0.375rem; background: var(--bg-principal); color: var(--text-primary)">
          <li id="story-suggestion-0" role="option" aria-selected="false" style="padding: 0.5rem">left-pad</li>
          <li id="story-suggestion-1" role="option" aria-selected="true" style="padding: 0.5rem; background: var(--bg-hover)">left-pad-cli</li>
        </ul>
      </div>`,
    moduleMetadata: { imports: [GbtInput] },
  }),
}

export const Types: Story = {
  name: 'Types number, search, url',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-input label="Nombre de jours" type="number" [min]="1" [max]="365" inputmode="numeric" hint="Entre 1 et 365." [formControl]="days" />
        <gbt-input label="Site web" type="url" placeholder="https://exemple.fr" inputmode="url" autocapitalize="off" [spellcheck]="false" />
        <gbt-input label="Recherche" type="search" enterkeyhint="search" leadingIcon="search" />
      </div>`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { days: new FormControl('30') },
  }),
}

export const OneTimeCode: Story = {
  name: 'One-time code (inputmode, maxlength, …)',
  render: () => ({
    template: `
      <gbt-input
        style="max-width:12rem"
        label="Code à 6 chiffres"
        [mono]="true"
        inputmode="numeric"
        autocomplete="one-time-code"
        [maxlength]="6"
        [spellcheck]="false"
        autocapitalize="off"
        enterkeyhint="go"
        hint="Saisissez le code de l'application."
      />`,
    moduleMetadata: { imports: [GbtInput] },
  }),
}

export const Dark: Story = {
  args: {
    label: 'Nom',
  },
  decorators: [darkTheme],
}

export const DarkFields: Story = {
  name: 'Dark — hint, error, sm, mono, icon',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-input label="Nom du dépôt" hint="Lettres, chiffres, - et _ uniquement." [formControl]="a" />
        <gbt-input label="Nom du dépôt" hint="Lettres, chiffres, - et _ uniquement." errorMessage="Ce nom est déjà utilisé." [formControl]="a" />
        <gbt-input label="Filtrer" [hideLabel]="true" size="sm" leadingIcon="search" type="search" placeholder="Filtrer…" />
        <gbt-input label="Empreinte" [mono]="true" [formControl]="b" />
      </div>`,
    moduleMetadata: { imports: [GbtInput, ReactiveFormsModule] },
    props: { a: new FormControl('ferrisgit'), b: new FormControl('9fceb02d0ae598e9') },
  }),
  decorators: [darkTheme],
}
