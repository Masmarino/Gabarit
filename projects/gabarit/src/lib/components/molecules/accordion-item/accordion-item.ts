import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'
import { Accordion } from '../accordion/accordion'

@Component({
  selector: 'gbt-accordion-item',
  standalone: true,
  imports: [Icon],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionItem {
  private readonly parent = inject(Accordion)
  private readonly header = viewChild<ElementRef<HTMLButtonElement>>('header')

  label = input.required<string>()

  protected readonly active = signal(false)
  protected readonly index = signal(0)
  protected readonly groupId = signal('')

  protected readonly headerId = computed(() => `${this.groupId()}-header-${this.index()}`)
  protected readonly panelId = computed(() => `${this.groupId()}-panel-${this.index()}`)

  setState(index: number, active: boolean, groupId: string): void {
    this.index.set(index)
    this.active.set(active)
    this.groupId.set(groupId)
  }

  focusHeader(): void {
    this.header()?.nativeElement.focus()
  }

  protected toggle(): void {
    this.parent.toggle(this.index())
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.parent.focusHeader(this.index() + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.parent.focusHeader(this.index() - 1)
    }
  }
}
