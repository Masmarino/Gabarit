import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { type Observable, map, of, shareReplay, tap } from 'rxjs'
import { DOCS_CONFIG } from './docs-config'

export interface DocsPageEntry {
  slug: string
  title: string
  description: string
}

export interface DocsSection {
  slug: string
  title: string
  pages: DocsPageEntry[]
}

/** `<root>/index.json`: the sections and their pages, in reading order. */
export interface DocsIndex {
  sections: DocsSection[]
}

export interface DocsLink {
  sectionTitle: string
  title: string
  commands: string[]
}

/** A page with its neighbours in reading order, across sections. */
export interface DocsLocation {
  section: DocsSection
  page: DocsPageEntry
  previous: DocsLink | null
  next: DocsLink | null
}

export function docsPageCommands(root: string, section: string, page: string): string[] {
  return [root, section, page]
}

/** Every page in reading order, each with its section. */
export function docsReadingOrder(
  index: DocsIndex,
): { section: DocsSection; page: DocsPageEntry }[] {
  return index.sections.flatMap((section) => section.pages.map((page) => ({ section, page })))
}

/** Where `<root>` leads: the first page of the first section, or `null` for an empty index. */
export function firstDocsPage(root: string, index: DocsIndex): string[] | null {
  const first = docsReadingOrder(index)[0]
  return first ? docsPageCommands(root, first.section.slug, first.page.slug) : null
}

export function locateDocsPage(
  root: string,
  index: DocsIndex,
  section: string | null,
  page: string | null,
): DocsLocation | null {
  const order = docsReadingOrder(index)
  const at = order.findIndex((entry) => entry.section.slug === section && entry.page.slug === page)
  if (at < 0) {
    return null
  }
  const link = (entry: (typeof order)[number] | undefined): DocsLink | null =>
    entry
      ? {
          sectionTitle: entry.section.title,
          title: entry.page.title,
          commands: docsPageCommands(root, entry.section.slug, entry.page.slug),
        }
      : null
  return { ...order[at], previous: link(order[at - 1]), next: link(order[at + 1]) }
}

// An SPA's fallback answers an unknown path with its index.html, which isn't a Markdown page.
const looksLikeHtml = (text: string) => /^\s*<!doctype html|^\s*<html[\s>]/i.test(text)

/**
 * The documentation, shipped as static files under the configured root. The index and each page are fetched once
 * and kept, since they only change with a new version of the app. A failure isn't kept, so it gets retried.
 */
@Injectable({ providedIn: 'root' })
export class DocsService {
  private readonly http = inject(HttpClient)
  readonly root = inject(DOCS_CONFIG).root
  private index$: Observable<DocsIndex> | null = null
  private readonly pages = new Map<string, string>()

  index(): Observable<DocsIndex> {
    this.index$ ??= this.http
      .get<DocsIndex>(`${this.root}/index.json`)
      .pipe(tap({ error: () => (this.index$ = null) }), shareReplay(1))
    return this.index$
  }

  /** The page's Markdown. A missing file fails with a 404, including when the server answers with the app shell. */
  page(section: string, page: string): Observable<string> {
    const key = `${section}/${page}`
    const known = this.pages.get(key)
    if (known !== undefined) {
      return of(known)
    }
    return this.http.get(`${this.root}/${key}.md`, { responseType: 'text' }).pipe(
      map((text) => {
        if (looksLikeHtml(text)) {
          throw new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            url: `${this.root}/${key}.md`,
          })
        }
        return text
      }),
      tap((text) => this.pages.set(key, text)),
    )
  }
}

export const isNotFound = (error: unknown) =>
  error instanceof HttpErrorResponse && error.status === 404
