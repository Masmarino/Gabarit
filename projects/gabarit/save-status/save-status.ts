import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

export type SaveStatusState = 'idle' | 'saving' | 'saved' | 'error'

@Component({
  selector: 'gbt-save-status',
  standalone: true,
  imports: [Icon],
  templateUrl: './save-status.html',
  styleUrl: './save-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveStatus {
  state = input<SaveStatusState>('idle')
  savingLabel = input('Saving…')
  savedLabel = input('Saved')
  errorLabel = input('Not saved')
  message = input<string | null>(null)

  protected readonly text = computed(() => {
    switch (this.state()) {
      case 'saving':
        return this.message() ?? this.savingLabel()
      case 'saved':
        return this.message() ?? this.savedLabel()
      case 'error':
        return this.message() ?? this.errorLabel()
      default:
        return ''
    }
  })
}
