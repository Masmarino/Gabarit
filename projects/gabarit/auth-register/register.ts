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
import { Button } from '@masmarino/gabarit/button'
import { GbtInput } from '@masmarino/gabarit/input'
import { Skeleton } from '@masmarino/gabarit/skeleton'
import { Alert } from '@masmarino/gabarit/alert'
import { EmptyState } from '@masmarino/gabarit/empty-state'
import { DEFAULT_REGISTER_LABELS, type RegisterLabels, authLabels } from '@masmarino/gabarit/auth'
import { AuthFooter, AuthFooterLink } from '@masmarino/gabarit/auth'
import { AuthPanel } from '@masmarino/gabarit/auth'
import { MfaEnrollment } from '@masmarino/gabarit/mfa-enrollment'
import { AUTH_PORT } from '@masmarino/gabarit/auth'
import { type RegisterFailure, classifyRegisterFailure } from '@masmarino/gabarit/auth'
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  accountName,
  emailProblem,
  passwordProblem,
  usernameProblem,
} from '@masmarino/gabarit/auth'
import { focusAfterRender, focusNow } from '@masmarino/gabarit/auth'

type Registration = 'loading' | 'open' | 'closed' | 'created'

let nextId = 0

@Component({
  selector: 'gbt-auth-register',
  standalone: true,
  imports: [
    FormsModule,
    Button,
    GbtInput,
    Skeleton,
    Alert,
    AuthFooter,
    AuthPanel,
    EmptyState,
    MfaEnrollment,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRegister {
  private readonly auth = inject(AUTH_PORT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  labels = input<Partial<RegisterLabels>>({})
  minPasswordLength = input(MIN_PASSWORD_LENGTH)
  usernamePattern = input<RegExp>(USERNAME_PATTERN)
  registered = output<void>()
  signIn = output<void>()

  protected readonly text = authLabels('register', DEFAULT_REGISTER_LABELS, this.labels)
  protected readonly signInLink = contentChild(AuthFooterLink)
  protected readonly id = `gbt-register-${nextId++}`
  protected readonly passwordHint = computed(() =>
    this.text().passwordHint(this.minPasswordLength()),
  )
  protected readonly skeletonFields = [
    { name: 'username', hint: true },
    { name: 'email', hint: false },
    { name: 'password', hint: true },
  ]

  registration = signal<Registration>('loading')
  username = signal('')
  email = signal('')
  protected password = signal('')
  error = signal('')
  submitting = signal(false)
  private attempted = signal(false)

  protected mfaToken = signal<string | null>(null)
  protected passkeysAvailable = signal(false)

  protected heading = computed(() => {
    if (this.mfaToken() !== null) {
      return this.text().enrollmentHeading
    }
    return this.registration() === 'open' ? this.text().heading : ''
  })
  protected intro = computed(() =>
    this.mfaToken() === null && this.registration() === 'open' ? this.text().intro : '',
  )
  protected createdName = computed(() => accountName(this.username()))
  private enrollmentExpired = signal(false)
  protected createdMessage = computed(
    () =>
      (this.enrollmentExpired() ? this.text().enrollmentExpired : '') + this.text().createdMessage,
  )

  protected usernameFieldError = computed(() => {
    if (!this.attempted()) {
      return null
    }
    const problem = usernameProblem(this.username(), this.usernamePattern())
    return problem === 'empty'
      ? this.text().usernameEmpty
      : problem === 'invalid'
        ? this.text().usernameInvalid
        : null
  })
  protected emailFieldError = computed(() => {
    if (!this.attempted()) {
      return null
    }
    const problem = emailProblem(this.email())
    return problem === 'empty'
      ? this.text().emailEmpty
      : problem === 'invalid'
        ? this.text().emailInvalid
        : null
  })
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

  constructor() {
    this.auth
      .authConfig()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (config) => {
          this.passkeysAvailable.set(config.passkeysAvailable === true)
          this.opened(config.registrationEnabled === true)
        },
        error: () => this.opened(true),
      })
  }

  submit(): void {
    if (this.submitting()) {
      return
    }
    this.error.set('')
    this.attempted.set(true)
    const username = this.username().trim()
    const email = this.email().trim()
    const firstWrong = usernameProblem(username, this.usernamePattern())
      ? 'username'
      : emailProblem(email)
        ? 'email'
        : passwordProblem(this.password(), this.minPasswordLength())
          ? 'password'
          : null
    if (firstWrong) {
      focusNow(this.host, `#${this.id}-${firstWrong}`)
      return
    }
    this.submitting.set(true)
    this.auth.register(username, email, this.password()).subscribe({
      next: (res) => {
        this.password.set('')
        this.submitting.set(false)
        if (res.token) {
          this.registered.emit()
        } else if (res.mfaToken) {
          this.mfaToken.set(res.mfaToken)
        } else {
          this.fail(this.text().failed, 'password')
        }
      },
      error: (err: unknown) => {
        this.submitting.set(false)
        this.failed(classifyRegisterFailure(err))
      },
    })
  }

  enrolled(token: string): void {
    this.auth.setToken(token)
    this.mfaToken.set(null)
    this.registered.emit()
  }

  enrollmentInterrupted(expired: boolean): void {
    this.mfaToken.set(null)
    this.enrollmentExpired.set(expired)
    this.registration.set('created')
    focusAfterRender(this.host, this.injector, 'h1')
  }

  private opened(open: boolean): void {
    this.registration.set(open ? 'open' : 'closed')
    focusAfterRender(this.host, this.injector, open ? `#${this.id}-username` : 'h1')
  }

  private failed(failure: RegisterFailure): void {
    const text = this.text()
    switch (failure) {
      case 'disabled':
        this.password.set('')
        this.opened(false)
        return
      case 'username-invalid':
        this.fail(text.invalid, 'username')
        return
      case 'email-invalid':
        this.fail(text.invalid, 'email')
        return
      case 'password-weak':
        this.fail(text.invalid, 'password')
        return
      case 'invalid':
        this.fail(text.invalid, 'alert')
        return
      case 'username-reserved':
        this.fail(text.reserved, 'username')
        return
      case 'username-taken':
        this.fail(text.taken, 'username')
        return
      case 'email-taken':
        this.fail(text.taken, 'email')
        return
      case 'rate-limited':
        this.fail(text.tooManyAttempts, 'password')
        return
      default:
        this.fail(text.failed, 'password')
    }
  }

  private fail(message: string, focusSuffix: string): void {
    this.error.set(message)
    focusAfterRender(this.host, this.injector, `#${this.id}-${focusSuffix}`)
  }
}
