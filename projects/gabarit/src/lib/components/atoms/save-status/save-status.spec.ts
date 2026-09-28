import { Component, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { SaveStatus, SaveStatusState } from './save-status'

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(SaveStatus)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    root,
    region: () => root.querySelector('.gbt-save-status') as HTMLElement,
    text: () => root.querySelector('.gbt-save-status__text')?.textContent?.trim(),
  }
}

describe('SaveStatus', () => {
  it('renders an empty polite status region when idle, so a change is announced later', () => {
    const { region, text } = setup()

    expect(region().getAttribute('role')).toBe('status')
    expect(region().getAttribute('data-state')).toBe('idle')
    expect(text()).toBe('')
    expect(region().querySelector('gbt-icon, .gbt-save-status__spinner')).toBeNull()
  })

  it('says "Saving…" with a spinning ring that is decorative', () => {
    const { region, text } = setup({ state: 'saving' })

    expect(text()).toBe('Saving…')
    expect(region().getAttribute('data-state')).toBe('saving')
    const spinner = region().querySelector('.gbt-save-status__spinner') as HTMLElement
    expect(spinner.getAttribute('aria-hidden')).toBe('true')
  })

  it('says "Saved" with a check icon', () => {
    const { region, text } = setup({ state: 'saved' })

    expect(text()).toBe('Saved')
    expect(region().querySelector('gbt-icon')).not.toBeNull()
    expect(region().querySelector('gbt-icon')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('says "Not saved" with an alert icon', () => {
    const { region, text } = setup({ state: 'error' })

    expect(text()).toBe('Not saved')
    expect(region().getAttribute('data-state')).toBe('error')
    expect(region().querySelector('gbt-icon')).not.toBeNull()
  })

  it('takes its labels from the inputs', () => {
    const inputs = {
      savingLabel: 'Enregistrement…',
      savedLabel: 'Enregistré',
      errorLabel: 'Non enregistré',
    }
    expect(setup({ ...inputs, state: 'saving' }).text()).toBe('Enregistrement…')
    expect(setup({ ...inputs, state: 'saved' }).text()).toBe('Enregistré')
    expect(setup({ ...inputs, state: 'error' }).text()).toBe('Non enregistré')
  })

  it('lets a message replace the label of the current state, but never shows one while idle', () => {
    expect(setup({ state: 'saved', message: 'Password updated' }).text()).toBe('Password updated')
    expect(setup({ state: 'error', message: 'The current password is wrong' }).text()).toBe(
      'The current password is wrong',
    )
    expect(setup({ state: 'idle', message: 'ignored' }).text()).toBe('')
  })

  it('keeps the same live-region element across every state change', () => {
    const fixture = TestBed.createComponent(SaveStatus)
    fixture.detectChanges()
    const region = fixture.nativeElement.querySelector('.gbt-save-status')

    for (const state of ['saving', 'saved', 'error', 'idle'] as SaveStatusState[]) {
      fixture.componentRef.setInput('state', state)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-save-status')).toBe(region)
      expect(region.getAttribute('data-state')).toBe(state)
    }
  })

  it('has no accessibility violations in any state', async () => {
    for (const state of ['idle', 'saving', 'saved', 'error']) {
      await expectNoA11yViolations(setup({ state }).root)
    }
  })
})

@Component({
  standalone: true,
  imports: [SaveStatus],
  template: `<gbt-save-status [state]="state()" />`,
})
class Host {
  state = signal<SaveStatusState>('idle')
}

describe('SaveStatus in a template', () => {
  it('follows a bound state', () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    fixture.componentInstance.state.set('saved')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-save-status__text').textContent).toBe('Saved')
  })
})
