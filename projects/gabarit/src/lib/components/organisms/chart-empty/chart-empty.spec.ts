import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ChartEmpty } from './chart-empty'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [ChartEmpty],
  template: `
    <gbt-chart-empty
      message="Aucune donnée sur cette période"
      actionLabel="Élargir la période"
      (action)="clicks.set(clicks() + 1)"
    />
  `,
})
class HostComponent {
  clicks = signal(0)
}

describe('ChartEmpty', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    return fixture
  }

  it('shows its message', () => {
    expect(setup().nativeElement.textContent).toContain('Aucune donnée sur cette période')
  })

  it('announces the change without taking focus', () => {
    const root = setup().nativeElement.querySelector('.gbt-chart-empty')
    expect(root.getAttribute('role')).toBe('status')
    expect(root.hasAttribute('tabindex')).toBe(false)
  })

  it('emits its action on click', () => {
    const fixture = setup()
    fixture.nativeElement.querySelector('button').click()
    fixture.detectChanges()
    expect(fixture.componentInstance.clicks()).toBe(1)
  })

  it('the live region pre-exists the content it announces', () => {
    @Component({
      standalone: true,
      imports: [ChartEmpty],
      template: `<gbt-chart-empty message="Rien" />`,
    })
    class SansActionHost {}
    const fixture = TestBed.createComponent(SansActionHost)
    fixture.detectChanges()
    const region = fixture.nativeElement.querySelector('[role="status"]')
    expect(region).not.toBeNull()
    expect(region.querySelector('.gbt-chart-empty__message')).not.toBeNull()
    expect(region.querySelector('.gbt-chart-empty__action')).toBeNull()
  })

  it('shows no button when no action is offered', () => {
    @Component({
      standalone: true,
      imports: [ChartEmpty],
      template: `<gbt-chart-empty message="Rien" />`,
    })
    class MinimalHost {}
    const fixture = TestBed.createComponent(MinimalHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('button')).toBeNull()
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
