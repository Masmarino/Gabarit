import { Component, Directive, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Icon } from '../../atoms/icon/icon'
import { Menu } from '../menu/menu'
import { MenuItem } from './menu-item'

/** Stands in for `routerLink`: a directive with its own click handler on the same element. */
@Directive({ selector: '[gbtFakeRouterLink]', standalone: true, host: { '(click)': 'go()' } })
class FakeRouterLink {
  navigations = 0
  go(): void {
    FakeRouterLink.total++
    this.navigations++
  }
  static total = 0
}

@Component({
  standalone: true,
  imports: [MenuItem, FakeRouterLink],
  template: `
    <button gbtMenuItem id="plain" (click)="clicks.push('plain')">Rename</button>
    <button
      gbtMenuItem
      id="danger"
      variant="danger"
      icon="trash-2"
      [disabled]="disabled()"
      (click)="clicks.push('danger')"
    >
      Delete
    </button>
    <a gbtMenuItem id="link" href="#/profile" icon="user" [disabled]="disabled()" gbtFakeRouterLink>
      Profile
    </a>
    <button gbtMenuItem id="typed" type="submit">Typed</button>
    <a gbtMenuItem id="own-tabindex" href="#/x" tabindex="0">Own tabindex</a>
  `,
})
class ItemsHost {
  disabled = signal(false)
  clicks: string[] = []
}

function setup() {
  FakeRouterLink.total = 0
  const fixture = TestBed.createComponent(ItemsHost)
  fixture.detectChanges()
  const el = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`)
  return { fixture, el }
}

describe('MenuItem', () => {
  describe('defaults', () => {
    it('is a menuitem with the menu item look, out of the tab order', () => {
      const { el } = setup()
      for (const id of ['plain', 'danger', 'link']) {
        expect(el(id).getAttribute('role')).toBe('menuitem')
        expect(el(id).classList.contains('gbt-menu__item')).toBe(true)
        expect(el(id).getAttribute('tabindex')).toBe('-1')
      }
    })

    it('leaves a default item free of variant and disabled markers', () => {
      const { el } = setup()
      expect(el('plain').hasAttribute('data-variant')).toBe(false)
      expect(el('plain').hasAttribute('aria-disabled')).toBe(false)
    })

    it('renders no icon unless asked, and projects the label', () => {
      const { fixture, el } = setup()
      expect(el('plain').querySelector('gbt-icon')).toBeNull()
      expect(el('plain').textContent?.trim()).toBe('Rename')
      expect(fixture.debugElement.queryAll(By.directive(Icon)).length).toBe(2)
    })

    it('makes a bare button a type="button" so it never submits a form, but respects an explicit type', () => {
      const { el } = setup()
      expect(el('plain').getAttribute('type')).toBe('button')
      expect(el('typed').getAttribute('type')).toBe('submit')
    })

    it('lets a consumer tabindex win over the default', () => {
      const { el } = setup()
      expect(el('own-tabindex').getAttribute('tabindex')).toBe('0')
    })
  })

  describe('icon', () => {
    it('renders a decorative icon before the label', () => {
      const { el } = setup()
      const icon = el('danger').firstElementChild as HTMLElement
      expect(icon.tagName).toBe('GBT-ICON')
      expect(icon.getAttribute('aria-hidden')).toBe('true')
      expect(icon.classList.contains('gbt-menu-item__icon')).toBe(true)
    })
  })

  describe('variant', () => {
    it('marks the danger variant with a data attribute', () => {
      const { el } = setup()
      expect(el('danger').getAttribute('data-variant')).toBe('danger')
    })
  })

  describe('disabled', () => {
    it('announces aria-disabled on a button and on a link, and drops it when re-enabled', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      expect(el('danger').getAttribute('aria-disabled')).toBe('true')
      expect(el('link').getAttribute('aria-disabled')).toBe('true')

      fixture.componentInstance.disabled.set(false)
      fixture.detectChanges()
      expect(el('danger').hasAttribute('aria-disabled')).toBe(false)
    })

    it('stays focusable (a disabled item is still reachable by arrow keys)', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      expect((el('danger') as HTMLButtonElement).disabled).toBe(false)
      el('danger').focus()
      expect(document.activeElement).toBe(el('danger'))
    })

    it('swallows the click: no consumer handler on a button', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      el('danger').click()
      expect(fixture.componentInstance.clicks).toEqual([])
    })

    it('swallows the click on a link: no navigation and no directive handler (routerLink)', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      el('link').dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(FakeRouterLink.total).toBe(0)
    })

    it('swallows the middle click of a disabled link too', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      const event = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
      el('link').dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    it('works again once enabled, for a button and a link', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      fixture.componentInstance.disabled.set(false)
      fixture.detectChanges()
      el('danger').click()
      el('link').addEventListener('click', (e) => e.preventDefault())
      el('link').click()
      expect(fixture.componentInstance.clicks).toEqual(['danger'])
      expect(FakeRouterLink.total).toBe(1)
    })

    it('also stops a click on the item icon (child of the item)', () => {
      const { fixture, el } = setup()
      fixture.componentInstance.disabled.set(true)
      fixture.detectChanges()
      ;(el('danger').querySelector('gbt-icon') as HTMLElement).click()
      expect(fixture.componentInstance.clicks).toEqual([])
    })
  })

  describe('inside a gbt-menu', () => {
    @Component({
      standalone: true,
      imports: [Menu, MenuItem],
      template: `
        <gbt-menu label="Row">
          <button gbtMenuItem (click)="log.push('rename')">Rename</button>
          <button gbtMenuItem [disabled]="true" (click)="log.push('archive')">Archive</button>
          <button gbtMenuItem variant="danger" icon="trash-2" (click)="log.push('delete')">
            Delete
          </button>
        </gbt-menu>
      `,
    })
    class InMenu {
      log: string[] = []
    }

    function open() {
      const fixture = TestBed.createComponent(InMenu)
      fixture.detectChanges()
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-menu__trigger')
      trigger.click()
      fixture.detectChanges()
      const items = [
        ...fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
      ] as HTMLElement[]
      return { fixture, trigger, items }
    }

    it('a disabled item keeps the menu open and does nothing', () => {
      const { fixture, trigger, items } = open()
      items[1].focus()
      items[1].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.log).toEqual([])
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(document.activeElement).toBe(items[1])
    })

    it('an enabled item runs, closes the menu and returns focus to the trigger', () => {
      const { fixture, trigger, items } = open()
      items[2].focus()
      items[2].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.log).toEqual(['delete'])
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger)
    })

    it('arrow keys move through the items, disabled ones included', () => {
      const { items, fixture } = open()
      const list = fixture.nativeElement.querySelector('[role="menu"]')
      items[0].focus()
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      expect(document.activeElement).toBe(items[1])
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      expect(document.activeElement).toBe(items[2])
    })
  })

  describe('accessibility', () => {
    it('has no a11y violations inside an open menu (icons, danger, disabled, link)', async () => {
      @Component({
        standalone: true,
        imports: [Menu, MenuItem],
        template: `
          <gbt-menu label="Row actions">
            <a gbtMenuItem href="#/x" icon="user">Profile</a>
            <button gbtMenuItem [disabled]="true">Archive</button>
            <button gbtMenuItem variant="danger" icon="trash-2">Delete</button>
          </gbt-menu>
        `,
      })
      class A11yHost {}
      const fixture = TestBed.createComponent(A11yHost)
      fixture.detectChanges()
      fixture.nativeElement.querySelector('.gbt-menu__trigger').click()
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
