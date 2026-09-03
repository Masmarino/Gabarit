import type { Meta, StoryObj } from '@storybook/angular-vite'
import { ChartFrame } from './chart-frame'
import { ChartAxis } from '../chart-axis/chart-axis'
import { ChartLegend } from '../chart-legend/chart-legend'
import { ChartTable } from '../chart-table/chart-table'

const meta: Meta<ChartFrame> = {
  title: 'Organisms/Dataviz/ChartFrame',
  component: ChartFrame,
}
export default meta
type Story = StoryObj<ChartFrame>
export const NumericAxes: Story = {
  render: () => ({
    props: {
      x: { kind: 'linear', domain: [0, 97] },
      y: { kind: 'linear', domain: [0, 1200] },
    },
    template: `
      <gbt-chart-frame label="Requêtes par tranche" [x]="x" [y]="y" [size]="{ width: 720, height: 300 }">
        <svg:g gbtChartLayer>
          <svg:g gbtChartAxis axis="x" locale="fr-FR"></svg:g>
          <svg:g gbtChartAxis axis="y" locale="fr-FR"></svg:g>
        </svg:g>
        <gbt-chart-table caption="Requêtes par tranche" [columns]="['Tranche', 'Requêtes']" [rows]="[['0-20', 120]]" />
      </gbt-chart-frame>
    `,
    moduleMetadata: { imports: [ChartFrame, ChartAxis, ChartTable] },
  }),
}

export const MultiDayTimeAxis: Story = {
  render: () => ({
    props: {
      x: {
        kind: 'time',
        domain: [new Date('2026-03-01T00:00:00Z'), new Date('2026-03-04T00:00:00Z')],
      },
      y: { kind: 'linear', domain: [0, 50] },
    },
    template: `
      <gbt-chart-frame label="Erreurs par heure" [x]="x" [y]="y" [size]="{ width: 900, height: 300 }">
        <svg:g gbtChartLayer>
          <svg:g gbtChartAxis axis="x" locale="fr-FR"></svg:g>
          <svg:g gbtChartAxis axis="y" locale="fr-FR"></svg:g>
        </svg:g>
        <gbt-chart-table caption="Erreurs par heure" [columns]="['Heure', 'Erreurs']" [rows]="[['01/03 00:00', 3]]" />
      </gbt-chart-frame>
    `,
    moduleMetadata: { imports: [ChartFrame, ChartAxis, ChartTable] },
  }),
}

export const Legend: Story = {
  render: () => ({
    props: {
      entries: [
        { label: 'Requêtes', pattern: 'solid' },
        { label: 'Erreurs', pattern: 'dashed' },
        { label: 'Latence', pattern: 'dotted' },
      ],
    },
    template: `<gbt-chart-legend [entries]="entries" />`,
    moduleMetadata: { imports: [ChartLegend] },
  }),
}
