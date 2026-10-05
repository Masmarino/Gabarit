import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../.storybook/preview'
import { withWidgetIcons } from '../../.storybook/widget-story-helpers'
import { Icon } from '../../icon/icon'
import { Menu } from '../../menu/menu'
import { AppShell } from '../app-shell'
import { AppShellNavGroup } from './app-shell-nav-group'

const meta: Meta<AppShellNavGroup> = {
  title: 'Templates/AppShellNavGroup',
  component: AppShellNavGroup,
  decorators: [withWidgetIcons],
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        desktop: { name: 'Desktop', styles: { width: '1180px', height: '860px' }, type: 'desktop' },
        mobile: { name: 'Mobile', styles: { width: '375px', height: '700px' }, type: 'mobile' },
      },
    },
  },
  globals: { viewport: { value: 'desktop', isRotated: false } },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'text' },
    expanded: { control: 'boolean' },
  },
  args: { label: 'Administration', icon: 'shield-check', expanded: true },
}

export default meta
type Story = StoryObj<AppShellNavGroup>

const shellAttributes = `
  navLabel="Main navigation"
  skipLabel="Skip to main content"
  openMenuLabel="Open navigation"
  closeMenuLabel="Close navigation"
  collapseLabel="Collapse navigation"
  expandLabel="Expand navigation"
`

const brand = `<a shell-brand href="#" style="font-weight:600;text-decoration:none;color:var(--text-primary)">Hangar</a>`

const railBrand = `
  <a shell-brand href="#" aria-label="Hangar" style="font-weight:600;text-decoration:none;color:var(--text-primary)">
    <gbt-icon name="info" />
    @if (!collapsed) {
      <span>Hangar</span>
    }
  </a>
`

// Top-level links, then the group: as a router-less app writes them (the current page carries
// `aria-current="page"`, as for any shell link).
const nav = `
  <a shell-nav href="#" class="gbt-app-shell__link"><gbt-icon name="folder" /><span>Repositories</span></a>
  <a shell-nav href="#" class="gbt-app-shell__link"><gbt-icon name="git-pull-request" /><span>Merge requests</span></a>
  <gbt-app-shell-nav-group shell-nav [label]="label" [icon]="icon" [(expanded)]="expanded">
    <a href="#" class="gbt-app-shell__link" aria-current="page"><gbt-icon name="users" /><span>Users</span></a>
    <a href="#" class="gbt-app-shell__link"><gbt-icon name="activity" /><span>Health</span></a>
    <a href="#" class="gbt-app-shell__link"><gbt-icon name="settings" /><span>Settings</span></a>
  </gbt-app-shell-nav-group>
  <a shell-nav href="#" class="gbt-app-shell__link"><gbt-icon name="book-open" /><span>Documentation</span></a>
`

const header = `
  <h1 shell-header style="margin:0;font-size:1rem">Users</h1>
  <div shell-header style="margin-left:auto">
    <gbt-menu label="My account" align="end">
      <a role="menuitem" class="gbt-menu__item" href="#">My account</a>
      <button role="menuitem" class="gbt-menu__item" type="button">Sign out</button>
    </gbt-menu>
  </div>
`

const shell = (collapsed: boolean) => `
  <gbt-app-shell ${shellAttributes} [collapsed]="collapsed" (collapsedChange)="collapsed = $event">
    ${collapsed ? railBrand : brand}
    ${nav}
    ${header}
    <p>${
      collapsed
        ? 'In the 64 px rail the group is one icon (label in the flyout) with a small chevron; its sub-links line up under it like top-level icons.'
        : 'The group toggle reads stronger while one of its links is the current page, even collapsed.'
    }</p>
  </gbt-app-shell>
`

const imports = { imports: [AppShell, AppShellNavGroup, Menu, Icon] }

/** Expanded in the full-width navigation: sub-links indented, chevron pointing up. */
export const Default: Story = {
  render: (args) => ({
    props: { ...args, collapsed: false },
    template: shell(false),
    moduleMetadata: imports,
  }),
}

/** Collapsed group: only the toggle shows, and it still reads as the current section. */
export const GroupCollapsed: Story = {
  args: { expanded: false },
  render: (args) => ({
    props: { ...args, collapsed: false },
    template: shell(false),
    moduleMetadata: imports,
  }),
}

/** The 64 px rail: an icon with a small chevron, sub-icons aligned under the top-level ones. */
export const InCollapsedRail: Story = {
  render: (args) => ({
    props: { ...args, collapsed: true },
    template: shell(true),
    moduleMetadata: imports,
  }),
}

/** The rail with the group folded away. */
export const InCollapsedRailFolded: Story = {
  args: { expanded: false },
  render: (args) => ({
    props: { ...args, collapsed: true },
    template: shell(true),
    moduleMetadata: imports,
  }),
}

/** In the drawer (below 768 px) the group works as in the full-width navigation. */
export const InMobileDrawer: Story = {
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: (args) => ({
    props: { ...args, collapsed: false },
    template: shell(false),
    moduleMetadata: imports,
  }),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('.gbt-app-shell__toggle')?.click()
  },
}

export const Dark: Story = {
  render: (args) => ({
    props: { ...args, collapsed: false },
    template: shell(false),
    moduleMetadata: imports,
  }),
  decorators: [darkTheme],
}

export const InCollapsedRailDark: Story = {
  render: (args) => ({
    props: { ...args, collapsed: true },
    template: shell(true),
    moduleMetadata: imports,
  }),
  decorators: [darkTheme],
}
