import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { CommandGroup, CommandItem, CommandPalette } from './command-palette'
import { CommandPaletteTrigger } from './command-palette-trigger'
import { matchCommand } from './command-match'
import { ariaKeyshortcuts, matchesShortcut, shortcutLabel } from './shortcut'

/** Items carrying data of their own, as an app's do: the trigger must still take the palette. */
interface Target {
  href: string
}

const GROUPS: CommandGroup<Target>[] = [
  {
    label: 'Aller à',
    items: [
      { id: 'home', label: 'Accueil', icon: 'home', data: { href: '/home' } },
      { id: 'repos', label: 'Dépôts', icon: 'folder', keywords: ['projets'] },
      {
        id: 'settings',
        label: 'Réglages',
        description: "De l'instance",
        icon: 'settings',
        shortcut: ['G', 'S'],
      },
    ],
  },
  {
    label: 'Actions',
    items: [{ id: 'new-repo', label: 'Nouveau dépôt', icon: 'plus' }],
  },
]

@Component({
  standalone: true,
  imports: [CommandPalette, CommandPaletteTrigger],
  template: `
    <button type="button" class="outside">Avant</button>
    <gbt-command-palette-trigger [palette]="palette" label="Rechercher" />
    <gbt-command-palette
      #palette
      [(open)]="open"
      [groups]="groups()"
      [shortcuts]="shortcuts"
      (queryChange)="queries.push($event)"
      (itemSelected)="selected.push($event)"
    />
  `,
})
class Host {
  open = signal(false)
  groups = signal<CommandGroup<Target>[]>(GROUPS)
  shortcuts = ['mod+k', '/']
  queries: string[] = []
  selected: CommandItem<Target>[] = []
}

describe('CommandPalette', () => {
  function render() {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const host = fixture.componentInstance
    const el = fixture.nativeElement as HTMLElement
    const dialog = () => el.querySelector<HTMLElement>('[role="dialog"]')
    const input = () => el.querySelector<HTMLInputElement>('.gbt-cp__input')!
    const labels = () =>
      Array.from(el.querySelectorAll('.gbt-cp__item-label')).map((node) => node.textContent?.trim())
    const groupLabels = () =>
      Array.from(el.querySelectorAll('.gbt-cp__group-label')).map((node) =>
        node.textContent?.trim(),
      )
    const active = () =>
      el
        .querySelector('[role="option"][aria-selected="true"] .gbt-cp__item-label')
        ?.textContent?.trim()
    const key = (key: string, init: KeyboardEventInit = {}) => {
      dialog()!.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
      )
      fixture.detectChanges()
    }
    const type = (value: string) => {
      input().value = value
      input().dispatchEvent(new Event('input'))
      fixture.detectChanges()
    }
    const open = async () => {
      host.open.set(true)
      fixture.detectChanges()
      await fixture.whenStable()
    }
    return { fixture, host, el, dialog, input, labels, groupLabels, active, key, type, open }
  }

  it('is closed until opened', () => {
    const { dialog } = render()
    expect(dialog()).toBeNull()
  })

  it('opens with Ctrl+K off Apple systems and closes again with it', () => {
    const { fixture, dialog } = render()
    const press = () =>
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }),
      )

    press()
    fixture.detectChanges()
    expect(dialog()).not.toBeNull()

    press()
    fixture.detectChanges()
    expect(dialog()).toBeNull()
  })

  it('opens with a plain-key shortcut, but not while someone types in a field', () => {
    const { fixture, dialog, el } = render()
    const field = document.createElement('input')
    el.appendChild(field)

    field.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))
    fixture.detectChanges()
    expect(dialog()).toBeNull()

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }),
    )
    fixture.detectChanges()
    expect(dialog()).not.toBeNull()
  })

  it('is a modal dialog whose field is a combobox controlling the list, focused on opening with an empty query', async () => {
    const { open, dialog, input, host } = render()

    await open()

    expect(dialog()!.getAttribute('aria-modal')).toBe('true')
    expect(input().getAttribute('role')).toBe('combobox')
    expect(
      document.getElementById(input().getAttribute('aria-controls')!)?.getAttribute('role'),
    ).toBe('listbox')
    expect(document.activeElement).toBe(input())
    expect(host.queries).toEqual([''])
  })

  it('lists every group while the query is empty, the first option active', async () => {
    const { open, labels, groupLabels, active } = render()

    await open()

    expect(groupLabels()).toEqual(['Aller à', 'Actions'])
    expect(labels()).toEqual(['Accueil', 'Dépôts', 'Réglages', 'Nouveau dépôt'])
    expect(active()).toBe('Accueil')
  })

  it('keeps what matches as one types, accents and keywords included, and drops empty groups', async () => {
    const { open, type, labels, groupLabels, host } = render()
    await open()

    type('depot')
    expect(labels()).toEqual(['Dépôts', 'Nouveau dépôt'])

    type('projets')
    expect(labels()).toEqual(['Dépôts'])
    expect(groupLabels()).toEqual(['Aller à'])
    expect(host.queries).toEqual(['', 'depot', 'projets'])
  })

  it('shows a group marked filter: false as given, whatever the query', async () => {
    const { open, type, labels, host, fixture } = render()
    host.groups.set([
      ...GROUPS,
      { label: 'Dépôts', filter: false, items: [{ id: 'r1', label: 'gabarit' }] },
    ])
    fixture.detectChanges()
    await open()

    type('zzz')

    expect(labels()).toEqual(['gabarit'])
  })

  it('says there is nothing when nothing matches', async () => {
    const { open, type, el } = render()
    await open()

    type('zzz')

    expect(el.querySelector('.gbt-cp__empty')?.textContent?.trim()).toBe('No results')
  })

  it('moves through the options with the arrows, wrapping around, and keeps the focus in the field', async () => {
    const { open, key, active, input } = render()
    await open()

    key('ArrowDown')
    expect(active()).toBe('Dépôts')
    key('ArrowUp')
    key('ArrowUp')
    expect(active()).toBe('Nouveau dépôt')
    expect(input().getAttribute('aria-activedescendant')).toBe(
      document.querySelector('[aria-selected="true"]')!.id,
    )

    key('Tab')
    expect(document.activeElement).toBe(input())
  })

  it('runs the active option on Enter and closes', async () => {
    const { open, key, host, dialog } = render()
    await open()

    key('ArrowDown')
    key('Enter')

    expect(host.selected.map((item) => item.id)).toEqual(['repos'])
    expect(dialog()).toBeNull()
  })

  it('runs an option clicked', async () => {
    const { open, el, host, fixture } = render()
    await open()

    el.querySelectorAll<HTMLElement>('[role="option"]')[2].click()
    fixture.detectChanges()

    expect(host.selected.map((item) => item.id)).toEqual(['settings'])
  })

  it('closes on Escape and on a click outside, giving the focus back', async () => {
    const { fixture, open, key, dialog, el } = render()
    const before = el.querySelector<HTMLButtonElement>('.outside')!
    before.focus()
    await open()

    key('Escape')
    await fixture.whenStable()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(before)

    await open()
    el.querySelector<HTMLElement>('.gbt-cp__backdrop')!.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    )
    fixture.detectChanges()
    expect(dialog()).toBeNull()
  })

  it('has a named close button for phones, which have no Escape key', async () => {
    const { fixture, open, dialog, el } = render()
    await open()

    const close = el.querySelector<HTMLButtonElement>('.gbt-cp__close')!
    expect(close.getAttribute('aria-label')).toBe('Close')
    close.click()
    fixture.detectChanges()
    expect(dialog()).toBeNull()
  })

  it('shows the shortcuts given to an option', async () => {
    const { open, el } = render()
    await open()

    const keys = Array.from(el.querySelectorAll('[role="option"]')[2].querySelectorAll('kbd')).map(
      (k) => k.textContent,
    )
    expect(keys).toEqual(['G', 'S'])
  })

  it('opens from its trigger, a button named by its label that says the shortcut', () => {
    const { fixture, el, dialog } = render()
    const trigger = el.querySelector<HTMLButtonElement>('.gbt-cp-trigger')!

    expect(trigger.getAttribute('aria-label')).toBe('Rechercher')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-keyshortcuts')).toMatch(/^(Meta|Control)\+K$/)

    trigger.click()
    fixture.detectChanges()
    expect(dialog()).not.toBeNull()
  })

  it('has no violation detected by axe, open', async () => {
    const { open, el } = render()
    await open()
    await expectNoA11yViolations(el)
  })
})

