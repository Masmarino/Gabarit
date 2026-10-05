import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type SpinnerSize = 'sm' | 'md' | 'lg'

@Component({
  selector: 'gbt-spinner',
  standalone: true,
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.data-size]': 'size()',
  },
})
export class Spinner {
  size = input<SpinnerSize>('md')
  label = input<string>('Loading…')
}
