/*
 * @masmarino/gabarit/docs: a reader for documentation written in Markdown and shipped with an app. Its own entry
 * point, since it needs the router, marked and DOMPurify, which the rest of Gabarit does not.
 */
export {
  DOCS_CONFIG,
  DOCS_TITLE,
  DEFAULT_DOCS_CONFIG,
  provideDocs,
  type DocsConfig,
} from './lib/docs-config'
export {
  DEFAULT_DOCS_LABELS,
  DOCS_LABELS,
  docsLabels,
  provideDocsLabels,
  type DocsLabels,
} from './lib/docs-labels'
export {
  DocsService,
  docsPageCommands,
  docsReadingOrder,
  firstDocsPage,
  isNotFound,
  locateDocsPage,
  type DocsIndex,
  type DocsLink,
  type DocsLocation,
  type DocsPageEntry,
  type DocsSection,
} from './lib/docs.service'
export {
  DOCS_SEARCH_LIMIT,
  DocsSearchService,
  parseDocsPage,
  searchTokens,
  type DocsSearchHit,
} from './lib/docs-search.service'
export { docsHomeGuard, docsRoutes } from './lib/docs.routes'
export { DocsNav } from './lib/docs-nav/docs-nav'
export { DocsPage } from './lib/docs-page/docs-page'
export { DocsSearch } from './lib/docs-search/docs-search'
export { MarkdownOutline, hasOutline } from './lib/markdown-outline/markdown-outline'
export {
  MarkdownView,
  decodeFragment,
  findAnchorTarget,
  headingSlug,
  makeScrollableBlocksFocusable,
  nameTaskCheckboxes,
  type MarkdownOutlineEntry,
} from './lib/markdown-view/markdown-view'
