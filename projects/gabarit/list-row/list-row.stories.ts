import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { expect, waitFor } from 'storybook/test'
import { darkTheme } from '../.storybook/preview'
import { inContentArea, withLayoutIcons } from '../.storybook/layout-story-helpers'
import { Avatar } from '../avatar/avatar'
import { Badge } from '../badge/badge'
import { Icon } from '../icon/icon'
import { Tag } from '../tag/tag'
import { UserChip } from '../user-chip/user-chip'
import { ListRow, ListRowTone } from './list-row'

// ---- A list card, as a page builds it -------------------------------------------------------------
// The card, the header and the `ul` belong to the page (see gbt-list-card); these styles only
// reproduce its current header-above-box look, not a card of its own.

const cardWrap = 'max-width: 960px; margin-inline: auto;'
const card =
  'border: 1px solid var(--gbt-card-border); border-radius: var(--site-border-radius); background: var(--bg-principal); overflow: hidden;'
const cardHeader =
  'display: flex; align-items: center; gap: 0.5rem; min-height: 38px; color: var(--text-primary); font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem;'
const list = 'margin: 0; padding: 0; list-style: none;'
const count =
  'display: inline-flex; align-items: center; gap: 0.25rem; font-variant-numeric: tabular-nums;'

interface Row {
  tone: ListRowTone
  icon: string
  status: string
  number: number
  title: string
  tags: { name: string; color: string }[]
  meta: string
  author: string
  assignee: string | null
  comments: number
  source?: string
  target?: string
}

const ISSUES: Row[] = [
  {
    tone: 'success',
    icon: 'circle-dot',
    status: 'Open',
    number: 128,
    title: 'The pagination skips a page when filtering by label',
    tags: [{ name: 'bug', color: '#dc2626' }],
    meta: 'opened 2 hours ago',
    author: 'alice',
    assignee: 'Bastien Petit',
    comments: 3,
  },
  {
    tone: 'warning',
    icon: 'circle-dot',
    status: 'In progress',
    number: 127,
    title: 'Add a dark mode to the wiki editor',
    tags: [
      { name: 'interface', color: '#6366f1' },
      { name: 'high priority', color: '#f97316' },
    ],
    meta: 'opened yesterday',
    author: 'florian',
    assignee: 'Florian Simon',
    comments: 12,
  },
  {
    tone: 'info',
    icon: 'circle-dot',
    status: 'In review',
    number: 121,
    title: 'Document how runners register',
    tags: [{ name: 'documentation', color: '#0ea5e9' }],
    meta: 'opened 6 days ago',
    author: 'bastien',
    assignee: null,
    comments: 0,
  },
  {
    tone: 'neutral',
    icon: 'circle-check',
    status: 'Closed',
    number: 117,
    title: 'Move the webhooks to the new queue',
    tags: [],
    meta: 'closed 3 weeks ago',
    author: 'alice',
    assignee: 'Alice Martin',
    comments: 5,
  },
]

const MERGE_REQUESTS: Row[] = [
  {
    tone: 'success',
    icon: 'git-pull-request',
    status: 'Open',
    number: 42,
    title: 'Paginate the issue list on the server',
    tags: [{ name: 'performance', color: '#16a34a' }],
    meta: 'opened 5 minutes ago',
    author: 'alice',
    assignee: null,
    comments: 7,
    source: 'feature/pagination',
    target: 'main',
  },
  {
    tone: 'info',
    icon: 'git-merge',
    status: 'Merged',
    number: 41,
    title: 'Fix a typo in the README',
    tags: [],
    meta: 'merged yesterday',
    author: 'bastien',
    assignee: null,
    comments: 1,
    source: 'fix/typo',
    target: 'main',
  },
  {
    tone: 'error',
    icon: 'circle-x',
    status: 'Closed',
    number: 39,
    title: 'Rewrite the gix reader',
    tags: [{ name: 'experimental', color: '#a855f7' }],
    meta: 'closed 2 weeks ago',
    author: 'florian',
    assignee: null,
    comments: 0,
    source: 'spike/gix-reader',
    target: 'develop',
  },
]

const LONG: Row[] = [
  {
    tone: 'warning',
    icon: 'circle-dot',
    status: 'In progress',
    number: 1024,
    title:
      'A particularly long issue title that does not fit on a single line, even on a large screen, and must be truncated cleanly with an ellipsis',
    tags: [
      { name: 'bug', color: '#dc2626' },
      { name: 'interface', color: '#6366f1' },
      { name: 'high priority', color: '#f97316' },
      { name: 'regression', color: '#be123c' },
    ],
    meta: 'opened 3 days ago',
    author: 'Marie-Hélène de La Tour d’Auvergne',
    assignee: 'Marie-Hélène de La Tour d’Auvergne-Lauraguais',
    comments: 142,
  },
  {
    tone: 'success',
    icon: 'circle-dot',
    status: 'Open',
    number: 1023,
    title: 'Short title',
    tags: [
      { name: 'bug', color: '#dc2626' },
      { name: 'interface', color: '#6366f1' },
      { name: 'high priority', color: '#f97316' },
      { name: 'regression', color: '#be123c' },
      { name: 'needs help', color: '#0d9488' },
    ],
    meta: 'opened 4 days ago',
    author: 'alice',
    assignee: null,
    comments: 2,
  },
  {
    tone: 'neutral',
    icon: 'circle-check',
    status: 'Closed',
    number: 1022,
    title: 'An_identifier_without_any_space_that_cannot_wrap_and_must_be_truncated_as_well',
    tags: [],
    meta: 'closed 1 month ago',
    author: 'bastien',
    assignee: 'Bastien Petit',
    comments: 0,
  },
]

