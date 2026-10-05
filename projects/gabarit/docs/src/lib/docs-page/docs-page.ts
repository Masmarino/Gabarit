import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, type ParamMap, RouterLink } from '@angular/router'
import {
  BehaviorSubject,
  type Observable,
  catchError,
  combineLatest,
  debounceTime,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs'
import { Alert } from '@masmarino/gabarit/alert'
import { Breadcrumb } from '@masmarino/gabarit/breadcrumb'
import { Button } from '@masmarino/gabarit/button'
import { Card, CardLink } from '@masmarino/gabarit/card'
import { EmptyState } from '@masmarino/gabarit/empty-state'
import { PageLayout } from '@masmarino/gabarit/page-layout'
import { Skeleton } from '@masmarino/gabarit/skeleton'
import { DOCS_CONFIG, DOCS_TITLE } from '../docs-config'
import { docsLabels } from '../docs-labels'
import { DocsNav } from '../docs-nav/docs-nav'
import {
  type DocsIndex,
  type DocsLocation,
  DocsService,
  docsPageCommands,
  firstDocsPage,
  isNotFound,
  locateDocsPage,
} from '../docs.service'
import { MarkdownOutline, hasOutline } from '../markdown-outline/markdown-outline'
import {
  type MarkdownOutlineEntry,
  MarkdownView,
  findAnchorTarget,
} from '../markdown-view/markdown-view'

type DocsView =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'not-found'; firstPage: string[] | null }
  | { kind: 'page'; location: DocsLocation; content: string }

const keyOf = (section: string | null, page: string | null) => `${section}/${page}`

/** The routed page with its nav, breadcrumb, neighbours and outline, or a "not found" in the same frame. */
@Component({
  selector: 'gbt-docs-page',
  standalone: true,
  imports: [
    RouterLink,
    Alert,
    Breadcrumb,
    Button,
    Card,
    CardLink,
    EmptyState,
    PageLayout,
    Skeleton,
    MarkdownView,
    MarkdownOutline,
    DocsNav,
  ],
  templateUrl: './docs-page.html',
  styleUrl: './docs-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPage {
  private readonly docs = inject(DocsService)
  private readonly route = inject(ActivatedRoute)
  private readonly setTitle = inject(DOCS_TITLE, { optional: true })
  private readonly callouts = inject(DOCS_CONFIG).callouts
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)

  protected readonly labels = docsLabels()
  protected readonly root = this.docs.root
  protected readonly skeletonRows = ['38%', '92%', '84%', '96%', '60%']

  private readonly reload$ = new BehaviorSubject<void>(undefined)
  protected readonly index = signal<DocsIndex | null>(null)
  private readonly params = toSignal(this.route.paramMap, { requireSync: true })
  protected readonly sectionSlug = computed(() => this.params().get('section'))
  protected readonly pageSlug = computed(() => this.params().get('page'))

  protected readonly view = toSignal(
    combineLatest([this.route.paramMap, this.reload$]).pipe(
      switchMap(([params]) => this.load(params)),
    ),
    { initialValue: { kind: 'loading' } as DocsView },
  )

  protected readonly page = computed(() => {
    const view = this.view()
    return view.kind === 'page' ? view : null
  })
  protected readonly notFound = computed(() => {
    const view = this.view()
    return view.kind === 'not-found' ? view : null
  })

  protected readonly outline = signal<MarkdownOutlineEntry[]>([])
  protected readonly showOutline = computed(
    () => this.view().kind === 'page' && hasOutline(this.outline()),
  )

  // What the reader navigated to (page and `#fragment`), handled once the page is on screen.
  private wanted: { key: string; fragment: string | null; moveFocus: boolean } | null = null
  private renderedKey: string | null = null

  constructor() {
    effect(() => {
      const view = this.view()
      const labels = this.labels()
      this.setTitle?.(
        view.kind === 'page'
          ? view.location.page.title
          : view.kind === 'not-found'
            ? labels.notFoundHeading
            : labels.documentation,
      )
    })

    // Params and fragment arrive one after the other, so wait for both. Leave the focus alone on the first visit.
    let first = true
    combineLatest([this.route.paramMap, this.route.fragment])
      .pipe(debounceTime(0), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(([params, fragment]) => {
        this.wanted = {
          key: keyOf(params.get('section'), params.get('page')),
          fragment,
          moveFocus: !first,
        }
        first = false
        this.settle()
      })
  }

  private load(params: ParamMap): Observable<DocsView> {
    const section = params.get('section')
    const page = params.get('page')
    return this.docs.index().pipe(
      tap((index) => this.index.set(index)),
      switchMap((index): Observable<DocsView> => {
        const location = locateDocsPage(this.root, index, section, page)
        const notFound: DocsView = { kind: 'not-found', firstPage: firstDocsPage(this.root, index) }
        if (!location) {
          return of(notFound)
        }
        return this.docs.page(location.section.slug, location.page.slug).pipe(
          map((content): DocsView => ({ kind: 'page', location, content })),
          catchError((error: unknown) =>
            of<DocsView>(isNotFound(error) ? notFound : { kind: 'failed' }),
          ),
        )
      }),
      catchError(() => of<DocsView>({ kind: 'failed' })),
      startWith<DocsView>({ kind: 'loading' }),
    )
  }

  protected retry(): void {
    this.reload$.next()
  }

  protected sectionLink(location: DocsLocation): string[] {
    return docsPageCommands(this.root, location.section.slug, location.section.pages[0].slug)
  }

  /** After each render: the outline, the callouts, then the pending navigation. */
  protected onRendered(entries: MarkdownOutlineEntry[]): void {
    this.outline.set(entries)
    const content = this.content()
    if (!content) {
      return
    }
    for (const quote of Array.from(content.querySelectorAll('blockquote'))) {
      const lead =
        quote.firstElementChild?.tagName === 'P' ? quote.firstElementChild.firstChild : null
      const word =
        lead instanceof HTMLElement && lead.tagName === 'STRONG'
          ? (lead.textContent ?? '').trim().toLowerCase()
          : ''
      const kind = Object.hasOwn(this.callouts, word) ? this.callouts[word] : undefined
      if (kind) {
        quote.setAttribute('data-callout', kind)
        quote.setAttribute('role', 'note')
      }
    }
    const view = this.view()
    this.renderedKey =
      view.kind === 'page' ? keyOf(view.location.section.slug, view.location.page.slug) : null
    this.settle()
  }

  private content(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('.gbt-docs-page__content')
  }

  /** Scrolls to the `#fragment` (an outline `user-content-…` id or the bare slug from a link), or to the top of a new page. */
  private settle(): void {
    const wanted = this.wanted
    const content = this.content()
    if (!wanted || wanted.key !== this.renderedKey || !content) {
      return
    }
    this.wanted = null
    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = wanted.fragment ? findAnchorTarget(content, wanted.fragment) : null
    if (target) {
      target.scrollIntoView?.({
        behavior: wanted.moveFocus && !reduceMotion ? 'smooth' : 'auto',
        block: 'start',
      })
      if (wanted.moveFocus) {
        this.focus(target)
      }
      return
    }
    if (wanted.moveFocus) {
      const heading = content.querySelector<HTMLElement>('h1')
      if (heading) {
        this.focus(heading)
      }
      this.host.nativeElement.ownerDocument.defaultView?.scrollTo?.({ top: 0 })
    }
  }

  // Headings aren't focusable; -1 lets the next Tab carry on from there.
  private focus(element: HTMLElement): void {
    if (element.tabIndex < 0) {
      element.setAttribute('tabindex', '-1')
    }
    element.focus({ preventScroll: true })
  }
}