describe('matchCommand', () => {
  const item = (label: string, extra: Partial<CommandItem> = {}): CommandItem => ({
    id: label,
    label,
    ...extra,
  })

  it('ranks a label starting with the query above a word that does, above any other match', () => {
    expect(matchCommand(item('Demandes de fusion'), 'dem')).toBe(3)
    expect(matchCommand(item('Nouvelle demande'), 'dem')).toBe(2)
    expect(matchCommand(item('Académie'), 'dem')).toBe(1)
  })

  it('needs every word, in the label, the description or the keywords', () => {
    expect(
      matchCommand(item('Tickets', { description: 'ferrisgit' }), 'tick ferris'),
    ).not.toBeNull()
    expect(matchCommand(item('Tickets'), 'tick ferris')).toBeNull()
    expect(matchCommand(item('Runners', { keywords: ['ci'] }), 'ci')).not.toBeNull()
  })
})

describe('shortcuts', () => {
  const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init)

  it('reads mod as ⌘ on Apple systems and Ctrl elsewhere', () => {
    expect(matchesShortcut(event({ key: 'k', metaKey: true }), 'mod+k', true)).toBe(true)
    expect(matchesShortcut(event({ key: 'k', ctrlKey: true }), 'mod+k', true)).toBe(false)
    expect(matchesShortcut(event({ key: 'k', ctrlKey: true }), 'mod+k', false)).toBe(true)
    expect(matchesShortcut(event({ key: 'k' }), 'mod+k', false)).toBe(false)
  })

  it('writes the shortcut for people and for assistive technology', () => {
    expect(shortcutLabel('mod+k', true)).toBe('⌘K')
    expect(shortcutLabel('mod+k', false)).toBe('Ctrl K')
    expect(ariaKeyshortcuts('mod+k', true)).toBe('Meta+K')
    expect(ariaKeyshortcuts('mod+k', false)).toBe('Control+K')
  })
})
