import { NgTemplateOutlet } from '@angular/common'
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

@Component({
  selector: 'gbt-card',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  hoverable = input(false, { transform: booleanAttribute })
  heading = input<string>('')
  icon = input<string>('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)

  protected readonly cardClass = computed(
    () => 'gbt-card' + (this.hoverable() ? ' gbt-card--hoverable' : ''),
  )
}
