import { Component, TemplateRef, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Table, TableColumn } from './table'

interface Row {
  id: string
  name: string
}

@Component({
  standalone: true,
  imports: [Table],
  template: `
    <ng-template #actionsCell let-row>
      <button type="button" class="row-action" [attr.data-row-id]="row.id">
        Supprimer {{ row.name }}
      </button>
    </ng-template>
    <gbt-table caption="Utilisateurs" [data]="data" [columns]="columns()" />
  `,
})
class HostWithTemplateColumn {
  private readonly actionsCell = viewChild.required<TemplateRef<{ $implicit: Row }>>('actionsCell')
  data: Row[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ]

  columns(): TableColumn<Row>[] {
    return [
      { key: 'name', label: 'Nom' },
      { key: 'actions', label: 'Actions', cellTemplate: this.actionsCell() },
    ]
  }
}

@Component({
  standalone: true,
  imports: [Table],
  template: `
    <ng-template #actionsCell let-row>
      <button type="button" class="row-action" [attr.data-row-id]="row.id">
        Supprimer {{ row.name }}
      </button>
    </ng-template>
    <gbt-table
      caption="Utilisateurs"
      [data]="data"
      [columns]="columns()"
      [clickableRows]="true"
      (rowClick)="rowClick($event)"
    />
  `,
})
class HostWithClickableRowsAndTemplateColumn {
  private readonly actionsCell = viewChild.required<TemplateRef<{ $implicit: Row }>>('actionsCell')
  data: Row[] = [{ id: '1', name: 'Alice' }]
  clicked: Row[] = []

  rowClick(row: Row): void {
    this.clicked.push(row)
  }

  columns(): TableColumn<Row>[] {
    return [
      { key: 'name', label: 'Nom' },
      { key: 'actions', label: 'Actions', cellTemplate: this.actionsCell() },
    ]
  }
}

@Component({
  standalone: true,
  imports: [Table],
  template: `
    <ng-template #cell>
      <details>
        <summary class="row-summary">Details</summary>
      </details>
      <div class="row-editable" contenteditable="true">Edit me</div>
      <span class="row-aria-checkbox" role="checkbox" aria-checked="false" tabindex="0"
        >Toggle</span
      >
      <label class="row-label"><input type="checkbox" /> Select</label>
    </ng-template>
    <gbt-table
      caption="Utilisateurs"
      [data]="data"
      [columns]="columns()"
      [clickableRows]="true"
      (rowClick)="rowClick($event)"
    />
  `,
})
class HostWithClickableRowsAndVariousInteractiveContent {
  private readonly cell = viewChild.required<TemplateRef<{ $implicit: Row }>>('cell')
  data: Row[] = [{ id: '1', name: 'Alice' }]
  clicked: Row[] = []

  rowClick(row: Row): void {
    this.clicked.push(row)
  }

  columns(): TableColumn<Row>[] {
    return [{ key: 'content', label: 'Contenu', cellTemplate: this.cell() }]
  }
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

  it('renders a cellTemplate column with the row projected as its context, once per row', () => {
    const fixture = TestBed.createComponent(HostWithTemplateColumn)
    fixture.detectChanges()

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.row-action'),
    )
    expect(buttons.length).toBe(2)
    expect(buttons[0].dataset['rowId']).toBe('1')
    expect(buttons[0].textContent?.trim()).toBe('Supprimer Alice')
    expect(buttons[1].dataset['rowId']).toBe('2')
    expect(buttons[1].textContent?.trim()).toBe('Supprimer Bob')
  })

  it('still renders a plain-text column normally alongside a cellTemplate column', () => {
    const fixture = TestBed.createComponent(HostWithTemplateColumn)
    fixture.detectChanges()

    const rows = fixture.nativeElement.querySelectorAll('tbody tr')
    expect(rows[0].textContent).toContain('Alice')
    expect(rows[1].textContent).toContain('Bob')
  })

  it('presents no accessibility violation with a cellTemplate column', async () => {
    const fixture = TestBed.createComponent(HostWithTemplateColumn)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  describe('a nested interactive cellTemplate control inside a clickable row', () => {
    function setup() {
      const fixture = TestBed.createComponent(HostWithClickableRowsAndTemplateColumn)
      fixture.detectChanges()
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('.row-action')
      return { fixture, button }
    }

    it("doesn't also fire rowClick when the nested button is clicked", () => {
      const { fixture, button } = setup()
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
    })

    it("doesn't fire rowClick, and doesn't suppress the button's own activation, on Space over the nested button", () => {
      const { fixture, button } = setup()
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      button.dispatchEvent(event)
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
      expect(event.defaultPrevented).toBe(false)
    })

    it('still fires rowClick for a click or Enter on a plain cell of the same row', () => {
      const { fixture } = setup()
      const row: HTMLElement = fixture.nativeElement.querySelector('tbody tr')
      const plainCell = row.querySelector('td')!
      plainCell.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()
      row.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([
        { id: '1', name: 'Alice' },
        { id: '1', name: 'Alice' },
      ])
    })
  })

  describe('other kinds of interactive content inside a clickable row', () => {
    function setup() {
      const fixture = TestBed.createComponent(HostWithClickableRowsAndVariousInteractiveContent)
      fixture.detectChanges()
      return { fixture, el: fixture.nativeElement as HTMLElement }
    }

    it("doesn't fire rowClick when a <summary> is clicked", () => {
      const { fixture, el } = setup()
      el.querySelector('.row-summary')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
    })

    it("doesn't fire rowClick when a contenteditable region is clicked", () => {
      const { fixture, el } = setup()
      el.querySelector('.row-editable')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
    })

    it('doesn\'t fire rowClick when an ARIA widget role other than "button" is clicked', () => {
      const { fixture, el } = setup()
      el.querySelector('.row-aria-checkbox')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
    })

    it("doesn't fire rowClick when the <label> text of a checkbox is clicked (not the input itself)", () => {
      const { fixture, el } = setup()
      el.querySelector('.row-label')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()

      expect(fixture.componentInstance.clicked).toEqual([])
    })
  })
})
