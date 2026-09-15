import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Observable } from 'rxjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Autocomplete, AutocompleteSearchFn } from './autocomplete'

interface User {
  id: string
  name: string
}

const ADA: User = { id: '1', name: 'Ada Lovelace' }
const ALAN: User = { id: '2', name: 'Alan Turing' }

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Autocomplete],
  template: `
    <form [formGroup]="form">
      <gbt-autocomplete
        label="Utilisateur"
        [search]="search"
        [displayFn]="displayFn"
        [minLength]="minLength"
        formControlName="user"
      />
    </form>
  `,
})
class AutocompleteHost {
  search: AutocompleteSearchFn<User> = () => Promise.resolve([])
  displayFn = (u: User) => u.name
  minLength = 1
  form = new FormGroup({ user: new FormControl<User | null>(null) })
}

function setup(searchImpl?: AutocompleteSearchFn<User>) {
  const fixture = TestBed.createComponent(AutocompleteHost)
  if (searchImpl) {
    fixture.componentInstance.search = searchImpl
  }
  fixture.detectChanges()
  return fixture
}

const input = (f: ReturnType<typeof setup>): HTMLInputElement =>
  f.nativeElement.querySelector('.gbt-autocomplete__input')

const panel = (f: ReturnType<typeof setup>): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-autocomplete__panel')

const options = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-autocomplete__option'),
]

function type(f: ReturnType<typeof setup>, value: string): void {
  const el = input(f)
  el.value = value
  el.dispatchEvent(new Event('input'))
  f.detectChanges()
}

