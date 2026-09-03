import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  selector: 'gbt-chart-table',
  standalone: true,
  imports: [],
  templateUrl: './chart-table.html',
  styleUrl: './chart-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartTable {
  caption = input.required<string>()
  columns = input.required<string[]>()
  rows = input.required<(string | number)[][]>()
}
