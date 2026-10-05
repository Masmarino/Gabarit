import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { expect } from 'storybook/test'
import { AuthPanel } from '../auth/auth-panel/auth-panel'
import { STORY_LOGO } from '../auth/testing/auth-story-helpers'
import { GitField } from './git-field'

/**
 * The family's animated commit graph, on the graphite frame. Its place is the `[auth-backdrop]` slot of the sign-in
 * pages, behind the panel; anywhere else it fills its nearest positioned ancestor.
 */
const meta: Meta<GitField> = {
  title: 'Templates/GitField',
  component: GitField,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [moduleMetadata({ imports: [AuthPanel] })],
}

export default meta
type Story = StoryObj<GitField>

/** Behind a sign-in panel, through its `[auth-backdrop]` slot. */
export const BehindTheSignInPanel: Story = {
  render: () => ({
    template: `<gbt-auth-panel heading="Sign in" intro="One sentence that explains what the page asks for.">
  <gbt-git-field auth-backdrop />
  ${STORY_LOGO}
  <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; text-align: center;">The page's form.</p>
</gbt-auth-panel>`,
  }),
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('main.gbt-auth-panel > gbt-git-field')!
    await expect(field).toBeTruthy()
    await expect(field.getAttribute('aria-hidden')).toBe('true')
  },
}

/** On a dark band of its own: the band is positioned and isolated, its content lifted above the field. */
export const OnADarkBand: Story = {
  render: () => ({
    template: `<section style="position: relative; isolation: isolate; min-height: 22rem; background: var(--frame);">
  <gbt-git-field />
</section>`,
  }),
}
