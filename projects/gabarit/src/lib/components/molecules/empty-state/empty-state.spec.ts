import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { EmptyState, EmptyStateIllustration } from './empty-state'

@Component({
  standalone: true,
  imports: [EmptyState],
  template: `
    <gbt-empty-state illustration="folder" heading="Aucun dépôt" message="Créez votre premier dépôt.">
      <button type="button">Nouveau dépôt</button>
    </gbt-empty-state>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

function setupState() {
  const fixture = TestBed.createComponent(EmptyState)
  fixture.componentRef.setInput('illustration', 'folder')
  fixture.componentRef.setInput('heading', 'Aucun dépôt')
  fixture.detectChanges()
  return fixture
}

const ALL_ILLUSTRATIONS: EmptyStateIllustration[] = ['folder', 'star', 'checklist', 'merge', 'pipeline', 'tag', 'book', 'server']

describe('EmptyState', () => {
  it('renders the heading and message', () => {
    const fixture = setup()
    const text = fixture.nativeElement.textContent as string
    expect(text).toContain('Aucun dépôt')
    expect(text).toContain('Créez votre premier dépôt.')
  })

  it('renders no message paragraph when none is given', () => {
    const fixture = setupState()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__message')).toBeNull()
  })

  it('projects the action content', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('button')?.textContent).toBe('Nouveau dépôt')
  })

  it('marks the illustration as decorative', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__illustration')?.getAttribute('aria-hidden')).toBe('true')
  })

  it.each(ALL_ILLUSTRATIONS)('renders real SVG content for the %s illustration', (illustration) => {
    const fixture = TestBed.createComponent(EmptyState)
    fixture.componentRef.setInput('illustration', illustration)
    fixture.componentRef.setInput('heading', 'Heading')
    fixture.detectChanges()
    const svg = fixture.nativeElement.querySelector('.gbt-empty-state__illustration svg')
    expect(svg).not.toBeNull()
    expect(svg.children.length).toBeGreaterThan(0)
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
