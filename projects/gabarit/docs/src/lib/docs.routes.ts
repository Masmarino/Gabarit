import { inject } from '@angular/core'
import { type CanActivateFn, Router, type Routes } from '@angular/router'
import { catchError, map, of } from 'rxjs'
import { DocsService, firstDocsPage } from './docs.service'

/**
 * The root opens the first page of the index. If the index can't be read or is empty, the reader shows that itself,
 * inside its own layout.
 */
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

/**
 * The reader's routes, to mount at the configured root: the root (to the first page), `<section>/<page>`, and any
 * other depth, which gets the reader's own "not found". `page` is the routed component that shows the reader (often
 * the app's own, wrapping `gbt-docs-page` in its layout).
 */
export function docsRoutes(page: () => Promise<unknown>): Routes {
  const loadComponent = page as Routes[number]['loadComponent']
  return [
    { path: '', pathMatch: 'full', canActivate: [docsHomeGuard], loadComponent },
    { path: ':section/:page', loadComponent },
    { path: '**', loadComponent },
  ]
}
