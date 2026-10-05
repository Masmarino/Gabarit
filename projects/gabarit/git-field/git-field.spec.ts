import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, type Type } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AuthActivate } from '../auth-activate/activate'
import { AuthLogin } from '../auth-login/login'
import { AuthRegister } from '../auth-register/register'
import { AuthResetPassword } from '../auth-reset-password/reset-password'
import { AuthPanel } from '../auth/auth-panel/auth-panel'
import { AUTH_PORT } from '../auth/ports/auth.port'
import { fakeAuthPort, fakeQrRenderer } from '../auth/testing/fake-ports'
import { TOTP_QR_RENDERER } from '../mfa-enrollment/totp-qr/totp-qr'
import { GitField } from './git-field'

describe('GitField', () => {
  function render() {
    TestBed.configureTestingModule({ imports: [GitField] })
    const fixture = TestBed.createComponent(GitField)
    fixture.detectChanges()
    return fixture.nativeElement as HTMLElement
  }

  it('is decoration, hidden from assistive technology', () => {
    const root = render()

    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.querySelector('svg')?.getAttribute('focusable')).toBe('false')
  })

  it('draws the same commit graph twice, side by side, so that it loops without a seam', () => {
    const root = render()
    const tiles = root.querySelectorAll('.gbt-git-field__track > g')

    expect(tiles).toHaveLength(2)
    expect(tiles[0].innerHTML).toBe(tiles[1].innerHTML)
    expect(tiles[0].querySelectorAll('.gbt-git-field__line').length).toBeGreaterThan(7)
    expect(tiles[0].querySelectorAll('.gbt-git-field__commit').length).toBeGreaterThan(30)
    expect(tiles[0].querySelectorAll('.gbt-git-field__pulse').length).toBeGreaterThan(2)
  })

  it('draws the same graph every time, so the server and the browser agree', () => {
    const first = render().querySelector('.gbt-git-field__track')!.innerHTML
    TestBed.resetTestingModule()
    const second = render().querySelector('.gbt-git-field__track')!.innerHTML

    expect(second).toBe(first)
  })
})

@Component({
  standalone: true,
  imports: [AuthPanel, GitField],
  template: `<gbt-auth-panel><gbt-git-field auth-backdrop /></gbt-auth-panel>`,
})
class PanelHost {}

@Component({
  standalone: true,
  imports: [AuthLogin, GitField],
  template: `<gbt-auth-login><gbt-git-field auth-backdrop /></gbt-auth-login>`,
})
class LoginHost {}

@Component({
  standalone: true,
  imports: [AuthRegister, GitField],
  template: `<gbt-auth-register><gbt-git-field auth-backdrop /></gbt-auth-register>`,
})
class RegisterHost {}

@Component({
  standalone: true,
  imports: [AuthActivate, GitField],
  template: `<gbt-auth-activate><gbt-git-field auth-backdrop /></gbt-auth-activate>`,
})
class ActivateHost {}

@Component({
  standalone: true,
  imports: [AuthResetPassword, GitField],
  template: `<gbt-auth-reset-password><gbt-git-field auth-backdrop /></gbt-auth-reset-password>`,
})
class ResetHost {}

/** Every sign-in page passes its `[auth-backdrop]` on to the panel, which draws it on the graphite, under the card. */
describe('GitField in the [auth-backdrop] slot', () => {
  const pages: [string, Type<unknown>][] = [
    ['gbt-auth-panel', PanelHost],
    ['gbt-auth-login', LoginHost],
    ['gbt-auth-register', RegisterHost],
    ['gbt-auth-activate', ActivateHost],
    ['gbt-auth-reset-password', ResetHost],
  ]

  for (const [selector, host] of pages) {
    it(`goes behind the panel of ${selector}`, async () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: AUTH_PORT, useValue: fakeAuthPort() },
          { provide: TOTP_QR_RENDERER, useValue: fakeQrRenderer },
        ],
      })
      const fixture = TestBed.createComponent(host)
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      const el = fixture.nativeElement as HTMLElement

      const field = el.querySelector('main.gbt-auth-panel > gbt-git-field')
      expect(field).toBeTruthy()
      expect(field?.closest('.gbt-auth-panel__panel')).toBeNull()
    })
  }

  it('lifts the panel over the field, inside a ground of its own', () => {
    const scss = readFileSync(
      join(process.cwd(), 'projects/gabarit/auth/auth-panel/auth-panel.scss'),
      'utf8',
    )
    expect(
      /\.gbt-auth-panel \{[^}]*position: relative;[^}]*isolation: isolate;/.exec(scss),
    ).not.toBeNull()
    expect(
      /\.gbt-auth-panel__panel \{[^}]*position: relative;[^}]*z-index: 1;/.exec(scss),
    ).not.toBeNull()
  })
})

describe('GitField stylesheet', () => {
  const scss = readFileSync(
    join(process.cwd(), 'projects/gabarit/git-field/git-field.scss'),
    'utf8',
  )

  it('reads the frame colours, since it is drawn on the graphite in both themes', () => {
    expect(scss).toMatch(/:host \{\s*@include themes\.frame-tokens;/)
  })

  it('stands still when reduced motion is asked for', () => {
    expect(scss).toMatch(/@media \(prefers-reduced-motion: reduce\)[^{]*\{[^}]*animation: none;/)
  })
})
