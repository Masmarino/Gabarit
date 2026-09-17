import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { GbtInput } from '../../atoms/input/input'
import { Select, SelectOption } from '../select/select'
import { Icon } from '../../atoms/icon/icon'

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

  // Plain `[ngModel]` bindings on the child `gbt-input`/`gbt-select` defer their
  // initial value to a control-value-accessor writeValue() call scheduled on a
  // microtask (an Angular Forms `NgModel` implementation detail), so the very
  // first render would briefly show the empty/placeholder state. Reactive
  // FormControls propagate `setValue()` to the CVA synchronously, so we mirror
  // the inputs onto internal controls instead and forward user edits back out.
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
