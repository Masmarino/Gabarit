import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Menu } from './menu'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

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
})
