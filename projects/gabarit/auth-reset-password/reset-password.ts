import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Button } from '@masmarino/gabarit/button'
import { GbtInput } from '@masmarino/gabarit/input'
import { Alert } from '@masmarino/gabarit/alert'
import { EmptyState } from '@masmarino/gabarit/empty-state'
import {
  DEFAULT_RESET_PASSWORD_LABELS,
  type ResetPasswordLabels,
  authLabels,
} from '@masmarino/gabarit/auth'
import { AuthFooter, AuthFooterLink } from '@masmarino/gabarit/auth'
import { AuthPanel } from '@masmarino/gabarit/auth'
import { AUTH_PORT } from '@masmarino/gabarit/auth'
// Shared with the activation: same failure taxonomy (generic 400 = dead link, weak password, 429).
import { classifyActivateFailure } from '@masmarino/gabarit/auth'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@masmarino/gabarit/auth'
import { focusAfterRender, focusNow } from '@masmarino/gabarit/auth'

type View = 'form' | 'success' | 'invalid'

let nextId = 0

@Component({
  selector: 'gbt-auth-reset-password',
  standalone: true,
  imports: [FormsModule, Button, GbtInput, Alert, AuthFooter, AuthPanel, EmptyState],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthResetPassword {
  private readonly auth = inject(AUTH_PORT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  token = input<string | null>(null)
  labels = input<Partial<ResetPasswordLabels>>({})
  minPasswordLength = input(MIN_PASSWORD_LENGTH)
  passwordReset = output<void>()
  signIn = output<void>()

  protected readonly text = authLabels('resetPassword', DEFAULT_RESET_PASSWORD_LABELS, this.labels)
  protected readonly id = `gbt-reset-password-${nextId++}`
  protected readonly signInLink = contentChild(AuthFooterLink)
  protected readonly passwordHint = computed(() =>
    this.text().passwordHint(this.minPasswordLength()),
  )

  private readonly spent = linkedSignal({ source: this.token, computation: () => false })
  view = linkedSignal<View>(() => (this.token() ? 'form' : 'invalid'))
  protected password = signal('')
  protected confirmation = signal('')
  error = signal('')
  submitting = signal(false)
  private attempted = signal(false)

  protected passwordFieldError = computed(() => {
    if (!this.attempted()) {
      return null
    }
    const min = this.minPasswordLength()
    const problem = passwordProblem(this.password(), min)
    return problem === 'empty'
      ? this.text().passwordEmpty
      : problem === 'too-short'
        ? this.text().passwordTooShort(min)
        : null
  })
  protected confirmationFieldError = computed(() =>
    this.attempted() ? this.confirmationProblem() : null,
  )

  constructor() {
    focusAfterRender(this.host, this.injector, () =>
      this.view() === 'form' ? `#${this.id}-password` : 'h1',
    )
  }

  submit(): void {
    const token = this.spent() ? null : this.token()
    if (this.submitting() || this.view() !== 'form' || !token) {
      return
    }
    this.error.set('')
    this.attempted.set(true)
    if (passwordProblem(this.password(), this.minPasswordLength())) {
      focusNow(this.host, `#${this.id}-password`)
      return
    }
    if (this.confirmationProblem()) {
      focusNow(this.host, `#${this.id}-confirmation`)
      return
    }
    this.submitting.set(true)
    this.auth.resetPassword(token, this.password()).subscribe({
      next: () => {
        this.submitting.set(false)
        this.spent.set(true)
        this.clearPasswords()
        this.show('success')
        this.passwordReset.emit()
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        const failure = classifyActivateFailure(err)
        if (failure === 'invalid-link') {
          this.spent.set(true)
          this.clearPasswords()
          this.show('invalid')
          return
        }
        const text = this.text()
        this.fail(
          failure === 'weak-password'
            ? text.weakPassword(this.minPasswordLength())
            : failure === 'rate-limited'
              ? text.tooManyAttempts
              : text.failed,
        )
      },
    })
  }

  private confirmationProblem(): string | null {
    if (this.confirmation() === '') {
      return this.text().confirmationEmpty
    }
    return this.confirmation() === this.password() ? null : this.text().mismatch
  }

  private clearPasswords(): void {
    this.password.set('')
    this.confirmation.set('')
    this.attempted.set(false)
  }

  private show(view: View): void {
    this.view.set(view)
    focusAfterRender(this.host, this.injector, 'h1')
  }

  private fail(message: string): void {
    this.error.set(message)
    focusAfterRender(this.host, this.injector, `#${this.id}-password`)
  }
}
