import { InjectionToken, type Provider } from '@angular/core'

export interface DocsConfig {
  /**
   * Where the pages are, both as files and as the reader's routes: `<root>/index.json`, `<root>/<section>/<page>.md`,
   * and the page `<root>/<section>/<page>`. `/docs` by default.
   */
  root: string
  /**
   * The quotes that become callouts: a quote whose first word, in bold, is one of these keys (`> **Note** …`), drawn
   * in the tone it maps to. Case does not matter.
   */
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
 * Where the shown page's title goes, for an app that names its pages somewhere of its own (a header, a breadcrumb):
 * called with the page's title, "not found" or the reader's name while loading. Without it the reader leaves the
 * title alone.
 */
export const DOCS_TITLE = new InjectionToken<(title: string) => void>('DOCS_TITLE')

export function provideDocs(config: Partial<DocsConfig> = {}): Provider {
  return { provide: DOCS_CONFIG, useValue: { ...DEFAULT_DOCS_CONFIG, ...config } }
}
