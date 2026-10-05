import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { inContentArea, muted, withLayoutIcons } from '../.storybook/layout-story-helpers'
import { Button } from '../button/button'
import { UserChip } from '../user-chip/user-chip'
import { Panel } from './panel'

// Panels live in a page's [page-aside]: shown at the aside's default width (300px).
const inAside = componentWrapperDecorator(
  (story) => `<aside style="max-width: 300px;">${story}</aside>`,
)

const meta: Meta<Panel> = {
  title: 'Molecules/Panel',
  component: Panel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withLayoutIcons,
    moduleMetadata({ imports: [Button, UserChip] }),
    inAside,
    inContentArea,
  ],
  argTypes: {
    headingLevel: { control: 'inline-radio', options: [2, 3, 4] },
  },
  args: { heading: 'About', headingLevel: 3 },
}

export default meta
type Story = StoryObj<Panel>

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <gbt-panel [heading]="heading" [headingLevel]="headingLevel">
        <p style="margin: 0 0 0.5rem;">A self-hosted Git forge written in Rust: repositories, issues, merge requests and pipelines.</p>
        ${muted('Created 8 months ago · 12.4 MB')}
      </gbt-panel>`,
  }),
}

/** A header action on the right of the heading. */
export const WithActions: Story = {
  args: { heading: 'Labels' },
  render: (args) => ({
    props: args,
    template: `
      <gbt-panel [heading]="heading" [headingLevel]="headingLevel">
        <gbt-button panel-actions variant="ghost" size="small" iconName="pencil" text="Edit" />
        <p style="margin: 0;">bug · interface · high priority</p>
      </gbt-panel>`,
  }),
}

/** Three consecutive panels, as in a repository aside: hairline separators between them. */
export const ThreeStacked: Story = {
  render: () => ({
    template: `
      <gbt-panel heading="About">
        <p style="margin: 0 0 0.5rem;">A self-hosted Git forge written in Rust.</p>
        ${muted('Created 8 months ago · 12.4 MB')}
      </gbt-panel>
      <gbt-panel heading="Topics">
        <p style="margin: 0;">rust · git · self-hosting</p>
      </gbt-panel>
      <gbt-panel heading="Contributors">
        <gbt-button panel-actions variant="ghost" size="small" text="See all" />
        <ul style="display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none;">
          <li><gbt-user-chip name="Florian Simon" /></li>
          <li><gbt-user-chip name="Alice Martin" /></li>
          <li><gbt-user-chip name="Bastien Petit" /></li>
        </ul>
      </gbt-panel>`,
  }),
}

/** A quiet empty content. */
export const EmptyContent: Story = {
  args: { heading: 'Participants' },
  render: (args) => ({
    props: args,
    template: `<gbt-panel [heading]="heading" [headingLevel]="headingLevel">${muted('No participant yet')}</gbt-panel>`,
  }),
}

/** A long heading wraps (even unbroken); the action keeps its place. */
export const LongHeading: Story = {
  args: { heading: 'Repository_settings_and_protected_branches_configuration_overview' },
  render: (args) => ({
    props: args,
    template: `
      <gbt-panel [heading]="heading" [headingLevel]="headingLevel">
        <gbt-button panel-actions variant="ghost" size="small" iconName="pencil" ariaLabel="Edit" />
        ${muted('Content below.')}
      </gbt-panel>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: ThreeStacked.render,
}
