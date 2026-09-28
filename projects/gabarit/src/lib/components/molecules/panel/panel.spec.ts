import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Panel, PanelHeadingLevel } from './panel'

@Component({
  standalone: true,
  imports: [Panel],
  template: `
    <gbt-panel heading="About" [headingLevel]="level()">
      <button panel-actions type="button" class="edit">Edit</button>
      <p class="body">A self-hosted Git forge written in Rust.</p>
    </gbt-panel>
  `,
})
class PanelHost {
  level = signal<PanelHeadingLevel>(3)
}

@Component({
  standalone: true,
  imports: [Panel],
  template: `
    <gbt-panel heading="Languages"><p>Rust</p></gbt-panel>
    <gbt-panel heading="Contributors"><p>alice</p></gbt-panel>
  `,
})
class TwoPanelsHost {}

describe('Panel', () => {
  it('renders the heading as an <h3> by default', () => {
    const fixture = TestBed.createComponent(PanelHost)
    fixture.detectChanges()

    const heading = fixture.nativeElement.querySelector('.gbt-panel__heading') as HTMLElement
    expect(heading.tagName).toBe('H3')
    expect(heading.textContent?.trim()).toBe('About')
  })

  it('maps headingLevel to h2 / h3 / h4, one heading at a time', () => {
    const fixture = TestBed.createComponent(PanelHost)
    for (const level of [2, 3, 4] as const) {
      fixture.componentInstance.level.set(level)
      fixture.detectChanges()
      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBe(1)
      expect(headings[0].tagName).toBe(`H${level}`)
    }
  })

  it('labels its section (a region landmark) with the heading', () => {
    const fixture = TestBed.createComponent(PanelHost)
    fixture.detectChanges()

    const section = fixture.nativeElement.querySelector('section') as HTMLElement
    const heading = fixture.nativeElement.querySelector('.gbt-panel__heading') as HTMLElement
    expect(heading.id).toBeTruthy()
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id)
  })

  it('keeps the label pointing at the heading when the level changes', () => {
    const fixture = TestBed.createComponent(PanelHost)
    fixture.detectChanges()
    fixture.componentInstance.level.set(2)
    fixture.detectChanges()

    const section = fixture.nativeElement.querySelector('section') as HTMLElement
    const heading = fixture.nativeElement.querySelector('h2') as HTMLElement
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id)
  })

  it('renders the actions slot next to the heading and the content below it', () => {
    const fixture = TestBed.createComponent(PanelHost)
    fixture.detectChanges()

    const el = fixture.nativeElement as HTMLElement
    expect(el.querySelector('.gbt-panel__header .gbt-panel__actions .edit')?.textContent).toBe(
      'Edit',
    )
    expect(el.querySelector('.gbt-panel__body .body')?.textContent).toBe(
      'A self-hosted Git forge written in Rust.',
    )
  })

  it('leaves the actions wrapper empty (collapsed by :empty) without an action', () => {
    const fixture = TestBed.createComponent(TwoPanelsHost)
    fixture.detectChanges()

    for (const actions of Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-panel__actions'),
    ) as HTMLElement[]) {
      expect(actions.childNodes.length).toBe(0)
    }
  })

  it('gives each panel a distinct heading id', () => {
    const fixture = TestBed.createComponent(TwoPanelsHost)
    fixture.detectChanges()

    const ids = Array.from(
      fixture.nativeElement.querySelectorAll('.gbt-panel__heading') as NodeListOf<HTMLElement>,
    ).map((h) => h.id)
    expect(ids.length).toBe(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('has no a11y violations, with actions and stacked', async () => {
    const single = TestBed.createComponent(PanelHost)
    single.detectChanges()
    await expectNoA11yViolations(single.nativeElement)

    const stacked = TestBed.createComponent(TwoPanelsHost)
    stacked.detectChanges()
    await expectNoA11yViolations(stacked.nativeElement)
  })
})
