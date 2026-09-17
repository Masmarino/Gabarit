import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type EmptyStateIllustration = 'folder' | 'star' | 'checklist' | 'merge' | 'pipeline' | 'tag' | 'book'

@Component({
  selector: 'gbt-empty-state',
  standalone: true,
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  illustration = input.required<EmptyStateIllustration>()
  heading = input.required<string>()
  message = input<string>('')
}
