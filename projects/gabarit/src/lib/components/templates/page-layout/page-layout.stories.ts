import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { expect, waitFor } from 'storybook/test'
import { darkTheme } from '../../../../../.storybook/preview'
import {
  demoCard,
  FILES_CARD,
  inContentArea,
  muted,
  NAV_LIST,
  README_CARD,
  withLayoutIcons,
} from '../../../../../.storybook/layout-story-helpers'
import { Badge } from '../../atoms/badge/badge'
import { Button } from '../../atoms/button/button'
import { PageHeader } from '../../molecules/page-header/page-header'
import { Panel } from '../../molecules/panel/panel'
import { UserChip } from '../../molecules/user-chip/user-chip'
import { PageLayout } from './page-layout'

const HEADER = `
  <gbt-page-header heading="harbor">
    <gbt-badge header-badges>Public</gbt-badge>
    <span header-meta>florian · A self-hosted Git forge written in Rust</span>
    <gbt-button header-actions variant="secondary" size="small" text="Follow" />
  </gbt-page-header>`

const ASIDE = `
  <div page-aside>
    <gbt-panel heading="About" [headingLevel]="2">
      <p style="margin: 0 0 0.5rem;">A self-hosted Git forge written in Rust.</p>
      ${muted('Created 8 months ago · 12.4 MB')}
    </gbt-panel>
    <gbt-panel heading="Topics" [headingLevel]="2">
      <p style="margin: 0;">rust · git · self-hosting</p>
    </gbt-panel>
    <gbt-panel heading="Contributors" [headingLevel]="2">
      <ul style="display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 0; list-style: none;">
        <li><gbt-user-chip name="Florian Simon" /></li>
        <li><gbt-user-chip name="Alice Martin" /></li>
        <li><gbt-user-chip name="Bastien Petit" /></li>
      </ul>
    </gbt-panel>
  </div>`

const MAIN = `${HEADER}<div style="display: flex; flex-direction: column; gap: 1.5rem;">${FILES_CARD}${README_CARD}</div>`

const NAV = `
  <div page-nav>
    <gbt-panel heading="Files" [headingLevel]="2">${NAV_LIST}</gbt-panel>
  </div>`

/**
 * Real-layout regression check (jsdom has no layout, so the unit specs cannot catch grid bugs): the
 * grid has exactly the columns its width and filled slots call for, no empty (0px) track, and the
 * main column starts at the grid's origin unless a nav or a start aside precedes it. Runs as the play
 * function of every story below, at whatever width the story is opened.
 */
async function expectCleanGrid({ canvasElement }: { canvasElement: HTMLElement }) {
  const host = canvasElement.querySelector('gbt-page-layout') as HTMLElement
  const grid = host.querySelector('.gbt-page-layout') as HTMLElement
  const region = (selector: string) => grid.querySelector(`:scope > ${selector}`) as HTMLElement
  const hasNav = region('.gbt-page-layout__nav').childNodes.length > 0
  const hasAside = region('.gbt-page-layout__aside').childNodes.length > 0
  const asideStart = host.dataset['asidePosition'] === 'start'
  const width = host.getBoundingClientRect().width
  if (width === 0) return // Rendered in a hidden frame (docs page): no layout to measure.

  const expectedColumns =
    width < 769 ? 1 : hasNav && hasAside && width >= 1101 ? 3 : hasNav || hasAside ? 2 : 1
  const style = getComputedStyle(grid)
  const columns = style.gridTemplateColumns.split(' ')
  const rows = style.gridTemplateRows.split(' ')
  await expect(columns, `columns at ${width}px`).toHaveLength(expectedColumns)
  await expect(
    columns.filter((track) => parseFloat(track) === 0),
    'empty column tracks',
  ).toEqual([])
  await expect(
    rows.filter((track) => parseFloat(track) === 0),
    'empty row tracks',
  ).toEqual([])

  const origin = grid.getBoundingClientRect()
  const main = region('.gbt-page-layout__main').getBoundingClientRect()
  if (!(hasNav && expectedColumns === 1)) {
    await expect(Math.round(main.top), 'main top').toBe(Math.round(origin.top))
  }
  if (!hasNav && !(asideStart && hasAside && expectedColumns > 1)) {
    await expect(Math.round(main.left), 'main left').toBe(Math.round(origin.left))
  }
}

