import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { AvatarGroup, AvatarGroupItem } from './avatar-group'

const USERS: AvatarGroupItem[] = [
  { name: 'Ada Lovelace' },
  { name: 'Alan Turing' },
  { name: 'Grace Hopper' },
  { name: 'Katherine Johnson' },
  { name: 'Margaret Hamilton' },
  { name: 'Dorothy Vaughan' },
  { name: 'Mary Jackson' },
]

function setup(items: AvatarGroupItem[] = USERS, max?: number) {
  const fixture = TestBed.createComponent(AvatarGroup)
  fixture.componentRef.setInput('items', items)
  if (max !== undefined) fixture.componentRef.setInput('max', max)
  fixture.detectChanges()
  return fixture
}

const visibleButtons = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-avatar-group__button'),
]

const moreButton = (f: ReturnType<typeof setup>): HTMLButtonElement | null =>
  f.nativeElement.querySelector('.gbt-avatar-group__more')

const panel = (f: ReturnType<typeof setup>): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-avatar-group__panel')

describe('AvatarGroup', () => {
  it('shows up to `max` avatars and a +N indicator for the rest', () => {
    const fixture = setup(USERS, 5)
    expect(visibleButtons(fixture).length).toBe(5)
    expect(moreButton(fixture)?.textContent?.trim()).toBe('+2')
  })

  it('defaults max to 5', () => {
    const fixture = setup()
    expect(visibleButtons(fixture).length).toBe(5)
  })

  it('shows no +N indicator when every item fits', () => {
    const fixture = setup(USERS.slice(0, 3), 5)
    expect(visibleButtons(fixture).length).toBe(3)
    expect(moreButton(fixture)).toBeNull()
  })

  it('emits itemClick with the clicked visible user', () => {
    const fixture = setup(USERS, 5)
    const emitted: AvatarGroupItem[] = []
    fixture.componentInstance.itemClick.subscribe((item) => emitted.push(item))

    visibleButtons(fixture)[1].click()

    expect(emitted).toEqual([USERS[1]])
  })

  it('opens a panel listing the overflow users when +N is clicked', () => {
    const fixture = setup(USERS, 5)
    expect(panel(fixture)).toBeNull()

    moreButton(fixture)!.click()
    fixture.detectChanges()

    expect(panel(fixture)).not.toBeNull()
    const names = [...fixture.nativeElement.querySelectorAll('.gbt-avatar-group__panel-item-name')].map(
      (el: HTMLElement) => el.textContent?.trim(),
    )
    expect(names).toEqual(['Dorothy Vaughan', 'Mary Jackson'])
  })

  it('emits itemClick and closes the panel when an overflow user is clicked', () => {
    const fixture = setup(USERS, 5)
    moreButton(fixture)!.click()
    fixture.detectChanges()
    const emitted: AvatarGroupItem[] = []
    fixture.componentInstance.itemClick.subscribe((item) => emitted.push(item))

    fixture.nativeElement.querySelector('.gbt-avatar-group__panel-item').click()
    fixture.detectChanges()

    expect(emitted).toEqual([USERS[5]])
    expect(panel(fixture)).toBeNull()
  })

  it('closes the panel on Escape', () => {
    const fixture = setup(USERS, 5)
    moreButton(fixture)!.click()
    fixture.detectChanges()
    expect(panel(fixture)).not.toBeNull()

    fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('closes the panel when clicking outside', () => {
    const fixture = setup(USERS, 5)
    moreButton(fixture)!.click()
    fixture.detectChanges()
    expect(panel(fixture)).not.toBeNull()

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('names the list and the overflow trigger', () => {
    const fixture = setup(USERS, 5)
    expect(fixture.nativeElement.querySelector('ul').getAttribute('aria-label')).toBe('Users')
    expect(moreButton(fixture)?.getAttribute('aria-label')).toBe('2 more')
  })

  it('allows customizing the labels', () => {
    const fixture = TestBed.createComponent(AvatarGroup)
    fixture.componentRef.setInput('items', USERS)
    fixture.componentRef.setInput('max', 5)
    fixture.componentRef.setInput('ariaLabel', 'Utilisateurs')
    fixture.componentRef.setInput('moreLabel', (count: number) => `${count} de plus`)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('ul').getAttribute('aria-label')).toBe('Utilisateurs')
    expect(moreButton(fixture)?.getAttribute('aria-label')).toBe('2 de plus')
  })

  it('has no a11y violations, no overflow', async () => {
    await expectNoA11yViolations(setup(USERS.slice(0, 3), 5).nativeElement)
  })

  it('has no a11y violations, with overflow panel open', async () => {
    const fixture = setup(USERS, 5)
    moreButton(fixture)!.click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  describe('activeItem', () => {
    it('marks the active visible avatar with aria-current, no check icon', () => {
      const fixture = setup(USERS, 5)
      fixture.componentRef.setInput('activeItem', USERS[1])
      fixture.detectChanges()

      const buttons = visibleButtons(fixture)
      expect(buttons[1].getAttribute('aria-current')).toBe('true')
      expect(buttons[1].classList).toContain('gbt-avatar-group__button--active')
      expect(buttons[1].querySelector('gbt-icon')).toBeNull()
      expect(buttons[0].getAttribute('aria-current')).toBeNull()
    })

    it('has no active avatar by default', () => {
      const fixture = setup(USERS, 5)
      expect(fixture.nativeElement.querySelector('.gbt-avatar-group__button--active')).toBeNull()
    })

    it('marks the active overflow item with aria-current and a check icon', () => {
      const fixture = setup(USERS, 5)
      fixture.componentRef.setInput('activeItem', USERS[5])
      fixture.detectChanges()
      moreButton(fixture)!.click()
      fixture.detectChanges()

      const items = [...fixture.nativeElement.querySelectorAll('.gbt-avatar-group__panel-item')]
      expect(items[0].getAttribute('aria-current')).toBe('true')
      expect(items[0].querySelector('gbt-icon')).not.toBeNull()
      expect(items[1].getAttribute('aria-current')).toBeNull()
      expect(items[1].querySelector('gbt-icon')).toBeNull()
    })

    it('has no a11y violations with an active item', async () => {
      const fixture = setup(USERS, 5)
      fixture.componentRef.setInput('activeItem', USERS[1])
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
