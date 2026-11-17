import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core'
import { Tab } from './tab/tab'

let nextTabsId = 0

/** Where the lens sits, in the list's box (px). */
interface LensBox {
  x: number
  y: number
  width: number
  height: number
}

@Component({
  selector: 'gbt-tabs',
  standalone: true,
  imports: [],
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tabs {
  id = input<string>(`gbt-tabs-${++nextTabsId}`)

  protected readonly tabs = contentChildren(Tab)
  private readonly triggers = viewChildren<ElementRef<HTMLButtonElement>>('trigger')
  private readonly list = viewChild<ElementRef<HTMLElement>>('list')

  activeIndex = model(0)

  /** The lens of liquid glass under the open tab (4.1): measured once the tabs are laid out, null before (the open
   * tab then shows its own ground). */
  protected readonly lens = signal<LensBox | null>(null)
  /** The lens glides only once it has a place. */
  protected readonly lensGlides = signal(false)

  constructor() {
    const layout = signal(0)
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => layout.update((n) => n + 1))
      afterRenderEffect(() => {
        const list = this.list()?.nativeElement
        if (list) {
          observer.disconnect()
          observer.observe(list)
        }
      })
      inject(DestroyRef).onDestroy(() => observer.disconnect())
    }
    afterRenderEffect({
      read: () => {
        layout()
        this.activeIndex()
        this.tabs()
        this.place()
      },
    })

    effect(() => {
      const tabs = this.tabs()
      const active = this.activeIndex()
      const groupId = this.id()
      tabs.forEach((tab, i) => tab.setState(i, i === active, groupId))
    })

    effect(() => {
      const count = this.tabs().length
      if (count === 0) {
        return
      }
      const current = this.activeIndex()
      const clamped = Math.min(Math.max(current, 0), count - 1)
      if (clamped !== current) {
        this.activeIndex.set(clamped)
      }
    })
  }

  private place(): void {
    const open = this.triggers()[this.activeIndex()]?.nativeElement
    if (!open || open.offsetWidth === 0) {
      this.lens.set(null)
      return
    }
    const box = {
      x: open.offsetLeft,
      y: open.offsetTop,
      width: open.offsetWidth,
      height: open.offsetHeight,
    }
    const current = this.lens()
    if (
      current &&
      current.x === box.x &&
      current.y === box.y &&
      current.width === box.width &&
      current.height === box.height
    ) {
      return
    }
    const first = current === null
    this.lens.set(box)
    if (first && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.lensGlides.set(true))
    }
  }

  protected select(index: number): void {
    this.activeIndex.set(index)
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length
    if (count === 0) {
      return
    }
    let next: number | null = null
    if (event.key === 'ArrowRight') {
      next = (index + 1) % count
    } else if (event.key === 'ArrowLeft') {
      next = (index - 1 + count) % count
    }
    if (next === null) {
      return
    }
    event.preventDefault()
    this.select(next)
    this.triggers()[next]?.nativeElement.focus()
  }
}
