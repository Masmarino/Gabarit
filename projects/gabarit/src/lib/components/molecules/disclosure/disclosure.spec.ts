import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Disclosure } from './disclosure'

@Component({
  standalone: true,
  imports: [Disclosure],
  template: `
    <gbt-disclosure
      label="Advanced options"
      [(open)]="open"
      [headingLevel]="level()"
      [icon]="icon()"
    >
      <label>Pipeline file <input class="inside" value=".ferrisgit-ci.yml" /></label>
    </gbt-disclosure>
  `,
})
class Host {
  open = signal(false)
  level = signal<2 | 3 | 4 | 5 | 6 | null>(null)
  icon = signal<string | null>(null)
}

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    button: () => root.querySelector('button') as HTMLButtonElement,
    panel: () => root.querySelector('.gbt-disclosure__panel') as HTMLElement,
  }
}

describe('Disclosure', () => {
  it('starts closed: aria-expanded false, the panel inert and linked by aria-controls', () => {
    const { button, panel } = setup()

    expect(button().getAttribute('type')).toBe('button')
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(button().textContent).toContain('Advanced options')
    expect(panel().hasAttribute('inert')).toBe(true)
    expect(button().getAttribute('aria-controls')).toBe(panel().id)
    expect(panel().hasAttribute('data-open')).toBe(false)
  })

  it('opens and closes on click, and keeps the bound model in step', () => {
    const { fixture, host, button, panel } = setup()

    button().click()
    fixture.detectChanges()
    expect(host.open()).toBe(true)
    expect(button().getAttribute('aria-expanded')).toBe('true')
    expect(panel().hasAttribute('inert')).toBe(false)
    expect(panel().hasAttribute('data-open')).toBe(true)

    button().click()
    fixture.detectChanges()
    expect(host.open()).toBe(false)
    expect(button().getAttribute('aria-expanded')).toBe('false')
    expect(panel().hasAttribute('inert')).toBe(true)
  })

  it('follows the model when the host sets it', () => {
    const { fixture, host, button, panel } = setup()
    host.open.set(true)
    fixture.detectChanges()

    expect(button().getAttribute('aria-expanded')).toBe('true')
    expect(panel().hasAttribute('inert')).toBe(false)
  })

  it('renders open when created open', () => {
    const fixture = TestBed.createComponent(Disclosure)
    fixture.componentRef.setInput('label', 'Files')
    fixture.componentRef.setInput('open', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('keeps the panel content in the DOM while closed, but inert (nothing to focus or read)', () => {
    const { root, panel } = setup()

    expect(root.querySelector('.inside')).not.toBeNull()
    expect(panel().contains(root.querySelector('.inside'))).toBe(true)
    expect(panel().hasAttribute('inert')).toBe(true)
  })

  it('is not a heading by default, and wraps the button in the requested level', () => {
    const { fixture, host, root, button } = setup()
    expect(root.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()

    for (const level of [2, 3, 4, 5, 6] as const) {
      host.level.set(level)
      fixture.detectChanges()
      const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(1)
      expect(headings[0].tagName).toBe(`H${level}`)
      expect(headings[0].contains(button())).toBe(true)
    }
  })

  it('shows an optional icon before the label', () => {
    const { fixture, host, root } = setup()
    expect(root.querySelectorAll('button gbt-icon').length).toBe(1) // the chevron

    host.icon.set('folder')
    fixture.detectChanges()
    expect(root.querySelectorAll('button gbt-icon').length).toBe(2)
  })

  it('applies the appearance', () => {
    const fixture = TestBed.createComponent(Disclosure)
    fixture.componentRef.setInput('label', 'More')
    fixture.detectChanges()
    const root = fixture.nativeElement.querySelector('.gbt-disclosure') as HTMLElement
    expect(root.getAttribute('data-appearance')).toBe('bordered')

    fixture.componentRef.setInput('appearance', 'plain')
    fixture.detectChanges()
    expect(root.getAttribute('data-appearance')).toBe('plain')
  })

  it('gives two disclosures their own ids', () => {
    const fixture = TestBed.createComponent(Disclosure)
    fixture.componentRef.setInput('label', 'A')
    const other = TestBed.createComponent(Disclosure)
    other.componentRef.setInput('label', 'B')
    fixture.detectChanges()
    other.detectChanges()

    const a = fixture.nativeElement.querySelector('button') as HTMLElement
    const b = other.nativeElement.querySelector('button') as HTMLElement
    expect(a.id).not.toBe(b.id)
    expect(a.getAttribute('aria-controls')).not.toBe(b.getAttribute('aria-controls'))
  })

  it('has no accessibility violations (closed, open, with a heading and an icon)', async () => {
    const { fixture, host, root } = setup()
    await expectNoA11yViolations(root)

    host.open.set(true)
    host.level.set(3)
    host.icon.set('folder')
    fixture.detectChanges()
    await expectNoA11yViolations(root)
  })
})
