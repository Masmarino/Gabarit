import { InjectionToken, type Provider, type Signal, computed, inject } from '@angular/core'

/** Every string the documentation reader shows or announces. English by default. */
export interface DocsLabels {
  /** The reader's name: the navigation's heading, its landmark and the breadcrumb's first step. */
  documentation: string
  showContents: string
  hideContents: string
  searchLabel: string
  searchPlaceholder: string
  searching: string
  noResults: string
  searchFailed: string
  results: (count: number) => string
  onThisPage: string
  breadcrumb: string
  neighbours: string
  previous: string
  next: string
  notFoundHeading: string
  notFoundMessage: string
  toStart: string
  loadFailed: string
  retry: string
  loading: string
  /** The accessible names given to a code block and a table, which scroll sideways and so take the focus. */
  codeBlock: string
  table: string
}

export const DEFAULT_DOCS_LABELS: Readonly<DocsLabels> = Object.freeze<DocsLabels>({
  documentation: 'Documentation',
  showContents: 'Show the contents',
  hideContents: 'Hide the contents',
  searchLabel: 'Search the documentation',
  searchPlaceholder: 'Search…',
  searching: 'Searching…',
  noResults: 'No page matches.',
  searchFailed: 'The documentation could not be loaded.',
  results: (count) => (count === 0 ? 'No results' : count === 1 ? '1 result' : `${count} results`),
  onThisPage: 'On this page',
  breadcrumb: 'Breadcrumb',
  neighbours: 'Neighbouring pages',
  previous: 'Previous',
  next: 'Next',
  notFoundHeading: 'Page not found',
  notFoundMessage:
    'This page does not exist in the documentation. Check the address, or start again from the beginning.',
  toStart: 'Go to the start of the documentation',
  loadFailed: 'The documentation could not be loaded.',
  retry: 'Retry',
  loading: 'Loading the page…',
  codeBlock: 'Code block',
  table: 'Table',
})

export const DOCS_LABELS = new InjectionToken<Partial<DocsLabels>>('DOCS_LABELS')

/** The reader's strings, over the English defaults; the ones left out keep theirs. */
export function provideDocsLabels(labels: Partial<DocsLabels>): Provider {
  return { provide: DOCS_LABELS, useValue: labels }
}

export function docsLabels(): Signal<DocsLabels> {
  const provided = inject(DOCS_LABELS, { optional: true }) ?? {}
  const defined = Object.fromEntries(
    Object.entries(provided).filter(([, value]) => value !== undefined),
  ) as Partial<DocsLabels>
  return computed(() => ({ ...DEFAULT_DOCS_LABELS, ...defined }))
}
