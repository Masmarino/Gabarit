import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core'

export type PageHeaderLevel = 1 | 2 | 3

@Component({
  selector: 'gbt-page-header',
  standalone: true,
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  heading = input.required<string>()
  headingLevel = input<PageHeaderLevel>(1)
  /** The line under the header, as before the ground (4.0 draws none: the page's glass sets it apart). */
  separated = input(false, { transform: booleanAttribute })
}
