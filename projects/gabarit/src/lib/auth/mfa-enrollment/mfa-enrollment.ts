import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EMPTY, from, switchMap } from 'rxjs'
import { Badge } from '../../components/atoms/badge/badge'
import { Button } from '../../components/atoms/button/button'
import { GbtInput } from '../../components/atoms/input/input'
import { Alert } from '../../components/molecules/alert/alert'
import { Card } from '../../components/molecules/card/card'
import { DEFAULT_MFA_ENROLLMENT_LABELS, type MfaEnrollmentLabels, authLabels } from '../auth-labels'
import { BackupCodes } from '../backup-codes/backup-codes'
import { AUTH_PORT } from '../ports/auth.port'
import { focusAfterRender } from '../shared/focus-after-render'
import { classifyMfaFailure } from '../shared/mfa-errors'
import { PASSKEY_NAME_MAX, passkeyNameProblem } from '../shared/passkey-name'
import { isAuthPortError } from '../shared/port-error'
import { TotpQr } from '../totp-qr/totp-qr'
import { classifyPasskeyError, createPasskeyCredential, passkeysSupported } from '../webauthn'

type Step = 'choice' | 'scan' | 'passkey' | 'codes'
type Factor = 'totp' | 'passkey'

const STEP_NUMBER: Record<Step, number> = { choice: 1, scan: 2, passkey: 2, codes: 3 }
const STEP_COUNT = 3

let nextId = 0

