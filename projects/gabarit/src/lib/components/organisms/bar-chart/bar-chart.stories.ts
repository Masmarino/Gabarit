import type { Meta, StoryObj } from '@storybook/angular-vite'
import { BarChart } from './bar-chart'

const meta: Meta<BarChart> = { title: 'Organisms/Dataviz/BarChart', component: BarChart }
export default meta
type Story = StoryObj<BarChart>
const template = `
  <div style="height: 18rem">
    <gbt-bar-chart label="Artefacts par registre" locale="fr-FR" [series]="series"
      emptyMessage="Aucun artefact." tableCaption="Artefacts par registre" xColumn="Registre" />
  </div>
`

const artifacts = {
  label: 'Artefacts',
  points: [
    { x: 'npm', y: 4210 },
    { x: 'Docker', y: 2105 },
    { x: 'Maven', y: 1052 },
    { x: 'NuGet', y: 421 },
    { x: 'Cargo', y: 108 },
  ],
}

export const Nominal: Story = {
  render: () => ({
    props: { series: artifacts },
    template: template,
    moduleMetadata: { imports: [BarChart] },
  }),
}

const denseArtifacts = {
  label: 'Artefacts',
  points: [
    'npm',
    'Docker',
    'Maven',
    'NuGet',
    'Cargo',
    'PyPI',
    'RubyGems',
    'Composer',
    'Go modules',
    'Helm',
    'Conan',
    'CocoaPods',
    'Debian',
    'RPM',
  ].map((name, index) => ({ x: name, y: Math.round(4210 / (index + 1)) })),
}

export const Dense: Story = {
  render: () => ({
    props: { series: denseArtifacts },
    template: `
      <div style="height: 18rem">
        <gbt-bar-chart label="Artefacts par registre, quatorze registres" locale="fr-FR"
          [series]="series" emptyMessage="Aucun artefact."
          tableCaption="Artefacts par registre" xColumn="Registre" />
      </div>
    `,
    moduleMetadata: { imports: [BarChart] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { series: { label: 'Artefacts', points: [] } },
    template: template,
    moduleMetadata: { imports: [BarChart] },
  }),
}
