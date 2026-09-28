import type { Meta, StoryObj } from '@storybook/angular-vite'
import { expect } from 'storybook/test'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { inContentArea, withLayoutIcons } from '../../../../../.storybook/layout-story-helpers'
import { Avatar } from '../../atoms/avatar/avatar'
import { Button } from '../../atoms/button/button'
import { Icon } from '../../atoms/icon/icon'
import { Tag } from '../../atoms/tag/tag'
import { ListRow } from '../list-row/list-row'
import { SegmentedControl } from '../segmented-control/segmented-control'
import { ListCard } from './list-card'

const ISSUES = [
  {
    id: 128,
    tone: 'success',
    status: 'Open',
    title: 'The pagination skips a page when filtering by label',
    tag: { name: 'bug', color: '#dc2626' },
    meta: 'opened 2 hours ago by alice',
    comments: 3,
    assignee: 'Bastien Petit',
  },
  {
    id: 127,
    tone: 'warning',
    status: 'In progress',
    title: 'Add a dark mode to the wiki editor',
    tag: { name: 'interface', color: '#6366f1' },
    meta: 'opened yesterday by florian',
    comments: 12,
    assignee: 'Florian Simon',
  },
  {
    id: 121,
    tone: 'info',
    status: 'In review',
    title: 'Document how runners register',
    tag: { name: 'documentation', color: '#0ea5e9' },
    meta: 'opened 6 days ago by bastien',
    comments: 0,
    assignee: null,
  },
]

const HEADER = `
  <gbt-segmented-control list-card-header tinted ariaLabel="Issue state" [options]="tabs" [value]="tab" (valueChange)="tab = $event" />`

const ROWS = `
  <ul>
    @for (issue of issues; track issue.id) {
      <li>
        <gbt-list-row [tone]="issue.tone">
          <span row-leading style="display: inline-flex;">
            <gbt-icon name="circle-dot" /><span class="sr-only">{{ issue.status }}</span>
          </span>
          <a href="#" [title]="issue.title" (click)="$event.preventDefault()">{{ issue.title }}</a>
          <gbt-tag [color]="issue.tag.color">{{ issue.tag.name }}</gbt-tag>
          <span row-meta>#{{ issue.id }} · {{ issue.meta }}</span>
          <span row-trailing style="display: inline-flex; align-items: center; gap: 0.25rem;" [attr.aria-label]="issue.comments + ' comments'">
            <gbt-icon name="message-circle" />{{ issue.comments }}
          </span>
          @if (issue.assignee) {
            <gbt-avatar row-trailing size="sm" [name]="issue.assignee" />
          } @else {
            <span row-trailing style="width: 24px;" aria-hidden="true"></span>
          }
        </gbt-list-row>
      </li>
    }
  </ul>`

const props = {
  issues: ISSUES,
  tabs: [
    { value: 'open', label: '2 Open' },
    { value: 'closed', label: '1 Closed' },
  ],
  tab: 'open',
}

const card = (attrs: string, content: string) => (args: ListCard) => ({
  props: { ...args, ...props },
  template: `<gbt-list-card [state]="state" ariaLabel="Issues" ${attrs}>${content}</gbt-list-card>`,
})

const meta: Meta<ListCard> = {
  title: 'Molecules/ListCard',
  component: ListCard,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withLayoutIcons,
    moduleMetadata({ imports: [ListRow, Icon, Tag, Avatar, Button, SegmentedControl] }),
    componentWrapperDecorator(
      (story) => `<div style="max-width: 960px; margin-inline: auto;">${story}</div>`,
    ),
    inContentArea,
  ],
  argTypes: {
    state: { control: 'inline-radio', options: ['loading', 'failed', 'empty', 'ready'] },
    emptyIllustration: {
      control: 'select',
      options: [null, 'folder', 'star', 'checklist', 'merge', 'pipeline', 'tag', 'book', 'server'],
    },
  },
  args: {
    state: 'ready',
    skeletonRows: 4,
    skeletonHeader: true,
    loadingLabel: 'Loading issues…',
    failedHeading: 'The issues could not be loaded',
    failedMessage: 'Check your connection and try again.',
    retryLabel: 'Retry',
    emptyHeading: 'No issues yet',
    emptyMessage: 'Track bugs and ideas: every issue is discussed and closed here.',
    emptyIllustration: null,
    emptyIcon: 'circle-dot',
  },
}

export default meta
type Story = StoryObj<ListCard>

/** The ready state: filter tabs in the header above the box, one row per issue. Use the controls to switch the state. */
export const Ready: Story = {
  render: card('', `${HEADER}${ROWS}`),
}

/**
 * A heading instead of tabs: any content goes in `[list-card-header]` (here an icon, an `h2`, a count and an
 * action). It is a plain row above the box, inside the card's named `<section>`.
 */
export const WithHeading: Story = {
  render: card(
    '',
    `<div list-card-header style="display: flex; flex: 1; align-items: center; gap: 0.5rem; min-width: 0;">
      <gbt-icon name="circle-dot" aria-hidden="true" style="color: var(--text-secondary);" />
      <h2 style="margin: 0; color: var(--text-primary); font-size: 1rem; font-weight: 600;">Open issues</h2>
      <span style="color: var(--text-secondary); font-size: 0.8125rem;">3</span>
      <gbt-button variant="secondary" size="small" iconName="plus" text="New issue" style="margin-left: auto;" />
    </div>${ROWS}`,
  ),
}

