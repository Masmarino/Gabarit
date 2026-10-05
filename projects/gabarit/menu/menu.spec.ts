import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Menu, MenuTrigger } from './menu'
import { MenuItem } from './menu-item/menu-item'
import { Avatar } from '../avatar/avatar'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Menu],
  template: `
    <gbt-menu label="Mon compte">
      <a role="menuitem" class="gbt-menu__item" href="/compte">Mon compte</a>
      <button role="menuitem" class="gbt-menu__item" type="button" (click)="logout()">
        Déconnexion
      </button>
    </gbt-menu>
  `,
})
class HostComponent {
  logoutCount = 0
  logout(): void {
    this.logoutCount++
  }
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const trigger = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-menu__trigger')

const items = (f: ReturnType<typeof setup>): HTMLElement[] => [
  ...f.nativeElement.querySelectorAll('[role="menuitem"]'),
]

describe('Menu', () => {
  it('renders a closed trigger, unambiguous to a screen reader', () => {
    const fixture = setup()
    const button = trigger(fixture)
    expect(button.textContent?.trim()).toBe('Mon compte')
    expect(button.getAttribute('aria-haspopup')).toBe('menu')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull()
  })

  it('opens on click and focuses the first item', async () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()
    await Promise.resolve()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true')
    const list = fixture.nativeElement.querySelector('[role="menu"]')
    expect(list).not.toBeNull()
    expect(list.getAttribute('aria-label')).toBe('Mon compte')
    expect(document.activeElement).toBe(items(fixture)[0])
  })

  it('Down arrow on the closed trigger opens it and focuses the first item', async () => {
    const fixture = setup()
    trigger(fixture).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    )
    fixture.detectChanges()
    await Promise.resolve()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items(fixture)[0])
  })

  it('Up arrow on the closed trigger opens it and focuses the last item', async () => {
    const fixture = setup()
    trigger(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    fixture.detectChanges()
    await Promise.resolve()

    const elements = items(fixture)
    expect(document.activeElement).toBe(elements[elements.length - 1])
  })

  it('arrow keys cycle through items with wraparound', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()
    const elements = items(fixture)
    const list = fixture.nativeElement.querySelector('[role="menu"]')

    elements[0].focus()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(elements[1])

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(elements[0])

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(document.activeElement).toBe(elements[elements.length - 1])
  })

  it('Home and End jump to the first and last item', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()
    const elements = items(fixture)
    const list = fixture.nativeElement.querySelector('[role="menu"]')

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(document.activeElement).toBe(elements[elements.length - 1])

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(document.activeElement).toBe(elements[0])
  })

  it('Escape closes it and returns focus to the trigger', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()
    const list = fixture.nativeElement.querySelector('[role="menu"]')

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger(fixture))
  })

  it('a click outside the menu closes it without stealing focus', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()

    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    elsewhere.focus()
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(elsewhere)
    elsewhere.remove()
  })

  it('activating an item triggers its own action and closes the menu', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()

    const button = items(fixture)[1] as HTMLButtonElement
    button.click()
    fixture.detectChanges()

    expect(fixture.componentInstance.logoutCount).toBe(1)
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
  })

  it('emits opened only on the closed-to-open transition, never on close', () => {
    @Component({
      standalone: true,
      imports: [Menu],
      template: `
        <gbt-menu label="Mon compte" (opened)="openedCount = openedCount + 1">
          <a role="menuitem" class="gbt-menu__item" href="/compte">Mon compte</a>
        </gbt-menu>
      `,
    })
    class HostWithOpened {
      openedCount = 0
    }

    const fixture = TestBed.createComponent(HostWithOpened)
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-menu__trigger')

    button.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.openedCount).toBe(1)

    button.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.openedCount).toBe(1)

    button.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.openedCount).toBe(2)
  })

  it('tabbing out of the menu closes it, without stealing focus', () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()

    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    const list = fixture.nativeElement.querySelector('[role="menu"]')
    list.dispatchEvent(new FocusEvent('focusout', { relatedTarget: elsewhere, bubbles: true }))
    fixture.detectChanges()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
    elsewhere.remove()
  })

  it('positions the list to the right of the trigger when align is end', () => {
    @Component({
      standalone: true,
      imports: [Menu],
      template: `
        <gbt-menu label="Mon compte" align="end">
          <a role="menuitem" class="gbt-menu__item" href="/compte">Mon compte</a>
        </gbt-menu>
      `,
    })
    class HostAlignEnd {}

    const fixture = TestBed.createComponent(HostAlignEnd)
    fixture.detectChanges()
    fixture.nativeElement.querySelector('.gbt-menu__trigger').click()
    fixture.detectChanges()

    const list: HTMLElement = fixture.nativeElement.querySelector('[role="menu"]')
    expect(list.style.right).not.toBe('')
    expect(list.style.left).toBe('')
  })

  it('has no violation detected by axe, closed', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no violation detected by axe, open', async () => {
    const fixture = setup()
    trigger(fixture).click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('renders an icon-only trigger when triggerIcon is set, using label as the accessible name', () => {
    @Component({
      standalone: true,
      imports: [Menu],
      template: `
        <gbt-menu label="Actions" triggerIcon="ellipsis-vertical">
          <a role="menuitem" class="gbt-menu__item" href="/x">Item</a>
        </gbt-menu>
      `,
    })
    class HostIconOnly {}

    const fixture = TestBed.createComponent(HostIconOnly)
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-menu__trigger')

    expect(button.textContent?.trim()).toBe('')
    expect(button.getAttribute('aria-label')).toBe('Actions')
    expect(button.querySelector('gbt-icon')).not.toBeNull()
    expect(button.querySelector('.gbt-menu__label')).toBeNull()
    expect(button.querySelector('.gbt-menu__chevron')).toBeNull()
  })

  it('an icon-only trigger still opens on click and focuses the first item', async () => {
    @Component({
      standalone: true,
      imports: [Menu],
      template: `
        <gbt-menu label="Actions" triggerIcon="ellipsis-vertical">
          <a role="menuitem" class="gbt-menu__item" href="/x">Item</a>
        </gbt-menu>
      `,
    })
    class HostIconOnlyOpens {}

    const fixture = TestBed.createComponent(HostIconOnlyOpens)
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-menu__trigger')
    button.click()
    fixture.detectChanges()
    await Promise.resolve()

    expect(button.getAttribute('aria-expanded')).toBe('true')
    const item: HTMLElement = fixture.nativeElement.querySelector('[role="menuitem"]')
    expect(document.activeElement).toBe(item)
  })

  it('has no violation detected by axe, icon-only trigger', async () => {
    @Component({
      standalone: true,
      imports: [Menu],
      template: `
        <gbt-menu label="Actions" triggerIcon="ellipsis-vertical">
          <a role="menuitem" class="gbt-menu__item" href="/x">Item</a>
        </gbt-menu>
      `,
    })
    class HostIconOnlyA11y {}

    const fixture = TestBed.createComponent(HostIconOnlyA11y)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Menu additions', () => {
  const trig = (f: { nativeElement: HTMLElement }): HTMLButtonElement =>
    f.nativeElement.querySelector('.gbt-menu__trigger') as HTMLButtonElement

  describe('focus returns to the trigger after an item is activated', () => {
    it('after clicking a button item', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      const item = items(fixture)[1]
      item.focus()
      item.click()
      fixture.detectChanges()

      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger(fixture))
      expect(fixture.componentInstance.logoutCount).toBe(1)
    })

    it('after clicking a link item', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      const link = items(fixture)[0]
      link.addEventListener('click', (e) => e.preventDefault())
      link.focus()
      link.click()
      fixture.detectChanges()

      expect(document.activeElement).toBe(trigger(fixture))
    })

    it('after an activation by keyboard (Enter/Space become a click on the item)', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      const item = items(fixture)[1]
      item.focus()
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
      fixture.detectChanges()

      expect(document.activeElement).toBe(trigger(fixture))
    })

    it('runs the item handler before focus moves (a modal opened from an item sees the item)', () => {
      const order: string[] = []
      @Component({
        standalone: true,
        imports: [Menu],
        template: `
          <gbt-menu label="Row">
            <button role="menuitem" class="gbt-menu__item" type="button" (click)="handle()">
              Delete
            </button>
          </gbt-menu>
        `,
      })
      class Host {
        handle(): void {
          order.push(`handler:${document.activeElement?.getAttribute('role')}`)
        }
      }
      const fixture = TestBed.createComponent(Host)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('.gbt-menu__trigger').click()
      fixture.detectChanges()
      const item: HTMLElement = fixture.nativeElement.querySelector('[role="menuitem"]')
      item.focus()
      item.click()
      expect(order).toEqual(['handler:menuitem'])
    })

    it('does not steal focus that an item handler moved synchronously', () => {
      @Component({
        standalone: true,
        imports: [Menu],
        template: `
          <input class="outside" aria-label="Rename" />
          <gbt-menu label="Row">
            <button role="menuitem" class="gbt-menu__item" type="button" (click)="rename()">
              Rename
            </button>
          </gbt-menu>
        `,
      })
      class Host {
        rename(): void {
          ;(document.querySelector('.outside') as HTMLInputElement).focus()
        }
      }
      const fixture = TestBed.createComponent(Host)
      fixture.nativeElement.ownerDocument.body.appendChild(fixture.nativeElement)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('.gbt-menu__trigger').click()
      fixture.detectChanges()
      const item: HTMLElement = fixture.nativeElement.querySelector('[role="menuitem"]')
      item.focus()
      item.click()
      fixture.detectChanges()

      expect(
        fixture.nativeElement.querySelector('.gbt-menu__trigger').getAttribute('aria-expanded'),
      ).toBe('false')
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.outside'))
    })

    it('a click on the list padding still closes the menu', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      fixture.nativeElement.querySelector('[role="menu"]').click()
      fixture.detectChanges()
      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
    })

    it('leaves focus where it is when a click outside closes the menu', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      const elsewhere = document.createElement('button')
      document.body.appendChild(elsewhere)
      elsewhere.focus()
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      fixture.detectChanges()
      expect(document.activeElement).toBe(elsewhere)
      elsewhere.remove()
    })

    it('a disabled item (aria-disabled) keeps the menu open and focus on the item', () => {
      @Component({
        standalone: true,
        imports: [Menu],
        template: `
          <gbt-menu label="Row">
            <button role="menuitem" class="gbt-menu__item" type="button" aria-disabled="true">
              Archive
            </button>
          </gbt-menu>
        `,
      })
      class Host {}
      const fixture = TestBed.createComponent(Host)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('.gbt-menu__trigger').click()
      fixture.detectChanges()
      const item: HTMLElement = fixture.nativeElement.querySelector('[role="menuitem"]')
      item.focus()
      item.click()
      fixture.detectChanges()
      expect(trig(fixture).getAttribute('aria-expanded')).toBe('true')
      expect(document.activeElement).toBe(item)
    })
  })

  describe('keyboard', () => {
    it('Escape on the trigger closes an open menu and keeps focus there', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      trigger(fixture).focus()
      trigger(fixture).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
      fixture.detectChanges()
      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger(fixture))
    })

    it('Escape on a closed trigger does nothing', () => {
      const fixture = setup()
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      trigger(fixture).dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })

    it('does not trap focus: Tab leaving the menu closes it and is not prevented', () => {
      const fixture = setup()
      trigger(fixture).click()
      fixture.detectChanges()
      const list = fixture.nativeElement.querySelector('[role="menu"]')
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      items(fixture)[0].dispatchEvent(tab)
      expect(tab.defaultPrevented).toBe(false)

      const outside = document.createElement('button')
      document.body.appendChild(outside)
      list.dispatchEvent(new FocusEvent('focusout', { relatedTarget: outside, bubbles: true }))
      fixture.detectChanges()
      expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')
      outside.remove()
    })
  })

  describe('custom trigger', () => {
    @Component({
      standalone: true,
      imports: [Menu, MenuTrigger],
      template: `
        <gbt-menu label="Account" [chevron]="chevron()" [triggerAriaLabel]="aria()">
          <span gbtMenuTrigger class="who"
            ><i class="dot" aria-hidden="true"></i> Ada Lovelace</span
          >
          <a role="menuitem" class="gbt-menu__item" href="/me">My account</a>
          <button role="menuitem" class="gbt-menu__item" type="button">Sign out</button>
        </gbt-menu>
      `,
    })
    class CustomHost {
      chevron = signal(true)
      aria = signal<string | null>(null)
    }

    it('projects the slot into the trigger button in place of the default label', () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      const button = trig(fixture)
      expect(button.querySelector('.who')).not.toBeNull()
      expect(button.textContent).toContain('Ada Lovelace')
      expect(button.querySelector('.gbt-menu__label')).toBeNull()
      expect(button.classList.contains('gbt-menu__trigger--custom')).toBe(true)
    })

    it('still shows the projected element when MenuTrigger is not imported', () => {
      @Component({
        standalone: true,
        imports: [Menu],
        template: `
          <gbt-menu label="Account">
            <span gbtMenuTrigger class="who">Ada Lovelace</span>
            <button role="menuitem" class="gbt-menu__item" type="button">Sign out</button>
          </gbt-menu>
        `,
      })
      class ForgottenImport {}
      const fixture = TestBed.createComponent(ForgottenImport)
      fixture.detectChanges()
      const button = trig(fixture)
      expect(button.querySelector('.who')?.textContent).toContain('Ada Lovelace')
      expect(button.querySelector('.gbt-menu__label')).toBeNull()
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
    })

    it('keeps the menu behaviour: aria-haspopup, expanded, opens on click, list named by label', async () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      const button = trig(fixture)
      expect(button.getAttribute('aria-haspopup')).toBe('menu')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      button.click()
      fixture.detectChanges()
      await Promise.resolve()

      expect(button.getAttribute('aria-expanded')).toBe('true')
      const list = fixture.nativeElement.querySelector('[role="menu"]')
      expect(list.getAttribute('aria-label')).toBe('Account')
      expect(document.activeElement).toBe(list.querySelector('[role="menuitem"]'))
    })

    it('names the button by its content unless triggerAriaLabel is given', () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      expect(trig(fixture).hasAttribute('aria-label')).toBe(false)

      fixture.componentInstance.aria.set('Open the account menu')
      fixture.detectChanges()
      expect(trig(fixture).getAttribute('aria-label')).toBe('Open the account menu')
    })

    it('lets the whole host chain shrink for a custom trigger only', () => {
      const custom = TestBed.createComponent(CustomHost)
      custom.detectChanges()
      expect(
        custom.nativeElement.querySelector('gbt-menu').classList.contains('gbt-menu-host--custom'),
      ).toBe(true)

      const plain = setup()
      expect(
        plain.nativeElement.querySelector('gbt-menu').classList.contains('gbt-menu-host--custom'),
      ).toBe(false)
    })

    it('shows the chevron by default and hides it with chevron=false', () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      expect(trig(fixture).querySelector('.gbt-menu__chevron')).not.toBeNull()

      fixture.componentInstance.chevron.set(false)
      fixture.detectChanges()
      expect(trig(fixture).querySelector('.gbt-menu__chevron')).toBeNull()
    })

    it('still supports the arrow keys on the custom trigger and Escape with focus return', async () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      trig(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      fixture.detectChanges()
      await Promise.resolve()
      const menuItems = [...fixture.nativeElement.querySelectorAll('[role="menuitem"]')]
      expect(document.activeElement).toBe(menuItems[menuItems.length - 1])

      fixture.nativeElement
        .querySelector('[role="menu"]')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      fixture.detectChanges()
      expect(document.activeElement).toBe(trig(fixture))
    })

    it('does not change the default trigger: label, chevron, no aria-label, no custom class', () => {
      const fixture = setup()
      const button = trigger(fixture)
      expect(button.querySelector('.gbt-menu__label')?.textContent).toBe('Mon compte')
      expect(button.querySelector('.gbt-menu__chevron')).not.toBeNull()
      expect(button.hasAttribute('aria-label')).toBe(false)
      expect(button.classList.contains('gbt-menu__trigger--custom')).toBe(false)
    })

    it('has no a11y violations, closed and open', async () => {
      const fixture = TestBed.createComponent(CustomHost)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
      trig(fixture).click()
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('has no a11y violations with a real avatar next to the name', async () => {
      @Component({
        standalone: true,
        imports: [Menu, MenuTrigger, Avatar],
        template: `
          <gbt-menu label="Account">
            <span gbtMenuTrigger>
              <span aria-hidden="true"><gbt-avatar name="Ada Lovelace" size="sm" /></span>
              ada.lovelace
            </span>
            <a role="menuitem" class="gbt-menu__item" href="/me">My account</a>
          </gbt-menu>
        `,
      })
      class WithAvatar {}
      const fixture = TestBed.createComponent(WithAvatar)
      fixture.detectChanges()
      expect(trig(fixture).textContent).toContain('ada.lovelace')
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('has no a11y violations with an avatar-only trigger named by triggerAriaLabel', async () => {
      @Component({
        standalone: true,
        imports: [Menu, MenuTrigger],
        template: `
          <gbt-menu label="Account" triggerAriaLabel="Account menu">
            <span gbtMenuTrigger aria-hidden="true">AL</span>
            <a role="menuitem" class="gbt-menu__item" href="/me">My account</a>
          </gbt-menu>
        `,
      })
      class AvatarOnly {}
      const fixture = TestBed.createComponent(AvatarOnly)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })

  describe('with gbtMenuItem items', () => {
    @Component({
      standalone: true,
      imports: [Menu, MenuItem],
      template: `
        <gbt-menu label="Row">
          <a gbtMenuItem icon="user" href="/me">Profile</a>
          <button gbtMenuItem (click)="rename()">Rename</button>
          <button gbtMenuItem variant="danger" icon="trash-2" (click)="remove()">Delete</button>
        </gbt-menu>
      `,
    })
    class ItemHost {
      renamed = 0
      removed = 0
      rename(): void {
        this.renamed++
      }
      remove(): void {
        this.removed++
      }
    }

    it('is reached by the menu keyboard handling like any menuitem', async () => {
      const fixture = TestBed.createComponent(ItemHost)
      fixture.detectChanges()
      trig(fixture).click()
      fixture.detectChanges()
      await Promise.resolve()

      const els: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('[role="menuitem"]')]
      expect(els.length).toBe(3)
      expect(document.activeElement).toBe(els[0])
      const list = fixture.nativeElement.querySelector('[role="menu"]')
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
      expect(document.activeElement).toBe(els[2])
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      expect(document.activeElement).toBe(els[0])
    })

    it('activating one runs its handler, closes the menu and returns focus to the trigger', () => {
      const fixture = TestBed.createComponent(ItemHost)
      fixture.detectChanges()
      trig(fixture).click()
      fixture.detectChanges()
      const del = fixture.nativeElement.querySelectorAll('[role="menuitem"]')[2] as HTMLElement
      del.focus()
      del.click()
      fixture.detectChanges()
      expect(fixture.componentInstance.removed).toBe(1)
      expect(trig(fixture).getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trig(fixture))
    })

    it('has no a11y violations, open', async () => {
      const fixture = TestBed.createComponent(ItemHost)
      fixture.detectChanges()
      trig(fixture).click()
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
