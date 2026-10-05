import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Panel, type PanelHeadingLevel } from '@masmarino/gabarit'
import { docsLabels } from '../docs-labels'
import type { MarkdownOutlineEntry } from '../markdown-view/markdown-view'

/** An outline is worth a panel from two headings on: one heading is no table of contents. */
export function hasOutline(entries: readonly MarkdownOutlineEntry[]): boolean {
  return entries.length >= 2
}

/** "On this page" for rendered Markdown. The router doesn't scroll to anchors, so a click does it here. */
@Component({
  selector: 'gbt-markdown-outline',
  standalone: true,
  imports: [RouterLink, Panel],
  templateUrl: './markdown-outline.html',
  styleUrl: './markdown-outline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownOutline {
  entries = input.required<MarkdownOutlineEntry[]>()
  headingLevel = input<PanelHeadingLevel>(2)

  protected readonly labels = docsLabels()
  protected readonly here: readonly string[] = []

  protected goTo(id: string): void {
    const heading = document.getElementById(id)
    if (!heading) {
      return
    }
    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    // Headings aren't focusable: -1 lets the next Tab continue from the section just reached.
    heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }
}
