import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  contentChildren,
  effect,
  input,
  model,
  viewChildren,
} from '@angular/core'
import { Tab } from '../tab/tab'

let nextTabsId = 0

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

  activeIndex = model(0)

  constructor() {
    effect(() => {
      const tabs = this.tabs()
      const active = this.activeIndex()
      const groupId = this.id()
      tabs.forEach((tab, i) => tab.setState(i, i === active, groupId))
    })

    // Self-heals an out-of-range `activeIndex` — e.g. a consumer binds it to
    // a URL query parameter and the stored value no longer matches any tab —
    // instead of leaving every panel hidden and every trigger out of the
    // keyboard tab order with no way to reach the component at all.
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
