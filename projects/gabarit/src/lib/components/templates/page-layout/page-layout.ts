import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core'

export type PageLayoutWidth = 'narrow' | 'default' | 'wide' | 'full'
export type PageLayoutAsideWidth = 'sm' | 'md' | 'lg'
export type PageLayoutAsidePosition = 'start' | 'end'

@Component({
  selector: 'gbt-page-layout',
  standalone: true,
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-width]': 'width()',
    '[attr.data-aside-width]': 'asideWidth()',
    '[attr.data-aside-position]': 'asidePosition()',
    '[attr.data-sticky-nav]': "stickyNav() ? '' : null",
  },
})
export class PageLayout {
  width = input<PageLayoutWidth>('default')
  asideWidth = input<PageLayoutAsideWidth>('md')
  asidePosition = input<PageLayoutAsidePosition>('end')
  navLabel = input('Page navigation')
  asideLabel = input<string | null>(null)
  stickyNav = input(false, { transform: booleanAttribute })
}
