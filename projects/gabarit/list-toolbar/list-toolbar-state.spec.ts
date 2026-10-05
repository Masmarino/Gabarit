import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { ListToolbar } from './list-toolbar'
import { createListToolbarState } from './list-toolbar-state'

interface Repo {
  name: string
  description: string | null
  stars: number
  created: Date | null
}

const REPOS: Repo[] = [
  { name: 'runner 10', description: 'Job runner', stars: 3, created: new Date('2026-03-01') },
  { name: 'Alpha', description: null, stars: 12, created: new Date('2026-01-01') },
  { name: 'runner 2', description: 'The other runner', stars: 12, created: null },
  { name: 'beta', description: 'Alpha tooling', stars: 7, created: new Date('2026-02-01') },
]

const SORT_OPTIONS = [
  { value: 'name' as const, label: 'Name' },
  { value: 'stars' as const, label: 'Stars' },
  { value: 'created' as const, label: 'Created' },
]

const ACCESSORS = {
  text: (repo: Repo) => [repo.name, repo.description],
  sortBy: {
    name: (repo: Repo) => repo.name,
    stars: (repo: Repo) => repo.stars,
    created: (repo: Repo) => repo.created,
  },
}

const names = (repos: Repo[]) => repos.map((repo) => repo.name)

describe('createListToolbarState', () => {
  it('starts on the first sort option, ascending, with an empty search', () => {
    const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
    expect(state.search()).toBe('')
    expect(state.sortValue()).toBe('name')
    expect(state.direction()).toBe('asc')
    expect(state.sortOptions).toBe(SORT_OPTIONS)
    expect(state.dirty()).toBe(false)
  })

  it('honours defaultSort, defaultDirection and initialSearch', () => {
    const state = createListToolbarState({
      sortOptions: SORT_OPTIONS,
      defaultSort: 'stars',
      defaultDirection: 'desc',
      initialSearch: 'run',
    })
    expect(state.sortValue()).toBe('stars')
    expect(state.direction()).toBe('desc')
    expect(state.search()).toBe('run')
    expect(state.dirty()).toBe(false)
  })

  it('works with no configuration at all', () => {
    const state = createListToolbarState()
    expect(state.sortOptions).toEqual([])
    expect(state.sortValue()).toBe('')
    expect(state.apply([3, 1, 2], {})).toEqual([3, 1, 2])
  })

  describe('apply', () => {
    it('returns every item, sorted by the default field, without a search', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'Alpha',
        'beta',
        'runner 2',
        'runner 10',
      ])
    })

    it('never mutates the source array', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      const source = [...REPOS]
      state.apply(source, ACCESSORS)
      state.direction.set('desc')
      state.apply(source, ACCESSORS)
      expect(source).toEqual(REPOS)
    })

    it('filters case-insensitively on any of the texts, ignoring null ones and outer spaces', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      state.search.set('  ALPHA ')
      // "Alpha" by name, "beta" by description (Alpha tooling).
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual(['Alpha', 'beta'])
      state.search.set('zzz')
      expect(state.apply(REPOS, ACCESSORS)).toEqual([])
    })

    it('accepts a single string from text', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      state.search.set('beta')
      expect(names(state.apply(REPOS, { text: (repo) => repo.name }))).toEqual(['beta'])
    })

    it('lets `matches` decide, receiving a trimmed lower-case query', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      state.search.set(' RUNNER ')
      const seen: string[] = []
      const found = state.apply(REPOS, {
        ...ACCESSORS,
        matches: (repo, query) => {
          seen.push(query)
          return repo.name.startsWith(query)
        },
      })
      expect(names(found)).toEqual(['runner 2', 'runner 10'])
      expect(new Set(seen)).toEqual(new Set(['runner']))
    })

    it('sorts text with a numeric-aware, case-insensitive collator', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      state.search.set('runner')
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual(['runner 2', 'runner 10'])
    })

    it('sorts numbers, and dates, by the selected field', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS, defaultSort: 'stars' })
      expect(state.apply(REPOS, ACCESSORS).map((repo) => repo.stars)).toEqual([3, 7, 12, 12])
      state.sortValue.set('created')
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'Alpha',
        'beta',
        'runner 10',
        // No date: last when ascending.
        'runner 2',
      ])
    })

    it('desc reverses the ascending order', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      state.direction.set('desc')
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'runner 10',
        'runner 2',
        'beta',
        'Alpha',
      ])
    })

    it('keeps equal items in source order when ascending (stable sort)', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS, defaultSort: 'stars' })
      const asc = state.apply(REPOS, ACCESSORS)
      expect(names(asc.filter((repo) => repo.stars === 12))).toEqual(['Alpha', 'runner 2'])
    })

    it('keeps missing values last in both directions with sortBy', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS, defaultSort: 'created' })
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'Alpha',
        'beta',
        'runner 10',
        'runner 2',
      ])
      state.direction.set('desc')
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'runner 10',
        'beta',
        'Alpha',
        'runner 2',
      ])
    })

    it('keeps equal items in source order in both directions with sortBy', () => {
      const state = createListToolbarState({
        sortOptions: SORT_OPTIONS,
        defaultSort: 'stars',
        defaultDirection: 'desc',
      })
      expect(names(state.apply(REPOS, ACCESSORS))).toEqual([
        'Alpha',
        'runner 2',
        'beta',
        'runner 10',
      ])
    })

    it('sorts NaN, Infinity and invalid dates last, deterministically', () => {
      const state = createListToolbarState<'v'>({ sortOptions: [{ value: 'v', label: 'V' }] })
      const rows = [
        { id: 'inf', v: Infinity },
        { id: 'two', v: 2 },
        { id: 'nan', v: NaN },
        { id: 'one', v: 1 },
        { id: 'bad-date', v: new Date('nope') },
        { id: 'neg', v: -Infinity },
      ]
      const sortBy = { v: (row: (typeof rows)[number]) => row.v }
      const asc = state.apply(rows, { sortBy }).map((row) => row.id)
      expect(asc.slice(0, 2)).toEqual(['one', 'two'])
      expect(asc.slice(2)).toEqual(['inf', 'nan', 'bad-date', 'neg'])
      state.direction.set('desc')
      const desc = state.apply(rows, { sortBy }).map((row) => row.id)
      expect(desc.slice(0, 2)).toEqual(['two', 'one'])
      expect(desc.slice(2)).toEqual(['inf', 'nan', 'bad-date', 'neg'])
    })

    it('lets `compare` replace `sortBy`', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      const byLength = state.apply(REPOS, {
        text: ACCESSORS.text,
        compare: (a, b) => a.name.length - b.name.length,
      })
      expect(names(byLength)).toEqual(['beta', 'Alpha', 'runner 2', 'runner 10'])
    })

    it('with `compare`, desc reverses the ascending order (as FerrisGit did)', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS, defaultDirection: 'desc' })
      const found = state.apply(REPOS, { compare: (a, b) => a.stars - b.stars })
      expect(found.map((repo) => repo.stars)).toEqual([12, 12, 7, 3])
      // Equal stars come out in reverse source order, the original's behaviour.
      expect(names(found.filter((repo) => repo.stars === 12))).toEqual(['runner 2', 'Alpha'])
    })

    it('leaves the order alone for a field that has no accessor', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS, defaultSort: 'created' })
      expect(names(state.apply(REPOS, { text: ACCESSORS.text }))).toEqual(names(REPOS))
    })

    it('uses the locale of the accessors for the collator', () => {
      const state = createListToolbarState<'name'>({ sortOptions: [{ value: 'name', label: 'N' }] })
      const words = ['z', 'ä', 'a']
      const sortBy = { name: (word: string) => word }
      expect(state.apply(words, { sortBy, locale: 'de' })).toEqual(['a', 'ä', 'z'])
      expect(state.apply(words, { sortBy, locale: 'sv' })).toEqual(['a', 'z', 'ä'])
    })
  })

  describe('filtered', () => {
    it('is a computed that follows the source and the toolbar signals', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      const source = signal<Repo[]>([])
      const rows = state.filtered(source, ACCESSORS)
      expect(rows()).toEqual([])

      source.set(REPOS)
      expect(names(rows())).toEqual(['Alpha', 'beta', 'runner 2', 'runner 10'])

      state.search.set('runner')
      expect(names(rows())).toEqual(['runner 2', 'runner 10'])

      state.direction.set('desc')
      expect(names(rows())).toEqual(['runner 10', 'runner 2'])

      state.sortValue.set('stars')
      expect(names(rows())).toEqual(['runner 2', 'runner 10'])
    })

    it('lets several lists share one toolbar', () => {
      const state = createListToolbarState({ sortOptions: SORT_OPTIONS })
      const groups = state.filtered(() => [{ ...REPOS[0], name: 'group b' }, REPOS[1]], ACCESSORS)
      const repos = state.filtered(() => REPOS, ACCESSORS)
      state.search.set('alpha')
      expect(names(groups())).toEqual(['Alpha'])
      expect(names(repos())).toEqual(['Alpha', 'beta'])
    })
  })

  describe('dirty and reset', () => {
    it('is dirty as soon as the search, the field or the direction moves, and reset undoes it', () => {
      const state = createListToolbarState({
        sortOptions: SORT_OPTIONS,
        defaultSort: 'stars',
        initialSearch: 'x',
      })
      state.search.set('y')
      expect(state.dirty()).toBe(true)
      state.reset()
      expect(state.dirty()).toBe(false)
      expect(state.search()).toBe('x')

      state.sortValue.set('name')
      expect(state.dirty()).toBe(true)
      state.reset()
      expect(state.sortValue()).toBe('stars')

      state.direction.set('desc')
      expect(state.dirty()).toBe(true)
      state.reset()
      expect(state.direction()).toBe('asc')
    })
  })
})

