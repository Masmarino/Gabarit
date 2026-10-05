# @masmarino/gabarit/docs

A reader for documentation written in Markdown and shipped with an app: a navigation with search on the left, the page
with its breadcrumb and neighbours, and its outline on a wide screen. It is its own entry point because it needs
`@angular/router`, [marked](https://marked.js.org) and [DOMPurify](https://github.com/cure53/DOMPurify), which the rest
of Gabarit does not; install them next to Gabarit:

```sh
npm install marked dompurify
```

## The pages

The app serves the documentation as static files under a root (`/docs` by default), for instance from its `public/`
folder:

```
public/docs/
  index.json                # the sections and their pages, in reading order
  demarrer/presentation.md  # one Markdown file per page: <section>/<page>.md
  demarrer/prise-en-main.md
```

```json
{
  "sections": [
    {
      "slug": "demarrer",
      "title": "Démarrer",
      "pages": [
        { "slug": "presentation", "title": "Présentation", "description": "What the app does." }
      ]
    }
  ]
}
```

The index and each page are fetched once and kept. A page links to another with a root-relative link
(`[Configuration](/docs/installation/configuration#variables)`): the reader follows it through the router. A quote
whose first word is a bold callout key becomes a callout: `> **Note** …` (and `> **Warning** …` by default).

## Wiring

```ts
// app.routes.ts
import { docsRoutes } from '@masmarino/gabarit/docs'

export const routes: Routes = [
  {
    path: 'docs',
    // The app's own page around the reader (its layout, its header), or DocsPage itself.
    children: docsRoutes(() => import('./docs/docs-route').then((m) => m.DocsRoute)),
  },
]
```

```ts
// docs-route.ts: the reader inside the app's layout
@Component({
  imports: [AppLayout, DocsPage],
  providers: [
    provideDocs({ callouts: { note: 'note', attention: 'warning' } }),
    provideDocsLabels(FRENCH_DOCS_LABELS),
    { provide: DOCS_TITLE, useFactory: () => (title: string) => inject(Title).setTitle(title) },
  ],
  template: `<app-layout><gbt-docs-page /></app-layout>`,
})
export class DocsRoute {}
```

`docsRoutes()` sends the root to the first page, mounts `<section>/<page>`, and gives any other address the reader's
own "not found". `gbt-docs-page` reads the section and the page from the route.

## Providers

| Token                 | Role                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `provideDocs(config)` | `root` (`/docs`) and the `callouts` keys (`note`, `warning`).                                          |
| `provideDocsLabels()` | The reader's strings, over the English defaults (`DEFAULT_DOCS_LABELS`).                               |
| `DOCS_TITLE`          | A function given the shown page's title (or "not found", or the reader's name while loading). Optional. |

## Pieces

| Piece                  | Role                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `gbt-docs-page`        | The whole reader for the routed page: navigation, page, neighbours, outline, loading, failure, not found. |
| `gbt-docs-nav`         | The sections and their pages, with the search; folds behind a toggle on a narrow layout.                  |
| `gbt-docs-search`      | A search over every page, in the browser, loaded on first focus.                                          |
| `gbt-markdown-view`    | Markdown to sanitised HTML, with the reading styles; usable on its own (a README, release notes).          |
| `gbt-markdown-outline` | The "On this page" panel for the headings a `gbt-markdown-view` emits.                                    |

## Security

The Markdown is sanitised with a dedicated DOMPurify instance, stricter than its defaults: no `<style>`, no `style`
attribute, no forms or buttons, no IDREFs or `tabindex`, ids and names prefixed with `user-content-`, only the
`language-*` classes of code blocks kept, task-list checkboxes disabled, remote images lazy and without a referrer.

## Accessibility

Every heading gets a stable id; the outline and in-page links move the focus to the heading they reach. Code blocks
and tables that scroll sideways take the focus and are named. Task-list checkboxes are named by their item. A new page
moves the focus to its title, except on the first visit.
