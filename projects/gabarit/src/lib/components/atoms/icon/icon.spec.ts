import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Icon } from './icon'
import { IconRegistry } from './icon-registry'

@Component({
  standalone: true,
  imports: [Icon],

  template: `<gbt-icon name="check" aria-label="Fermer" />`,
})
class HostWithMisusedAriaLabel {}

@Component({
  standalone: true,
  imports: [Icon],

  template: `<gbt-icon name="check" aria-hidden="false" />`,
})
class HostOverridingAriaHidden {}

describe('Icon', () => {
  it("renders the requested icon's markup", () => {
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', 'check')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull()
  })

  it('renders no svg for an unknown icon', () => {
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', 'inexistante')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg')).toBeNull()
  })

  it('renders an icon registered by the application', () => {
    TestBed.inject(IconRegistry).register('rocket', '<circle cx="12" cy="12" r="4" />')
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', 'rocket')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('svg circle')).not.toBeNull()
  })

  it('causes no accessibility violation', async () => {
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', 'check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('hides the host and the rendered svg from assistive technology, the icon being purely decorative', () => {
    const fixture = TestBed.createComponent(Icon)
    fixture.componentRef.setInput('name', 'check')
    fixture.detectChanges()
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true')
    const svg = fixture.nativeElement.querySelector('svg')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('ignores an aria-label set on the host: neither an accessible name nor invalid ARIA markup', async () => {
    const fixture = TestBed.createComponent(HostWithMisusedAriaLabel)
    fixture.detectChanges()
    const host = fixture.nativeElement.querySelector('gbt-icon')
    expect(host.getAttribute('aria-label')).toBe('Fermer')
    expect(host.getAttribute('aria-hidden')).toBe('true')
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('cannot be made announceable via aria-hidden="false" set by the consumer', async () => {
    const fixture = TestBed.createComponent(HostOverridingAriaHidden)
    fixture.detectChanges()
    const host = fixture.nativeElement.querySelector('gbt-icon')
    expect(host.getAttribute('aria-hidden')).toBe('true')
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
