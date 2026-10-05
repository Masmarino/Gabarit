import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { GbtInput } from '@masmarino/gabarit/input'
import { Select, SelectOption } from '@masmarino/gabarit/select'
import { Icon } from '@masmarino/gabarit/icon'

export interface ListToolbarSortOption<T extends string = string> {
  value: T
  label: string
}

@Component({
  selector: 'gbt-list-toolbar',
  standalone: true,
  imports: [ReactiveFormsModule, GbtInput, Select, Icon],
  templateUrl: './list-toolbar.html',
  styleUrl: './list-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbar<T extends string = string> {
  searchValue = input<string>('')
  searchLabel = input.required<string>()
  searchPlaceholder = input<string>('')
  sortOptions = input.required<ListToolbarSortOption<T>[]>()
  sortValue = input.required<T>()
  sortDirection = input<'asc' | 'desc'>('asc')
  sortLabel = input<string>('Sort by')
  directionLabel = input<string>('Reverse sort direction')

  searchValueChange = output<string>()
  sortValueChange = output<T>()
  sortDirectionChange = output<'asc' | 'desc'>()

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true })
  protected readonly sortControl = new FormControl<T | null>(null)

  constructor() {
    effect(() => this.searchControl.setValue(this.searchValue(), { emitEvent: false }))
    effect(() => this.sortControl.setValue(this.sortValue(), { emitEvent: false }))

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.searchValueChange.emit(value))

    this.sortControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value !== null && value !== this.sortValue()) {
        this.sortValueChange.emit(value)
      }
    })
  }

  protected asSelectOptions(options: ListToolbarSortOption<T>[]): SelectOption<T>[] {
    return options
  }

  protected toggleDirection(): void {
    this.sortDirectionChange.emit(this.sortDirection() === 'asc' ? 'desc' : 'asc')
  }
}
