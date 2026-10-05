import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'

@Component({
  selector: 'gbt-chart-empty',
  standalone: true,
  imports: [],
  templateUrl: './chart-empty.html',
  styleUrl: './chart-empty.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartEmpty {
  message = input.required<string>()
  actionLabel = input<string>('')

  action = output<void>()
}
