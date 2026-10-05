import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'
import { GBT_NAV_TABS } from './nav-tabs.token'

@Component({
  selector: 'a[gbtNavTab]',
  standalone: true,
  imports: [Icon],
  templateUrl: './nav-tab.html',
  styleUrl: './nav-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gbt-nav-tab',
    '[attr.aria-current]': 'active() ? "page" : null',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class NavTab {
  active = input(false, { transform: booleanAttribute })
  icon = input<string | null>(null)
  badge = input<number | string | null>(null)

  private readonly nav = inject(GBT_NAV_TABS, { optional: true })
  private readonly label = viewChild<ElementRef<HTMLElement>>('label')

  protected readonly orientation = computed(() => this.nav?.orientation() ?? 'horizontal')

  protected readonly hasBadge = computed(() => {
    const badge = this.badge()
    return badge !== null && badge !== undefined && badge !== ''
  })

  constructor() {
    afterEveryRender({
      write: () => {
        const label = this.label()?.nativeElement
        const text = label?.textContent?.trim() ?? ''
        if (label && label.getAttribute('data-label') !== text) {
          label.setAttribute('data-label', text)
        }
      },
    })
  }
}