@Component({
  standalone: true,
  imports: [ListToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <gbt-list-toolbar
      searchLabel="Search"
      [sortOptions]="toolbar.sortOptions"
      [searchValue]="toolbar.search()"
      [sortValue]="toolbar.sortValue()"
      [sortDirection]="toolbar.direction()"
      (searchValueChange)="toolbar.search.set($event)"
      (sortValueChange)="toolbar.sortValue.set($event)"
      (sortDirectionChange)="toolbar.direction.set($event)"
    />
    <ul>
      @for (repo of rows(); track repo.name) {
        <li>{{ repo.name }}</li>
      }
    </ul>
  `,
})
class Host {
  readonly toolbar = createListToolbarState({ sortOptions: SORT_OPTIONS })
  readonly rows = this.toolbar.filtered(() => REPOS, ACCESSORS)
}

describe('createListToolbarState with gbt-list-toolbar', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const rows = () =>
      Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li')).map((li) =>
        li.textContent?.trim(),
      )
    return { fixture, rows }
  }

  it('drives the list from the toolbar outputs', async () => {
    const { fixture, rows } = setup()
    expect(rows()).toEqual(['Alpha', 'beta', 'runner 2', 'runner 10'])

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]')
    input.value = 'runner'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    expect(fixture.componentInstance.toolbar.search()).toBe('runner')
    expect(rows()).toEqual(['runner 2', 'runner 10'])

    const direction: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.gbt-list-toolbar__direction',
    )
    direction.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.toolbar.direction()).toBe('desc')
    expect(rows()).toEqual(['runner 10', 'runner 2'])

    fixture.nativeElement.querySelector('.gbt-select__trigger').click()
    fixture.detectChanges()
    const options: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-select__option'),
    )
    options.find((option) => option.textContent?.trim() === 'Stars')!.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.toolbar.sortValue()).toBe('stars')
    // Stars ascending is runner 10 (3), runner 2 (12); descending flips it.
    expect(rows()).toEqual(['runner 2', 'runner 10'])

    await expectNoA11yViolations(fixture.nativeElement)
  })
})
