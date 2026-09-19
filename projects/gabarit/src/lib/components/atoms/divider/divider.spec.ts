import { TestBed } from '@angular/core/testing'
import { Divider } from './divider'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(Divider)
  fixture.detectChanges()
  return fixture
}

describe('Divider', () => {
  it('has role separator', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('role')).toBe('separator')
  })

  it('defaults to horizontal, with no aria-orientation (the ARIA default)', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('data-orientation')).toBe('horizontal')
    expect(fixture.nativeElement.getAttribute('aria-orientation')).toBeNull()
  })

  it('reflects the vertical orientation', () => {
    const fixture = setup()
    fixture.componentRef.setInput('orientation', 'vertical')
    fixture.detectChanges()
    expect(fixture.nativeElement.getAttribute('data-orientation')).toBe('vertical')
    expect(fixture.nativeElement.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('renders no label by default', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-divider__label')).toBeNull()
  })

  it('renders the given label centered between two lines', () => {
    const fixture = setup()
    fixture.componentRef.setInput('label', 'OR')
    fixture.detectChanges()
    const label = fixture.nativeElement.querySelector('.gbt-divider__label')
    expect(label.textContent.trim()).toBe('OR')
    expect(fixture.nativeElement.querySelectorAll('.gbt-divider__line').length).toBe(2)
  })

  it('has no a11y violations, plain', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with a label', async () => {
    const fixture = setup()
    fixture.componentRef.setInput('label', 'OR')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
