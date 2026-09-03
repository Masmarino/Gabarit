import type { Meta, StoryObj } from '@storybook/angular-vite'
import { DimensionCard } from './dimension-card'

const meta: Meta<DimensionCard> = {
  title: 'Molecules/Dataviz/DimensionCard',
  component: DimensionCard,
}

export default meta
type Story = StoryObj<DimensionCard>

const template = `
  <gbt-dimension-card [rows]="rows" caption="Paquets les plus tirés" labelColumn="Paquet"
    valueColumn="Tirages" emptyMessage="Aucun tirage." locale="fr-FR" />
`

const packages = [
  { label: '@hangar/core', value: 12_480 },
  { label: '@hangar/cli', value: 8_310 },
  { label: 'hangar-docker-proxy', value: 4_905 },
  { label: '@hangar/auth-oidc', value: 2_140 },
  { label: '@hangar/audit-log', value: 612 },
]

export const Nominal: Story = {
  render: () => ({
    props: { rows: packages },
    template: template,
    moduleMetadata: { imports: [DimensionCard] },
  }),
}

const densePackages = [
  { label: '@hangar/registry-storage-replication-agent', value: 3182 },
  { label: '@hangar/registry-garbage-collector-worker', value: 3104 },
  { label: '@hangar/oidc-token-exchange-middleware', value: 3050 },
  { label: '@hangar/audit-log-forwarder-elasticsearch', value: 2988 },
  { label: '@hangar/webhook-delivery-retry-scheduler', value: 2915 },
  { label: '@hangar/docker-manifest-list-normalizer', value: 2870 },
  { label: '@hangar/npm-dist-tag-reconciler', value: 2812 },
  { label: '@hangar/quota-enforcement-daemon', value: 2765 },
]

export const Dense: Story = {
  render: () => ({
    props: { rows: densePackages },
    template: template,
    moduleMetadata: { imports: [DimensionCard] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { rows: [] },
    template: template,
    moduleMetadata: { imports: [DimensionCard] },
  }),
}

export const PreformattedValues: Story = {
  render: () => ({
    props: {
      rows: [
        { label: 'Archives', value: 2_147_483_648, display: '2 Gio' },
        { label: 'Miroirs', value: 1_073_741_824, display: '1 Gio' },
        { label: 'Journaux', value: 268_435_456, display: '256 Mio' },
      ],
    },
    template: template,
    moduleMetadata: { imports: [DimensionCard] },
  }),
}