/** One row per item, as a page writes it: status icon, title link + tags, meta, counters + assignee. */
const rowsTemplate = (items: string, heading: string) => `
  <div style="${cardWrap}">
    <div style="${cardHeader}">${heading}</div>
    <section style="${card}">
    <ul style="${list}">
      @for (row of ${items}; track row.number) {
        <li>
          <gbt-list-row [tone]="row.tone">
            <span row-leading style="display: inline-flex;">
              <gbt-icon [name]="row.icon" />
              <span class="sr-only">{{ row.status }}</span>
            </span>
            <a href="#" [title]="row.title" (click)="$event.preventDefault()">{{ row.title }}</a>
            @for (tag of row.tags; track tag.name) {
              <gbt-tag [color]="tag.color">{{ tag.name }}</gbt-tag>
            }
            <span row-meta>{{ row.source ? '' : '#' + row.number + ' · ' }}{{ row.meta }} by <a href="#" (click)="$event.preventDefault()">{{ row.author }}</a></span>
            @if (row.source) {
              <span row-meta><code>{{ row.source }}</code> → <code>{{ row.target }}</code></span>
            }
            <span row-trailing style="${count}" [attr.aria-label]="row.comments + ' comments'" [title]="row.comments + ' comments'">
              <gbt-icon name="message-circle" />{{ row.comments }}
            </span>
            @if (row.assignee) {
              <gbt-avatar row-trailing size="sm" [name]="row.assignee" [title]="'Assigned to ' + row.assignee" />
            } @else if (!row.source) {
              <!-- Unassigned: an empty avatar-sized cell keeps every row's counters in one column. -->
              <span row-trailing style="width: 24px;" aria-hidden="true"></span>
            }
          </gbt-list-row>
        </li>
      }
    </ul>
    </section>
  </div>`

/**
 * Layout invariants jsdom cannot check, run on every story with rows: the leading icon, the title and
 * the trailing items share the title's first line; a long title stays inside its column; nothing
 * overflows horizontally; consecutive rows are separated by a hairline; empty slots take no room.
 * Retried by `waitFor` until the story's styles have settled.
 */
function assertRowLayout(canvasElement: HTMLElement): number {
  const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('gbt-list-row'))
  if (rows.length === 0) throw new Error('rows not rendered yet')
  const rect = (el: Element) => el.getBoundingClientRect()
  const centre = (el: Element) => rect(el).top + rect(el).height / 2
  const check = (ok: boolean, message: string) => {
    if (!ok) throw new Error(message)
  }

  for (const [index, row] of rows.entries()) {
    const title = row.querySelector('.gbt-list-row__title')!
    const firstLine = rect(title).top + 12 // centre of the 24px title line
    const leading = row.querySelector('.gbt-list-row__leading svg')
    if (row.querySelector('.gbt-list-row__leading > *')) {
      check(!!leading, `row ${index}: leading icon rendered`)
      check(
        Math.abs(centre(leading!) - firstLine) <= 1,
        `row ${index}: icon centred on the title line`,
      )
    }
    const link = row.querySelector('.gbt-list-row__title > a')
    if (link) {
      check(Math.abs(centre(link) - firstLine) <= 1, `row ${index}: title link on the first line`)
      check(
        rect(link).right <= rect(title).right + 0.5,
        `row ${index}: the title link stays inside its column (truncates)`,
      )
    }
    const trailing = row.querySelector('.gbt-list-row__trailing')
    if (trailing && trailing.children.length > 0 && rect(trailing).top < rect(title).bottom) {
      check(
        Math.abs(centre(trailing) - firstLine) <= 1,
        `row ${index}: trailing items on the title line`,
      )
    }
    check(row.scrollWidth <= row.clientWidth + 1, `row ${index}: no horizontal overflow`)
    for (const slot of ['leading', 'meta', 'trailing']) {
      const wrapper = row.querySelector(`.gbt-list-row__${slot}`)!
      if (wrapper.children.length === 0) {
        check(
          rect(wrapper).width + rect(wrapper).height === 0,
          `row ${index}: empty ${slot} takes no room`,
        )
      }
    }
    if (row.parentElement?.tagName === 'LI') {
      const expected = index > 0 && row.parentElement.previousElementSibling ? '1px' : '0px'
      check(
        getComputedStyle(row).borderTopWidth === expected,
        `row ${index}: border-top ${expected} (hairline between rows only)`,
      )
    }
  }
  return rows.length
}

