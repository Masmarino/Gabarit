import { ChangeDetectionStrategy, Component, inject, output, viewChild } from '@angular/core'
import { Router } from '@angular/router'
import { Autocomplete, type AutocompleteSearchFn } from '@masmarino/gabarit'
import { docsLabels } from '../docs-labels'
import { type DocsSearchHit, DocsSearchService } from '../docs-search.service'

/** The search field above the documentation's navigation. Pages load on first focus, since most visits never search. */
@Component({
  selector: 'gbt-docs-search',
  standalone: true,
  imports: [Autocomplete],
  templateUrl: './docs-search.html',
  styleUrl: './docs-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsSearch {
  /** Emitted once a result is opened, so a folded navigation can close. */
  opened = output<DocsSearchHit>()

  private readonly searchService = inject(DocsSearchService)
  private readonly router = inject(Router)
  private readonly field = viewChild.required(Autocomplete)
  protected readonly labels = docsLabels()

  protected readonly search: AutocompleteSearchFn<DocsSearchHit> = (query) =>
    this.searchService.search(query)
  protected readonly label = (hit: DocsSearchHit) => hit.pageTitle
  protected readonly announce = (count: number) => this.labels().results(count)

  protected prepare(): void {
    this.searchService.prepare()
  }

  protected open(hit: DocsSearchHit): void {
    // Empty the field, or it keeps the chosen title.
    this.field().writeValue(null)
    void this.router.navigate(hit.commands, { fragment: hit.fragment ?? undefined })
    this.opened.emit(hit)
  }
}
