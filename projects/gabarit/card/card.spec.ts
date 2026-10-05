import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, reflectComponentType, signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'

import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Checkbox } from '../checkbox/checkbox'
import { Icon } from '../icon/icon'
import { Switch } from '../switch/switch'
import { Card, CardHeader } from './card'
import { CardLink } from './card-link'

describe('Card', () => {
  let component: Card
  let fixture: ComponentFixture<Card>
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
    }).compileComponents()

    fixture = TestBed.createComponent(Card)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('renders no header when title is empty', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__header')).toBeNull()
  })

  it('renders a header with the title once set', () => {
    fixture.componentRef.setInput('heading', 'Serveur mail')
    fixture.detectChanges()

    const header = fixture.nativeElement.querySelector('.gbt-card__header')
    expect(header).toBeTruthy()
    expect(header.textContent).toContain('Serveur mail')
    expect(fixture.nativeElement.querySelector('gbt-icon')).toBeNull()
  })

  it('renders the icon alongside the title when set', () => {
    fixture.componentRef.setInput('heading', 'Serveur mail')
    fixture.componentRef.setInput('icon', 'mail')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('gbt-icon')).toBeTruthy()
  })

  it('renders an h2 by default', () => {
    const fixture = TestBed.createComponent(Card)
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Dépôts')
  })

  it('respects the requested heading level', () => {
    const fixture = TestBed.createComponent(Card)
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.componentRef.setInput('headingLevel', 3)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h3')?.textContent).toContain('Dépôts')
    expect(fixture.nativeElement.querySelector('h2')).toBeNull()
  })

  it('presents no accessibility violation', async () => {
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

// ---- 1.2.0 additions ---------------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [Card, CardHeader],
  template: `
    <gbt-card [heading]="heading()" variant="outlined">
      <div card-header class="custom">Chemin/du/fichier.ts</div>
      <button card-header-actions type="button" class="act">Ouvrir</button>
      <p class="body">Corps</p>
    </gbt-card>
  `,
})
class CustomHeaderHost {
  heading = signal('')
}

@Component({
  standalone: true,
  imports: [Card, CardHeader, CardLink],
  template: `
    <gbt-card variant="outlined">
      <h3 card-header><a gbtCardLink href="/release/1">Release 1.2.0</a></h3>
      <button card-header-actions type="button" class="act">Télécharger</button>
      <p>Corps</p>
      <a href="/notes" class="inner">Notes</a>
    </gbt-card>
  `,
})
class ProjectedLinkHost {}

function mount(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Card)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  return fixture
}

/** The card's box (`.gbt-card`): border or shadow, radius, the body. The header is its sibling. */
const cardRoot = (f: { nativeElement: HTMLElement }): HTMLElement =>
  f.nativeElement.querySelector('.gbt-card') as HTMLElement
const cardHeader = (f: { nativeElement: HTMLElement }): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-card__header')
const iconName = (f: ComponentFixture<unknown>, within: string): string | null => {
  const icon = f.debugElement.query(By.css(`${within} gbt-icon`))
  return icon ? (icon.injector.get(Icon).name() as string) : null
}
const userAttrs = (el: Element): string[] =>
  el.getAttributeNames().filter((n) => !n.startsWith('_ng'))

