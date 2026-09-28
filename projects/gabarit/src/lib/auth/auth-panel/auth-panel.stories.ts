import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { expect, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { Button } from '../../components/atoms/button/button'
import { EmptyState } from '../../components/molecules/empty-state/empty-state'
import { AuthFooter, AuthFooterLink } from '../auth-footer/auth-footer'
import { STORY_LOGO, atPhoneWidth, expectPanelLayout } from '../testing/auth-story-helpers'
import { AuthPanel } from './auth-panel'

/**
 * The frame of the public sign-in pages: page background, panel, the application's logo (the
 * `[auth-logo]` slot), heading and intro, then whatever the page projects. `gbt-auth-footer` and the
 * `gbt-empty-state` states (registration closed, account created or activated, dead link) are the
 * two blocks the pages put inside it.
 */
const meta: Meta<AuthPanel> = {
  title: 'Auth/AuthPanel',
  component: AuthPanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [AuthFooter, AuthFooterLink, EmptyState, Button] })],
  args: {
    heading: 'A page heading',
    intro: 'One sentence that explains what the page asks for.',
    wide: false,
  },
  play: expectPanelLayout(),
}

export default meta
type Story = StoryObj<AuthPanel>

const DEFAULT_TEMPLATE = `<gbt-auth-panel [heading]="heading" [intro]="intro" [wide]="wide">
  ${STORY_LOGO}
  <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; text-align: center;">The page's content is projected here.</p>
  <gbt-auth-footer text="Already have an account?"><a gbtButton variant="link" gbtAuthFooterLink href="#">Sign in</a></gbt-auth-footer>
</gbt-auth-panel>`

/** Heading, intro, a projected block and the footer. */
export const Default: Story = {
  render: (args) => ({ props: args, template: DEFAULT_TEMPLATE }),
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('heading', { level: 1, name: 'A page heading' }),
    ).toBeVisible()
    await expect(within(context.canvasElement).getByRole('img', { name: 'Acme' })).toBeVisible()
    await expectPanelLayout()(context)
  },
}

/** The heading alone (the enrolment writes its own text under it), on the wider panel. */
export const WideHeadingAlone: Story = {
  args: { heading: 'Two-factor authentication', intro: '', wide: true },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro" [wide]="wide">${STORY_LOGO}<p style="margin: 0; text-align: center; color: var(--text-secondary);">Wide content</p></gbt-auth-panel>`,
  }),
}

/** No heading: the state draws its own (icon, h1, text and the one action). Done. */
export const WithStatus: Story = {
  args: { heading: '', intro: '' },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro">
      ${STORY_LOGO}
      <gbt-empty-state class="gbt-auth-panel__status gbt-auth-panel__status--success" icon="circle-check" [headingLevel]="1" headingFocusable heading="Your account is activated" message="You can now sign in.">
        <gbt-button class="gbt-auth-panel__submit" block size="large" text="Sign in" />
      </gbt-empty-state>
    </gbt-auth-panel>`,
  }),
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('heading', {
        level: 1,
        name: 'Your account is activated',
      }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}

/** Something closed or informational: the neutral glyph. */
export const WithNeutralStatus: Story = {
  args: { heading: '', intro: '' },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro">
      ${STORY_LOGO}
      <gbt-empty-state class="gbt-auth-panel__status" icon="lock" [headingLevel]="1" headingFocusable heading="Registration is closed" message="This instance does not accept open registration. Ask an administrator for an invitation.">
        <gbt-button class="gbt-auth-panel__submit" block size="large" text="Sign in" />
      </gbt-empty-state>
    </gbt-auth-panel>`,
  }),
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('heading', {
        level: 1,
        name: 'Registration is closed',
      }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}

/** Something went wrong and only a new start helps: the error tone. */
export const WithErrorStatus: Story = {
  args: { heading: '', intro: '' },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro">
      ${STORY_LOGO}
      <gbt-empty-state class="gbt-auth-panel__status" tone="error" icon="shield-alert" [headingLevel]="1" headingFocusable heading="This link does not work" message="This invitation link is invalid or has expired. Ask an administrator to send you a new one.">
        <gbt-button class="gbt-auth-panel__submit" block size="large" text="Sign in" />
      </gbt-empty-state>
    </gbt-auth-panel>`,
  }),
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('heading', {
        level: 1,
        name: 'This link does not work',
      }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}

/** No logo projected: the slot takes no room and the heading tops the panel. */
export const WithoutLogo: Story = {
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro" [wide]="wide">
      <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; text-align: center;">The page's content is projected here.</p>
    </gbt-auth-panel>`,
  }),
  play: async (context) => {
    const logo = context.canvasElement.querySelector<HTMLElement>('.gbt-auth-panel__logo')!
    await expect(logo).not.toBeVisible()
    await expectPanelLayout()(context)
  },
}

/** The dark theme: the panel on the dark page background. */
export const Dark: Story = {
  decorators: [darkTheme],
  render: Default.render,
  play: Default.play,
}

/** A phone's width: the panel keeps its 16px gutter. */
export const Phone: Story = {
  decorators: [atPhoneWidth],
  render: Default.render,
  play: Default.play,
}

/**
 * The panel's strings are its inputs and the page's own content: an application localises them
 * where it writes them (here the French of the original application).
 */
export const Localised: Story = {
  args: {
    heading: 'Un titre de page',
    intro: 'Une phrase qui explique ce que la page demande.',
  },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel [heading]="heading" [intro]="intro" [wide]="wide">
      ${STORY_LOGO}
      <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; text-align: center;">Le contenu de la page est projeté ici.</p>
      <gbt-auth-footer text="Vous avez déjà un compte ?"><a gbtButton variant="link" gbtAuthFooterLink href="#">Se connecter</a></gbt-auth-footer>
    </gbt-auth-panel>`,
  }),
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('heading', { level: 1, name: 'Un titre de page' }),
    ).toBeVisible()
    await expect(
      within(context.canvasElement).getByRole('link', { name: 'Se connecter' }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}
