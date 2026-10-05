import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { expect, waitFor } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { withDocs } from '../testing/docs-story-fixtures'
import { FAILING_DOCS, LOADING_DOCS, fakeDocsService } from '../testing/docs-fixtures'

// DocsPage reads its section and page from the route, so the stories render it through the reader's routes.
@Component({
  selector: 'gbt-docs-route',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class DocsRoute {}

const atPhoneWidth = componentWrapperDecorator(
  (story) => `<div style="max-width: 375px; margin: 0 auto;">${story}</div>`,
)
const inPage = componentWrapperDecorator((story) => `<div style="padding: 1.5rem;">${story}</div>`)

/** Layout checks jsdom can't do: nothing overflows the frame and the article stays inside it. */
async function expectDocsLayout({ canvasElement }: { canvasElement: HTMLElement }) {
  const article = await waitFor(() => {
    const found = canvasElement.querySelector('.gbt-docs-page__article')
    if (!found) throw new Error('page not rendered yet')
    return found
  })
  const doc = canvasElement.ownerDocument.documentElement
  await expect(doc.scrollWidth, 'no horizontal overflow').toBeLessThanOrEqual(doc.clientWidth + 1)
  const frame = canvasElement.querySelector('gbt-page-layout')!.getBoundingClientRect()
  await expect(
    article.getBoundingClientRect().right,
    'the article stays inside the layout',
  ).toBeLessThanOrEqual(frame.right + 0.5)
}

/**
 * A documentation page: the navigation and its search on the left, the page with its breadcrumb and neighbours, and on
 * a wide screen the outline. The stories mount `gbt-docs-page` through `docsRoutes()` over made-up French pages.
 */
const meta: Meta<DocsRoute> = {
  title: 'Docs/DocsPage',
  component: DocsRoute,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [inPage],
}

export default meta
type Story = StoryObj<DocsRoute>

export const Reference: Story = {
  decorators: [withDocs()],
  play: async (context) => {
    await expectDocsLayout(context)
    await waitFor(() =>
      expect(
        context.canvasElement.querySelector('aside .gbt-markdown-outline__list'),
      ).not.toBeNull(),
    )
  },
}

export const Dark: Story = {
  decorators: [withDocs(), darkTheme],
  play: expectDocsLayout,
}

export const Phone: Story = {
  decorators: [withDocs(), atPhoneWidth],
  play: async (context) => {
    await expectDocsLayout(context)
    const toggle = context.canvasElement.querySelector('.gbt-docs-nav__toggle')!
    await expect(getComputedStyle(toggle).display, 'the sections fold behind a toggle').not.toBe(
      'none',
    )
    await expect(
      getComputedStyle(context.canvasElement.querySelector('.gbt-docs-nav__body')!).display,
    ).toBe('none')
  },
}

export const FirstPage: Story = {
  decorators: [withDocs({ url: '/docs' })],
  play: async (context) => {
    await expectDocsLayout(context)
    await expect(context.canvasElement.querySelector('article h1')?.textContent?.trim()).toBe(
      'Présentation',
    )
  },
}

export const NotFound: Story = {
  decorators: [withDocs({ url: '/docs/ci-cd/disparue' })],
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector('h1')?.textContent?.trim()).toBe('Page introuvable'),
    )
  },
}

export const Loading: Story = {
  decorators: [withDocs({ docs: fakeDocsService({ page: LOADING_DOCS }) })],
}

export const Failed: Story = {
  decorators: [withDocs({ docs: fakeDocsService({ index: FAILING_DOCS }) })],
}
