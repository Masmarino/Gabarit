import type { Meta, StoryObj } from '@storybook/angular-vite'
import { LineChart } from './line-chart'

const meta: Meta<LineChart<Date | number>> = {
  title: 'Organisms/Dataviz/LineChart',
  component: LineChart,
}

export default meta
type Story = StoryObj<LineChart<Date | number>>

const DAYS = [24, 25, 26, 27, 28, 29, 30].map((j) => new Date(Date.UTC(2026, 7, j)))

const GIO = 1024 ** 3

const storage = [
  { label: 'Docker', bytes: [232, 242, 250, 257, 266, 265, 278] },
  { label: 'npm', bytes: [92, 96, 99, 103, 106, 105, 110] },
].map(({ label, bytes }) => ({
  label,
  points: bytes.map((amount, index) => ({
    x: DAYS[index],
    y: amount * GIO,
    display: `${amount} Gio`,
  })),
}))

export const Nominal: Story = {
  render: () => ({
    props: { series: storage },
    template: `
      <div style="height: 320px">
        <gbt-line-chart
          [series]="series" xKind="time" locale="fr-FR"
          label="Stockage des registres, sept derniers jours"
          heading="Stockage des registres"
          headline="388 Gio"
          trend="+8,4 % sur 7 jours"
          tableCaption="Stockage par registre et par jour"
          xColumn="Jour" emptyMessage="Pas encore assez de mesures."
          [area]="true"
        />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}

export const SingleSeries: Story = {
  render: () => ({
    props: {
      series: [
        {
          label: 'npm',
          points: [7, 14, 30, 60, 90].map((x, i) => ({
            x,
            y: [340, 210, 96, 41, 18][i],
          })),
        },
      ],
    },
    template: `
      <div style="height: 18rem">
        <gbt-line-chart label="Artefacts purgeables selon la fenêtre de rétention" locale="fr-FR" xKind="linear"
          [series]="series" emptyMessage="Aucune mesure."
          tableCaption="Artefacts purgeables par fenêtre" xColumn="Fenêtre (jours)" />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}

export const ThreeSeries: Story = {
  render: () => ({
    props: {
      series: [
        {
          label: 'npm',
          pattern: 'solid',
          points: [10, 25, 50, 100].map((x, i) => ({ x, y: [820, 410, 96, 18][i] })),
        },
        {
          label: 'Docker',
          pattern: 'dashed',
          points: [10, 25, 50, 100].map((x, i) => ({ x, y: [120, 380, 540, 210][i] })),
        },
        {
          label: 'Maven',
          pattern: 'dotted',
          points: [10, 25, 50, 100].map((x, i) => ({ x, y: [640, 290, 88, 12][i] })),
        },
      ],
    },
    template: `
      <div style="height: 18rem">
        <gbt-line-chart label="Artefacts par tranche de taille" locale="fr-FR" xKind="linear"
          [series]="series" emptyMessage="Aucune mesure."
          tableCaption="Artefacts par tranche de taille et par registre" xColumn="Taille (Mio)" />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}

export const UnroundedXValues: Story = {
  render: () => ({
    props: {
      series: [
        {
          label: '@hangar/core — téléchargements cumulés',
          points: [3, 17, 29, 44, 58, 71, 97].map((x, i) => ({
            x,
            y: [128, 340, 512, 780, 1050, 1240, 1690][i],
          })),
        },
      ],
    },
    template: `
      <div style="height: 18rem">
        <gbt-line-chart label="Téléchargements cumulés depuis publication" locale="fr-FR" xKind="linear"
          [series]="series" emptyMessage="Aucune mesure."
          tableCaption="Téléchargements par heure écoulée" xColumn="Heures écoulées" />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}

const NINETY_DAYS = Array.from({ length: 90 }, (_, i) => ({
  x: new Date(Date.UTC(2026, 5, 1 + i)),
  y: (180 + i * 1.1 + Math.sin(i / 6) * 9) * GIO,
  display: `${Math.round(180 + i * 1.1 + Math.sin(i / 6) * 9)} Gio`,
}))

export const Dense: Story = {
  render: () => ({
    props: { series: [{ label: 'Docker', points: NINETY_DAYS }] },
    template: `
      <div style="height: 320px">
        <gbt-line-chart
          [series]="series" xKind="time" locale="fr-FR"
          label="Stockage Docker, quatre-vingt-dix jours"
          tableCaption="Stockage Docker par jour"
          xColumn="Jour" emptyMessage="Pas encore assez de mesures."
        />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { series: [] },
    template: `
      <div style="height: 320px">
        <gbt-line-chart
          [series]="series" xKind="time" locale="fr-FR"
          label="Stockage des registres, sept derniers jours"
          tableCaption="Stockage par registre et par jour"
          xColumn="Jour" emptyMessage="Pas encore assez de mesures."
        />
      </div>
    `,
    moduleMetadata: { imports: [LineChart] },
  }),
}
