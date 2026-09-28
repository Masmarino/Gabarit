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
import { Button } from '../../components/atoms/button/button'
import { GbtInput } from '../../components/atoms/input/input'
import { Alert } from '../../components/molecules/alert/alert'
import { EmptyState } from '../../components/molecules/empty-state/empty-state'
import { type ActivateLabels, DEFAULT_ACTIVATE_LABELS, authLabels } from '../auth-labels'
import { AuthFooter, AuthFooterLink } from '../auth-footer/auth-footer'
import { AuthPanel } from '../auth-panel/auth-panel'
import { AUTH_PORT } from '../ports/auth.port'
import { classifyActivateFailure } from '../shared/account-errors'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '../shared/account-rules'
import { focusAfterRender, focusNow } from '../shared/focus-after-render'

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
    this.auth.activate(token, this.password()).subscribe({
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