/**
 * `stickyNav` at the real layout: from two columns up the nav column is sticky, so once the page has
 * scrolled past it, it still sits 1rem (16px) under the top of the viewport while the main column has
 * moved up; stacked (one column), it scrolls away with the page like any content. Scrolls the story's
 * own frame and puts it back.
 */
async function expectStickyNav({ canvasElement }: { canvasElement: HTMLElement }) {
  await expectCleanGrid({ canvasElement })
  const doc = canvasElement.ownerDocument.documentElement
  const view = canvasElement.ownerDocument.defaultView!
  if (doc.clientWidth === 0) return // hidden frame (docs page): no layout to measure
  const host = canvasElement.querySelector('gbt-page-layout') as HTMLElement
  const nav = host.querySelector('.gbt-page-layout__nav') as HTMLElement
  const main = host.querySelector('.gbt-page-layout__main') as HTMLElement
  await expect(host.hasAttribute('data-sticky-nav'), 'sticky-nav attribute').toBe(true)
  if (host.getBoundingClientRect().width < 769) {
    await expect(getComputedStyle(nav).position, 'stacked nav').not.toBe('sticky')
    return
  }
  await expect(getComputedStyle(nav).position, 'nav position').toBe('sticky')

  const navTop = nav.getBoundingClientRect().top + view.scrollY
  const distance = Math.min(600, doc.scrollHeight - doc.clientHeight)
  await expect(distance, 'room to scroll (a long main column)').toBeGreaterThan(navTop + 100)
  view.scrollTo(0, distance)
  try {
    await waitFor(() => expect(Math.round(view.scrollY)).toBe(Math.round(distance)))
    const box = nav.getBoundingClientRect()
    await expect(Math.round(box.top), 'nav 1rem under the top of the viewport').toBe(16)
    await expect(box.bottom, 'nav still in view').toBeLessThanOrEqual(view.innerHeight)
    await expect(main.getBoundingClientRect().top, 'main column scrolled up').toBeLessThan(0)
    // Its column is only as tall as its content (align-self: start), not the whole main column's.
    await expect(box.height, 'nav as tall as its content').toBeLessThan(
      main.getBoundingClientRect().height,
    )
  } finally {
    view.scrollTo(0, 0)
  }
}

const meta: Meta<PageLayout> = {
  title: 'Templates/PageLayout',
  component: PageLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [
    withLayoutIcons,
    moduleMetadata({ imports: [PageHeader, Panel, UserChip, Badge, Button] }),
    inContentArea,
  ],
  argTypes: {
    width: { control: 'inline-radio', options: ['narrow', 'default', 'wide', 'full'] },
    asideWidth: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    asidePosition: { control: 'inline-radio', options: ['start', 'end'] },
  },
  args: {
    width: 'default',
    asideWidth: 'md',
    asidePosition: 'end',
    navLabel: 'Page navigation',
    asideLabel: null,
    stickyNav: false,
  },
  play: expectCleanGrid,
}

export default meta
type Story = StoryObj<PageLayout>

const layout = (slots: string) => (args: PageLayout) => ({
  props: args,
  template: `<gbt-page-layout [width]="width" [asideWidth]="asideWidth" [asidePosition]="asidePosition" [navLabel]="navLabel" [asideLabel]="asideLabel" [stickyNav]="stickyNav">${slots}</gbt-page-layout>`,
})

/** One column: the main content alone, centred within the max width. */
export const MainOnly: Story = {
  render: layout(MAIN),
}

/** The usual page: main content with a side panel at the end (300px, sticky beyond 1100px). */
export const MainAndAside: Story = {
  render: layout(`${MAIN}${ASIDE}`),
}

/** The aside on the start side. */
export const AsideStart: Story = {
  args: { asidePosition: 'start' },
  render: layout(`${MAIN}${ASIDE}`),
}

/** Three columns beyond 1100px; between 769 and 1100px the aside moves under the main column. */
export const NavMainAside: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
}