describe('Card — defaults keep the pre-1.2.0 rendering', () => {
  it('renders a bare div.gbt-card with no new attribute and no header', () => {
    const fixture = mount()
    const root = cardRoot(fixture)
    expect(userAttrs(root)).toEqual(['class'])
    expect(root.className).toBe('gbt-card')
    expect(fixture.nativeElement.querySelector('.gbt-card__header')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-card__selected-label')).toBeNull()
    expect(fixture.nativeElement.querySelector('a')).toBeNull()
  })

  it('keeps header > h2.gbt-card__title (no wrapper) and the hoverable class', () => {
    const fixture = mount({ heading: 'Dépôts', hoverable: true })
    const header = fixture.nativeElement.querySelector('.gbt-card__header') as HTMLElement
    expect(header.firstElementChild?.tagName).toBe('H2')
    expect(header.querySelector('.gbt-card__titles')).toBeNull()
    expect(header.querySelector('.gbt-card__count')).toBeNull()
    expect(header.querySelector('.gbt-card__description')).toBeNull()
    expect(cardRoot(fixture).className).toBe('gbt-card gbt-card--hoverable')
  })

  it('puts the icon beside the heading, before it in the header (not inside the heading)', () => {
    const fixture = mount({ heading: 'Serveur', icon: 'check' })
    const header = cardHeader(fixture)!
    const icon = header.querySelector(':scope > .gbt-card__icon') as HTMLElement
    expect(icon).not.toBeNull()
    expect(icon.nextElementSibling?.tagName).toBe('H2')
    expect(icon.querySelector('gbt-icon')?.getAttribute('aria-hidden')).toBe('true')
    expect(fixture.nativeElement.querySelector('.gbt-card__title gbt-icon')).toBeNull()
    expect(fixture.nativeElement.querySelectorAll('gbt-icon').length).toBe(1)
    expect(iconName(fixture, '.gbt-card__icon')).toBe('check')
  })

  it('projects the body inside .gbt-card__body', () => {
    const fixture = TestBed.createComponent(CustomHeaderHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__body .body')).not.toBeNull()
  })
})

describe('Card — variant, flush, tone', () => {
  it('marks outlined and flush on the box, and the tone on the header, only when asked', () => {
    const fixture = mount({ heading: 'X' })
    const root = cardRoot(fixture)
    for (const attr of ['data-variant', 'data-flush', 'data-tone']) {
      expect(root.hasAttribute(attr), attr).toBe(false)
    }
    expect(cardHeader(fixture)!.hasAttribute('data-tone')).toBe(false)
    fixture.componentRef.setInput('variant', 'outlined')
    fixture.componentRef.setInput('flush', true)
    fixture.componentRef.setInput('tone', 'error')
    fixture.detectChanges()
    expect(root.getAttribute('data-variant')).toBe('outlined')
    expect(root.hasAttribute('data-flush')).toBe(true)
    expect(cardHeader(fixture)!.getAttribute('data-tone')).toBe('error')
    // The tone is the header's: the box is never tinted.
    expect(root.hasAttribute('data-tone')).toBe(false)
  })

  it('no longer has a headerStyle input (a single header look), every other input kept', () => {
    const inputs = reflectComponentType(Card)!.inputs.map((i) => i.templateName)
    expect(inputs).not.toContain('headerStyle')
    expect([...inputs].sort()).toEqual(
      [
        'count',
        'description',
        'flush',
        'heading',
        'headingLevel',
        'hoverable',
        'href',
        'icon',
        'linkLabel',
        'selected',
        'selectedLabel',
        'tone',
        'variant',
      ].sort(),
    )
  })

  it('renders no header-style attribute anywhere', () => {
    const fixture = mount({ heading: 'X', icon: 'check', variant: 'outlined', flush: true })
    expect(fixture.nativeElement.querySelector('[data-header-style]')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-card__tile')).toBeNull()
  })
})

describe('Card — the header sits above the box, outside it', () => {
  it('renders the header as the sibling right before the box, never inside it', () => {
    const fixture = mount({ heading: 'Variables', description: 'Texte', count: 2 })
    const host = fixture.nativeElement as HTMLElement
    const header = cardHeader(fixture)!
    const box = cardRoot(fixture)
    expect(Array.from(host.children)).toEqual([header, box])
    expect(header.nextElementSibling).toBe(box)
    expect(box.contains(header)).toBe(false)
    expect(box.querySelector('h2, .gbt-card__description, .gbt-card__count')).toBeNull()
  })

  it('renders the box alone, as the only child, when there is no header', () => {
    const fixture = mount()
    const host = fixture.nativeElement as HTMLElement
    expect(host.children.length).toBe(1)
    expect(host.firstElementChild).toBe(cardRoot(fixture))
  })

  it('gives the header no background, border, radius, shadow or padding of its own', () => {
    const header = ruleBody(CARD_SCSS, '.gbt-card__header') ?? ''
    expect(header).toContain('grid-area: gbt-card-header;')
    for (const property of ['background', 'border', 'border-radius', 'box-shadow', 'padding']) {
      expect(header, property).not.toMatch(new RegExp(`(^|[; ])${property}\\s*:`))
    }
    // No other rule reaches into the header to paint it (the band is gone).
    expect(CARD_SCSS).not.toMatch(/data-header-style|--bg-hover|gbt-card__tile/)
    expect(CARD_SCSS.replace(/\s+/g, ' ')).not.toMatch(/\.gbt-card__header[^{]*\{[^}]*background/)
  })

  it('places the header then the box in the host grid, with a gap under the header', () => {
    const host = ruleBody(CARD_SCSS, ':host') ?? ''
    expect(host).toContain('position: relative;')
    expect(host).toContain('display: grid;')
    expect(host).toContain("grid-template-areas: 'gbt-card-header' 'gbt-card-box';")
    expect(host).toContain('grid-template-columns: minmax(0, 1fr);')
    // Same heading-to-content gap as gbt-panel.
    expect(ruleBody(CARD_SCSS, '.gbt-card__header')).toContain('margin-bottom: 0.5rem;')
    expect(ruleBody(CARD_SCSS, '.gbt-card')).toContain('grid-area: gbt-card-box;')
  })
})

describe('Card — the box always has its full radius', () => {
  it('rounds the box on all four corners, whatever sits above it', () => {
    expect(ruleBody(CARD_SCSS, '.gbt-card')).toContain('border-radius: var(--gbt-card-radius);')
    // No corner-splitting anywhere: every radius in the file is a single value (a var() fallback is one value too).
    for (const [, value] of CARD_SCSS.matchAll(/border-radius:\s*([^;]+);/g)) {
      expect(value.trim().replace(/\([^)]*\)/g, '()'), value).not.toMatch(/\s/)
    }
  })

  it('clips a flush body to the four inner corners of the box', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(
      /\.gbt-card\[data-flush\] \.gbt-card__body \{ display: block; overflow: clip; border-radius: var\(--gbt-card-inner-radius\); \}/,
    )
  })

  it('draws the outlined edge on the box itself, in the shared card border token', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(
      /\.gbt-card\[data-variant='outlined'\] \{[^}]*border: 1px solid var\(--gbt-card-edge\);/,
    )
    expect(ruleBody(CARD_SCSS, '.gbt-card')).toContain('--gbt-card-edge: var(--gbt-card-border);')
    expect(flat).not.toMatch(/> \.gbt-card__body \{ border/)
  })

  it('makes flush only drop the box padding (no header special case left)', () => {
    expect(ruleBody(CARD_SCSS, '.gbt-card[data-flush]')).toBe('padding: 0;')
    expect(CARD_SCSS).not.toMatch(/data-flush\][^{]*\.gbt-card__header/)
  })
})

describe('Card — tone colours the header icon and title only', () => {
  it('uses the --color-*-text pair of gbt-badge (outline) on the icon and the title', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toContain('@each $tone in (success, warning, error)')
    expect(flat).toMatch(
      /\.gbt-card__header\[data-tone='#\{\$tone\}'\] \{ \.gbt-card__icon, \.gbt-card__title \{ color: var\(--color-#\{\$tone\}-text\); \}/,
    )
    const badge = readFileSync(join(process.cwd(), 'projects/gabarit/badge/badge.scss'), 'utf8')
    for (const tone of ['success', 'warning', 'error']) {
      expect(badge, `badge reuses --color-${tone}-text`).toContain(
        `color: var(--color-${tone}-text)`,
      )
    }
  })

  it('never tints the box, its edge or the header background', () => {
    expect(CARD_SCSS).not.toMatch(/\.gbt-card\[data-tone/)
    expect(CARD_SCSS).not.toMatch(/--color-[^;]*-bg\b/)
  })

  it("pairs the tone with an icon: the tone's own (as gbt-alert) when none is given", () => {
    const expected = { success: 'check-circle', warning: 'alert-triangle', error: 'alert-circle' }
    for (const [tone, icon] of Object.entries(expected)) {
      const fixture = mount({ heading: 'Registre', tone })
      expect(iconName(fixture, '.gbt-card__header[data-tone] .gbt-card__icon'), tone).toBe(icon)
      // Drawn in gbt-alert's ring, the shape those status glyphs are made for.
      expect(
        fixture.nativeElement
          .querySelector('.gbt-card__icon')
          .classList.contains('gbt-card__icon--status'),
        tone,
      ).toBe(true)
    }
    const ring = ruleBody(CARD_SCSS, '.gbt-card__icon--status gbt-icon') ?? ''
    expect(ring).toContain('border: 1.5px solid currentColor;')
    expect(ring).toContain('border-radius: 50%;')
  })

  it('keeps the given icon (no ring) on a toned header, and shows none on a neutral one without an icon', () => {
    expect(
      mount({ heading: 'Registre', tone: 'error', icon: 'server' }).nativeElement.querySelector(
        '.gbt-card__icon--status',
      ),
    ).toBeNull()
    expect(
      iconName(mount({ heading: 'Registre', tone: 'error', icon: 'server' }), '.gbt-card__icon'),
    ).toBe('server')
    expect(mount({ heading: 'Registre' }).nativeElement.querySelector('gbt-icon')).toBeNull()
  })
})

describe('Card — description and count', () => {
  it('renders the description under the heading, in a titles wrapper', () => {
    const fixture = mount({ heading: 'Variables', description: 'Injectées dans chaque job.' })
    const titles = fixture.nativeElement.querySelector('.gbt-card__titles') as HTMLElement
    expect(titles.children[0].tagName).toBe('H2')
    expect(titles.children[1].className).toBe('gbt-card__description')
    expect(titles.children[1].textContent).toBe('Injectées dans chaque job.')
  })

  it('renders the count in the heading, including 0, and nothing for null', () => {
    const fixture = mount({ heading: 'Variables', count: 0 })
    expect(fixture.nativeElement.querySelector('.gbt-card__count')?.textContent).toBe('0')
    fixture.componentRef.setInput('count', 12)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h2 .gbt-card__count')?.textContent).toBe('12')
    fixture.componentRef.setInput('count', null)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__count')).toBeNull()
  })
})

describe('Card — selected', () => {
  it('marks the card and tells screen readers, with an overridable label', () => {
    const fixture = mount({ heading: 'Option A', selected: true })
    expect(cardRoot(fixture).hasAttribute('data-selected')).toBe(true)
    // The selection is the box's: the label opens the box, the header above stays a plain label.
    expect(cardRoot(fixture).firstElementChild?.className).toBe('gbt-card__selected-label')
    expect(cardHeader(fixture)!.hasAttribute('data-selected')).toBe(false)
    expect(fixture.nativeElement.querySelector('.gbt-card__selected-label')?.textContent).toBe(
      'Selected',
    )
    fixture.componentRef.setInput('selectedLabel', 'Recommandé')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__selected-label')?.textContent).toBe(
      'Recommandé',
    )
    fixture.componentRef.setInput('selectedLabel', '')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__selected-label')).toBeNull()
  })

  it('is neutral when not selected', () => {
    const fixture = mount({ heading: 'Option A', selectedLabel: 'Sélectionné' })
    expect(cardRoot(fixture).hasAttribute('data-selected')).toBe(false)
    expect(fixture.nativeElement.querySelector('.gbt-card__selected-label')).toBeNull()
  })
})

describe('Card — [card-header] slot', () => {
  it('replaces the heading block and keeps [card-header-actions]', () => {
    const fixture = TestBed.createComponent(CustomHeaderHost)
    fixture.componentInstance.heading.set('Ignoré')
    fixture.detectChanges()
    const header = fixture.nativeElement.querySelector('.gbt-card__header') as HTMLElement
    expect(header.querySelector('.gbt-card__header-slot > .custom')?.textContent).toBe(
      'Chemin/du/fichier.ts',
    )
    expect(header.querySelector('.act')).not.toBeNull()
    // Outside the box, like the built-in header.
    expect(header.nextElementSibling).toBe(fixture.nativeElement.querySelector('.gbt-card'))
    expect(fixture.nativeElement.querySelector('h2')).toBeNull()
    expect(fixture.nativeElement.textContent).not.toContain('Ignoré')
  })

  it('renders the header even without a heading', () => {
    const fixture = TestBed.createComponent(CustomHeaderHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__header .custom')).not.toBeNull()
  })
})

describe('Card — link mode', () => {
  it('turns the heading text into the link, with the count outside it', () => {
    const fixture = mount({ heading: 'Guide', href: '/guide', count: 3 })
    const link = fixture.nativeElement.querySelector('h2 a.gbt-card__link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/guide')
    expect(link.textContent).toBe('Guide')
    expect(link.querySelector('.gbt-card__count')).toBeNull()
    // The anchor stays in the heading, above the box; the box is the marked target.
    expect(cardHeader(fixture)!.contains(link)).toBe(true)
    expect(cardRoot(fixture).hasAttribute('data-link')).toBe(true)
    expect(cardHeader(fixture)!.hasAttribute('data-link')).toBe(false)
  })

  it('renders the heading-less overlay anchor inside the box', () => {
    const fixture = mount({ href: '/x', linkLabel: 'Ouvrir' })
    expect(cardRoot(fixture).querySelector(':scope > a.gbt-card__link')).not.toBeNull()
  })

  it('stretches the overlay over the box area of the host grid, above the box', () => {
    const flat = CARD_LINK_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(
      /&::after \{[^}]*position: absolute; inset: 0;[^}]*z-index: 1;[^}]*grid-area: gbt-card-box;/,
    )
    // The box's radius and the selected focus offset are mirrored on the host for a header link.
    const card = CARD_SCSS.replace(/\s+/g, ' ')
    expect(card).toMatch(
      /:host:has\(> \.gbt-card\[data-variant='outlined'\]\) \{ --gbt-card-radius: var\(--site-border-radius\); \}/,
    )
    expect(card).toMatch(
      /:host:has\(> \.gbt-card\[data-selected\]\) \{ --gbt-card-focus-offset: -5px; \}/,
    )
    // Hovering the header link's overlay gives the box its hover look.
    expect(card).toContain(
      ':host:has(> .gbt-card__header .gbt-card__link:hover) > .gbt-card[data-link] { box-shadow: var(--site-shadow-lg);',
    )
  })

  it('has no link and no data-link without href', () => {
    const fixture = mount({ heading: 'Guide' })
    expect(fixture.nativeElement.querySelector('a')).toBeNull()
    expect(cardRoot(fixture).hasAttribute('data-link')).toBe(false)
  })

  it('renders a named overlay anchor when there is no heading', () => {
    const fixture = mount({ href: '/x', linkLabel: 'Ouvrir la release' })
    const link = fixture.nativeElement.querySelector('a.gbt-card__link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/x')
    expect(link.getAttribute('aria-label')).toBe('Ouvrir la release')
  })

  it('never nests interactive content in the link (anchor holds the heading text only)', () => {
    const fixture = mount({ heading: 'Guide', href: '/guide', description: 'Texte' })
    const link = fixture.nativeElement.querySelector('a.gbt-card__link') as HTMLElement
    expect(link.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull()
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(1)
  })

  it('detects a projected <a gbtCardLink> and keeps other controls as siblings', () => {
    const fixture = TestBed.createComponent(ProjectedLinkHost)
    fixture.detectChanges()
    const card = fixture.nativeElement.querySelector('gbt-card') as HTMLElement
    const root = card.querySelector('.gbt-card') as HTMLElement
    expect(root.hasAttribute('data-link')).toBe(true)
    // In the [card-header] slot: above the box, not in it.
    const link = card.querySelector('.gbt-card__header a.gbt-card__link') as HTMLElement
    expect(link.textContent).toBe('Release 1.2.0')
    expect(root.contains(link)).toBe(false)
    for (const other of [card.querySelector('.act'), root.querySelector('.inner')]) {
      expect(other).not.toBeNull()
      expect(link.contains(other)).toBe(false)
    }
  })

  it('a card with an <a gbtCardLink> keeps a single link as the card target', () => {
    const fixture = TestBed.createComponent(ProjectedLinkHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('a.gbt-card__link').length).toBe(1)
  })
})

describe('Card — a11y of the 1.2.0 additions', () => {
  it('has no violations: outlined card with description, count, tone and selection', async () => {
    const fixture = mount({
      heading: 'Variables',
      icon: 'check',
      description: 'Injectées dans chaque job.',
      count: 3,
      variant: 'outlined',
      tone: 'success',
      selected: true,
      flush: true,
    })
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violations in href link mode (heading, and heading-less named overlay)', async () => {
    await expectNoA11yViolations(mount({ heading: 'Guide', href: '/guide' }).nativeElement)
    await expectNoA11yViolations(mount({ href: '/x', linkLabel: 'Ouvrir' }).nativeElement)
  })

  it('has no violations with a custom header, a projected link and separate controls', async () => {
    const fixture = TestBed.createComponent(ProjectedLinkHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
    const custom = TestBed.createComponent(CustomHeaderHost)
    custom.detectChanges()
    await expectNoA11yViolations(custom.nativeElement)
  })
})

// ---- Fix round 1 -------------------------------------------------------------------------------------

const CARD_SCSS = readFileSync(join(process.cwd(), 'projects/gabarit/card/card.scss'), 'utf8')
const CARD_LINK_SCSS = readFileSync(
  join(process.cwd(), 'projects/gabarit/card/card-link.scss'),
  'utf8',
)

/** The declarations of the top-level rule whose selector is exactly `selector`. */
function ruleBody(scss: string, selector: string): string | null {
  const flat = ' ' + scss.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ')
  const start = flat.search(new RegExp(`(?:^|[};]) +${selector.replace(/[.[\]()]/g, '\\$&')} \\{`))
  if (start === -1) return null
  const open = flat.indexOf('{', start)
  return flat.slice(open + 1, flat.indexOf('}', open)).trim()
}

@Component({
  standalone: true,
  imports: [Card],
  template: `
    <gbt-card [heading]="heading()">
      <div card-header class="custom">Chemin/du/fichier.ts</div>
      <p class="body">Corps</p>
    </gbt-card>
  `,
})
class CardOnlyHost {
  heading = signal('')
}

@Component({
  standalone: true,
  imports: [Card, Switch, Checkbox],
  template: `
    <gbt-card heading="Notifications" href="/settings/notifications">
      <gbt-switch label="Courriel" />
      <gbt-checkbox label="Résumé hebdomadaire" />
    </gbt-card>
  `,
})
class LinkWithControlsHost {}

describe('Card — a forgotten CardHeader import does not drop the slot', () => {
  it('shows the [card-header] content when only Card is imported, without a heading', () => {
    const fixture = TestBed.createComponent(CardOnlyHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.custom')?.textContent).toBe('Chemin/du/fichier.ts')
    expect(fixture.nativeElement.querySelector('.gbt-card__body .body')).not.toBeNull()
  })

  it('shows it next to the built-in heading when only Card is imported', () => {
    const fixture = TestBed.createComponent(CardOnlyHost)
    fixture.componentInstance.heading.set('Dépôts')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Dépôts')
    expect(fixture.nativeElement.querySelector('.custom')?.textContent).toBe('Chemin/du/fichier.ts')
  })

  it('adds nothing to a card that does not use the slot', () => {
    const fixture = mount()
    expect(cardRoot(fixture).children.length).toBe(1)
    expect((cardRoot(fixture).firstElementChild as HTMLElement).className).toBe('gbt-card__body')
  })

  it('still replaces the built-in heading when the directive is imported', () => {
    const fixture = TestBed.createComponent(CustomHeaderHost)
    fixture.componentInstance.heading.set('Ignoré')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelectorAll('.custom').length).toBe(1)
    expect(fixture.nativeElement.querySelector('h2')).toBeNull()
  })
})

describe('Card — the body wrapper does not change the default layout', () => {
  it('is display: contents by default, so a consumer flex/gap on the card still reaches the children', () => {
    expect(ruleBody(CARD_SCSS, '.gbt-card__body')).toBe('display: contents;')
  })

  it('only becomes a real box where a feature needs it (flush clipping)', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(/\.gbt-card\[data-flush\] \.gbt-card__body \{ display: block;/)
    // …and nowhere else: a single rule turns the wrapper into a box.
    expect(flat.match(/\.gbt-card__body[^{]*\{ display: block;/g)?.length).toBe(1)
  })

  it('keeps the projected children inside the wrapper, in order', () => {
    const fixture = TestBed.createComponent(CustomHeaderHost)
    fixture.detectChanges()
    const body = fixture.nativeElement.querySelector('.gbt-card__body') as HTMLElement
    expect(Array.from(body.children).map((c) => c.className)).toEqual(['body'])
  })
})

describe('Card — link-mode lifting leaves controls their own position', () => {
  it('lifts the controls with a zero-specificity :where() so a component position wins', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(/:where\(\.gbt-card\[data-link\]\) ::ng-deep :where\(/)
    // No plain (specific) lifting rule is left under the card.
    expect(flat).not.toMatch(/\.gbt-card\[data-link\] \{[^}]*::ng-deep/)
  })

  it('renders a switch and a checkbox inside a link card as siblings of the link', () => {
    const fixture = TestBed.createComponent(LinkWithControlsHost)
    fixture.detectChanges()
    const root = fixture.nativeElement.querySelector('.gbt-card') as HTMLElement
    expect(root.hasAttribute('data-link')).toBe(true)
    const link = fixture.nativeElement.querySelector(
      '.gbt-card__header a.gbt-card__link',
    ) as HTMLElement
    expect(link).not.toBeNull()
    for (const input of Array.from(root.querySelectorAll('input'))) {
      expect(link.contains(input)).toBe(false)
    }
    expect(root.querySelectorAll('input').length).toBe(2)
  })

  it('has no accessibility violation with a switch and a checkbox in a link card', async () => {
    const fixture = TestBed.createComponent(LinkWithControlsHost)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Card — linkLabel never replaces a visible heading as the link name', () => {
  it('leaves the heading text as the link name even when linkLabel is set', () => {
    const fixture = mount({
      heading: 'Guide',
      href: '/guide',
      linkLabel: 'Ouvrir le guide complet',
    })
    const link = fixture.nativeElement.querySelector('a.gbt-card__link') as HTMLAnchorElement
    expect(link.hasAttribute('aria-label')).toBe(false)
    expect(link.textContent).toBe('Guide')
  })

  it('still names a heading-less overlay link', () => {
    const fixture = mount({ href: '/x', linkLabel: 'Ouvrir' })
    expect(fixture.nativeElement.querySelector('a.gbt-card__link').getAttribute('aria-label')).toBe(
      'Ouvrir',
    )
  })
})

describe('Card — the keyboard focus ring of a selected link card', () => {
  it('moves inside the selection ring instead of sharing its band', () => {
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(/\.gbt-card\[data-selected\] \{[^}]*--gbt-card-focus-offset: -5px/)
    // Mirrored on the host, for a heading link whose overlay is outside the box.
    expect(flat).toMatch(
      /:host:has\(> \.gbt-card\[data-selected\]\) \{ --gbt-card-focus-offset: -5px/,
    )
    expect(CARD_LINK_SCSS.replace(/\s+/g, ' ')).toContain(
      'outline-offset: var(--gbt-card-focus-offset, -2px)',
    )
  })
})

describe('Card — count pill', () => {
  it('uses the primary text colour on a faint wash (contrast measured in contrast.spec.ts)', () => {
    const body = ruleBody(CARD_SCSS, '.gbt-card__count') ?? ''
    expect(body).toContain('color-mix(in srgb, var(--border-color) 8%, transparent)')
    expect(body).toContain('color: var(--text-primary)')
  })
})

// ---- Review fixes: header lift, tone with a custom header, selection ring radius ---------------------

@Component({
  standalone: true,
  imports: [Card, CardHeader],
  template: `
    <gbt-card tone="warning" variant="outlined">
      <div card-header class="custom">Quota</div>
      <p>Corps</p>
    </gbt-card>
  `,
})
class TonedCustomHeaderHost {}

describe('Card — link-mode lifting also covers the header controls', () => {
  const flat = CARD_SCSS.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ')
  const HEADER_LIFT =
    /(:where\(\.gbt-card__header:has\(~ \.gbt-card\[data-link\]\)\)) ::ng-deep (:where\([^{]*\)) \{ position: relative; z-index: 2; \}/

  it('lifts the header controls with the same zero-specificity rule as the body controls', () => {
    const match = HEADER_LIFT.exec(flat)
    expect(match).not.toBeNull()
    // The same control list as the body lift, the stretched link itself excluded.
    const body = /:where\(\.gbt-card\[data-link\]\) ::ng-deep (:where\([^{]*\)) \{/.exec(flat)
    expect(match![2]).toBe(body![1])
    expect(match![2]).toContain('a:not(.gbt-card__link)')
  })

  it('targets a [card-header-actions] control of a link card, never the link, nothing without a link', () => {
    const [, header, controls] = HEADER_LIFT.exec(flat)!
    // `::ng-deep` only lifts Angular's scoping: in the DOM the selector reads without it.
    const selector = `${header} ${controls}`

    const linked = TestBed.createComponent(ProjectedLinkHost)
    linked.detectChanges()
    const action = linked.nativeElement.querySelector('.gbt-card__header .act') as HTMLElement
    expect(action.matches(selector)).toBe(true)
    expect(linked.nativeElement.querySelector('a.gbt-card__link').matches(selector)).toBe(false)

    const plain = TestBed.createComponent(CustomHeaderHost)
    plain.detectChanges()
    expect(plain.nativeElement.querySelector('.gbt-card__header .act').matches(selector)).toBe(
      false,
    )
  })
})

describe('Card — tone with a custom [card-header]', () => {
  it('only marks the header with data-tone: no tone icon, no built-in title to colour', () => {
    const fixture = TestBed.createComponent(TonedCustomHeaderHost)
    fixture.detectChanges()
    const header = fixture.nativeElement.querySelector('.gbt-card__header') as HTMLElement
    expect(header.getAttribute('data-tone')).toBe('warning')
    expect(header.querySelector('.gbt-card__header-slot > .custom')?.textContent).toBe('Quota')
    // The slot replaces the built-in icon and title, which the tone rule targets (see the README).
    expect(fixture.nativeElement.querySelector('.gbt-card__icon')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-card__title')).toBeNull()
    expect(fixture.nativeElement.querySelector('gbt-icon')).toBeNull()
  })
})

describe('Card — the selection ring follows the inner corners of the box', () => {
  it('rounds the ring with the inner radius (radius minus the 1px edge on an outlined box)', () => {
    expect(ruleBody(CARD_SCSS, '.gbt-card[data-selected]::before')).toContain(
      'border-radius: var(--gbt-card-inner-radius);',
    )
    const flat = CARD_SCSS.replace(/\s+/g, ' ')
    expect(flat).toMatch(
      /\.gbt-card\[data-variant='outlined'\] \{[^}]*--gbt-card-inner-radius: calc\(var\(--site-border-radius\) - 1px\);/,
    )
  })
})
