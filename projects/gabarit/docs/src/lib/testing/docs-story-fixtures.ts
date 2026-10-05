// Storybook only: the reader's routes over the fixtures, in French.
import { inject, provideAppInitializer } from '@angular/core'
import { provideLocationMocks } from '@angular/common/testing'
import { Router, provideRouter } from '@angular/router'
import { applicationConfig } from '@storybook/angular-vite'
import { provideDocs } from '../docs-config'
import { provideDocsLabels } from '../docs-labels'
import type { DocsService } from '../docs.service'
import { DocsService as Service } from '../docs.service'
import { docsRoutes } from '../docs.routes'
import { FRENCH_CALLOUTS, FRENCH_DOCS_LABELS, fakeDocsService } from './docs-fixtures'

/** The reader's routes with in-memory navigation starting at `url`, over the fixtures (or the given service). */
export function withDocs(
  options: { url?: string; docs?: Pick<DocsService, 'root' | 'index' | 'page'> } = {},
) {
  return applicationConfig({
    providers: [
      provideRouter([
        {
          path: 'docs',
          children: docsRoutes(() => import('../docs-page/docs-page').then((m) => m.DocsPage)),
        },
      ]),
      provideLocationMocks(),
      provideAppInitializer(() =>
        inject(Router).navigateByUrl(options.url ?? '/docs/ci-cd/reference-yaml'),
      ),
      { provide: Service, useValue: options.docs ?? fakeDocsService() },
      provideDocsLabels(FRENCH_DOCS_LABELS),
      provideDocs({ callouts: FRENCH_CALLOUTS }),
    ],
  })
}
