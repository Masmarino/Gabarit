import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Tabs } from './tabs'
import { Tab } from '../tab/tab'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Tabs, Tab],
  template: `
    <gbt-tabs>
      <gbt-tab label="Un"><p>Contenu un</p></gbt-tab>
      <gbt-tab label="Deux"><p>Contenu deux</p></gbt-tab>
      <gbt-tab label="Trois"><p>Contenu trois</p></gbt-tab>
    </gbt-tabs>
  `,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [Tabs, Tab],
  template: `
    <gbt-tabs>
      <gbt-tab label="Groupe 1 — Un"><p>1A</p></gbt-tab>
      <gbt-tab label="Groupe 1 — Deux"><p>1B</p></gbt-tab>
    </gbt-tabs>
    <gbt-tabs>
      <gbt-tab label="Groupe 2 — Un"><p>2A</p></gbt-tab>
      <gbt-tab label="Groupe 2 — Deux"><p>2B</p></gbt-tab>
    </gbt-tabs>
  `,
})
class TwoGroupsHostComponent {}

function render() {
  TestBed.configureTestingModule({ imports: [HostComponent] })
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

function triggers(fixture: ReturnType<typeof render>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.gbt-tabs__trigger'))
}

function panelDisplay(fixture: ReturnType<typeof render>, index: number): string {
  const panels = fixture.nativeElement.querySelectorAll('gbt-tab')
  return (panels[index] as HTMLElement).style.display
}

describe('Tabs', () => {
  it("renders one trigger per projected tab, labelled from each tab's input", () => {
    const fixture = render()

    const labels = triggers(fixture).map((btn) => btn.textContent?.trim())
    expect(labels).toEqual(['Un', 'Deux', 'Trois'])
  })

  it('shows only the first tab panel by default', () => {
    const fixture = render()

    expect(panelDisplay(fixture, 0)).not.toBe('none')
    expect(panelDisplay(fixture, 1)).toBe('none')
    expect(panelDisplay(fixture, 2)).toBe('none')
    expect(fixture.nativeElement.textContent).toContain('Contenu un')
  })

  it('switches the visible panel when a trigger is clicked', () => {
    const fixture = render()

    triggers(fixture)[1].click()
    fixture.detectChanges()

    expect(panelDisplay(fixture, 0)).toBe('none')
    expect(panelDisplay(fixture, 1)).not.toBe('none')
    expect(panelDisplay(fixture, 2)).toBe('none')
  })

  it('marks the active trigger with aria-selected and the active class', () => {
    const fixture = render()

    triggers(fixture)[2].click()
    fixture.detectChanges()

    const buttons = triggers(fixture)
    expect(buttons[2].getAttribute('aria-selected')).toBe('true')
    expect(buttons[2].classList.contains('gbt-tabs__trigger--active')).toBe(true)
    expect(buttons[0].getAttribute('aria-selected')).toBe('false')
  })

  it('moves selection and focus with the right arrow key, wrapping past the last tab', () => {
    const fixture = render()
    const buttons = triggers(fixture)

    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    fixture.detectChanges()

    expect(panelDisplay(fixture, 0)).not.toBe('none')
    expect(document.activeElement).toBe(triggers(fixture)[0])
  })

  it('moves selection with the left arrow key, wrapping before the first tab', () => {
    const fixture = render()
    const buttons = triggers(fixture)

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    fixture.detectChanges()

    expect(panelDisplay(fixture, 2)).not.toBe('none')
  })
})

describe('Tabs — ARIA consistency', () => {
  it('links each panel to its tab via gbt--prefixed identifiers', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const panels = fixture.nativeElement.querySelectorAll('[role="tabpanel"]')
    expect(panels.length).toBe(3)

    for (const panel of panels) {
      const id = panel.getAttribute('id')
      const labelledBy = panel.getAttribute('aria-labelledby')
      expect(id).toMatch(/^gbt-tabs-\d+-panel-\d+$/)
      expect(labelledBy).toMatch(/^gbt-tabs-\d+-trigger-\d+$/)
      expect(fixture.nativeElement.querySelector(`#${labelledBy}`)).not.toBeNull()
    }
  })

  it('namespaces ids per instance, so two gbt-tabs groups on the same page never collide', () => {
    const fixture = TestBed.createComponent(TwoGroupsHostComponent)
    fixture.detectChanges()

    const groups: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('gbt-tabs'))
    expect(groups.length).toBe(2)

    const allPanels: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tabpanel"]'),
    )
    const allTriggers: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tab"]'),
    )
    expect(allPanels.length).toBe(4)
    expect(allTriggers.length).toBe(4)

    const panelIds = allPanels.map((p) => p.getAttribute('id'))
    const triggerIds = allTriggers.map((t) => t.getAttribute('id'))
    expect(new Set(panelIds).size).toBe(4)
    expect(new Set(triggerIds).size).toBe(4)

    for (const group of groups) {
      const groupPanels: HTMLElement[] = Array.from(group.querySelectorAll('[role="tabpanel"]'))
      const groupTriggerIds = new Set(
        Array.from(group.querySelectorAll('[role="tab"]')).map((t) => t.getAttribute('id')),
      )
      for (const panel of groupPanels) {
        const labelledBy = panel.getAttribute('aria-labelledby')
        expect(groupTriggerIds.has(labelledBy)).toBe(true)
      }
    }
  })
})

describe('Tabs — accessibility', () => {
  it('presents no accessibility violation', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('allows navigating between tabs with arrow keys — criterion 7.3', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const triggers = fixture.nativeElement.querySelectorAll('[role="tab"]')
    triggers[0].focus()
    triggers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    fixture.detectChanges()
    expect(document.activeElement).toBe(triggers[1])
    expect(triggers[1].getAttribute('aria-selected')).toBe('true')
  })
})
