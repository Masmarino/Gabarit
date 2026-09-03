import { TestBed } from '@angular/core/testing'
import { IconRegistry } from './icon-registry'

describe('IconRegistry', () => {
  it('provides built-in icons with no prior registration', () => {
    const registry = TestBed.inject(IconRegistry)
    expect(registry.get('chevron-down')).toContain('<path')
  })

  it('returns null for an unknown icon', () => {
    const registry = TestBed.inject(IconRegistry)
    expect(registry.get('inexistante')).toBeNull()
  })

  it('registers an application icon', () => {
    const registry = TestBed.inject(IconRegistry)
    registry.register('rocket', '<circle cx="12" cy="12" r="4" />')
    expect(registry.get('rocket')).toBe('<circle cx="12" cy="12" r="4" />')
  })

  it('registers a batch of icons', () => {
    const registry = TestBed.inject(IconRegistry)
    registry.registerAll({ alpha: '<path d="M0 0" />', beta: '<path d="M1 1" />' })
    expect(registry.get('alpha')).toBe('<path d="M0 0" />')
    expect(registry.get('beta')).toBe('<path d="M1 1" />')
  })

  it('lets the application override a built-in icon', () => {
    const registry = TestBed.inject(IconRegistry)
    registry.register('check', '<path d="custom" />')
    expect(registry.get('check')).toBe('<path d="custom" />')
  })
})
