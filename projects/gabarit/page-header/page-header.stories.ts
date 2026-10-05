import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { inContentArea, withLayoutIcons } from '../.storybook/layout-story-helpers'
import { Badge } from '../badge/badge'
import { Button } from '../button/button'
import { UserChip } from '../user-chip/user-chip'
import { PageHeader } from './page-header'

const meta: Meta<PageHeader> = {
  title: 'Molecules/PageHeader',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withLayoutIcons,
    moduleMetadata({ imports: [Badge, Button, UserChip] }),
    inContentArea,
  ],
  argTypes: {
    headingLevel: { control: 'inline-radio', options: [1, 2, 3] },
  },
  args: { heading: 'harbor', headingLevel: 1 },
}

export default meta
type Story = StoryObj<PageHeader>

const REPOSITORY = (args: PageHeader) => ({
  props: args,
  template: `
    <gbt-page-header [heading]="heading" [headingLevel]="headingLevel">
      <gbt-badge header-badges>Public</gbt-badge>
      <span header-meta>florian · A self-hosted Git forge written in Rust</span>
      <gbt-button header-actions variant="secondary" size="small" iconName="bell" text="Follow" />
      <gbt-button header-actions variant="primary" size="small" text="New merge request" />
    </gbt-page-header>`,
})

/** A repository: visibility badge, a muted meta line and the header actions. */
export const WithBadgesMetaAndActions: Story = {
  render: REPOSITORY,
}

/** An issue: a `#number` suffix on the title row, a status badge and a byline. */
export const IssueWithNumber: Story = {
  args: { heading: 'The label picker reloads in a loop' },
  render: (args) => ({
    props: args,
    template: `
      <gbt-page-header [heading]="heading">
        <span header-title style="color: var(--text-secondary); font-size: 1.5rem; font-weight: 400;">#128</span>
        <gbt-badge header-badges variant="success" icon="check">Open</gbt-badge>
        <span header-meta><gbt-user-chip name="Alice Martin" /> opened this issue 2 days ago · 4 comments</span>
        <gbt-button header-actions variant="secondary" size="small" iconName="pencil" text="Edit" />
        <gbt-button header-actions variant="secondary" size="small" text="Close issue" />
      </gbt-page-header>`,
  }),
}

/** Only a title: settings and list pages. */
export const TitleOnly: Story = {
  args: { heading: 'Account settings' },
}

/** A long title wraps; the actions move under it once the title needs the room. */
export const LongTitleWraps: Story = {
  args: {
    heading:
      'Replace the timestamps in seconds with DateTime<Utc> in every session and API token table',
  },
  render: (args) => ({
    props: args,
    template: `
      <gbt-page-header [heading]="heading">
        <gbt-badge header-badges variant="warning">Draft</gbt-badge>
        <span header-meta>feature/datetime-utc → main · updated 3 hours ago</span>
        <gbt-button header-actions variant="secondary" size="small" text="Edit" />
        <gbt-button header-actions variant="primary" size="small" text="Merge" />
      </gbt-page-header>`,
  }),
}

/** An unbroken identifier (a path or a hash) as the title still stays inside the page. */
export const UnbrokenTitle: Story = {
  args: {
    heading:
      'frontend/src/app/merge-requests/merge-request-timeline/merge-request-timeline.component.scss',
  },
}

/** Phone width (343px inside a 375px viewport): the actions wrap under the title. */
export const Narrow: Story = {
  render: REPOSITORY,
  decorators: [
    componentWrapperDecorator((story) => `<div style="max-width: 343px;">${story}</div>`),
  ],
}

/** A header repeated inside a page (a section, a dialog) is an `h2`, so the page keeps one `h1`. */
export const SectionHeading: Story = {
  args: { heading: 'Pipelines', headingLevel: 2 },
  render: (args) => ({
    props: args,
    template: `
      <gbt-page-header [heading]="heading" [headingLevel]="headingLevel">
        <span header-meta>Latest runs on every branch</span>
        <gbt-button header-actions variant="secondary" size="small" iconName="refresh-cw" text="Refresh" />
      </gbt-page-header>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: REPOSITORY,
}