/** The list is empty under the current filter (the card is not): a quiet centred message. */
export const NoResultsInTab: Story = {
  render: (args) => ({
    props: { ...args, ...props, tab: 'closed' },
    template: `
      <gbt-list-card [state]="state" ariaLabel="Issues">
        ${HEADER}
        <p list-card-message>No closed issues.</p>
      </gbt-list-card>`,
  }),
}

/** A skeleton of the same shape: a header placeholder above the box and rows in it, one polite status for screen readers. */
export const Loading: Story = {
  args: { state: 'loading' },
  render: card('', `${HEADER}${ROWS}`),
}

/** The load failed: message, retry button, optionally more actions. */
export const Failed: Story = {
  args: { state: 'failed' },
  render: (args) => ({
    props: { ...args, ...props, retried: 0 },
    template: `
      <gbt-list-card [state]="state" ariaLabel="Issues" [failedHeading]="failedHeading" [failedMessage]="failedMessage" [retryLabel]="retryLabel" (retry)="retried = retried + 1">
        ${HEADER}${ROWS}
      </gbt-list-card>
      <p style="margin: 0.75rem 0 0; color: var(--text-secondary); font-size: 0.8125rem;">Retry pressed {{ retried }} time(s).</p>`,
  }),
}

/** A failed list with its own action (`retryLabel` null hides the built-in button). */
export const FailedWithCustomAction: Story = {
  args: { state: 'failed', retryLabel: null },
  render: (args) => ({
    props: { ...args, ...props },
    template: `
      <gbt-list-card [state]="state" ariaLabel="Issues" [retryLabel]="retryLabel">
        <gbt-button list-card-failed variant="secondary" size="small" iconName="refresh-cw" text="Reload the page" />
      </gbt-list-card>`,
  }),
}

/** Nothing to list at all: icon, heading, message and the call to action. */
export const Empty: Story = {
  args: { state: 'empty' },
  render: (args) => ({
    props: { ...args, ...props },
    template: `
      <gbt-list-card [state]="state" ariaLabel="Issues" [emptyHeading]="emptyHeading" [emptyMessage]="emptyMessage" [emptyIcon]="emptyIcon" [emptyIllustration]="emptyIllustration">
        <gbt-button list-card-empty variant="secondary" iconName="plus" text="New issue" />
      </gbt-list-card>`,
  }),
}

/** The curated artwork instead of the icon. */
export const EmptyWithIllustration: Story = {
  args: { state: 'empty', emptyIllustration: 'checklist' },
  render: Empty.render,
}

/** Phone width (343px card): a tighter header, titles truncate, tags wrap. */
export const Narrow: Story = {
  render: card('', `${HEADER}${ROWS}`),
  decorators: [
    componentWrapperDecorator((story) => `<div style="max-width: 343px;">${story}</div>`),
  ],
}

/** Loading, failed and empty at phone width. */
export const NarrowStates: Story = {
  render: (args) => ({
    props: { ...args, ...props },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 343px;">
        <gbt-list-card state="loading" ariaLabel="Issues" />
        <gbt-list-card state="failed" ariaLabel="Issues" failedMessage="Check your connection and try again." />
        <gbt-list-card state="empty" ariaLabel="Issues" emptyIcon="circle-dot" emptyHeading="No issues yet">
          <gbt-button list-card-empty variant="secondary" iconName="plus" text="New issue" />
        </gbt-list-card>
      </div>`,
  }),
}

/**
 * Loading and ready side by side: the header placeholder takes the ready header's place and height, so the
 * box does not move when the list arrives.
 */
export const LoadingThenReady: Story = {
  render: (args) => ({
    props: { ...args, ...props },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; align-items: start;">
        <gbt-list-card state="loading" ariaLabel="Issues (loading)" [skeletonRows]="3" />
        <gbt-list-card state="ready" ariaLabel="Issues (ready)">${HEADER}${ROWS}</gbt-list-card>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const [loading, ready] = Array.from(canvasElement.querySelectorAll('gbt-list-card'))
    const top = (card: Element, selector: string) =>
      card.querySelector(selector)!.getBoundingClientRect().top - card.getBoundingClientRect().top
    // The box starts at the same height in both states: no jump when the list arrives.
    await expect(top(loading, '.gbt-list-card__box')).toBe(top(ready, '.gbt-list-card__box'))
    // The header is outside the box, inside the named section.
    for (const [card, label] of [
      [loading, 'Issues (loading)'],
      [ready, 'Issues (ready)'],
    ] as const) {
      const header = card.querySelector('.gbt-list-card__header')!
      await expect(card.querySelector('.gbt-list-card__box')!.contains(header)).toBe(false)
      await expect(header.closest('section')?.getAttribute('aria-label')).toBe(label)
    }
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: (args) => ({
    props: { ...args, ...props },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <gbt-list-card state="ready" ariaLabel="Issues (ready)">${HEADER}${ROWS}</gbt-list-card>
        <gbt-list-card state="loading" ariaLabel="Issues (loading)" />
        <gbt-list-card state="failed" ariaLabel="Issues (failed)" failedMessage="Check your connection and try again." />
        <gbt-list-card state="empty" ariaLabel="Issues (empty)" emptyIcon="circle-dot" emptyHeading="No issues yet" emptyMessage="Track bugs and ideas.">
          <gbt-button list-card-empty variant="secondary" iconName="plus" text="New issue" />
        </gbt-list-card>
      </div>`,
  }),
}
