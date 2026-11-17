import { NgTemplateOutlet } from '@angular/common'
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  input,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'
import { CardLink } from './card-link'

/**
 * `elevated`: a shadow. `bordered` (4.0; `outlined`, its name in 3.x, is kept): a quiet 1px edge. `glass` (4.0): the
 * regular content glass of the apps, for a page laid on a ground (`--gbt-ground`): translucent, blurred, a rim of
 * light and a soft shadow, no edge.
 */
export type CardVariant = 'elevated' | 'bordered' | 'outlined' | 'glass'
export type CardTone = 'default' | 'success' | 'warning' | 'error'

const TONE_ICONS: Record<Exclude<CardTone, 'default'>, string> = {
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert-circle',
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[card-header]',
  standalone: true,
})
export class CardHeader {}

@Component({
  selector: 'gbt-card',
  standalone: true,
  imports: [Icon, NgTemplateOutlet, CardLink],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  hoverable = input(false, { transform: booleanAttribute })
  heading = input<string>('')
  icon = input<string>('')
  headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2)

  variant = input<CardVariant>('elevated')
  description = input<string>('')
  count = input<number | null>(null)
  flush = input(false, { transform: booleanAttribute })
  tone = input<CardTone>('default')
  selected = input(false, { transform: booleanAttribute })
  /** A form's card: its fields lose their own frame, the card is theirs, and its rows are split by a fine line. */
  form = input(false, { transform: booleanAttribute })
  selectedLabel = input<string>('Selected')

  href = input<string | null>(null)
  linkLabel = input<string | null>(null)

  private readonly customHeader = contentChild(CardHeader)
  private readonly projectedLink = contentChild(CardLink)

  protected readonly hasCustomHeader = computed(() => !!this.customHeader())
  protected readonly hasHeader = computed(() => !!this.heading() || this.hasCustomHeader())
  protected readonly linked = computed(() => !!this.href() || !!this.projectedLink())
  protected readonly headerIcon = computed(() => {
    const tone = this.tone()
    return this.icon() || (tone === 'default' ? '' : TONE_ICONS[tone])
  })

  /** The box's look: `bordered` draws as `outlined` (one rule for both names). */
  protected readonly boxVariant = computed(() => {
    const variant = this.variant()
    return variant === 'elevated' ? null : variant === 'bordered' ? 'outlined' : variant
  })

  protected readonly cardClass = computed(
    () => 'gbt-card' + (this.hoverable() ? ' gbt-card--hoverable' : ''),
  )
}
