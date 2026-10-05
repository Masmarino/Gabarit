import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { Icon } from '@masmarino/gabarit/icon'

export type EmptyStateIllustration =
  'folder' | 'star' | 'checklist' | 'merge' | 'pipeline' | 'tag' | 'book' | 'server'

export type EmptyStateSize = 'default' | 'compact'
export type EmptyStateTone = 'default' | 'error'
export type EmptyStateHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

@Component({
  selector: 'gbt-empty-state',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  illustration = input<EmptyStateIllustration | null | undefined>(null)
  heading = input.required<string>()
  message = input<string>('')

  icon = input<string | null>(null)
  size = input<EmptyStateSize>('default')
  tone = input<EmptyStateTone>('default')
  headingLevel = input<EmptyStateHeadingLevel | null>(null)
  headingId = input<string | null>(null)
  headingFocusable = input(false, { transform: booleanAttribute })

  private readonly headingEl = viewChild<ElementRef<HTMLElement>>('headingEl')

  focusHeading(): void {
    this.headingEl()?.nativeElement.focus()
  }
}
