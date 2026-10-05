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
import { type ActivateLabels, DEFAULT_ACTIVATE_LABELS, authLabels } from '@masmarino/gabarit/auth'
import { AuthFooter, AuthFooterLink } from '@masmarino/gabarit/auth'
import { AuthPanel } from '@masmarino/gabarit/auth'
import { AUTH_PORT } from '@masmarino/gabarit/auth'
import { classifyActivateFailure } from '@masmarino/gabarit/auth'
import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  passwordProblem,
  usernameProblem,
} from '@masmarino/gabarit/auth'
import { focusAfterRender, focusNow } from '@masmarino/gabarit/auth'

type View = 'form' | 'success' | 'invalid'

let nextId = 0

@Component({
  selector: 'gbt-auth-activate',
  standalone: true,
  imports: [FormsModule, Button, GbtInput, Alert, AuthFooter, AuthPanel, EmptyState],
  templateUrl: './activate.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthActivate {
  private readonly auth = inject(AUTH_PORT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  token = input<string | null>(null)
  labels = input<Partial<ActivateLabels>>({})
  minPasswordLength = input(MIN_PASSWORD_LENGTH)
  /** The invitee chooses their username along with the password, for servers that let them. */
  chooseUsername = input(false)
  usernamePattern = input<RegExp>(USERNAME_PATTERN)
  activated = output<void>()
  signIn = output<void>()

  protected readonly text = authLabels('activate', DEFAULT_ACTIVATE_LABELS, this.labels)
  protected readonly id = `gbt-activate-${nextId++}`
  protected readonly signInLink = contentChild(AuthFooterLink)
  protected readonly passwordHint = computed(() =>
    this.text().passwordHint(this.minPasswordLength()),
  )

  private readonly spent = linkedSignal({ source: this.token, computation: () => false })
  view = linkedSignal<View>(() => (this.token() ? 'form' : 'invalid'))
  protected username = signal('')
  protected password = signal('')
  protected confirmation = signal('')
  error = signal('')
  submitting = signal(false)
  private attempted = signal(false)

  protected intro = computed(() =>
    this.chooseUsername() ? this.text().introWithUsername : this.text().intro,
  )
  protected usernameFieldError = computed(() => {
    if (!this.chooseUsername() || !this.attempted()) {
      return null
    }
    const problem = usernameProblem(this.username(), this.usernamePattern())
    return problem === 'empty'
      ? this.text().usernameEmpty
      : problem === 'invalid'
        ? this.text().usernameInvalid
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
  protected confirmationFieldError = computed(() =>
    this.attempted() ? this.confirmationProblem() : null,
  )

  constructor() {
    focusAfterRender(this.host, this.injector, () =>
      this.view() === 'form' ? `#${this.id}-${this.firstField()}` : 'h1',
    )
  }

  submit(): void {
    const token = this.spent() ? null : this.token()
    if (this.submitting() || this.view() !== 'form' || !token) {
      return
    }
    this.error.set('')
    this.attempted.set(true)
    const chooseUsername = this.chooseUsername()
    if (chooseUsername && usernameProblem(this.username(), this.usernamePattern())) {
      focusNow(this.host, `#${this.id}-username`)
      return
    }
    if (passwordProblem(this.password(), this.minPasswordLength())) {
      focusNow(this.host, `#${this.id}-password`)
      return
    }
    if (this.confirmationProblem()) {
      focusNow(this.host, `#${this.id}-confirmation`)
      return
    }
    this.submitting.set(true)
    const activation = chooseUsername
      ? this.auth.activate(token, this.password(), this.username().trim())
      : this.auth.activate(token, this.password())
    activation.subscribe({
      next: () => {
        this.submitting.set(false)
        this.spent.set(true)
        this.clearPasswords()
        this.show('success')
        this.activated.emit()
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
        if (chooseUsername && failure.startsWith('username-')) {
          this.fail(
            failure === 'username-reserved'
              ? text.usernameReserved
              : failure === 'username-taken'
                ? text.usernameTaken
                : text.usernameInvalid,
          )
          return
        }
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

  private firstField(): 'username' | 'password' {
    return this.chooseUsername() ? 'username' : 'password'
  }

  private fail(message: string): void {
    this.error.set(message)
    focusAfterRender(this.host, this.injector, `#${this.id}-${this.firstField()}`)
  }
}
