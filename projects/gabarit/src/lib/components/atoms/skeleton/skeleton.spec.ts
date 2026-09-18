import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Skeleton, SkeletonVariant } from './skeleton'

function setup() {
  const fixture = TestBed.createComponent(Skeleton)
  fixture.detectChanges()
  return fixture
}

describe('Skeleton', () => {
  it('defaults to the text variant', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('data-variant')).toBe('text')
  })

  it.each<SkeletonVariant>(['text', 'circle', 'rect'])('reflects the %s variant', (variant) => {
    const fixture = setup()
    fixture.componentRef.setInput('variant', variant)
    fixture.detectChanges()
    expect(fixture.nativeElement.getAttribute('data-variant')).toBe(variant)
  })

  it('defaults width to 100%', () => {
    const fixture = setup()
    expect(fixture.nativeElement.style.width).toBe('100%')
  })

  it('sets no inline height by default, leaving it to the variant', () => {
    const fixture = setup()
    expect(fixture.nativeElement.style.height).toBe('')
  })

  it('applies a given width and height as inline styles', () => {
    const fixture = setup()
    fixture.componentRef.setInput('width', '40px')
    fixture.componentRef.setInput('height', '40px')
    fixture.detectChanges()
    expect(fixture.nativeElement.style.width).toBe('40px')
    expect(fixture.nativeElement.style.height).toBe('40px')
  })

  it('is hidden from assistive technology', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true')
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
