import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Alert, AlertVariant } from './alert'
import { Icon } from '../../atoms/icon/icon'

@Component({
  standalone: true,
  imports: [Alert],
  template: `<gbt-alert [variant]="variant" [dismissible]="dismissible">{{ message }}</gbt-alert>`,
})
class HostComponent {
  variant: AlertVariant = 'info'
  dismissible = false
  message = 'Le quota du dépôt est presque atteint.'
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const alert = (f: ReturnType<typeof setup>): HTMLElement => f.nativeElement.querySelector('.gbt-alert')

function setupAlert() {
  const fixture = TestBed.createComponent(Alert)
  fixture.detectChanges()
  return fixture
}

describe('Alert', () => {
  it('projects its content as the message', () => {
    const fixture = setup()
    expect(alert(fixture).textContent?.trim()).toBe('Le quota du dépôt est presque atteint.')
  })

  it('defaults to the info variant with a polite status role', () => {
    const fixture = setup()
    expect(alert(fixture).getAttribute('data-variant')).toBe('info')
    expect(alert(fixture).getAttribute('role')).toBe('status')
  })

  it.each<[AlertVariant, string, string]>([
    ['success', 'status', 'check-circle'],
    ['info', 'status', 'info'],
    ['warning', 'alert', 'alert-triangle'],
    ['error', 'alert', 'alert-circle'],
  ])('sets the %s variant with role="%s" and the %s icon', (variant, role, iconName) => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('variant', variant)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-alert').getAttribute('data-variant')).toBe(
      variant,
    )
    expect(fixture.nativeElement.querySelector('.gbt-alert').getAttribute('role')).toBe(role)
    const icon = fixture.debugElement.query(By.directive(Icon))
    expect(icon.componentInstance.name()).toBe(iconName)
  })

  it('renders no close button by default', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-alert__close')).toBeNull()
  })

  it('shows a close button when dismissible, labelled and emitting on click', () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('dismissible', true)
    fixture.detectChanges()

    const close: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-alert__close')
    expect(close).not.toBeNull()
    expect(close.getAttribute('aria-label')).toBe('Dismiss')

    const emitted: void[] = []
    fixture.componentInstance.dismissed.subscribe(() => emitted.push(undefined))
    close.click()

    expect(emitted.length).toBe(1)
  })

  it('allows customizing the close button label', () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('dismissible', true)
    fixture.componentRef.setInput('closeLabel', 'Fermer')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-alert__close').getAttribute('aria-label')).toBe(
      'Fermer',
    )
  })

  it('does not remove itself when dismissed — the app decides, like Toaster', () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('dismissible', true)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.gbt-alert__close').click()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-alert')).not.toBeNull()
  })

  it('has no a11y violations for every variant', async () => {
    for (const variant of ['info', 'success', 'warning', 'error'] as const) {
      const fixture = setupAlert()
      fixture.componentRef.setInput('variant', variant)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    }
  })

  it('has no a11y violations when dismissible', async () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('dismissible', true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
