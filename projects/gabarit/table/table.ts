import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  output,
} from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'

export interface TableColumn<T> {
  key: string
  label: string
  format?: (row: T) => string
  cellTemplate?: TemplateRef<{ $implicit: T }>
}

const INTERACTIVE_TARGET_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
].join(', ')

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

  protected onRowClick(event: MouseEvent, row: T): void {
    if (!this.isInteractiveTarget(event)) {
      this.rowClick.emit(row)
    }
  }

  protected onRowKeydown(event: KeyboardEvent, row: T): void {
    if ((event.key === 'Enter' || event.key === ' ') && !this.isInteractiveTarget(event)) {
      event.preventDefault()
      this.rowClick.emit(row)
    }
  }

  private isInteractiveTarget(event: Event): boolean {
    return (event.target as HTMLElement).closest(INTERACTIVE_TARGET_SELECTOR) !== null
  }

  protected cellValue(row: T, column: TableColumn<T>): unknown {
    return column.format ? column.format(row) : (row as Record<string, unknown>)[column.key]
  }
}