async function expectRowLayout({ canvasElement }: { canvasElement: HTMLElement }) {
  const count = await waitFor(() => assertRowLayout(canvasElement), { timeout: 3000 })
  await expect(count, 'rows laid out').toBeGreaterThan(0)
}

const meta: Meta<ListRow> = {
  title: 'Molecules/ListRow',
  component: ListRow,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withLayoutIcons,
    moduleMetadata({ imports: [Icon, Tag, Avatar, Badge, UserChip] }),
    inContentArea,
  ],
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'error', 'info'] },
  },
}

export default meta
type Story = StoryObj<ListRow>

/** Issues in a list card: every status tone, tags, meta line, comment count and assignee. */
export const Issues: Story = {
  play: expectRowLayout,
  render: () => ({ props: { rows: ISSUES }, template: rowsTemplate('rows', '4 issues') }),
}

/** Merge requests: status icons, `source → target` branches in the meta line, discussion count. */
export const MergeRequests: Story = {
  play: expectRowLayout,
  render: () => ({
    props: { rows: MERGE_REQUESTS },
    template: rowsTemplate('rows', '3 merge requests'),
  }),
}

/**
 * A long title truncates on one line (full title in the tooltip); tags that do not fit beside the
 * title wrap below it; a long assignee name stays an avatar; a 3-digit count keeps its column.
 */
export const LongTitlesAndManyTags: Story = {
  play: expectRowLayout,
  render: () => ({ props: { rows: LONG }, template: rowsTemplate('rows', 'Long titles') }),
}

/** Only the title: the empty leading, meta and trailing slots collapse (no box, no gap). */
export const TitleOnly: Story = {
  play: expectRowLayout,
  render: () => ({
    template: `
      <div style="${cardWrap}">
        <section style="${card}">
          <ul style="${list}">
            <li><gbt-list-row><a href="#">Milestone v1.0</a></gbt-list-row></li>
            <li><gbt-list-row><a href="#">Milestone v1.1</a><gbt-tag color="#16a34a">in progress</gbt-tag></gbt-list-row></li>
            <li><gbt-list-row><a href="#">Milestone v2.0</a><span row-meta>due 1 December</span></gbt-list-row></li>
          </ul>
        </section>
      </div>`,
  }),
}

/** An identity chip in the title area (an account list): it shrinks and truncates its name. */
export const WithUserChipAndBadges: Story = {
  play: expectRowLayout,
  render: () => ({
    template: `
      <div style="${cardWrap}">
        <section style="${card}">
          <ul style="${list}">
            <li>
              <gbt-list-row>
                <gbt-user-chip name="florian" />
                <gbt-badge variant="info" icon="check">Administrator</gbt-badge>
                <gbt-badge variant="neutral">You</gbt-badge>
                <span row-meta>florian@example.org · created 2 months ago</span>
                <gbt-badge row-trailing variant="success" icon="check">Active</gbt-badge>
              </gbt-list-row>
            </li>
            <li>
              <gbt-list-row>
                <gbt-user-chip name="Marie-Hélène de La Tour d’Auvergne-Lauraguais" />
                <span row-meta>marie-helene.de-la-tour-dauvergne-lauraguais@example.org</span>
                <gbt-badge row-trailing variant="warning">Invited</gbt-badge>
              </gbt-list-row>
            </li>
          </ul>
        </section>
      </div>`,
  }),
}

/** Phone width (375px viewport → 343px card): titles truncate, tags wrap, nothing overflows. */
export const Narrow: Story = {
  play: expectRowLayout,
  decorators: [
    componentWrapperDecorator((story) => `<div style="max-width: 343px;">${story}</div>`),
  ],
  render: () => ({
    props: { rows: [...ISSUES.slice(0, 2), ...LONG] },
    template: rowsTemplate('rows', '5 issues'),
  }),
}

/**
 * Focus inside the second row: the row takes the hover background (`:focus-within`). Tab through the
 * list to see the title link's own focus ring (`:focus-visible`, keyboard only).
 */
export const KeyboardFocus: Story = {
  render: () => ({ props: { rows: ISSUES }, template: rowsTemplate('rows', '4 issues') }),
  play: async (context) => {
    await expectRowLayout(context)
    const link = context.canvasElement.querySelectorAll<HTMLAnchorElement>(
      '.gbt-list-row__title > a',
    )[1]
    link.focus()
    const row = link.closest('.gbt-list-row')!
    await expect(getComputedStyle(row).backgroundColor, 'focus-within background').not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
  play: expectRowLayout,
  render: () => ({
    props: { rows: [...ISSUES, ...MERGE_REQUESTS] },
    template: rowsTemplate('rows', '7 items'),
  }),
}
