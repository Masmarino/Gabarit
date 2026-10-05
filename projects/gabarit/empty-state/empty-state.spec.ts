import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { EmptyState, EmptyStateIllustration } from './empty-state'

@Component({
  standalone: true,
  imports: [EmptyState],
  template: `
    <gbt-empty-state
      illustration="folder"
      heading="Aucun dépôt"
      message="Créez votre premier dépôt."
    >
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

const ALL_ILLUSTRATIONS: EmptyStateIllustration[] = [
  'folder',
  'star',
  'checklist',
  'merge',
  'pipeline',
  'tag',
  'book',
  'server',
]

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
    expect(
      fixture.nativeElement
        .querySelector('.gbt-empty-state__illustration')
        ?.getAttribute('aria-hidden'),
    ).toBe('true')
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

// ---- 1.2.0 additions ---------------------------------------------------------------------------------

function setupOnly(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(EmptyState)
  fixture.componentRef.setInput('heading', 'Aucun jeton')
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  return fixture
}

const rootOf = (f: { nativeElement: HTMLElement }): HTMLElement =>
  f.nativeElement.querySelector('.gbt-empty-state') as HTMLElement

describe('EmptyState — defaults keep the pre-1.2.0 rendering', () => {
  it('renders the illustration, a <p> heading and no new attribute', () => {
    const fixture = setupState()
    const root = rootOf(fixture)
    expect(root.getAttributeNames().filter((n) => !n.startsWith('_ng'))).toEqual(['class'])
    const heading = fixture.nativeElement.querySelector('.gbt-empty-state__heading') as HTMLElement
    expect(heading.tagName).toBe('P')
    expect(heading.getAttributeNames().filter((n) => !n.startsWith('_ng'))).toEqual(['class'])
    expect(heading.textContent).toBe('Aucun dépôt')
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__icon')).toBeNull()
    expect(fixture.nativeElement.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
  })

  it('keeps the child order: illustration, heading, message, action', () => {
    const fixture = setup()
    const classes = Array.from(rootOf(fixture).children).map((c) => c.className.split(' ')[0])
    expect(classes).toEqual([
      'gbt-empty-state__illustration',
      'gbt-empty-state__heading',
      'gbt-empty-state__message',
      'gbt-empty-state__action',
    ])
  })
})

describe('EmptyState — illustration is optional', () => {
  it('renders without an illustration and without an icon', () => {
    const fixture = setupOnly({})
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__illustration')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__icon')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__heading')?.textContent).toBe(
      'Aucun jeton',
    )
  })

  it('accepts null and undefined for illustration', () => {
    for (const value of [null, undefined]) {
      const fixture = setupOnly({ illustration: value })
      expect(fixture.nativeElement.querySelector('.gbt-empty-state__illustration')).toBeNull()
    }
  })
})

describe('EmptyState — icon', () => {
  it('shows the icon on a disc, decorative', () => {
    const fixture = setupOnly({ icon: 'search' })
    const disc = fixture.nativeElement.querySelector('.gbt-empty-state__icon') as HTMLElement
    expect(disc.getAttribute('aria-hidden')).toBe('true')
    expect(disc.querySelector('gbt-icon')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__illustration')).toBeNull()
  })

  it('lets the illustration win when both are set', () => {
    const fixture = setupOnly({ icon: 'search', illustration: 'folder' })
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__illustration')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-empty-state__icon')).toBeNull()
  })
})

describe('EmptyState — size and tone', () => {
  it('marks compact and error only when asked', () => {
    const fixture = setupOnly({})
    expect(rootOf(fixture).hasAttribute('data-size')).toBe(false)
    expect(rootOf(fixture).hasAttribute('data-tone')).toBe(false)
    fixture.componentRef.setInput('size', 'compact')
    fixture.componentRef.setInput('tone', 'error')
    fixture.detectChanges()
    expect(rootOf(fixture).getAttribute('data-size')).toBe('compact')
    expect(rootOf(fixture).getAttribute('data-tone')).toBe('error')
    fixture.componentRef.setInput('size', 'default')
    fixture.componentRef.setInput('tone', 'default')
    fixture.detectChanges()
    expect(rootOf(fixture).hasAttribute('data-size')).toBe(false)
    expect(rootOf(fixture).hasAttribute('data-tone')).toBe(false)
  })
})

describe('EmptyState — heading level, id and focus', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renders an h%s when headingLevel=%s', (level) => {
    const fixture = setupOnly({ headingLevel: level })
    const heading = fixture.nativeElement.querySelector('.gbt-empty-state__heading') as HTMLElement
    expect(heading.tagName).toBe(`H${level}`)
    expect(heading.textContent).toBe('Aucun jeton')
    expect(fixture.nativeElement.querySelectorAll('p.gbt-empty-state__heading').length).toBe(0)
  })

  it('puts headingId on the heading, so a region can be named by it', () => {
    const fixture = setupOnly({ headingLevel: 2, headingId: 'empty-title' })
    const heading = fixture.nativeElement.querySelector('#empty-title') as HTMLElement
    expect(heading.tagName).toBe('H2')
    expect(heading.className).toContain('gbt-empty-state__heading')
  })

  it('also applies headingId to the default <p>', () => {
    const fixture = setupOnly({ headingId: 'empty-title' })
    expect(fixture.nativeElement.querySelector('p#empty-title')).not.toBeNull()
  })

  it('is not focusable by default, and focusHeading() does nothing then', () => {
    const fixture = setupOnly({ headingLevel: 1 })
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement
    expect(heading.hasAttribute('tabindex')).toBe(false)
    fixture.componentInstance.focusHeading()
    expect(document.activeElement).not.toBe(heading)
  })

  it('headingFocusable gives tabindex=-1 (not a tab stop) and focusHeading() moves focus', () => {
    const fixture = setupOnly({ headingLevel: 1, headingFocusable: true })
    document.body.appendChild(fixture.nativeElement)
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement
    expect(heading.getAttribute('tabindex')).toBe('-1')
    fixture.componentInstance.focusHeading()
    expect(document.activeElement).toBe(heading)
    fixture.nativeElement.remove()
  })
})

describe('EmptyState — a11y of the 1.2.0 additions', () => {
  it('has no violations for an icon, compact, error-toned h2 with an id', async () => {
    const fixture = setupOnly({
      icon: 'alert-circle',
      size: 'compact',
      tone: 'error',
      headingLevel: 2,
      headingId: 'empty-title',
      message: 'Réessayez dans un instant.',
    })
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violations with neither illustration nor icon', async () => {
    const fixture = setupOnly({ size: 'compact' })
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violations as a focusable h1 result', async () => {
    const fixture = setupOnly({ headingLevel: 1, headingFocusable: true, icon: 'check' })
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('EmptyState — focus ring of the focusable heading', () => {
  it('draws no ring on a heading that only takes focus by script (not a control)', () => {
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/empty-state/empty-state.scss'),
      'utf8',
    )
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
    expect(scss).toMatch(/\.gbt-empty-state__heading \{[^}]*&:focus \{ outline: none;/)
  })
})
