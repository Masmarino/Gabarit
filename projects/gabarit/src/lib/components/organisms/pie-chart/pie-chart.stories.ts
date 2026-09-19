import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { PieChart } from './pie-chart'

const meta: Meta<PieChart> = { title: 'Organisms/Dataviz/PieChart', component: PieChart }

export default meta
type Story = StoryObj<PieChart>

const template = `
  <gbt-pie-chart [slices]="slices" label="Répartition du trafic" locale="fr-FR"
    emptyMessage="Aucune donnée." tableCaption="Répartition du trafic"
    categoryColumn="Source" valueColumn="Visites" shareColumn="Part"
    [sliceAnnouncement]="sliceAnnouncement" [innerRadiusRatio]="innerRadiusRatio" />
`

const sliceAnnouncement = (label: string, value: string, share: string) =>
  `${label}, ${value} visites, ${share} du total`

const trafficSources = [
  { label: 'Direct', value: 4200 },
  { label: 'Recherche organique', value: 3100 },
  { label: 'Réseaux sociaux', value: 1800 },
  { label: 'Email', value: 900 },
  { label: 'Référencement payant', value: 600 },
]

export const Pie: Story = {
  render: () => ({
    props: { slices: trafficSources, sliceAnnouncement, innerRadiusRatio: 0 },
    template,
    moduleMetadata: { imports: [PieChart] },
  }),
}

export const Donut: Story = {
  render: () => ({
    props: { slices: trafficSources, sliceAnnouncement, innerRadiusRatio: 0.6 },
    template,
    moduleMetadata: { imports: [PieChart] },
  }),
}

const manySources = [
  { label: 'Direct', value: 2600 },
  { label: 'Recherche organique', value: 2100 },
  { label: 'Réseaux sociaux', value: 1500 },
  { label: 'Email', value: 1100 },
  { label: 'Référencement payant', value: 800 },
  { label: 'Partenaires', value: 500 },
  { label: 'Forums', value: 300 },
]

export const ManySlices: Story = {
  render: () => ({
    props: { slices: manySources, sliceAnnouncement, innerRadiusRatio: 0 },
    template,
    moduleMetadata: { imports: [PieChart] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { slices: [], sliceAnnouncement, innerRadiusRatio: 0 },
    template,
    moduleMetadata: { imports: [PieChart] },
  }),
}

export const Dark: Story = {
  render: () => ({
    props: { slices: trafficSources, sliceAnnouncement, innerRadiusRatio: 0.6 },
    template,
    moduleMetadata: { imports: [PieChart] },
  }),
  decorators: [darkTheme],
}