describe('Autocomplete', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not search below minLength', async () => {
    vi.useFakeTimers()
    const search = vi.fn(() => Promise.resolve([ADA]))

    @Component({
      standalone: true,
      imports: [Autocomplete],
      template: `<gbt-autocomplete [search]="search" [minLength]="2" />`,
    })
    class MinLengthHost {
      search = search
    }

    const fixture = TestBed.createComponent(MinLengthHost)
    fixture.detectChanges()
    const el: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-autocomplete__input')
    el.value = 'a'
    el.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    await vi.advanceTimersByTimeAsync(1000)
    fixture.detectChanges()

    expect(search).not.toHaveBeenCalled()
    expect(fixture.nativeElement.querySelector('.gbt-autocomplete__panel')).toBeNull()
  })

  it('debounces the search, firing once after rapid typing', async () => {
    vi.useFakeTimers()
    const search = vi.fn(() => Promise.resolve([ADA]))
    const fixture = setup(search)

    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(100)
    type(fixture, 'ad')
    await vi.advanceTimersByTimeAsync(100)
    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith('ada')
  })

  it('shows a loading state while the search is pending', async () => {
    vi.useFakeTimers()
    let resolve!: (items: User[]) => void
    const search = vi.fn(() => new Promise<User[]>((r) => (resolve = r)))
    const fixture = setup(search)

    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(panel(fixture)?.textContent).toContain('Searching…')

    resolve([ADA])
    await vi.advanceTimersByTimeAsync(0)
    fixture.detectChanges()

    expect(panel(fixture)?.textContent).not.toContain('Searching…')
  })

  it('renders results in a listbox with the right ARIA wiring', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA, ALAN]))
    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    const el = input(fixture)
    expect(el.getAttribute('role')).toBe('combobox')
    expect(el.getAttribute('aria-expanded')).toBe('true')
    const listbox: HTMLElement = fixture.nativeElement.querySelector('[role="listbox"]')
    expect(el.getAttribute('aria-controls')).toBe(listbox.id)
    expect(el.getAttribute('aria-activedescendant')).toBe(`${el.id}-option-0`)

    const opts = options(fixture)
    expect(opts.map((o) => o.textContent?.trim())).toEqual(['Ada Lovelace', 'Alan Turing'])
    expect(opts[0].getAttribute('role')).toBe('option')
    expect(opts[0].getAttribute('aria-selected')).toBe('true')
  })

  it('shows a no-results state when the search resolves empty', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([]))
    type(fixture, 'zzz')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(panel(fixture)?.textContent).toContain('No results')
  })

  it('shows an error state when the search rejects', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.reject(new Error('boom')))
    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(panel(fixture)?.textContent).toContain('Search failed')
    expect(fixture.nativeElement.querySelector('.gbt-autocomplete__state--error')).not.toBeNull()
  })

  it('supports an Observable-returning search function', async () => {
    vi.useFakeTimers()
    const search = () =>
      new Observable<User[]>((subscriber) => {
        subscriber.next([ADA])
        subscriber.complete()
      })
    const fixture = setup(search)
    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(options(fixture).map((o) => o.textContent?.trim())).toEqual(['Ada Lovelace'])
  })

  it('ignores a stale response that resolves after a more recent one', async () => {
    vi.useFakeTimers()
    const resolvers: Array<(items: User[]) => void> = []
    const search = vi.fn(() => new Promise<User[]>((r) => resolvers.push(r)))
    const fixture = setup(search)

    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(300)
    type(fixture, 'al')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    expect(resolvers).toHaveLength(2)
    // second (more recent) query resolves first, then the stale first one
    resolvers[1]([ALAN])
    await vi.advanceTimersByTimeAsync(0)
    resolvers[0]([ADA])
    await vi.advanceTimersByTimeAsync(0)
    fixture.detectChanges()

    expect(options(fixture).map((o) => o.textContent?.trim())).toEqual(['Alan Turing'])
  })

  it('selects an option on click: updates the form value, the input text, and closes the panel', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA, ALAN]))
    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    options(fixture)[1].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.user.value).toEqual(ALAN)
    expect(input(fixture).value).toBe('Alan Turing')
    expect(panel(fixture)).toBeNull()
  })

  it('emits itemSelected when an option is chosen', async () => {
    vi.useFakeTimers()
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, Autocomplete],
      template: `
        <gbt-autocomplete
          [search]="search"
          [displayFn]="displayFn"
          (itemSelected)="selected = $event"
        />
      `,
    })
    class EmitHost {
      search = () => Promise.resolve([ADA])
      displayFn = (u: User) => u.name
      selected: User | null = null
    }

    const fixture = TestBed.createComponent(EmitHost)
    fixture.detectChanges()
    const el: HTMLInputElement = fixture.nativeElement.querySelector('.gbt-autocomplete__input')
    el.value = 'ada'
    el.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-autocomplete__option').click()
    fixture.detectChanges()

    expect(fixture.componentInstance.selected).toEqual(ADA)
  })

  it('clears the form value as soon as the user edits away from a selection', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA]))
    fixture.componentInstance.form.controls.user.setValue(ADA)
    fixture.detectChanges()
    expect(input(fixture).value).toBe('Ada Lovelace')

    type(fixture, 'Ada Lovelace!')

    expect(fixture.componentInstance.form.controls.user.value).toBeNull()
  })

  it('navigates results with the keyboard and selects with Enter', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA, ALAN]))
    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()

    const el = input(fixture)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    fixture.detectChanges()
    expect(options(fixture)[1].classList).toContain('gbt-autocomplete__option--active')

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    fixture.detectChanges()

    expect(fixture.componentInstance.form.controls.user.value).toEqual(ALAN)
  })

  it('closes the panel on Escape without clearing the query', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA]))
    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()
    expect(panel(fixture)).not.toBeNull()

    input(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
    expect(input(fixture).value).toBe('ada')
  })

  it('closes the panel on blur, once focus leaves the component', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA]))
    type(fixture, 'ada')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()
    expect(panel(fixture)).not.toBeNull()

    input(fixture).dispatchEvent(new Event('blur'))
    await vi.advanceTimersByTimeAsync(200)
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('reflects the disabled state on the input', () => {
    const fixture = setup()
    fixture.componentInstance.form.controls.user.disable()
    fixture.detectChanges()

    expect(input(fixture).disabled).toBe(true)
  })

  it('has no a11y violations, panel closed', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, panel open with results', async () => {
    vi.useFakeTimers()
    const fixture = setup(() => Promise.resolve([ADA, ALAN]))
    type(fixture, 'a')
    await vi.advanceTimersByTimeAsync(300)
    fixture.detectChanges()
    vi.useRealTimers()

    await expectNoA11yViolations(fixture.nativeElement)
  })
})
