import type { Meta, StoryObj } from '@storybook/angular-vite'
import { signal } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { CheckboxGroup, type CheckboxGroupSection } from './checkbox-group'

const meta: Meta<CheckboxGroup> = {
  title: 'Molecules/CheckboxGroup',
  component: CheckboxGroup,
}

export default meta
type Story = StoryObj<CheckboxGroup>

const notifications = [
  { value: 'mentions', label: 'Mentions' },
  { value: 'reviews', label: 'Demandes de relecture' },
  { value: 'releases', label: 'Nouvelles versions' },
  { value: 'digest', label: 'Résumé hebdomadaire' },
]

const eventGroups: CheckboxGroupSection[] = [
  {
    label: 'Code',
    options: [
      { value: 'push', label: 'Push' },
      { value: 'tag', label: 'Tag créé' },
      { value: 'branch', label: 'Branche supprimée' },
    ],
  },
  {
    label: 'Suivi',
    options: [
      { value: 'issue', label: 'Ticket ouvert' },
      { value: 'issue-comment', label: 'Ticket commenté' },
    ],
  },
  {
    label: 'Fusion',
    options: [
      { value: 'mr', label: 'Demande de fusion' },
      { value: 'mr-comment', label: 'Demande de fusion commentée' },
      { value: 'mr-merged', label: 'Fusion effectuée' },
    ],
  },
  {
    label: 'Livraison',
    options: [
      { value: 'pipeline', label: 'Pipeline terminé' },
      { value: 'release', label: 'Version publiée' },
    ],
  },
]

export const Nominal: Story = {
  render: () => ({
    template: `
      <gbt-checkbox-group legend="Me prévenir pour" [options]="options" [formControl]="control" />
      <p style="margin:1rem 0 0;font-size:0.8125rem;color:var(--text-secondary)">
        Valeur : {{ (control.value ?? []).join(', ') || 'aucune' }}
      </p>
    `,
    moduleMetadata: { imports: [CheckboxGroup, ReactiveFormsModule] },
    props: { options: notifications, control: new FormControl(['mentions', 'reviews']) },
  }),
}

export const WithHintAndOptionHints: Story = {
  name: 'With a hint and option hints',
  render: () => ({
    template: `
      <div style="max-width:26rem">
        <gbt-checkbox-group
          legend="Me prévenir pour"
          hint="Vous pouvez changer ces réglages à tout moment."
          [options]="options"
          [formControl]="control"
          required
        />
      </div>
    `,
    moduleMetadata: { imports: [CheckboxGroup, ReactiveFormsModule] },
    props: {
      options: [
        { value: 'mentions', label: 'Mentions', hint: 'Quand quelqu’un vous cite avec @.' },
        {
          value: 'reviews',
          label: 'Demandes de relecture',
          hint: 'Dès qu’une demande de fusion vous est assignée.',
        },
        { value: 'digest', label: 'Résumé hebdomadaire', disabled: true },
      ],
      control: new FormControl(['mentions']),
    },
  }),
}

/** The webhook events form: four named sections laid out as columns that fit the width. */
export const GroupedColumns: Story = {
  name: 'Grouped, in columns',
  render: () => ({
    template: `
      <gbt-checkbox-group
        legend="Événements"
        [groups]="groups"
        columns="auto"
        [formControl]="control"
      />
      <p style="margin:1rem 0 0;font-size:0.8125rem;color:var(--text-secondary)">
        {{ (control.value ?? []).length }} événement(s) sélectionné(s)
      </p>
    `,
    moduleMetadata: { imports: [CheckboxGroup, ReactiveFormsModule] },
    props: { groups: eventGroups, control: new FormControl(['push', 'release']) },
  }),
}

export const TwoColumns: Story = {
  name: 'Flat, two columns',
  render: () => ({
    template: `
      <div style="max-width:28rem">
        <gbt-checkbox-group legend="Me prévenir pour" [options]="options" [columns]="2" [(value)]="value" />
      </div>
    `,
    moduleMetadata: { imports: [CheckboxGroup] },
    props: { options: notifications, value: signal(['releases']) },
  }),
}

export const WithError: Story = {
  render: () => ({
    template: `
      <gbt-checkbox-group
        legend="Événements"
        [groups]="groups"
        columns="auto"
        errorMessage="Sélectionnez au moins un événement."
        [(value)]="value"
      />
    `,
    moduleMetadata: { imports: [CheckboxGroup] },
    props: { groups: eventGroups.slice(0, 2), value: signal<string[]>([]) },
  }),
}

export const Disabled: Story = {
  render: () => ({
    template: `<gbt-checkbox-group legend="Me prévenir pour" [options]="options" disabled [(value)]="value" />`,
    moduleMetadata: { imports: [CheckboxGroup] },
    props: { options: notifications, value: signal(['mentions']) },
  }),
}

export const HiddenLegend: Story = {
  name: 'Hidden legend',
  render: () => ({
    template: `<gbt-checkbox-group legend="Me prévenir pour" hideLegend [options]="options" [(value)]="value" />`,
    moduleMetadata: { imports: [CheckboxGroup] },
    props: { options: notifications.slice(0, 2), value: signal(['mentions']) },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-checkbox-group
        legend="Événements"
        hint="Un appel est envoyé à chaque événement coché."
        [groups]="groups"
        columns="auto"
        [formControl]="control"
      />
    `,
    moduleMetadata: { imports: [CheckboxGroup, ReactiveFormsModule] },
    props: { groups: eventGroups, control: new FormControl(['push', 'issue', 'release']) },
  }),
  decorators: [darkTheme],
}
