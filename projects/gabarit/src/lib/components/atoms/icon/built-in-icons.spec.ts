import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { BUILT_IN_ICONS } from './built-in-icons'
import { Icon } from './icon'
import { IconRegistry } from './icon-registry'

const ORIGINAL_ICONS = [
  'search',
  'x',
  'eye',
  'eye-off',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevrons-left',
  'chevrons-right',
  'ellipsis-vertical',
  'check',
  'copy',
  'check-circle',
  'alert-circle',
  'alert-triangle',
  'info',
  'arrow-up',
  'arrow-down',
  'calendar',
  'upload',
  'folder',
  'file',
]

const ADDED_IN_1_2_0 = [
  'home',
  'folders',
  'server',
  'lock',
  'key',
  'settings',
  'log-out',
  'user',
  'bell',
  'activity',
  'layout-dashboard',
  'circle-dot',
  'arrow-left',
  'play',
  'tag',
  'book-open',
  'folder-open',
  'message-circle',
  'pencil',
  'flag',
  'star',
  'download',
  'globe',
  'circle-check',
  'bug',
  'sparkles',
  'square-check',
  'layers',
  'plus',
  'kanban',
  'list',
  'clock',
  'circle-play',
  'circle-x',
  'circle-slash',
  'flask-conical',
  'trash-2',
  'database',
  'hard-drive',
  'mail',
  'send',
  'shield-check',
  'shield-alert',
  'smartphone',
  'users',
  'user-plus',
  'refresh-cw',
]

const SVG_ELEMENTS = ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']

describe('BUILT_IN_ICONS', () => {
  it('still ships every icon of 1.1.0', () => {
    for (const name of ORIGINAL_ICONS) {
      expect(BUILT_IN_ICONS, name).toHaveProperty(name)
    }
  })

  it('ships the generic glyphs FerrisGit registered by itself', () => {
    expect(ADDED_IN_1_2_0).toHaveLength(47)
    for (const name of ADDED_IN_1_2_0) {
      expect(BUILT_IN_ICONS, name).toHaveProperty(name)
    }
  })

  it('has no name that is both original and added (no silent override)', () => {
    expect(ADDED_IN_1_2_0.filter((name) => ORIGINAL_ICONS.includes(name))).toEqual([])
    expect(Object.keys(BUILT_IN_ICONS)).toHaveLength(ORIGINAL_ICONS.length + ADDED_IN_1_2_0.length)
  })

  it.each(Object.entries(BUILT_IN_ICONS))(
    '%s is inner SVG markup: known shape elements only, no <svg> wrapper, no script',
    (_name, markup) => {
      expect(markup.trim()).not.toBe('')
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
        'image/svg+xml',
      )
      expect(doc.querySelector('parsererror')).toBeNull()
      const children = Array.from(doc.documentElement.children)
      expect(children.length).toBeGreaterThan(0)
      for (const child of children) {
        expect(SVG_ELEMENTS).toContain(child.localName)
      }
    },
  )

  it('uses no colour of its own: icons follow currentColor (nothing but the explicit fill)', () => {
    for (const [name, markup] of Object.entries(BUILT_IN_ICONS)) {
      expect(markup, name).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|stroke="(?!none)/i)
    }
  })

  it('every icon renders through gbt-icon and stays hidden from assistive technology', async () => {
    const registry = TestBed.inject(IconRegistry)
    for (const name of Object.keys(BUILT_IN_ICONS)) {
      expect(registry.get(name), name).toBe(BUILT_IN_ICONS[name])
    }
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', ADDED_IN_1_2_0[ADDED_IN_1_2_0.length - 1])
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg')?.children.length).toBeGreaterThan(0)
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true')
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
