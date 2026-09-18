import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Accordion } from './accordion'
import { AccordionItem } from '../accordion-item/accordion-item'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Accordion, AccordionItem],
  template: `
    <gbt-accordion>
      <gbt-accordion-item label="Un"><p>Contenu un</p></gbt-accordion-item>
      <gbt-accordion-item label="Deux"><p>Contenu deux</p></gbt-accordion-item>
      <gbt-accordion-item label="Trois"><p>Contenu trois</p></gbt-accordion-item>
    </gbt-accordion>
  `,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [Accordion, AccordionItem],
  template: `
    <gbt-accordion mode="multiple">
      <gbt-accordion-item label="Un"><p>Contenu un</p></gbt-accordion-item>
      <gbt-accordion-item label="Deux"><p>Contenu deux</p></gbt-accordion-item>
      <gbt-accordion-item label="Trois"><p>Contenu trois</p></gbt-accordion-item>
    </gbt-accordion>
  `,
})
class MultipleHostComponent {}

function render() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

function headers(fixture: ReturnType<typeof render>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.gbt-accordion-item__header'))
}

function panelOpen(fixture: ReturnType<typeof render>, index: number): boolean {
  const panels = fixture.nativeElement.querySelectorAll('.gbt-accordion-item__panel')
  return (panels[index] as HTMLElement).classList.contains('gbt-accordion-item__panel--open')
}

describe('Accordion', () => {
  it('renders one header per projected item, labelled from its input', () => {
    const fixture = render()
    const labels = headers(fixture).map((btn) => btn.textContent?.trim())
    expect(labels).toEqual(['Un', 'Deux', 'Trois'])
  })

  it('starts with every panel collapsed by default', () => {
    const fixture = render()
    expect(panelOpen(fixture, 0)).toBe(false)
    expect(panelOpen(fixture, 1)).toBe(false)
    expect(panelOpen(fixture, 2)).toBe(false)
  })

  it('expands a panel when its header is clicked', () => {
    const fixture = render()
    headers(fixture)[1].click()
    fixture.detectChanges()

    expect(panelOpen(fixture, 1)).toBe(true)
    expect(fixture.nativeElement.textContent).toContain('Contenu deux')
  })

  it('collapses the previously open panel in single mode', () => {
    const fixture = render()
    headers(fixture)[0].click()
    fixture.detectChanges()
    headers(fixture)[1].click()
    fixture.detectChanges()

    expect(panelOpen(fixture, 0)).toBe(false)
    expect(panelOpen(fixture, 1)).toBe(true)
  })

  it('collapses the open panel when clicking its header again, in single mode', () => {
    const fixture = render()
    headers(fixture)[0].click()
    fixture.detectChanges()
    headers(fixture)[0].click()
    fixture.detectChanges()

    expect(panelOpen(fixture, 0)).toBe(false)
  })

  it('marks the active header with aria-expanded', () => {
    const fixture = render()
    headers(fixture)[2].click()
    fixture.detectChanges()

    const buttons = headers(fixture)
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
  })

  it('marks a collapsed panel inert, and an open one not', () => {
    const fixture = render()
    headers(fixture)[0].click()
    fixture.detectChanges()

    const panels = fixture.nativeElement.querySelectorAll('.gbt-accordion-item__panel')
    expect((panels[0] as HTMLElement).hasAttribute('inert')).toBe(false)
    expect((panels[1] as HTMLElement).hasAttribute('inert')).toBe(true)
  })

  it('links each header to its panel via gbt--prefixed identifiers', () => {
    const fixture = render()
    const buttons = headers(fixture)
    const panels = fixture.nativeElement.querySelectorAll('.gbt-accordion-item__panel')

    for (let i = 0; i < buttons.length; i++) {
      const headerId = buttons[i].getAttribute('id')
      const panelId = buttons[i].getAttribute('aria-controls')
      expect(headerId).toMatch(/^gbt-accordion-\d+-header-\d+$/)
      expect(panelId).toMatch(/^gbt-accordion-\d+-panel-\d+$/)
      expect(panels[i].getAttribute('id')).toBe(panelId)
      expect(panels[i].getAttribute('aria-labelledby')).toBe(headerId)
    }
  })

  it('moves focus to the next header with ArrowDown, wrapping past the last', () => {
    const fixture = render()
    const buttons = headers(fixture)
    buttons[2].focus()
    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    fixture.detectChanges()

    expect(document.activeElement).toBe(headers(fixture)[0])
  })

  it('moves focus to the previous header with ArrowUp, wrapping before the first', () => {
    const fixture = render()
    const buttons = headers(fixture)
    buttons[0].focus()
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    fixture.detectChanges()

    expect(document.activeElement).toBe(headers(fixture)[2])
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(render().nativeElement)
  })

  it('has no a11y violations with a panel open', async () => {
    const fixture = render()
    headers(fixture)[0].click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Accordion — multiple mode', () => {
  function renderMultiple() {
    const fixture = TestBed.createComponent(MultipleHostComponent)
    fixture.detectChanges()
    return fixture
  }

  it('allows several panels open at once', () => {
    const fixture = renderMultiple()
    headers(fixture)[0].click()
    fixture.detectChanges()
    headers(fixture)[1].click()
    fixture.detectChanges()

    expect(panelOpen(fixture, 0)).toBe(true)
    expect(panelOpen(fixture, 1)).toBe(true)
  })

  it('toggles a single panel independently of the others', () => {
    const fixture = renderMultiple()
    headers(fixture)[0].click()
    headers(fixture)[1].click()
    fixture.detectChanges()

    headers(fixture)[0].click()
    fixture.detectChanges()

    expect(panelOpen(fixture, 0)).toBe(false)
    expect(panelOpen(fixture, 1)).toBe(true)
  })
})

@Component({
  standalone: true,
  imports: [Accordion, AccordionItem],
  template: `
    <gbt-accordion [expanded]="expanded" (expandedChange)="expanded = $event">
      <gbt-accordion-item label="Un"><p>Contenu un</p></gbt-accordion-item>
      <gbt-accordion-item label="Deux"><p>Contenu deux</p></gbt-accordion-item>
    </gbt-accordion>
  `,
})
class ControlledHostComponent {
  expanded: number[] = [0]
}

describe('Accordion — external control', () => {
  it('opens the panel named by an externally-set expanded array', () => {
    const fixture = TestBed.createComponent(ControlledHostComponent)
    fixture.detectChanges()

    expect(panelOpen(fixture, 0)).toBe(true)
    expect(panelOpen(fixture, 1)).toBe(false)
  })

  it('emits expandedChange, and reflects the parent update back, when a header is clicked', () => {
    const fixture = TestBed.createComponent(ControlledHostComponent)
    fixture.detectChanges()

    headers(fixture)[1].click()
    fixture.detectChanges()

    expect(fixture.componentInstance.expanded).toEqual([1])
    expect(panelOpen(fixture, 1)).toBe(true)
  })
})
