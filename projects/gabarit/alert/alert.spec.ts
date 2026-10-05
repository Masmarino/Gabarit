import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { Alert, AlertVariant } from './alert'
import { Icon } from '../icon/icon'

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

const alert = (f: ReturnType<typeof setup>): HTMLElement =>
  f.nativeElement.querySelector('.gbt-alert')

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

    expect(
      fixture.nativeElement.querySelector('.gbt-alert__close').getAttribute('aria-label'),
    ).toBe('Fermer')
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

// ---- 1.2.0 additions ---------------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [Alert],
  template: `
    <gbt-alert [variant]="variant()" [heading]="heading()" [live]="live()">
      Le service ne répond pas.
      <button alert-actions type="button" class="retry">Réessayer</button>
    </gbt-alert>
  `,
})
class SlotHost {
  variant = signal<AlertVariant>('error')
  heading = signal('')
  live = signal<'auto' | 'assertive' | 'polite' | 'off'>('auto')
}

const root = (f: { nativeElement: HTMLElement }): HTMLElement =>
  f.nativeElement.querySelector('.gbt-alert') as HTMLElement

describe('Alert — defaults keep the pre-1.2.0 rendering', () => {
  it('renders exactly the historical attributes and no new element', () => {
    const fixture = setupAlert()
    const el = root(fixture)
    expect(
      el
        .getAttributeNames()
        .filter((n) => !n.startsWith('_ng'))
        .sort(),
    ).toEqual(['aria-atomic', 'class', 'data-variant', 'role'])
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-atomic')).toBe('true')
    expect(el.className).toBe('gbt-alert')
    expect(fixture.nativeElement.querySelector('.gbt-alert__heading')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-alert__actions:not(:empty)')).toBeNull()
  })

  it.each<[AlertVariant, string]>([
    ['success', 'status'],
    ['info', 'status'],
    ['warning', 'alert'],
    ['error', 'alert'],
  ])('live="auto" (default) keeps role="%s" → %s', (variant, role) => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('variant', variant)
    fixture.detectChanges()
    expect(fixture.componentInstance['live']()).toBe('auto')
    expect(root(fixture).getAttribute('role')).toBe(role)
  })
})

describe('Alert — live', () => {
  it.each<[AlertVariant, 'assertive' | 'polite', string]>([
    ['info', 'assertive', 'alert'],
    ['success', 'assertive', 'alert'],
    ['error', 'polite', 'status'],
    ['warning', 'polite', 'status'],
  ])('%s + live="%s" → role="%s"', (variant, live, role) => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('variant', variant)
    fixture.componentRef.setInput('live', live)
    fixture.detectChanges()
    expect(root(fixture).getAttribute('role')).toBe(role)
    expect(root(fixture).getAttribute('aria-atomic')).toBe('true')
  })

  it.each<AlertVariant>(['info', 'success', 'warning', 'error', 'neutral'])(
    'live="off" removes every live-region attribute from a %s alert',
    (variant) => {
      const fixture = setupAlert()
      fixture.componentRef.setInput('variant', variant)
      fixture.componentRef.setInput('live', 'off')
      fixture.detectChanges()
      const el = root(fixture)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-live')).toBe(false)
      expect(el.hasAttribute('aria-atomic')).toBe(false)
    },
  )
})

describe('Alert — heading and [alert-actions]', () => {
  it('renders the heading before the message, and none without it', () => {
    const fixture = TestBed.createComponent(SlotHost)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-alert__heading')).toBeNull()

    fixture.componentInstance.heading.set('Impossible de charger')
    fixture.detectChanges()
    const message = fixture.nativeElement.querySelector('.gbt-alert__message') as HTMLElement
    expect(message.firstElementChild?.className).toBe('gbt-alert__heading')
    expect(message.firstElementChild?.textContent).toBe('Impossible de charger')
    expect(root(fixture).hasAttribute('data-heading')).toBe(true)
  })

  it('projects [alert-actions] into its own slot, outside the message', () => {
    const fixture = TestBed.createComponent(SlotHost)
    fixture.detectChanges()
    const actions = fixture.nativeElement.querySelector('.gbt-alert__actions') as HTMLElement
    expect(actions.querySelector('button.retry')?.textContent).toBe('Réessayer')
    expect(
      (fixture.nativeElement.querySelector('.gbt-alert__message') as HTMLElement).querySelector(
        'button',
      ),
    ).toBeNull()
    expect(actions.matches(':empty')).toBe(false)
  })

  it('leaves the slot empty (so CSS hides it) when nothing is projected', () => {
    const fixture = setupAlert()
    const actions = fixture.nativeElement.querySelector('.gbt-alert__actions') as HTMLElement
    expect(actions.matches(':empty')).toBe(true)
  })

  it('keeps an action focusable and clickable, next to the dismiss button', () => {
    const fixture = TestBed.createComponent(SlotHost)
    fixture.detectChanges()
    const retry = fixture.nativeElement.querySelector('.retry') as HTMLButtonElement
    let clicks = 0
    retry.addEventListener('click', () => clicks++)
    retry.click()
    expect(clicks).toBe(1)
  })
})

