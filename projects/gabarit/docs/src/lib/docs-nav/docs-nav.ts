import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core'
import { RouterLink } from '@angular/router'
import { Button, Disclosure, NavTab, NavTabs } from '@masmarino/gabarit'
import { docsLabels } from '../docs-labels'
import { DocsSearch } from '../docs-search/docs-search'
import { type DocsIndex, DocsService, docsPageCommands } from '../docs.service'

let nextNavId = 0

/** The left column: search, then the sections and their pages, only the current one open. */
@Component({
  selector: 'gbt-docs-nav',
  standalone: true,
  imports: [RouterLink, Button, Disclosure, NavTab, NavTabs, DocsSearch],
  templateUrl: './docs-nav.html',
  styleUrl: './docs-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsNav {
  index = input.required<DocsIndex>()
  section = input<string | null>(null)
  page = input<string | null>(null)

  private readonly root = inject(DocsService).root
  protected readonly labels = docsLabels()
  protected readonly bodyId = `gbt-docs-nav-${++nextNavId}`
  protected readonly navOpen = signal(false)

  // What the reader opened or closed by hand; forgotten on moving to another section.
  private readonly toggled = linkedSignal<string | null, Record<string, boolean>>({
    source: this.section,
    computation: () => ({}),
  })

  protected readonly sections = computed(() =>
    this.index().sections.map((section) => {
      const current = section.slug === this.section()
      return {
        slug: section.slug,
        title: section.title,
        open: this.toggled()[section.slug] ?? current,
        pages: section.pages.map((page) => ({
          slug: page.slug,
          title: page.title,
          commands: docsPageCommands(this.root, section.slug, page.slug),
          current: current && page.slug === this.page(),
        })),
      }
    }),
  )

  protected setOpen(slug: string, open: boolean): void {
    this.toggled.update((toggled) => ({ ...toggled, [slug]: open }))
  }

  protected close(): void {
    this.navOpen.set(false)
  }
}
