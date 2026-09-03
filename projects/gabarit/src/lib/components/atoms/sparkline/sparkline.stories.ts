import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Sparkline } from './sparkline'

const meta: Meta<Sparkline> = { title: 'Atoms/Dataviz/Sparkline', component: Sparkline }
export default meta

type Story = StoryObj<Sparkline>
const template = `
  <gbt-sparkline [values]="values" tableCaption="Tirages des sept derniers jours"
    xColumn="Jour" yColumn="Tirages" locale="fr-FR" emptyMessage="Aucun tirage." />
`

const downloads = [412, 388, 455, 902, 671, 240, 318]

export const Nominal: Story = {
  render: () => ({
    props: { values: downloads },
    template: template,
    moduleMetadata: { imports: [Sparkline] },
  }),
}

export const InTable: Story = {
  render: () => ({
    props: { values: downloads },
    template: `
      <table style="border-collapse: collapse">
        <tbody>
          <tr>
            <td style="padding: 0.5rem">hangar-docker-proxy</td>
            <td style="padding: 0.5rem">${template}</td>
            <td style="padding: 0.5rem">3 386</td>
          </tr>
        </tbody>
      </table>
    `,
    moduleMetadata: { imports: [Sparkline] },
  }),
}

const denseDownloads = Array.from({ length: 30 }, (_, i) =>
  Math.round(400 + 20 * Math.sin(i / 2) + (i % 3)),
)

export const Dense: Story = {
  render: () => ({
    props: { values: denseDownloads },
    template: `
      <gbt-sparkline [values]="values" tableCaption="Tirages des trente derniers jours"
        xColumn="Jour" yColumn="Tirages" locale="fr-FR" emptyMessage="Aucun tirage." />
    `,
    moduleMetadata: { imports: [Sparkline] },
  }),
}

export const Empty: Story = {
  render: () => ({
    props: { values: [] },
    template: template,
    moduleMetadata: { imports: [Sparkline] },
  }),
}
