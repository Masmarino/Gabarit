import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, Directive, HostListener, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { resolveControlHeight } from '../src/testing/control-height'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Button } from './button'

describe('Button', () => {
  it('renders the given text', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Enregistrer')
  })

  it('emits click when clicked while enabled', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(true)
  })

  it('does not emit click when disabled', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('disabled', true)
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(false)
  })

  it('does not emit click while loading', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(false)
  })

  it('keeps the visible text label next to the spinner while loading — a sighted user should not see an unlabelled spinner', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.componentRef.setInput('loading', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-button__spinner')).not.toBeNull()
    expect(fixture.nativeElement.textContent).toContain('Enregistrer')
  })

  it('uses the English default for the loading announcement', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Loading')
  })

  it('renders an overridden loading announcement', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    fixture.componentRef.setInput('loadingLabel', 'Chargement en cours')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Chargement en cours')
  })

  it('presents no accessibility violation', async () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('hides its loading label without depending on global utilities', () => {
    const dir = join(process.cwd(), 'projects/gabarit/button')
    const html = readFileSync(join(dir, 'button.html'), 'utf8')
    const scss = readFileSync(join(dir, 'button.scss'), 'utf8')
    expect(html, 'button.html no longer uses .sr-only').toContain('class="sr-only"')
    const block = /\.sr-only\s*\{([^}]*)\}/.exec(scss)
    expect(block, '.sr-only is not defined in button.scss').not.toBeNull()
    expect(block![1]).toContain('@include a11y.visually-hidden')

    // The mixin comes from the tokens, which ship with the package.
    const mixins = readFileSync(join(dir, '../src/lib/tokens/_a11y.scss'), 'utf8')
    const hidden = /@mixin visually-hidden\s*\{([^}]*)\}/.exec(mixins)![1]
    expect(hidden).toContain('position: absolute')
    expect(hidden).toContain('width: 1px')
    expect(hidden).toMatch(/clip-path:|clip:/)
  })

  it('presents no violation as an icon-only button', async () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', '')
    fixture.componentRef.setInput('iconName', 'check')
    fixture.componentRef.setInput('ariaLabel', 'Valider')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  describe("defaults keep today's rendering", () => {
    function render(inputs: Record<string, unknown> = { text: 'Enregistrer' }) {
      const fixture = TestBed.createComponent(Button)
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      const host: HTMLElement = fixture.nativeElement
      const button: HTMLButtonElement = host.querySelector('button')!
      return { fixture, host, button }
    }

    it('renders a plain primary/medium button of type "button" with only the historical classes', () => {
      const { button } = render()
      expect(Array.from(button.classList).sort()).toEqual([
        'gbt-button',
        'gbt-button--medium',
        'gbt-button--primary',
      ])
      expect(button.getAttribute('type')).toBe('button')
      expect(button.disabled).toBe(false)
    })

    it('emits none of the new ARIA attributes unless asked to', () => {
      const { button } = render()
      for (const attribute of [
        'aria-pressed',
        'aria-expanded',
        'aria-controls',
        'aria-haspopup',
        'aria-label',
        'aria-busy',
      ]) {
        expect(button.hasAttribute(attribute), attribute).toBe(false)
      }
    })

    it('keeps the icon then the text span, in this order', () => {
      const { button } = render({ text: 'Valider', iconName: 'check' })
      expect(Array.from(button.children).map((child) => child.tagName.toLowerCase())).toEqual([
        'gbt-icon',
        'span',
      ])
      expect(button.querySelector('span')!.textContent).toBe('Valider')
    })

    it('is not a block button, so the host stays an inline-sized box', () => {
      const { host } = render()
      expect(host.classList.contains('gbt-button-host--block')).toBe(false)
    })
  })

  describe('icon-only rendering', () => {
    it('renders no text span when there is no text — no stray flex gap next to the icon', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'check')
      fixture.componentRef.setInput('ariaLabel', 'Valider')
      fixture.detectChanges()

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
      expect(button.querySelector('span')).toBeNull()
      expect(Array.from(button.children).map((child) => child.tagName.toLowerCase())).toEqual([
        'gbt-icon',
      ])
    })

    it('renders no empty span either while loading an icon-only button', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'check')
      fixture.componentRef.setInput('ariaLabel', 'Valider')
      fixture.componentRef.setInput('loading', true)
      fixture.detectChanges()

      const spans = Array.from(fixture.nativeElement.querySelectorAll('button > span')).map(
        (span) => (span as HTMLElement).className,
      )
      expect(spans).toEqual(['gbt-button__spinner', 'sr-only'])
    })

    it('renders the text span again as soon as text is set', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'check')
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('button > span')).toBeNull()

      fixture.componentRef.setInput('text', 'Valider')
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('button > span').textContent).toBe('Valider')
    })

    it('squares the button with iconOnly, and only then', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'check')
      fixture.componentRef.setInput('ariaLabel', 'Valider')
      fixture.detectChanges()
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
      expect(button.classList.contains('gbt-button--icon-only')).toBe(false)

      fixture.componentRef.setInput('iconOnly', true)
      fixture.detectChanges()
      expect(button.classList.contains('gbt-button--icon-only')).toBe(true)
    })
  })

  describe('toggle and disclosure semantics', () => {
    function render(inputs: Record<string, unknown>) {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Étoile')
      for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      return {
        fixture,
        button: fixture.nativeElement.querySelector('button') as HTMLButtonElement,
      }
    }

    it('reflects pressed on the inner button as aria-pressed, both states', () => {
      const { fixture, button } = render({ pressed: true })
      expect(button.getAttribute('aria-pressed')).toBe('true')

      fixture.componentRef.setInput('pressed', false)
      fixture.detectChanges()
      expect(button.getAttribute('aria-pressed')).toBe('false')

      fixture.componentRef.setInput('pressed', null)
      fixture.detectChanges()
      expect(button.hasAttribute('aria-pressed')).toBe(false)
    })

    it('reflects ariaExpanded as aria-expanded, both states', () => {
      const { fixture, button } = render({ ariaExpanded: false })
      expect(button.getAttribute('aria-expanded')).toBe('false')

      fixture.componentRef.setInput('ariaExpanded', true)
      fixture.detectChanges()
      expect(button.getAttribute('aria-expanded')).toBe('true')
    })

    it('reflects ariaControls as aria-controls', () => {
      const { button } = render({ ariaControls: 'panel-1' })
      expect(button.getAttribute('aria-controls')).toBe('panel-1')
    })

    it('reflects ariaHaspopup as aria-haspopup, with a token or a boolean', () => {
      const { fixture, button } = render({ ariaHaspopup: 'menu' })
      expect(button.getAttribute('aria-haspopup')).toBe('menu')

      fixture.componentRef.setInput('ariaHaspopup', true)
      fixture.detectChanges()
      expect(button.getAttribute('aria-haspopup')).toBe('true')
    })

    it('draws a ring inside a pressed button, so the state is not carried by colour alone', () => {
      const { fixture, button } = render({ pressed: false })
      expect(getComputedStyle(button).boxShadow).not.toContain('inset')

      fixture.componentRef.setInput('pressed', true)
      fixture.detectChanges()
      expect(getComputedStyle(button).boxShadow).toContain('inset')
    })

    it('still emits clicked for a pressed/expanded button (the consumer flips the state)', () => {
      const { fixture, button } = render({ pressed: false, ariaExpanded: false })
      let count = 0
      fixture.componentInstance.clicked.subscribe(() => count++)
      button.click()
      expect(count).toBe(1)
    })
  })

  describe('block', () => {
    it('adds the host block class only when block is set', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Se connecter')
      fixture.detectChanges()
      const host: HTMLElement = fixture.nativeElement
      expect(host.classList.contains('gbt-button-host--block')).toBe(false)

      fixture.componentRef.setInput('block', true)
      fixture.detectChanges()
      expect(host.classList.contains('gbt-button-host--block')).toBe(true)
    })

    it('stretches host and button to the container width', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Se connecter')
      fixture.componentRef.setInput('block', true)
      fixture.detectChanges()
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
      expect(getComputedStyle(fixture.nativeElement).display).toBe('block')
      expect(getComputedStyle(fixture.nativeElement).width).toBe('100%')
      expect(getComputedStyle(button).width).toBe('100%')
    })
  })

  describe('quiet variants', () => {
    it.each(['ghost', 'ghost-danger', 'link'] as const)(
      'applies the gbt-button--%s class',
      (variant) => {
        const fixture = TestBed.createComponent(Button)
        fixture.componentRef.setInput('text', 'Annuler')
        fixture.componentRef.setInput('variant', variant)
        fixture.detectChanges()
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
        expect(button.classList.contains(`gbt-button--${variant}`)).toBe(true)
      },
    )

    it('gives ghost and ghost-danger no fill and no border at rest', () => {
      for (const variant of ['ghost', 'ghost-danger'] as const) {
        const fixture = TestBed.createComponent(Button)
        fixture.componentRef.setInput('text', 'Annuler')
        fixture.componentRef.setInput('variant', variant)
        fixture.detectChanges()
        const style = getComputedStyle(fixture.nativeElement.querySelector('button'))
        expect(style.backgroundColor, variant).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/)
        expect(style.borderStyle === 'none' || style.borderWidth === '0px', variant).toBe(true)
      }
    })

    it('underlines the link variant, so it is not told apart by colour alone', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Mot de passe oublié')
      fixture.componentRef.setInput('variant', 'link')
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('button').className).toContain('gbt-button--link')
      // jsdom does not compute text-decoration: guard the stylesheet source instead.
      const scss = readFileSync(
        join(process.cwd(), 'projects/gabarit/button/_button-look.scss'),
        'utf8',
      )
      expect(scss).toMatch(/'\.gbt-button--link'\)\s*\{[^}]*text-decoration:\s*underline/)
    })
  })

  describe('sizes', () => {
    it('reaches a 44px tall touch target at the large size', () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Continuer')
      fixture.componentRef.setInput('size', 'large')
      fixture.detectChanges()
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button')
      expect(button.classList.contains('gbt-button--large')).toBe(true)

      expect(getComputedStyle(button).minHeight).toBe('var(--gbt-control-height-lg)')
      expect(resolveControlHeight(getComputedStyle(button).minHeight)).toBe(44)
    })

    it.each([
      ['small', 32],
      ['medium', 38],
    ] as const)('sizes the %s button to the shared control scale (%ipx)', (size, px) => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Continuer')
      fixture.componentRef.setInput('size', size)
      fixture.detectChanges()
      const style = getComputedStyle(fixture.nativeElement.querySelector('button'))
      expect(resolveControlHeight(style.minHeight)).toBe(px)
    })

    it.each([
      ['small', 32],
      ['medium', 38],
      ['large', 44],
    ] as const)('squares an icon-only %s button (%ipx on each side)', (size, px) => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'check')
      fixture.componentRef.setInput('iconOnly', true)
      fixture.componentRef.setInput('ariaLabel', 'Valider')
      fixture.componentRef.setInput('size', size)
      fixture.detectChanges()
      const style = getComputedStyle(fixture.nativeElement.querySelector('button'))
      expect(resolveControlHeight(style.minHeight)).toBe(px)
      expect(resolveControlHeight(style.minWidth)).toBe(px)
    })

    it('leaves the link variant free of the control height, at every size', () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const fixture = TestBed.createComponent(Button)
        fixture.componentRef.setInput('text', 'Mot de passe oublié')
        fixture.componentRef.setInput('variant', 'link')
        fixture.componentRef.setInput('size', size)
        fixture.detectChanges()
        const style = getComputedStyle(fixture.nativeElement.querySelector('button'))
        expect(['', '0px', '0', 'auto']).toContain(style.minHeight)
      }
    })
  })

  describe('accessibility of the new states', () => {
    it('presents no violation for a toggle button', async () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Suivre')
      fixture.componentRef.setInput('pressed', true)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('presents no violation for a disclosure/menu trigger', async () => {
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('text', 'Options')
      fixture.componentRef.setInput('ariaExpanded', true)
      fixture.componentRef.setInput('ariaControls', 'options-panel')
      fixture.componentRef.setInput('ariaHaspopup', 'menu')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('presents no violation for the quiet variants, an icon-only square and a block button', async () => {
      for (const variant of ['ghost', 'ghost-danger', 'link'] as const) {
        const fixture = TestBed.createComponent(Button)
        fixture.componentRef.setInput('text', 'Supprimer')
        fixture.componentRef.setInput('variant', variant)
        fixture.componentRef.setInput('block', true)
        fixture.detectChanges()
        await expectNoA11yViolations(fixture.nativeElement)
      }
      const fixture = TestBed.createComponent(Button)
      fixture.componentRef.setInput('iconName', 'x')
      fixture.componentRef.setInput('ariaLabel', 'Fermer')
      fixture.componentRef.setInput('iconOnly', true)
      fixture.componentRef.setInput('variant', 'ghost')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})

/** Stands in for a router link: it navigates from its own click listener on the same anchor. */
@Directive({ selector: '[gbtFakeNavigate]', standalone: true })
class FakeNavigate {
  static navigations = 0

  @HostListener('click')
  navigate(): void {
    FakeNavigate.navigations++
  }
}

@Component({
  standalone: true,
  imports: [Button, FakeNavigate],
  template: `
    <a
      gbtButton
      href="#/groups"
      gbtFakeNavigate
      [variant]="variant()"
      [size]="size()"
      [block]="block()"
      [iconName]="iconName()"
      [iconOnly]="iconOnly()"
      [disabled]="disabled()"
      (click)="clicks.update((n) => n + 1)"
      >Groupes</a
    >
  `,
})
class HostComponent {
  variant = signal<ButtonVariantForTest>('primary')
  size = signal<'small' | 'medium' | 'large'>('medium')
  block = signal(false)
  iconName = signal<string | null>(null)
  iconOnly = signal(false)
  disabled = signal(false)
  clicks = signal(0)
}

type ButtonVariantForTest = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger' | 'link'

function renderLink(configure: (host: HostComponent) => void = () => {}) {
  const fixture = TestBed.createComponent(HostComponent)
  configure(fixture.componentInstance)
  fixture.detectChanges()
  const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a')
  return { fixture, link }
}

// The anchor form (`a[gbtButton]`) of the same `Button` class — formerly the separate `ButtonLink`
// component. Every behavioural assertion from the old `button-link.spec.ts` lives here, unchanged.
describe('Button as a[gbtButton] (anchor form)', () => {
  beforeEach(() => {
    FakeNavigate.navigations = 0
  })

  it('keeps the native anchor: same element, same href, projected text', () => {
    const { link } = renderLink()
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('#/groups')
    expect(link.textContent?.trim()).toBe('Groupes')
  })

  it('carries the button classes on the anchor itself, primary and medium by default', () => {
    const { link } = renderLink()
    expect(link.classList.contains('gbt-button')).toBe(true)
    expect(link.classList.contains('gbt-button--primary')).toBe(true)
    expect(link.classList.contains('gbt-button--medium')).toBe(true)
    expect(link.classList.contains('gbt-button--icon-only')).toBe(false)
    expect(link.classList.contains('gbt-button-host--block')).toBe(false)
  })

  it('renders exactly what a gbt-button of the same variant renders, plus the anchor semantics', () => {
    const { link } = renderLink()
    expect(link.hasAttribute('aria-disabled')).toBe(false)
    expect(link.hasAttribute('tabindex')).toBe(false)
    expect(link.hasAttribute('role')).toBe(false)
  })

  it.each(['primary', 'secondary', 'danger', 'ghost', 'ghost-danger', 'link'] as const)(
    'supports the %s variant',
    (variant) => {
      const { link } = renderLink((host) => host.variant.set(variant))
      expect(link.classList.contains(`gbt-button--${variant}`)).toBe(true)
    },
  )

  it.each(['small', 'medium', 'large'] as const)('supports the %s size', (size) => {
    const { link } = renderLink((host) => host.size.set(size))
    expect(link.classList.contains(`gbt-button--${size}`)).toBe(true)
  })

  it('reaches 44px tall at the large size', () => {
    const { link } = renderLink((host) => host.size.set('large'))
    expect(getComputedStyle(link).minHeight).toBe('var(--gbt-control-height-lg)')
    expect(resolveControlHeight(getComputedStyle(link).minHeight)).toBe(44)
  })

  it('renders the icon before the projected text', () => {
    const { link } = renderLink((host) => host.iconName.set('check'))
    expect(link.firstElementChild?.tagName.toLowerCase()).toBe('gbt-icon')
    expect(link.textContent?.trim()).toBe('Groupes')
  })

  it('squares an icon-only link, and stretches a block link', () => {
    const { fixture, link } = renderLink((host) => {
      host.iconName.set('plus')
      host.iconOnly.set(true)
      host.block.set(true)
    })
    expect(link.classList.contains('gbt-button--icon-only')).toBe(true)
    expect(link.classList.contains('gbt-button-host--block')).toBe(true)
    expect(getComputedStyle(link).width).toBe('100%')
    expect(fixture.nativeElement.querySelector('a gbt-icon')).not.toBeNull()
  })

  it('keeps a consumer tabindex while the link is enabled', () => {
    const fixture = TestBed.createComponent(TabindexHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('a').getAttribute('tabindex')).toBe('0')
  })

  it('restores the consumer tabindex after a disabled spell, and removes the attribute when there was none', () => {
    const { fixture, link } = renderLink((host) => host.disabled.set(true))
    expect(link.getAttribute('tabindex')).toBe('-1')
    fixture.componentInstance.disabled.set(false)
    fixture.detectChanges()
    expect(link.hasAttribute('tabindex')).toBe(false)

    fixture.componentInstance.disabled.set(true)
    fixture.detectChanges()
    fixture.componentInstance.disabled.set(false)
    fixture.detectChanges()
    expect(link.hasAttribute('tabindex')).toBe(false)

    const withTabindex = TestBed.createComponent(TabindexHost)
    withTabindex.detectChanges()
    const anchor: HTMLAnchorElement = withTabindex.nativeElement.querySelector('a')
    expect(anchor.getAttribute('tabindex')).toBe('0')
    withTabindex.componentInstance.disabled.set(true)
    withTabindex.detectChanges()
    expect(anchor.getAttribute('tabindex')).toBe('-1')
    withTabindex.componentInstance.disabled.set(false)
    withTabindex.detectChanges()
    expect(anchor.getAttribute('tabindex')).toBe('0')
  })

  it('forces text-decoration: none with one class more than a global a:hover rule', () => {
    const scss = readFileSync(join(process.cwd(), 'projects/gabarit/button/button.scss'), 'utf8')
    expect(scss).toMatch(/:host\(a\.gbt-button\)\s*\{[^}]*text-decoration:\s*none/)
  })

  it('lets a consumer class through next to the button classes', () => {
    const fixture = TestBed.createComponent(ClassHost)
    fixture.detectChanges()
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a')
    expect(link.classList.contains('my-link')).toBe(true)
    expect(link.classList.contains('gbt-button')).toBe(true)
  })

  describe('disabled', () => {
    it('exposes aria-disabled and takes the link out of the tab order', () => {
      const { link } = renderLink((host) => host.disabled.set(true))
      expect(link.getAttribute('aria-disabled')).toBe('true')
      expect(link.getAttribute('tabindex')).toBe('-1')
    })

    it('does not navigate: the default action is prevented', () => {
      const { link } = renderLink((host) => host.disabled.set(true))
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    it('stops the click before a router-link-like listener on the same anchor, and before the consumer (click)', () => {
      const { fixture, link } = renderLink((host) => host.disabled.set(true))
      link.click()
      expect(FakeNavigate.navigations).toBe(0)
      expect(fixture.componentInstance.clicks()).toBe(0)
    })

    it('blocks a click that lands on the icon inside the link as well', () => {
      const { fixture, link } = renderLink((host) => {
        host.iconName.set('check')
        host.disabled.set(true)
      })
      link.querySelector<HTMLElement>('gbt-icon')!.click()
      expect(FakeNavigate.navigations).toBe(0)
      expect(fixture.componentInstance.clicks()).toBe(0)
    })

    it('also blocks a middle click (auxclick) from opening the link', () => {
      const { link } = renderLink((host) => host.disabled.set(true))
      const event = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    it('dims the link and shows the not-allowed cursor', () => {
      const { link } = renderLink((host) => host.disabled.set(true))
      expect(getComputedStyle(link).cursor).toBe('not-allowed')
      expect(getComputedStyle(link).opacity).toBe('0.5')
    })

    it('behaves normally again once re-enabled', () => {
      const { fixture, link } = renderLink((host) => host.disabled.set(true))
      fixture.componentInstance.disabled.set(false)
      fixture.detectChanges()
      expect(link.hasAttribute('aria-disabled')).toBe(false)
      expect(link.hasAttribute('tabindex')).toBe(false)

      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
      expect(FakeNavigate.navigations).toBe(1)
      expect(fixture.componentInstance.clicks()).toBe(1)
    })
  })

  describe('enabled', () => {
    it('lets the click through to the router link and to the consumer handler', () => {
      const { fixture, link } = renderLink()
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
      expect(FakeNavigate.navigations).toBe(1)
      expect(fixture.componentInstance.clicks()).toBe(1)
    })
  })

  it('presents no accessibility violation as a text link-button', async () => {
    const { fixture } = renderLink()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation when disabled, with an icon, and in each variant', async () => {
    for (const variant of ['secondary', 'danger', 'ghost', 'ghost-danger', 'link'] as const) {
      const { fixture } = renderLink((host) => {
        host.variant.set(variant)
        host.iconName.set('check')
        host.disabled.set(true)
      })
      await expectNoA11yViolations(fixture.nativeElement)
    }
  })

  it('presents no accessibility violation as an icon-only link with an accessible name', async () => {
    const fixture = TestBed.createComponent(IconOnlyHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('never imports @angular/router: the button module stays router-agnostic', () => {
    const ts = readFileSync(join(process.cwd(), 'projects/gabarit/button/button.ts'), 'utf8')
    expect(ts).not.toMatch(/from ['"]@angular\/router['"]/)
  })
})

@Component({
  standalone: true,
  imports: [Button],
  template: `<a gbtButton href="#/x" tabindex="0" [disabled]="disabled()">Aller</a>`,
})
class TabindexHost {
  disabled = signal(false)
}

@Component({
  standalone: true,
  imports: [Button],
  template: `<a gbtButton class="my-link" href="#/x">Aller</a>`,
})
class ClassHost {}

@Component({
  standalone: true,
  imports: [Button],
  template: `<a
    gbtButton
    href="#/new"
    aria-label="Nouveau groupe"
    iconName="plus"
    [iconOnly]="true"
  ></a>`,
})
class IconOnlyHost {}
