import { ChangeDetectionStrategy, Component, TemplateRef, booleanAttribute, input, output } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'

export interface TableColumn<T> {
  key: string
  label: string
  format?: (row: T) => string
  cellTemplate?: TemplateRef<{ $implicit: T }>
}

@Component({
  selector: 'gbt-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table<T extends object> {
  data = input.required<T[]>()
  columns = input.required<TableColumn<T>[]>()
  trackBy = input<((row: T) => unknown) | null>(null)
  emptyMessage = input<string>('No data')
  caption = input.required<string>()
  clickableRows = input(false, { transform: booleanAttribute })

  rowClick = output<T>()

  protected trackRow = (index: number, row: T): unknown => {
    const identify = this.trackBy()
    return identify ? identify(row) : index
  }

  protected onRowKeydown(event: KeyboardEvent, row: T): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.rowClick.emit(row)
    }
  }

  protected cellValue(row: T, column: TableColumn<T>): unknown {
    return column.format ? column.format(row) : (row as Record<string, unknown>)[column.key]
  }
}
