import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Table } from './table'

interface Row {
  id: string
  name: string
}

describe('Table', () => {
  it('renders one row per data item with the configured columns', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()

    const rows = fixture.nativeElement.querySelectorAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[0].textContent).toContain('Alice')
    expect(rows[1].textContent).toContain('Bob')
  })

  it('emits rowClick on click when rows are interactive', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    const row = { id: '1', name: 'Alice' }
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [row])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('clickableRows', true)
    let clicked: Row | null = null
    fixture.componentInstance.rowClick.subscribe((r: Row) => (clicked = r))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('tbody tr').click()

    expect(clicked).toEqual(row)
  })

  it('does not emit rowClick on click when rows are not interactive', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [{ id: '1', name: 'Alice' }])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    let clicked: Row | null = null
    fixture.componentInstance.rowClick.subscribe((r: Row) => (clicked = r))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('tbody tr').click()

    expect(clicked).toBeNull()
  })

  it('shows an empty-state row when there is no data', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('No data')
  })

  it('shows the provided empty-state message', () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('emptyMessage', 'Rien à afficher')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Rien à afficher')
  })

  it('shows an English default empty-state message', () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('No data')
  })

  it('renders the caption element with the provided title', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    fixture.componentRef.setInput('caption', 'Liste des utilisateurs')
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()

    const caption = fixture.nativeElement.querySelector('table > caption')
    expect(caption).not.toBeNull()
    expect(caption.textContent?.trim()).toBe('Liste des utilisateurs')
  })

  it('associates a caption with the table when a title is provided', () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('caption', 'Liste des dépôts')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('table > caption')?.textContent).toContain(
      'Liste des dépôts',
    )
  })

  it('makes rows keyboard-activatable when they are interactive', () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('caption', 'Dépôts')
    fixture.componentRef.setInput('data', [{ name: 'gabarit' }])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('clickableRows', true)
    let emitted: unknown = null
    fixture.componentInstance.rowClick.subscribe((row: unknown) => (emitted = row))
    fixture.detectChanges()

    const row = fixture.nativeElement.querySelector('tbody tr')
    expect(row.getAttribute('tabindex')).toBe('0')
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(emitted).toEqual({ name: 'gabarit' })
  })

  it('does not make rows focusable when they are not interactive', () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('caption', 'Dépôts')
    fixture.componentRef.setInput('data', [{ name: 'gabarit' }])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('tbody tr').getAttribute('tabindex')).toBeNull()
  })

  it('never sets role="button" on a row — ARIA 1.2 makes it Children Presentational, which would erase the row/cell/th-scope association for every interactive row', () => {
    const fixture = TestBed.createComponent(Table<Row>)
    fixture.componentRef.setInput('caption', 'Utilisateurs')
    fixture.componentRef.setInput('data', [{ id: '1', name: 'Alice' }])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('tbody tr').getAttribute('role')).toBeNull()

    fixture.componentRef.setInput('clickableRows', true)
    fixture.detectChanges()
    const row: HTMLElement = fixture.nativeElement.querySelector('tbody tr')
    expect(row.getAttribute('role')).toBeNull()
    expect(row.getAttribute('tabindex')).toBe('0')
    expect(row.classList.contains('gbt-table__row--clickable')).toBe(true)
  })

  it('presents no accessibility violation, empty', async () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('data', [])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('caption', 'Dépôts')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, populated', async () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('data', [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('caption', 'Dépôts')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation, interactive rows', async () => {
    const fixture = TestBed.createComponent(Table)
    fixture.componentRef.setInput('data', [{ id: '1', name: 'Alice' }])
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nom' }])
    fixture.componentRef.setInput('caption', 'Dépôts')
    fixture.componentRef.setInput('clickableRows', true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
