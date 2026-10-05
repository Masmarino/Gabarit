import { inject } from '@angular/core'
import { type CanActivateFn, Router, type Routes } from '@angular/router'
import { catchError, map, of } from 'rxjs'
import { DocsService, firstDocsPage } from './docs.service'

/** Sends the root to the first page. A broken or empty index is left for the reader to show. */
export const docsHomeGuard: CanActivateFn = () => {
  const router = inject(Router)
  const docs = inject(DocsService)
  return docs.index().pipe(
    map((index) => {
      const first = firstDocsPage(docs.root, index)
      return first ? router.createUrlTree(first) : true
    }),
    catchError(() => of(true)),
  )
}

/** The reader's routes, for the configured root. `page` loads the component that shows it (often the app's). */
export function docsRoutes(page: () => Promise<unknown>): Routes {
  const loadComponent = page as Routes[number]['loadComponent']
  return [
    { path: '', pathMatch: 'full', canActivate: [docsHomeGuard], loadComponent },
    { path: ':section/:page', loadComponent },
    { path: '**', loadComponent },
  ]
}
