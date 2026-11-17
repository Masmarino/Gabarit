import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  contentChildren,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core'
import { NavTab } from './nav-tab'
import { GBT_NAV_TABS, type NavTabsOrientation } from './nav-tabs.token'

export type { NavTabsOrientation } from './nav-tabs.token'

@Component({
  selector: 'gbt-nav-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './nav-tabs.html',
  styleUrl: './nav-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: GBT_NAV_TABS, useExisting: NavTabs }],
})
export class NavTabs {
  ariaLabel = input<string>('')
  orientation = input<NavTabsOrientation>('horizontal')
  landmark = input(true, { transform: booleanAttribute })

  private readonly list = viewChild<ElementRef<HTMLElement>>('list')
  private readonly tabs = contentChildren(NavTab, { descendants: true })

  protected readonly hiddenBefore = signal(false)
  protected readonly hiddenAfter = signal(false)

  protected updateOverflow(): void {
    const list = this.list()?.nativeElement
    if (!list) return
    const hidden = list.scrollWidth - list.clientWidth
    this.hiddenBefore.set(hidden > 1 && list.scrollLeft > 1)
    this.hiddenAfter.set(hidden > 1 && list.scrollLeft < hidden - 1)
  }

  constructor() {
    afterRenderEffect({
      write: () => {
        this.tabs().forEach((tab) => tab.active())
        const list = this.list()?.nativeElement
        if (!list) return
        const active = list.querySelector<HTMLElement>('[aria-current="page"]')
        if (active && list.scrollWidth > list.clientWidth) {
          const start = active.offsetLeft
          const end = start + active.offsetWidth
          const glimpse = 40
          if (start - glimpse < list.scrollLeft) {
            list.scrollLeft = Math.max(0, start - glimpse)
          } else if (end + glimpse > list.scrollLeft + list.clientWidth) {
            list.scrollLeft = end + glimpse - list.clientWidth
          }
        }
        this.updateOverflow()
      },
    })

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => this.updateOverflow())
      const observed = new Set<Element>()
      afterRenderEffect({
        write: () => {
          this.tabs()
          const list = this.list()?.nativeElement
          if (!list) return
          const wanted = new Set<Element>([list, ...Array.from(list.children)])
          for (const element of observed) {
            if (!wanted.has(element)) {
              observer.unobserve(element)
              observed.delete(element)
            }
          }
          for (const element of wanted) {
            if (!observed.has(element)) {
              observer.observe(element)
              observed.add(element)
            }
          }
        },
      })
      inject(DestroyRef).onDestroy(() => observer.disconnect())
    }
  }
}
