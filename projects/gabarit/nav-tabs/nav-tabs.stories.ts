import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { withWidgetIcons } from '../.storybook/widget-story-helpers'
import { PageLayout } from '../page-layout/page-layout'
import { Card } from '../card/card'
import { NavTab } from './nav-tab'
import { NavTabs } from './nav-tabs'

const inColumn = componentWrapperDecorator(
  (story) => `<div style="box-sizing:border-box;max-width:44rem;padding:1rem">${story}</div>`,
)

const meta: Meta<NavTabs> = {
  title: 'Molecules/NavTabs',
  component: NavTabs,
  decorators: [withWidgetIcons, moduleMetadata({ imports: [NavTabs, NavTab, PageLayout, Card] })],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    landmark: { control: 'boolean' },
  },
  args: { ariaLabel: 'Repository settings', orientation: 'horizontal', landmark: true },
}

export default meta
type Story = StoryObj<NavTabs>

// Router-less: plain hrefs, and the application owns which one is active (with the Angular router,
// put `routerLink` on each anchor and feed `[active]` from `routerLinkActive`).
const tabs = `
  <a gbtNavTab href="#general" icon="settings" [active]="section === 'general'" (click)="$event.preventDefault(); section = 'general'">General</a>
  <a gbtNavTab href="#members" icon="users" [badge]="12" [active]="section === 'members'" (click)="$event.preventDefault(); section = 'members'">Members</a>
  <a gbtNavTab href="#webhooks" icon="bell" [badge]="3" [active]="section === 'webhooks'" (click)="$event.preventDefault(); section = 'webhooks'">Webhooks</a>
  <a gbtNavTab href="#security" icon="lock" [active]="section === 'security'" (click)="$event.preventDefault(); section = 'security'">Security</a>
  <a gbtNavTab href="#danger" [active]="section === 'danger'" (click)="$event.preventDefault(); section = 'danger'">Danger zone</a>
`

const nav = (attributes = '') =>
  `<gbt-nav-tabs [ariaLabel]="ariaLabel" [orientation]="orientation" [landmark]="landmark" ${attributes}>${tabs}</gbt-nav-tabs>`

/** Underline tabs above a section, router-less: click an item and the application flips `active`. */
export const Default: Story = {
  decorators: [inColumn],
  render: (args) => ({
    props: { ...args, section: 'general' },
    template: `${nav()}<p style="color:var(--text-primary)">Current section: <strong>{{ section }}</strong></p>`,
  }),
}

/** The router-less usage in full: plain anchors, no `@angular/router` anywhere. */
export const RouterLess: Story = {
  decorators: [inColumn],
  render: (args) => ({
    props: { ...args, section: 'members' },
    template: `${nav()}<p style="color:var(--text-primary)">Each item is a native link (href, middle-click, Tab and Enter); the current one carries <code>aria-current="page"</code>.</p>`,
  }),
}

/** A list of pill links for a side column. */
export const Vertical: Story = {
  decorators: [inColumn],
  args: { orientation: 'vertical' },
  render: (args) => ({
    props: { ...args, section: 'general' },
    template: `<div style="max-width:15rem">${nav()}</div>`,
  }),
}

/** In a narrow box the row scrolls to the active tab and fades at the edges that hide tabs. */
export const Overflowing: Story = {
  decorators: [inColumn],
  render: (args) => ({
    props: { ...args, section: 'security' },
    template: `<div style="max-width:20rem">${nav()}</div>`,
  }),
}

/** Vertical inside a `gbt-page-layout` `[page-nav]`: the layout wraps it in the landmark (`[landmark]="false"`). */
export const InPageLayout: Story = {
  args: { orientation: 'vertical', landmark: false },
  decorators: [componentWrapperDecorator((story) => `<div style="padding:1rem">${story}</div>`)],
  render: (args) => ({
    props: { ...args, section: 'general' },
    template: `
      <gbt-page-layout navLabel="Repository settings">
        <gbt-nav-tabs page-nav [ariaLabel]="ariaLabel" [orientation]="orientation" [landmark]="landmark">${tabs}</gbt-nav-tabs>
        <gbt-card heading="Section">
          <p style="margin:0;color:var(--text-primary)">Below 769 px of layout width the list folds into a row of tabs above the section.</p>
        </gbt-card>
      </gbt-page-layout>`,
  }),
}

/** The same page layout in a 600 px box: the vertical nav folds into the row of tabs. */
export const InNarrowPageLayout: Story = {
  decorators: [componentWrapperDecorator((story) => `<div style="padding:1rem">${story}</div>`)],
  args: { orientation: 'vertical', landmark: false },
  render: (args) => ({
    props: { ...args, section: 'members' },
    template: `
      <div style="max-width:600px">
        <gbt-page-layout navLabel="Repository settings">
          <gbt-nav-tabs page-nav [ariaLabel]="ariaLabel" [orientation]="orientation" [landmark]="landmark">${tabs}</gbt-nav-tabs>
          <gbt-card heading="Section">
            <p style="margin:0;color:var(--text-primary)">The layout is a size container: 600 px is under its 768 px stacking breakpoint.</p>
          </gbt-card>
        </gbt-page-layout>
      </div>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme, inColumn],
  render: (args) => ({
    props: { ...args, section: 'webhooks' },
    template: nav(),
  }),
}

export const VerticalDark: Story = {
  args: { orientation: 'vertical' },
  decorators: [darkTheme, inColumn],
  render: (args) => ({
    props: { ...args, section: 'webhooks' },
    template: `<div style="max-width:15rem">${nav()}</div>`,
  }),
}