describe('Alert — size, appearance, neutral, icon alignment', () => {
  it('adds data-size only for sm', () => {
    const fixture = setupAlert()
    expect(root(fixture).hasAttribute('data-size')).toBe(false)
    fixture.componentRef.setInput('size', 'sm')
    fixture.detectChanges()
    expect(root(fixture).getAttribute('data-size')).toBe('sm')
    fixture.componentRef.setInput('size', 'md')
    fixture.detectChanges()
    expect(root(fixture).hasAttribute('data-size')).toBe(false)
  })

  it('adds data-appearance only for subtle', () => {
    const fixture = setupAlert()
    expect(root(fixture).hasAttribute('data-appearance')).toBe(false)
    fixture.componentRef.setInput('appearance', 'subtle')
    fixture.detectChanges()
    expect(root(fixture).getAttribute('data-appearance')).toBe('subtle')
  })

  it('has a neutral variant: status role, info icon', () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('variant', 'neutral')
    fixture.detectChanges()
    expect(root(fixture).getAttribute('data-variant')).toBe('neutral')
    expect(root(fixture).getAttribute('role')).toBe('status')
    expect(fixture.debugElement.query(By.directive(Icon)).componentInstance.name()).toBe('info')
  })

  it('adds data-icon-align only when forced', () => {
    const fixture = setupAlert()
    expect(root(fixture).hasAttribute('data-icon-align')).toBe(false)
    fixture.componentRef.setInput('iconAlign', 'start')
    fixture.detectChanges()
    expect(root(fixture).getAttribute('data-icon-align')).toBe('start')
    fixture.componentRef.setInput('iconAlign', 'center')
    fixture.detectChanges()
    expect(root(fixture).getAttribute('data-icon-align')).toBe('center')
  })
})

describe('Alert — a11y of the 1.2.0 additions', () => {
  it('has no violations with heading, actions and a dismiss button', async () => {
    const fixture = TestBed.createComponent(SlotHost)
    fixture.componentInstance.heading.set('Impossible de charger')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no violations for live off, sm, subtle and neutral', async () => {
    const fixture = setupAlert()
    fixture.componentRef.setInput('variant', 'neutral')
    fixture.componentRef.setInput('live', 'off')
    fixture.componentRef.setInput('size', 'sm')
    fixture.componentRef.setInput('appearance', 'subtle')
    fixture.componentRef.setInput('dismissible', true)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Alert — stylesheet', () => {
  it('keeps the :has() selector in a rule of its own, so a browser without :has() keeps the others', () => {
    const scss = readFileSync(join(process.cwd(), 'projects/gabarit/alert/alert.scss'), 'utf8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
    // A selector list is dropped WHOLE when one of its selectors is unsupported.
    const rules = [...scss.matchAll(/([^{}]+) \{ @include icon-start; \}/g)].map((m) => m[1].trim())
    expect(rules.length).toBeGreaterThanOrEqual(2)
    const withHas = rules.filter((selector) => selector.includes(':has('))
    expect(withHas.length).toBe(1)
    expect(withHas[0]).not.toContain(',')
  })

  it('gives a projected [alert-actions] button a 44px touch target on a coarse pointer', () => {
    const scss = readFileSync(join(process.cwd(), 'projects/gabarit/alert/alert.scss'), 'utf8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
    const coarseIndex = scss.indexOf('@media (pointer: coarse)')
    const ruleIndex = scss.indexOf(
      '.gbt-alert__actions ::ng-deep .gbt-button { min-height: 44px; }',
    )
    expect(coarseIndex).toBeGreaterThan(-1)
    expect(ruleIndex).toBeGreaterThan(coarseIndex)
  })
})
