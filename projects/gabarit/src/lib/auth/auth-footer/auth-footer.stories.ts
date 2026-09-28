import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { expect, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { Button } from '../../components/atoms/button/button'
import { AuthPanel } from '../auth-panel/auth-panel'
import { STORY_LOGO, atPhoneWidth, expectPanelLayout } from '../testing/auth-story-helpers'
import { AuthFooter, AuthFooterLink } from './auth-footer'

/**
 * Under the form of a sign-in page: a hairline, the sentence, and the link (44px high to tap) to the
 * sibling page. The link is drawn from `href` and `linkText`, or projected by the application (an
 * `a[gbtButton][gbtAuthFooterLink]` carrying its `routerLink`). The stories' links point at `#`.
 */
const meta: Meta<AuthFooter> = {
  title: 'Auth/AuthFooter',
  component: AuthFooter,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [AuthPanel, AuthFooterLink, Button] })],
  args: { text: 'Already have an account?', linkText: 'Sign in', href: '#' },
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel heading="Create an account" intro="An example page.">${STORY_LOGO}<gbt-auth-footer [text]="text" [linkText]="linkText" [href]="href" /></gbt-auth-panel>`,
  }),
  play: async (context) => {
    await expect(within(context.canvasElement).getByRole('link', { name: 'Sign in' })).toBeVisible()
    await expectPanelLayout()(context)
  },
}

export default meta
type Story = StoryObj<AuthFooter>

/** The link drawn from `href` and `linkText`. */
export const Default: Story = {}

/** A longer sentence wraps under the link's row rather than overflowing the panel. */
export const LongText: Story = {
  args: {
    text: 'Already have an account and want to sign in with it?',
    linkText: 'Sign in now',
  },
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('link', { name: 'Sign in now' }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}

/**
 * The link projected by the application, as the sign-in pages receive it: the same look, the same
 * 44px, and the application's own `routerLink` (a plain `href` here).
 */
export const ProjectedLink: Story = {
  render: (args) => ({
    props: args,
    template: `<gbt-auth-panel heading="Create an account" intro="An example page.">${STORY_LOGO}<gbt-auth-footer [text]="text"><a gbtButton variant="link" gbtAuthFooterLink href="#">Sign in</a></gbt-auth-footer></gbt-auth-panel>`,
  }),
  play: async (context) => {
    const link = within(context.canvasElement).getByRole('link', { name: 'Sign in' })
    await expect(link).toBeVisible()
    await expect(link).toHaveClass('gbt-auth-footer__link')
    await expectPanelLayout()(context)
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
}

/** A phone's width: the sentence and the link wrap inside the panel. */
export const Phone: Story = {
  decorators: [atPhoneWidth],
  args: {
    text: 'Already have an account and want to sign in with it?',
    linkText: 'Sign in now',
  },
  play: LongText.play,
}

/** The sentence and the link text are inputs: an application localises them (here in French). */
export const Localised: Story = {
  args: { text: 'Vous avez déjà un compte ?', linkText: 'Se connecter' },
  play: async (context) => {
    await expect(
      within(context.canvasElement).getByRole('link', { name: 'Se connecter' }),
    ).toBeVisible()
    await expectPanelLayout()(context)
  },
}
