import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { IconMarker } from './icon-marker'

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(IconMarker)
  fixture.componentRef.setInput('icon', 'check')
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return { fixture, root, marker: () => root.querySelector('.gbt-icon-marker') as HTMLElement }
}

describe('IconMarker', () => {
  it('draws the icon on a neutral, medium disc, decorative, by default', () => {
    const { marker } = setup()

    expect(marker().querySelector('gbt-icon')).not.toBeNull()
    expect(marker().getAttribute('data-tone')).toBe('neutral')
    expect(marker().getAttribute('data-size')).toBe('md')
    expect(marker().hasAttribute('data-shape')).toBe(false)
    expect(marker().hasAttribute('data-appearance')).toBe(false)
    expect(marker().getAttribute('aria-hidden')).toBe('true')
    expect(marker().hasAttribute('role')).toBe(false)
  })

  it('applies tone, size, shape and appearance', () => {
    const { marker } = setup({
      tone: 'success',
      size: 'xl',
      shape: 'tile',
      appearance: 'outline',
    })

    expect(marker().getAttribute('data-tone')).toBe('success')
    expect(marker().getAttribute('data-size')).toBe('xl')
    expect(marker().getAttribute('data-shape')).toBe('tile')
    expect(marker().getAttribute('data-appearance')).toBe('outline')
  })

  it('accepts every tone and size', () => {
    const { fixture, marker } = setup()
    for (const tone of ['neutral', 'primary', 'success', 'warning', 'error', 'info']) {
      fixture.componentRef.setInput('tone', tone)
      fixture.detectChanges()
      expect(marker().getAttribute('data-tone')).toBe(tone)
    }
    for (const size of ['sm', 'md', 'lg', 'xl']) {
      fixture.componentRef.setInput('size', size)
      fixture.detectChanges()
      expect(marker().getAttribute('data-size')).toBe(size)
    }
  })

  it('becomes an image with a name when it has a label, and is no longer hidden', () => {
    const { marker } = setup({ label: 'Approved' })

    expect(marker().getAttribute('role')).toBe('img')
    expect(marker().getAttribute('aria-label')).toBe('Approved')
    expect(marker().hasAttribute('aria-hidden')).toBe(false)
  })

  it('has no accessibility violations (decorative, labelled, every tone and look)', async () => {
    await expectNoA11yViolations(setup().root)
    await expectNoA11yViolations(setup({ label: 'Approved', tone: 'success' }).root)
    for (const tone of ['primary', 'warning', 'error', 'info']) {
      await expectNoA11yViolations(setup({ tone, appearance: 'outline', shape: 'tile' }).root)
    }
  })
})
