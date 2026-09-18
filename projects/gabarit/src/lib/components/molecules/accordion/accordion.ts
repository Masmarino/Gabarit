import { ChangeDetectionStrategy, Component, contentChildren, effect, input, model } from '@angular/core'
import { AccordionItem } from '../accordion-item/accordion-item'

export type AccordionMode = 'single' | 'multiple'

let nextAccordionId = 0

@Component({
  selector: 'gbt-accordion',
  standalone: true,
  imports: [],
  template: `
    <div class="gbt-accordion">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Accordion {
  id = input<string>(`gbt-accordion-${++nextAccordionId}`)
  mode = input<AccordionMode>('single')
  expanded = model<number[]>([])

  protected readonly items = contentChildren(AccordionItem)

  constructor() {
    effect(() => {
      const items = this.items()
      const expanded = this.expanded()
      const groupId = this.id()
      items.forEach((item, i) => item.setState(i, expanded.includes(i), groupId))
    })
  }

  toggle(index: number): void {
    const current = this.expanded()
    if (this.mode() === 'single') {
      this.expanded.set(current.includes(index) ? [] : [index])
      return
    }
    this.expanded.set(
      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
    )
  }

  focusHeader(index: number): void {
    const items = this.items()
    const count = items.length
    if (count === 0) {
      return
    }
    const wrapped = ((index % count) + count) % count
    items[wrapped]?.focusHeader()
  }
}
