import type { Meta, StoryObj } from '@storybook/angular-vite'
import { TimelineChart } from './timeline-chart'

const meta: Meta<TimelineChart> = {
  title: 'Organisms/Dataviz/TimelineChart',
  component: TimelineChart,
}

export default meta
type Story = StoryObj<TimelineChart>

const template = `
  <div style="height: 18rem">
    <gbt-timeline-chart label="Écritures et fenêtres de rétention" locale="fr-FR"
      [series]="series" [intervals]="intervals" emptyMessage="Aucune écriture."
      tableCaption="Écritures par jour" intervalsCaption="Fenêtres" xColumn="Jour" />
  </div>
`

const writes = {
  label: 'Écritures',
  points: Array.from({ length: 30 }, (_, i) => ({
    x: new Date(Date.UTC(2026, 7, 1 + i)),
    y: Math.max(8, Math.round(60 + 35 * Math.sin(i / 4) + (i % 7 === 5 ? 40 : 0))),
  })),
}

const retentionWindows = [
  {
    start: new Date(Date.UTC(2026, 7, 1)),
    end: new Date(Date.UTC(2026, 7, 15)),
    label: 'Rétention npm',
  },
  {
    start: new Date(Date.UTC(2026, 7, 10)),
    end: new Date(Date.UTC(2026, 7, 24)),
    label: 'Rétention Docker',
  },
  {
    start: new Date(Date.UTC(2026, 7, 22)),
    end: new Date(Date.UTC(2026, 7, 26)),
    label: 'Purge programmée',
  },
]

export const Nominal: Story = {
  render: () => ({
    props: {
      series: writes,
      intervals: retentionWindows,
    },
    template: template,
    moduleMetadata: { imports: [TimelineChart] },
  }),
}

const denseWrites = {
  label: 'Écritures',
  points: Array.from({ length: 90 }, (_, i) => ({
    x: new Date(Date.UTC(2026, 5, 1 + i)),
    y: Math.max(5, Math.round(70 + 40 * Math.sin(i / 6) + (i % 11 === 0 ? 90 : 0))),
  })),
}

const denseRetentionWindows = [
  {
    start: new Date(Date.UTC(2026, 5, 1)),
    end: new Date(Date.UTC(2026, 5, 29)),
    label: 'Rétention npm — dépôts inactifs depuis plus de 90 jours',
  },
  {
    start: new Date(Date.UTC(2026, 5, 20)),
    end: new Date(Date.UTC(2026, 6, 25)),
    label: 'Rétention Docker — images non tirées depuis 60 jours',
  },
  {
    start: new Date(Date.UTC(2026, 6, 10)),
    end: new Date(Date.UTC(2026, 6, 12)),
    label: 'Purge Maven',
  },
  {
    start: new Date(Date.UTC(2026, 6, 18)),
    end: new Date(Date.UTC(2026, 6, 20)),
    label: 'Purge NuGet',
  },
  {
    start: new Date(Date.UTC(2026, 7, 5)),
    end: new Date(Date.UTC(2026, 7, 6)),
    label: 'Purge Cargo',
  },
  {
    start: new Date(Date.UTC(2026, 7, 20)),
    end: new Date(Date.UTC(2026, 7, 29)),
    label: 'Rétention générale — fin de trimestre',
  },
]

export const Dense: Story = {
  render: () => ({
    props: { series: denseWrites, intervals: denseRetentionWindows },
    template: `
      <div style="height: 18rem">
        <gbt-timeline-chart label="Écritures et fenêtres de rétention, quatre-vingt-dix jours" locale="fr-FR"
          [series]="series" [intervals]="intervals" emptyMessage="Aucune écriture."
          tableCaption="Écritures par jour" intervalsCaption="Fenêtres" xColumn="Jour" />
      </div>
    `,
    moduleMetadata: { imports: [TimelineChart] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { series: { label: 'Écritures', points: [] }, intervals: [] },
    template: template,
    moduleMetadata: { imports: [TimelineChart] },
  }),
}
