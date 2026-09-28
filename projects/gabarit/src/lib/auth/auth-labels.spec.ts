import { Component, input } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import {
  AUTH_LABELS,
  DEFAULT_ACTIVATE_LABELS,
  DEFAULT_BACKUP_CODES_LABELS,
  DEFAULT_LOGIN_LABELS,
  DEFAULT_MFA_ENROLLMENT_LABELS,
  DEFAULT_MFA_SETTINGS_LABELS,
  DEFAULT_PASSKEY_SETTINGS_LABELS,
  DEFAULT_REGISTER_LABELS,
  DEFAULT_TOTP_QR_LABELS,
  type LoginLabels,
  authLabels,
  provideAuthLabels,
} from './auth-labels'

@Component({
  selector: 'gbt-labels-probe',
  standalone: true,
  template: `{{ text().heading }}|{{ text().submit }}|{{ text().back }}`,
})
class Probe {
  labels = input<Partial<LoginLabels>>({})
  readonly text = authLabels('login', DEFAULT_LOGIN_LABELS, this.labels)
}

function render(labels: Partial<LoginLabels> = {}) {
  const fixture = TestBed.createComponent(Probe)
  fixture.componentRef.setInput('labels', labels)
  fixture.detectChanges()
  return (fixture.nativeElement as HTMLElement).textContent
}

describe('the auth kit labels', () => {
  it('are English by default', () => {
    expect(render()).toBe('Sign in|Sign in|Back')
  })

  it('take what the application provided once, over the defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideAuthLabels({ login: { heading: 'Connexion', back: 'Retour' } })],
    })

    expect(render()).toBe('Connexion|Sign in|Retour')
  })

  it("take the component's own input over the application's, string by string", () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_LABELS, useValue: { login: { heading: 'Connexion', back: 'Retour' } } },
      ],
    })

    expect(render({ heading: 'Bienvenue', submit: 'Se connecter' })).toBe(
      'Bienvenue|Se connecter|Retour',
    )
  })

  it('keep the default for a string given as undefined', () => {
    TestBed.configureTestingModule({
      providers: [provideAuthLabels({ login: { heading: undefined } })],
    })

    expect(render({ submit: undefined })).toBe('Sign in|Sign in|Back')
  })

  it('word counts and names through functions', () => {
    expect(DEFAULT_MFA_SETTINGS_LABELS.codesLeft(0)).toBe('No backup codes left')
    expect(DEFAULT_MFA_SETTINGS_LABELS.codesLeft(1)).toBe('1 backup code left')
    expect(DEFAULT_MFA_SETTINGS_LABELS.codesLeft(8)).toBe('8 backup codes left')
    expect(DEFAULT_PASSKEY_SETTINGS_LABELS.deleteDialogMessage('MacBook', false)).not.toContain(
      'last factor',
    )
    expect(DEFAULT_PASSKEY_SETTINGS_LABELS.deleteDialogMessage('MacBook', true)).toContain(
      'last factor',
    )
  })

  it('export frozen defaults: a consumer cannot change them for everyone', () => {
    const defaults = [
      DEFAULT_TOTP_QR_LABELS,
      DEFAULT_BACKUP_CODES_LABELS,
      DEFAULT_MFA_ENROLLMENT_LABELS,
      DEFAULT_LOGIN_LABELS,
      DEFAULT_REGISTER_LABELS,
      DEFAULT_ACTIVATE_LABELS,
      DEFAULT_MFA_SETTINGS_LABELS,
      DEFAULT_PASSKEY_SETTINGS_LABELS,
    ]
    for (const labels of defaults) {
      expect(Object.isFrozen(labels)).toBe(true)
    }
    expect(() => {
      ;(DEFAULT_LOGIN_LABELS as { heading: string }).heading = 'Hijacked'
    }).toThrow(TypeError)
    expect(render()).toBe('Sign in|Sign in|Back')
  })
})
