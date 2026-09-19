import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { Spinner } from './spinner'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(Spinner)
  fixture.detectChanges()
  return fixture
}

describe('Spinner', () => {
  it('has role status', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('role')).toBe('status')
  })

  it('announces the default English label once, visually hidden', () => {
    const fixture = setup()
    const srText = fixture.nativeElement.querySelector('.sr-only')
    expect(srText.textContent.trim()).toBe('Loading…')
  })

  it('announces a custom label', () => {
    const fixture = setup()
    fixture.componentRef.setInput('label', 'Chargement…')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.sr-only').textContent.trim()).toBe('Chargement…')
  })

  it('defaults to the md size', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('data-size')).toBe('md')
  })

  it.each(['sm', 'md', 'lg'] as const)('reflects the %s size', (size) => {
    const fixture = setup()
    fixture.componentRef.setInput('size', size)
    fixture.detectChanges()
    expect(fixture.nativeElement.getAttribute('data-size')).toBe(size)
  })

  it('hides the visual ring from assistive technology', () => {
    const fixture = setup()
    const ring = fixture.nativeElement.querySelector('.gbt-spinner__ring')
    expect(ring.getAttribute('aria-hidden')).toBe('true')
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it("gives the ring a non-inline display so its width/height (and so its roundness) actually apply", () => {
    const scss = readFileSync(join(__dirname, 'spinner.scss'), 'utf8')
    const ringBlock = /\.gbt-spinner__ring\s*\{([^}]*)\}/.exec(scss)?.[1] ?? ''
    expect(ringBlock).toMatch(/display:\s*(block|inline-block|flex|grid)\b/)
  })
})