@Component({
  selector: 'gbt-mfa-enrollment',
  standalone: true,
  imports: [FormsModule, Badge, Button, Card, GbtInput, Alert, TotpQr, BackupCodes],
  templateUrl: './mfa-enrollment.html',
  styleUrl: './mfa-enrollment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaEnrollment {
  private readonly auth = inject(AUTH_PORT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  mfaToken = input.required<string>()
  passkeysAvailable = input(false, { transform: booleanAttribute })
  labels = input<Partial<MfaEnrollmentLabels>>({})
  completed = output<string>()
  cancelled = output<void>()
  expired = output<void>()

  protected readonly text = authLabels('mfaEnrollment', DEFAULT_MFA_ENROLLMENT_LABELS, this.labels)
  protected readonly stepCount = STEP_COUNT
  protected readonly id = `gbt-mfa-enrollment-${nextId++}`
  protected step = signal<Step>('choice')
  protected factor = signal<Factor>('totp')
  protected passkeyOffered = computed(() => this.passkeysAvailable() && this.browserHasPasskeys)
  protected passkeyName = signal('')
  protected errorVariant = signal<'error' | 'info'>('error')
  protected promptOpen = signal(false)
  protected stepNumber = computed(() => STEP_NUMBER[this.step()])
  protected secret = signal('')
  protected otpauthUrl = signal('')
  protected code = signal('')
  protected backupCodes = signal<string[]>([])
  protected acknowledged = signal(false)
  protected error = signal('')
  protected submitting = signal(false)

  private sessionToken: string | null = null
  private readonly browserHasPasskeys = passkeysSupported()
  private ceremony = 0

  constructor() {
    this.focus('heading')
    effect((onCleanup) => {
      if (this.step() === 'codes' && !this.acknowledged()) {
        const view = this.host.nativeElement.ownerDocument.defaultView
        const warn = (event: BeforeUnloadEvent) => {
          event.preventDefault()
          event.returnValue = ''
        }
        view?.addEventListener('beforeunload', warn)
        onCleanup(() => view?.removeEventListener('beforeunload', warn))
      }
    })
  }

  begin(): void {
    if (this.submitting()) {
      return
    }
    this.clearError()
    this.submitting.set(true)
    this.auth.enrollTotp(this.mfaToken()).subscribe({
      next: ({ secret, otpauthUrl }) => {
        this.submitting.set(false)
        this.factor.set('totp')
        this.secret.set(secret)
        this.otpauthUrl.set(otpauthUrl)
        this.goTo('scan')
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        this.error.set(this.messageFor(err, this.text().startFailed))
        this.focus('begin')
      },
    })
  }

  confirm(): void {
    if (this.submitting()) {
      return
    }
    const code = this.code().replace(/\s+/g, '')
    if (code === '') {
      this.error.set(this.text().enterCode)
      this.focus('field')
      return
    }
    this.clearError()
    this.submitting.set(true)
    this.auth.confirmTotp(this.mfaToken(), code).subscribe({
      next: ({ token, backupCodes }) => {
        this.submitting.set(false)
        this.secret.set('')
        this.otpauthUrl.set('')
        this.code.set('')
        this.enrolled(token, backupCodes)
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        this.error.set(this.messageFor(err, this.text().activationFailed, this.text().wrongCode))
        if (classifyMfaFailure(err) === 'wrong-code') {
          this.code.set('')
        }
        this.focus('field')
      },
    })
  }

  choosePasskey(): void {
    this.clearError()
    this.factor.set('passkey')
    this.goTo('passkey')
  }

  createPasskey(): void {
    if (this.submitting()) {
      return
    }
    const name = this.passkeyName().trim() || this.text().defaultPasskeyName
    const problem = passkeyNameProblem(name)
    if (problem) {
      this.fail(
        problem === 'too-long'
          ? this.text().nameTooLong(PASSKEY_NAME_MAX)
          : this.text().nameControlCharacters,
        'field',
      )
      return
    }
    const mfaToken = this.mfaToken()
    this.clearError()
    this.submitting.set(true)
    const run = ++this.ceremony
    this.auth
      .startPasskeySetup(mfaToken)
      .pipe(
        switchMap(({ challengeId, publicKey }) => {
          if (run !== this.ceremony) {
            return EMPTY
          }
          this.promptOpen.set(true)
          return from(createPasskeyCredential(publicKey)).pipe(
            switchMap((credential) =>
              run === this.ceremony
                ? this.auth.finishPasskeySetup(mfaToken, challengeId, credential, name)
                : EMPTY,
            ),
          )
        }),
      )
      .subscribe({
        next: ({ token, backupCodes }) => {
          this.submitting.set(false)
          this.promptOpen.set(false)
          this.passkeyName.set('')
          this.enrolled(token, backupCodes)
        },
        error: (err: unknown) => {
          if (run !== this.ceremony) {
            return
          }
          this.submitting.set(false)
          this.promptOpen.set(false)
          this.passkeyFailed(err)
        },
      })
  }

  protected back(): void {
    this.ceremony++
    this.submitting.set(false)
    this.promptOpen.set(false)
    if (this.step() !== 'choice' && this.passkeyOffered()) {
      this.clearError()
      this.secret.set('')
      this.otpauthUrl.set('')
      this.code.set('')
      this.goTo('choice')
      return
    }
    this.cancelled.emit()
  }

  /** A server that issues no backup codes with this factor has nothing to show: the enrolment ends there. */
  private enrolled(token: string, backupCodes: string[]): void {
    if (backupCodes.length === 0) {
      this.completed.emit(token)
      return
    }
    this.sessionToken = token
    this.backupCodes.set(backupCodes)
    this.goTo('codes')
  }

  finish(): void {
    if (!this.acknowledged() || this.sessionToken === null) {
      return
    }
    this.completed.emit(this.sessionToken)
  }

  private goTo(step: Step): void {
    this.step.set(step)
    this.focus('heading')
  }

  private passkeyFailed(err: unknown): void {
    const text = this.text()
    if (isAuthPortError(err)) {
      if (err.status === 409) {
        this.fail(text.alreadyRegistered, 'button')
        return
      }
      switch (classifyMfaFailure(err)) {
        case 'expired':
          this.expired.emit()
          this.fail(text.loginExpired, 'button')
          return
        case 'already-set-up':
          this.expired.emit()
          this.fail(text.alreadySetUp, 'button')
          return
        case 'rate-limited':
          this.fail(text.tooManyAttempts, 'button')
          return
        case 'unavailable':
          this.fail(text.passkeysUnavailable, 'button')
          return
        default:
          this.fail(text.passkeyFailed, 'button')
          return
      }
    }
    switch (classifyPasskeyError(err)) {
      case 'cancelled':
        this.fail(text.cancelled, 'button', 'info')
        return
      case 'already-registered':
        this.fail(text.alreadyRegistered, 'button')
        return
      case 'unsupported':
        this.fail(text.browserUnsupported, 'button')
        return
      default:
        this.fail(text.passkeyFailed, 'button')
    }
  }

  private clearError(): void {
    this.error.set('')
    this.errorVariant.set('error')
  }

  private fail(
    message: string,
    target: 'field' | 'button',
    variant: 'error' | 'info' = 'error',
  ): void {
    this.errorVariant.set(variant)
    this.error.set(message)
    this.focus(target)
  }

  private messageFor(err: unknown, generic: string, wrongCode?: string): string {
    const text = this.text()
    switch (classifyMfaFailure(err)) {
      case 'rate-limited':
        return text.tooManyAttempts
      case 'expired':
        this.expired.emit()
        return text.loginExpired
      case 'already-set-up':
        this.expired.emit()
        return text.alreadySetUp
      case 'wrong-code':
        return wrongCode ?? generic
      default:
        return generic
    }
  }

  private focus(target: 'heading' | 'field' | 'button' | 'begin'): void {
    focusAfterRender(this.host, this.injector, () => {
      const field = this.step() === 'passkey' ? `#${this.id}-passkey-name` : `#${this.id}-code`
      return {
        heading: 'h2',
        field,
        button: '.gbt-mfa-enrollment__primary button',
        begin: '.gbt-mfa-enrollment__begin button',
      }[target]
    })
  }
}
