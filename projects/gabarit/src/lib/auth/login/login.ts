import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { EMPTY, from, switchMap } from 'rxjs'
import { Button } from '../../components/atoms/button/button'
import { Divider } from '../../components/atoms/divider/divider'
import { GbtInput } from '../../components/atoms/input/input'
import { Alert } from '../../components/molecules/alert/alert'
import { DEFAULT_LOGIN_LABELS, type LoginLabels, authLabels } from '../auth-labels'
import { AuthFooter, AuthFooterLink } from '../auth-footer/auth-footer'
import { AuthPanel } from '../auth-panel/auth-panel'
import { MfaEnrollment } from '../mfa-enrollment/mfa-enrollment'
import { AUTH_PORT, type MfaProof } from '../ports/auth.port'
import { focusAfterRender } from '../shared/focus-after-render'
import { classifyMfaFailure } from '../shared/mfa-errors'
import { isAuthPortError } from '../shared/port-error'
import { classifyPasskeyError, getPasskeyAssertion, passkeysSupported } from '../webauthn'

let nextId = 0

@Component({
  selector: 'gbt-auth-login',
  standalone: true,
  imports: [FormsModule, Button, Divider, GbtInput, Alert, AuthFooter, AuthPanel, MfaEnrollment],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLogin {
  private readonly auth = inject(AUTH_PORT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  labels = input<Partial<LoginLabels>>({})
  loggedIn = output<void>()

  protected readonly text = authLabels('login', DEFAULT_LOGIN_LABELS, this.labels)
  protected readonly registerLink = contentChild(AuthFooterLink)
  protected readonly id = `gbt-login-${nextId++}`

  username = signal('')
  protected password = signal('')
  error = signal('')
  submitting = signal(false)

  protected mfaToken = signal<string | null>(null)
  mfaSetupRequired = signal(false)
  mfaHasTotp = signal(false)
  mfaHasPasskey = signal(false)
  useBackupCode = signal(false)
  protected code = signal('')
  protected backupCode = signal('')

  protected registrationEnabled = signal(false)
  protected passkeysAvailable = signal<boolean | null>(null)
  private browserHasPasskeys = signal(false)
  protected passkeyInFlight = signal(false)
  private ceremony = 0
  protected errorVariant = signal<'error' | 'info'>('error')

  protected enrolling = computed(() => this.mfaToken() !== null && this.mfaSetupRequired())
  protected challenging = computed(() => this.mfaToken() !== null && !this.mfaSetupRequired())

  protected canUsePasskey = computed(
    () => this.mfaHasPasskey() && this.browserHasPasskeys() && this.passkeysAvailable() !== false,
  )
  protected hasTotp = computed(() => this.mfaHasTotp() || !this.mfaHasPasskey())
  protected passkeyBlocked = computed(
    () => this.challenging() && this.mfaHasPasskey() && !this.hasTotp() && !this.canUsePasskey(),
  )
  protected showBackupCode = computed(() => this.useBackupCode() || this.passkeyBlocked())
  protected blockedReason = computed(() =>
    this.browserHasPasskeys() ? this.text().blockedByServer : this.text().blockedByBrowser,
  )
  protected backFromBackupLabel = computed(() => {
    const text = this.text()
    if (this.canUsePasskey()) {
      return this.hasTotp() ? text.backToPasskeyOrApp : text.backToPasskey
    }
    return text.backToApp
  })

  protected heading = computed(() => {
    if (this.enrolling()) {
      return this.text().enrollmentHeading
    }
    return this.challenging() ? this.text().challengeHeading : this.text().heading
  })
  protected intro = computed(() => {
    const text = this.text()
    if (this.enrolling()) {
      return ''
    }
    if (!this.challenging()) {
      return text.intro
    }
    if (this.showBackupCode()) {
      return text.introBackupCode
    }
    if (this.canUsePasskey()) {
      return this.hasTotp() ? text.introPasskeyOrCode : text.introPasskey
    }
    return text.introCode
  })

  constructor() {
    this.focusField('username')
    this.auth
      .authConfig()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (config) => {
          this.registrationEnabled.set(config.registrationEnabled === true)
          this.passkeysAvailable.set(config.passkeysAvailable === true)
        },
        error: () => this.registrationEnabled.set(false),
      })
  }

  submit(): void {
    if (this.submitting()) {
      return
    }
    this.error.set('')
    this.submitting.set(true)
    this.auth.login(this.username(), this.password()).subscribe({
      next: (res) => {
        this.password.set('')
        this.submitting.set(false)
        if (res.token) {
          this.loggedIn.emit()
        } else if (res.mfaToken) {
          this.mfaSetupRequired.set(res.mfaSetupRequired === true)
          this.mfaHasTotp.set(res.mfaHasTotp === true)
          this.mfaHasPasskey.set(res.mfaHasPasskey === true)
          this.browserHasPasskeys.set(passkeysSupported())
          this.mfaToken.set(res.mfaToken)
          if (!this.mfaSetupRequired()) {
            this.focusField(this.firstChallengeTarget())
          }
        } else {
          this.fail(this.text().loginFailed, 'password')
        }
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        this.fail(this.loginFailureMessage(err), 'password')
      },
    })
  }

  private loginFailureMessage(err: unknown): string {
    const status = isAuthPortError(err) ? err.status : null
    if (status === 401) {
      return this.text().wrongCredentials
    }
    if (status === 429) {
      return this.text().tooManyAttempts
    }
    return this.text().loginFailed
  }

  verify(): void {
    if (this.submitting()) {
      return
    }
    const mfaToken = this.mfaToken()
    const backup = this.showBackupCode()
    const value = (backup ? this.backupCode() : this.code()).replace(/\s+/g, '')
    const field = backup ? 'mfa-backup-code' : 'mfa-code'
    if (mfaToken === null) {
      return
    }
    if (value === '') {
      this.fail(backup ? this.text().enterBackupCode : this.text().enterCode, field)
      return
    }
    this.error.set('')
    this.submitting.set(true)
    const proof: MfaProof = backup ? { backupCode: value } : { code: value }
    this.auth.verifyMfa(mfaToken, proof).subscribe({
      next: () => {
        this.submitting.set(false)
        this.resetMfa()
        this.loggedIn.emit()
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        const failure = classifyMfaFailure(err)
        if (failure === 'expired') {
          this.sessionExpired()
          return
        }
        if (failure === 'wrong-code') {
          this.code.set('')
          this.backupCode.set('')
        }
        const text = this.text()
        this.fail(
          failure === 'rate-limited'
            ? text.tooManyAttempts
            : failure === 'wrong-code'
              ? text.wrongCode
              : text.verifyFailed,
          field,
        )
      },
    })
  }

  usePasskey(): void {
    const mfaToken = this.mfaToken()
    if (this.submitting() || mfaToken === null) {
      return
    }
    this.error.set('')
    this.submitting.set(true)
    this.passkeyInFlight.set(true)
    const run = ++this.ceremony
    this.auth
      .startPasskeyChallenge(mfaToken)
      .pipe(
        switchMap(({ challengeId, publicKey }) =>
          run !== this.ceremony
            ? EMPTY
            : from(getPasskeyAssertion(publicKey)).pipe(
                switchMap((credential) =>
                  run === this.ceremony
                    ? this.auth.finishPasskeyChallenge(mfaToken, challengeId, credential)
                    : EMPTY,
                ),
              ),
        ),
      )
      .subscribe({
        next: () => {
          this.submitting.set(false)
          this.passkeyInFlight.set(false)
          this.resetMfa()
          this.loggedIn.emit()
        },
        error: (err: unknown) => {
          if (run !== this.ceremony) {
            return
          }
          this.submitting.set(false)
          this.passkeyInFlight.set(false)
          this.passkeyFailed(err)
        },
      })
  }

  private passkeyFailed(err: unknown): void {
    const text = this.text()
    if (!isAuthPortError(err)) {
      switch (classifyPasskeyError(err)) {
        case 'cancelled':
          this.fail(text.cancelled, 'mfa-passkey', 'info')
          return
        case 'unsupported':
          this.fail(text.browserUnsupported, 'mfa-passkey')
          return
        default:
          this.fail(text.verifyFailed, 'mfa-passkey')
          return
      }
    }
    switch (classifyMfaFailure(err)) {
      case 'expired':
        this.sessionExpired()
        return
      case 'wrong-code':
        this.fail(text.passkeyRefused, 'mfa-passkey')
        return
      case 'rate-limited':
        this.fail(text.tooManyAttempts, 'mfa-passkey')
        return
      case 'unavailable':
        this.fail(text.passkeysUnavailable, 'mfa-passkey')
        return
      default:
        this.fail(text.verifyFailed, 'mfa-passkey')
    }
  }

  toggleBackupCode(): void {
    this.error.set('')
    this.useBackupCode.update((backup) => !backup)
    this.focusField(this.useBackupCode() ? 'mfa-backup-code' : this.firstChallengeTarget())
  }

  private firstChallengeTarget(): string {
    if (this.showBackupCode()) {
      return 'mfa-backup-code'
    }
    return this.canUsePasskey() ? 'mfa-passkey' : 'mfa-code'
  }

  backToCredentials(): void {
    this.resetMfa()
    this.error.set('')
    this.focusField('password')
  }

  sessionExpired(): void {
    this.resetMfa()
    this.fail(this.text().loginExpired, 'password')
  }

  enrolled(token: string): void {
    this.auth.setToken(token)
    this.resetMfa()
    this.loggedIn.emit()
  }

  private resetMfa(): void {
    this.ceremony++
    this.submitting.set(false)
    this.passkeyInFlight.set(false)
    this.mfaToken.set(null)
    this.mfaSetupRequired.set(false)
    this.mfaHasTotp.set(false)
    this.mfaHasPasskey.set(false)
    this.useBackupCode.set(false)
    this.code.set('')
    this.backupCode.set('')
  }

  private fail(message: string, focusSuffix: string, variant: 'error' | 'info' = 'error'): void {
    this.errorVariant.set(variant)
    this.error.set(message)
    this.focusField(focusSuffix)
  }

  private focusField(suffix: string): void {
    focusAfterRender(this.host, this.injector, `#${this.id}-${suffix}`, {
      nestedFallback: 'button',
    })
  }
}
