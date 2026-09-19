import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { NotificationDot } from './notification-dot'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [NotificationDot],
  template: `
    <gbt-notification-dot>
      <button type="button">Notifications</button>
    </gbt-notification-dot>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(NotificationDot)
  fixture.detectChanges()
  return fixture
}

const dot = (f: ReturnType<typeof setup>): HTMLElement | null =>
  f.nativeElement.querySelector('.gbt-notification-dot__badge')

describe('NotificationDot', () => {
  it('projects the trigger content', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Notifications')
  })

  it('shows a plain dot with no count by default', () => {
    const fixture = setup()
    expect(dot(fixture)).not.toBeNull()
    expect(dot(fixture)!.textContent?.trim()).toBe('')
  })

  it('shows the count when given', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 3)
    fixture.detectChanges()
    expect(dot(fixture)!.textContent?.trim()).toBe('3')
  })

  it('truncates a count above max to "max+"', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 150)
    fixture.detectChanges()
    expect(dot(fixture)!.textContent?.trim()).toBe('99+')
  })

  it('respects a custom max', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 15)
    fixture.componentRef.setInput('max', 9)
    fixture.detectChanges()
    expect(dot(fixture)!.textContent?.trim()).toBe('9+')
  })

  it('hides the dot when count is exactly 0', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 0)
    fixture.detectChanges()
    expect(dot(fixture)).toBeNull()
  })

  it('hides the dot when hidden is true, even with a count', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 3)
    fixture.componentRef.setInput('hidden', true)
    fixture.detectChanges()
    expect(dot(fixture)).toBeNull()
  })

  it('marks the visual dot as aria-hidden (decorative)', () => {
    const fixture = setup()
    expect(dot(fixture)!.getAttribute('aria-hidden')).toBe('true')
  })

  it('exposes the count publicly for the consumer to wire onto their own trigger', () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 3)
    fixture.detectChanges()
    expect(fixture.componentInstance.count()).toBe(3)
  })

  it('has no a11y violations, plain dot', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with a count', async () => {
    const fixture = setup()
    fixture.componentRef.setInput('count', 3)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
