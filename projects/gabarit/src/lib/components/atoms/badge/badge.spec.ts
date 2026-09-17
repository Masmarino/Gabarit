import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Badge, BadgeVariant } from './badge'
import { Icon } from '../icon/icon'

@Component({
  standalone: true,
  imports: [Badge],
  template: `<gbt-badge>{{ label }}</gbt-badge>`,
})
class HostComponent {
  label = 'Actif'
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const badge = (f: ReturnType<typeof setup>): HTMLElement => f.nativeElement.querySelector('.gbt-badge')

function setupBadge() {
  const fixture = TestBed.createComponent(Badge)
  fixture.detectChanges()
  return fixture
}

describe('Badge', () => {
  it('projects its content as the label', () => {
    const fixture = setup()
    expect(badge(fixture).textContent?.trim()).toBe('Actif')
  })

  it('defaults to the neutral variant', () => {
    const fixture = setup()
    expect(badge(fixture).getAttribute('data-variant')).toBe('neutral')
  })

  it.each<BadgeVariant>(['success', 'warning', 'error', 'info'])(
    'reflects the %s variant as a data attribute',
    (variant) => {
      const fixture = setupBadge()
      fixture.componentRef.setInput('variant', variant)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-badge').getAttribute('data-variant')).toBe(
        variant,
      )
    },
  )

  it('renders no icon by default', () => {
    const fixture = setup()
    expect(fixture.debugElement.query(By.directive(Icon))).toBeNull()
  })

  it('renders the given icon before the label', () => {
    const fixture = setupBadge()
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()

    const icon = fixture.debugElement.query(By.directive(Icon))
    expect(icon).not.toBeNull()
    expect(icon.componentInstance.name()).toBe('check')
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations with an icon', async () => {
    const fixture = setupBadge()
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
