import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FunnelChart } from './funnel-chart'

const meta: Meta<FunnelChart> = {
  title: 'Molecules/Dataviz/FunnelChart',
  component: FunnelChart,
}

export default meta
type Story = StoryObj<FunnelChart>

const template = `
  <gbt-funnel-chart [steps]="steps" label="Publication d'un artefact" locale="fr-FR"
    emptyMessage="Aucune publication." tableCaption="Publication d'un artefact"
    stepColumn="Étape" valueColumn="Dépôts" conversionColumn="Conversion"
    [stepAnnouncement]="stepAnnouncement" />
`

const stepAnnouncement = (label: string, conversion: string) =>
  `${label}, conversion depuis l'étape précédente : ${conversion}`

const publicationSteps = [
  { label: 'Dépôt reçu', value: 1000 },
  { label: 'Signature validée', value: 940 },
  { label: 'Analyse antivirus passée', value: 902 },
  { label: 'Indexé', value: 880 },
  { label: 'Répliqué', value: 615 },
]

export const Nominal: Story = {
  render: () => ({
    props: { steps: publicationSteps, stepAnnouncement },
    template: template,
    moduleMetadata: { imports: [FunnelChart] },
  }),
}

const densePublicationSteps = [
  { label: 'Dépôt reçu par la passerelle HTTP', value: 5000 },
  { label: "Authentification de l'organisation vérifiée", value: 4870 },
  { label: 'Quota de stockage contrôlé', value: 4790 },
  { label: "Signature de l'artefact validée", value: 4755 },
  { label: 'Analyse antivirus passée', value: 4690 },
  { label: 'Indexé dans le registre', value: 4610 },
  { label: 'Répliqué vers le nœud secondaire', value: 3120 },
  { label: 'Notification webhook envoyée', value: 3005 },
]

export const Dense: Story = {
  render: () => ({
    props: { steps: densePublicationSteps, stepAnnouncement },
    template: template,
    moduleMetadata: { imports: [FunnelChart] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { steps: [], stepAnnouncement },
    template: template,
    moduleMetadata: { imports: [FunnelChart] },
  }),
}