/** Nav and main only (blob view, repository settings). */
export const NavAndMain: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}`),
}

const LONG_MAIN = `${HEADER}<div style="display: flex; flex-direction: column; gap: 1.5rem;">${FILES_CARD}${README_CARD}${[
  'Installation',
  'Configuration',
  'Deployment',
  'Backups',
  'Upgrading',
]
  .map((title) =>
    demoCard(
      title,
      `${muted('A long section: the navigation column stays in view while the page scrolls.')}<p style="margin: 0.75rem 0 0;">${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(6)}</p>`,
    ),
  )
  .join('')}</div>`

/**
 * `stickyNav` (a wiki's pages): from two columns up, the nav column stays 1rem under the top of the
 * viewport while a long main column scrolls. Stacked, it scrolls away with the page.
 */
export const StickyNav: Story = {
  args: { width: 'wide', navLabel: 'Wiki pages', stickyNav: true },
  render: layout(`${NAV}${LONG_MAIN}`),
  play: expectStickyNav,
}

const widthDemo = (label: string) =>
  `${HEADER.replace('heading="harbor"', `heading="Width ${label}"`)}${demoCard('Content', muted('The layout centres itself and stops at this width; the shell already adds 1rem of margin.'))}`

/** 640px: forms and settings pages. */
export const WidthNarrow: Story = {
  args: { width: 'narrow' },
  render: layout(widthDemo('narrow (640px)')),
}

/** 1200px (default). */
export const WidthDefault: Story = {
  args: { width: 'default' },
  render: layout(`${widthDemo('default (1200px)')}${ASIDE}`),
}

/** 1440px: repository pages. */
export const WidthWide: Story = {
  args: { width: 'wide' },
  render: layout(`${widthDemo('wide (1440px)')}${ASIDE}`),
}

/** No max width: kanban, code browsing. */
export const WidthFull: Story = {
  args: { width: 'full' },
  render: layout(`${widthDemo('full (no limit)')}${ASIDE}`),
}

/** Small (240px) and large (360px) asides. */
export const AsideSmall: Story = {
  args: { asideWidth: 'sm' },
  render: layout(`${MAIN}${ASIDE}`),
}

export const AsideLarge: Story = {
  args: { asideWidth: 'lg' },
  render: layout(`${MAIN}${ASIDE}`),
}

// ---- The container query: the layout follows ITS OWN width, not the window's ----------------------

const atWidth = (px: number) =>
  componentWrapperDecorator(
    (story) =>
      `<div style="width: ${px}px; max-width: 100%; box-sizing: border-box; border: 1px dashed var(--border-color);">${story}</div>`,
  )

/**
 * Drag the bottom-right corner of the dashed frame: the columns follow the frame's width (one column
 * up to 768px, two up to 1100px, three beyond), whatever the size of the window.
 */
export const Resizable: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="width: 1200px; min-width: 300px; max-width: 100%; box-sizing: border-box; overflow: auto; resize: horizontal; border: 1px dashed var(--border-color); padding: 0.5rem;">${story}</div>`,
    ),
  ],
}

/** Phone: 343px of layout, one column, nav then main then the aside under a hairline. */
export const PhoneWidth: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
  decorators: [atWidth(343)],
}

/** 700px: still one column, the columns only start above 768px of layout width. */
export const BelowTwoColumns: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
  decorators: [atWidth(700)],
}

/** 900px with a nav: nav | main, the aside under main. */
export const TwoColumnsWithNav: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
  decorators: [atWidth(900)],
}

/** 1280px: nav | main | aside. */
export const ThreeColumnsWide: Story = {
  args: { width: 'full', navLabel: 'Repository files' },
  render: layout(`${NAV}${MAIN}${ASIDE}`),
  decorators: [atWidth(1280)],
}

/** Nav and aside are optional and conditional: content inside `@if` needs one root element. */
export const ConditionalSlots: Story = {
  args: { width: 'wide' },
  render: (args) => ({
    props: { ...args, showAside: true },
    template: `
      <label style="display: inline-flex; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-primary);">
        <input type="checkbox" [checked]="showAside" (change)="showAside = !showAside" /> Show the aside
      </label>
      <gbt-page-layout [width]="width" [asideWidth]="asideWidth">
        ${MAIN}
        @if (showAside) {
          ${ASIDE}
        }
      </gbt-page-layout>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: layout(`${MAIN}${ASIDE}`),
}
