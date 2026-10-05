import { InjectionToken, type Provider } from '@angular/core'

export interface DocsConfig {
  /** Where the files (`<root>/index.json`, `<root>/<section>/<page>.md`) and the routes live. `/docs` by default. */
  root: string
  /** A quote opening on one of these words in bold (`> **Note** …`) becomes a callout of that tone. Any case. */
  callouts: Readonly<Record<string, 'note' | 'warning'>>
}

export const DEFAULT_DOCS_CONFIG: Readonly<DocsConfig> = Object.freeze<DocsConfig>({
  root: '/docs',
  callouts: { note: 'note', warning: 'warning' },
})

export const DOCS_CONFIG = new InjectionToken<DocsConfig>('DOCS_CONFIG', {
  factory: () => DEFAULT_DOCS_CONFIG,
})

/**
 * Gets the shown page's title (or "not found", or the reader's name while loading), for an app that shows titles in
 * its own header. Optional.
 */
export const DOCS_TITLE = new InjectionToken<(title: string) => void>('DOCS_TITLE')

export function provideDocs(config: Partial<DocsConfig> = {}): Provider {
  return { provide: DOCS_CONFIG, useValue: { ...DEFAULT_DOCS_CONFIG, ...config } }
}
