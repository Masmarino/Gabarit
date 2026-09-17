import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { ListToolbar, ListToolbarSortOption } from './list-toolbar'

const SORT_OPTIONS: ListToolbarSortOption<'name' | 'date'>[] = [
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date' },
]

@Component({
  standalone: true,
  imports: [ListToolbar],
  template: `
    <gbt-list-toolbar
      searchLabel="Rechercher"
      [searchValue]="search"
      [sortOptions]="sortOptions"
      [sortValue]="sort"
      [sortDirection]="direction"
      (searchValueChange)="search = $event"
      (sortValueChange)="onSortValueChange($event)"
      (sortDirectionChange)="direction = $event"
    />
  `,
})
class HostComponent {
  search = ''
  sort: 'name' | 'date' = 'name'
  direction: 'asc' | 'desc' = 'asc'
  sortOptions = SORT_OPTIONS
  sortChangeCount = 0

  onSortValueChange(value: 'name' | 'date'): void {
    this.sortChangeCount++
    this.sort = value
  }
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('ListToolbar', () => {
  it('emits searchValueChange as the search input changes', () => {
    const fixture = setup()
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]')
    input.value = 'gabarit'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    expect(fixture.componentInstance.search).toBe('gabarit')
  })

  it('renders the sort options in the select', () => {
    const fixture = setup()
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Nom')
  })

  it('emits sortValueChange when a different sort option is selected', () => {
    const fixture = setup()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()
    const options: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.gbt-select__option'))
    const dateOption = options.find((o) => o.textContent?.trim() === 'Date')
    dateOption!.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.sort).toBe('date')
  })

  it('does not emit sortValueChange when re-selecting the already-selected sort option', () => {
    const fixture = setup()
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-select__trigger')
    trigger.click()
    fixture.detectChanges()
    const options: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.gbt-select__option'))
    const nameOption = options.find((o) => o.textContent?.trim() === 'Nom')
    nameOption!.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.sortChangeCount).toBe(0)
  })

  it('shows the arrow-up icon in ascending direction', () => {
    const fixture = setup()
    const icon = fixture.debugElement.query(By.css('.gbt-list-toolbar__direction gbt-icon'))
    expect(icon.componentInstance.name()).toBe('arrow-up')
  })

  it('emits sortDirectionChange with the flipped direction when the direction button is clicked', () => {
    const fixture = setup()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-list-toolbar__direction')
    button.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.direction).toBe('desc')

    const icon = fixture.debugElement.query(By.css('.gbt-list-toolbar__direction gbt-icon'))
    expect(icon.componentInstance.name()).toBe('arrow-down')
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
