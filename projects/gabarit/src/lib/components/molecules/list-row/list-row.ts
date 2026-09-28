import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type ListRowTone = 'neutral' | 'success' | 'warning' | 'error' | 'info'

@Component({
  selector: 'gbt-list-row',
  standalone: true,
  templateUrl: './list-row.html',
  styleUrl: './list-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRow {
  tone = input<ListRowTone>('neutral')
}
