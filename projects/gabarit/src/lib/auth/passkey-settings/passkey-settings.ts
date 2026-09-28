import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EMPTY, catchError, forkJoin, from, of, switchMap } from 'rxjs'
import { Button } from '../../components/atoms/button/button'
import { IconMarker } from '../../components/atoms/icon-marker/icon-marker'
import { GbtInput } from '../../components/atoms/input/input'
import { SaveStatus } from '../../components/atoms/save-status/save-status'
import { Alert } from '../../components/molecules/alert/alert'
import { Card } from '../../components/molecules/card/card'
import { EmptyState } from '../../components/molecules/empty-state/empty-state'
import { SkeletonList } from '../../components/molecules/skeleton-list/skeleton-list'
import { ConfirmDangerModal } from '../../components/organisms/confirm-danger-modal/confirm-danger-modal'
import { GbtDateTimePipe, GbtRelativeTimePipe } from '../../pipes/format.pipes'
import {
  DEFAULT_PASSKEY_SETTINGS_LABELS,
  type PasskeySettingsLabels,
  authLabels,
} from '../auth-labels'
import { AUTH_PORT } from '../ports/auth.port'
import { MFA_PORT, type Passkey } from '../ports/mfa.port'
import { focusAfterRender } from '../shared/focus-after-render'
import {
  classifyMfaFailure,
  classifyPasswordFailure,
  isTooManyPasskeys,
} from '../shared/mfa-errors'
import { MfaSettingsState } from '../shared/mfa-settings-state'
import { PASSKEY_NAME_MAX, passkeyNameProblem } from '../shared/passkey-name'
import { isAuthPortError } from '../shared/port-error'
import { classifyPasskeyError, createPasskeyCredential, passkeysSupported } from '../webauthn'

type View = 'loading' | 'failed' | 'ready' | 'revoked'

let nextId = 0

const ABSOLUTE_AFTER_DAYS = 30
const DAY = 86_400_000

@Component({
  selector: 'gbt-passkey-settings',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    Alert,
    EmptyState,
    Button,
    GbtInput,
    IconMarker,
    SaveStatus,
    SkeletonList,
    ConfirmDangerModal,
    Card,
    GbtRelativeTimePipe,
    GbtDateTimePipe,
  ],
  templateUrl: './passkey-settings.html',
  styleUrl: './passkey-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasskeySettings {
  private readonly mfa = inject(MFA_PORT)
  private readonly auth = inject(AUTH_PORT, { optional: true })
  private readonly state = inject(MfaSettingsState)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  labels = input<Partial<PasskeySettingsLabels>>({})
  locale = input<string | null>(null)
  sessionRevoked = output<void>()

  protected readonly text = authLabels(
    'passkeySettings',
    DEFAULT_PASSKEY_SETTINGS_LABELS,
    this.labels,
  )
  protected readonly id = `gbt-passkey-settings-${nextId++}`
  protected readonly relativeOptions = computed(() => ({
    style: 'short' as const,
    maxUnit: 'day' as const,
    absoluteAfterDays: ABSOLUTE_AFTER_DAYS,
    locale: this.locale() ?? undefined,
  }))
  protected readonly dateOptions = computed(() => ({
    day: '2-digit' as const,
    month: '2-digit' as const,
    year: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    locale: this.locale() ?? undefined,
  }))
  protected readonly absolute = (iso: string): boolean =>
    Math.abs(Date.now() - Date.parse(iso)) >= ABSOLUTE_AFTER_DAYS * DAY

  protected view = signal<View>('loading')
  protected passkeys = signal<Passkey[]>([])
  protected totpEnabled = signal(false)
  private serverAvailable = signal<boolean | null>(null)
  private readonly browserSupported = passkeysSupported()

  protected blockedReason = computed(() => {
    if (!this.browserSupported) {
      return this.text().browserBlocked
    }
    return this.serverAvailable() === false ? this.text().serverBlocked : null
  })

  protected result = signal<string | null>(null)

  protected adding = signal(false)
  protected name = signal('')
  protected nameError = signal<string | null>(null)
  protected password = signal('')
  protected passwordError = signal<string | null>(null)
  protected notice = signal('')
  protected noticeVariant = signal<'error' | 'info'>('error')
  protected busy = signal(false)
  protected promptOpen = signal(false)
  private ceremony = 0

  protected deleting = signal<Passkey | null>(null)
  protected deletePassword = signal('')
  protected deletePasswordError = signal<string | null>(null)
  protected deleteNotice = signal('')
  protected confirmingDelete = signal(false)
  protected deleteBusy = signal(false)

  protected count = computed(() =>
    this.view() === 'ready' && this.passkeys().length > 0 ? this.passkeys().length : null,
  )
  protected appBusy = this.state.appFlowActive
  protected lastFactor = computed(
    () => this.passkeys().length === 1 && !(this.state.totpEnabled() ?? this.totpEnabled()),
  )
  protected deleteMessage = computed(() =>
    this.text().deleteDialogMessage(this.deleting()?.name ?? '', this.lastFactor()),
  )

  constructor() {
    this.load()
    effect(() => {
      if (this.state.formOwner() === 'app') {
        untracked(() => {
          this.cancelAddQuietly()
          this.closeDelete()
        })
      }
    })
    inject(DestroyRef).onDestroy(() => {
      this.ceremony++
      this.password.set('')
      this.deletePassword.set('')
    })
  }

  protected load(): void {
    this.view.set('loading')
    const config = this.auth ? this.auth.authConfig().pipe(catchError(() => of(null))) : of(null)
    forkJoin([this.mfa.status(), config]).subscribe({
      next: ([status, config]) => {
        this.state.statusLoaded(status)
        this.passkeys.set(status.passkeys)
        this.totpEnabled.set(status.totpEnabled)
        this.serverAvailable.set(config ? config.passkeysAvailable === true : null)
        this.view.set('ready')
      },
      error: () => this.view.set('failed'),
    })
  }

  protected openAdd(): void {
    if (this.blockedReason() || this.appBusy()) {
      return
    }
    this.state.claimForm('passkeys')
    this.closeDelete()
    this.resetAdd()
    this.result.set(null)
    this.adding.set(true)
    this.focus(`#${this.id}-name`)
  }

  protected cancelAdd(): void {
    this.resetAdd()
    this.adding.set(false)
    this.focus('[data-opener="add"] button')
  }

  protected setName(value: string): void {
    this.name.set(value)
    this.nameError.set(null)
    this.clearNotice()
  }

  protected setPassword(value: string): void {
    this.password.set(value)
    this.passwordError.set(null)
    this.clearNotice()
  }

  protected submitAdd(): void {
    if (this.busy()) {
      return
    }
    const text = this.text()
    const name = this.name().trim() || text.defaultPasskeyName
    const nameProblem = passkeyNameProblem(name)
    if (nameProblem) {
      this.nameError.set(
        nameProblem === 'too-long'
          ? text.nameTooLong(PASSKEY_NAME_MAX)
          : text.nameControlCharacters,
      )
      this.focus(`#${this.id}-name`)
      return
    }
    if (this.password() === '') {
      this.passwordError.set(text.enterPassword)
      this.focus(`#${this.id}-password`)
      return
    }
    this.clearNotice()
    this.busy.set(true)
    const attempt = ++this.ceremony
    this.mfa
      .startPasskeyRegistration(this.password())
      .pipe(
        switchMap((challenge) => {
          if (attempt !== this.ceremony) {
            return EMPTY
          }
          this.promptOpen.set(true)
          return from(createPasskeyCredential(challenge.publicKey)).pipe(
            switchMap((credential) =>
              attempt === this.ceremony
                ? this.mfa.finishPasskeyRegistration(challenge.challengeId, credential, name)
                : EMPTY,
            ),
          )
        }),
      )
      .subscribe({
        next: (passkey) => {
          this.state.passkeyAdded()
          if (attempt !== this.ceremony) {
            return
          }
          this.busy.set(false)
          this.promptOpen.set(false)
          this.resetAdd()
          this.adding.set(false)
          this.passkeys.update((list) => [...list, passkey])
          this.result.set(this.text().passkeyAdded(passkey.name))
          this.focus(`[data-passkey-id="${CSS.escape(passkey.id)}"]`)
        },
        error: (err: unknown) => {
          if (attempt === this.ceremony) {
            this.addFailed(err)
          }
        },
      })
  }

  private addFailed(err: unknown): void {
    const text = this.text()
    this.busy.set(false)
    this.promptOpen.set(false)
    if (isAuthPortError(err)) {
      if (isTooManyPasskeys(err)) {
        return this.fail(text.tooManyPasskeys)
      }
      if (err.status === 409) {
        return this.fail(text.alreadyRegistered)
      }
      if (classifyMfaFailure(err) === 'unavailable') {
        return this.fail(text.passkeysUnavailable)
      }
      switch (classifyPasswordFailure(err)) {
        case 'wrong-password':
          this.passwordError.set(text.wrongPassword)
          this.focus(`#${this.id}-password`)
          return
        case 'rate-limited':
          return this.fail(text.tooManyAttempts)
        default:
          return this.fail(text.addFailed)
      }
    }
    switch (classifyPasskeyError(err)) {
      case 'cancelled':
        return this.fail(text.cancelled, 'info')
      case 'already-registered':
        return this.fail(text.alreadyRegistered)
      case 'unsupported':
        return this.fail(text.browserUnsupported)
      default:
        return this.fail(text.addFailed)
    }
  }

  private fail(message: string, variant: 'error' | 'info' = 'error'): void {
    this.noticeVariant.set(variant)
    this.notice.set(message)
    this.focus('.gbt-passkey-settings__submit button')
  }

  private clearNotice(): void {
    this.notice.set('')
    this.noticeVariant.set('error')
  }

  private resetAdd(): void {
    this.ceremony++
    this.name.set('')
    this.nameError.set(null)
    this.password.set('')
    this.passwordError.set(null)
    this.clearNotice()
    this.busy.set(false)
    this.promptOpen.set(false)
  }

  protected openDelete(passkey: Passkey): void {
    this.state.claimForm('passkeys')
    if (this.adding()) {
      this.cancelAddQuietly()
    }
    this.resetDelete()
    this.result.set(null)
    this.deleting.set(passkey)
    this.focus(`#${this.id}-delete-password`)
  }

  protected cancelDelete(): void {
    const target = this.deleting()
    this.closeDelete()
    if (target) {
      this.focus(`[data-passkey-id="${CSS.escape(target.id)}"] [data-opener="delete"] button`)
    }
  }

  protected setDeletePassword(value: string): void {
    this.deletePassword.set(value)
    this.deletePasswordError.set(null)
    this.deleteNotice.set('')
  }

  protected submitDelete(): void {
    if (this.deleteBusy() || !this.deleting()) {
      return
    }
    if (this.deletePassword() === '') {
      this.deletePasswordError.set(this.text().enterPassword)
      this.focus(`#${this.id}-delete-password`)
      return
    }
    this.deletePasswordError.set(null)
    this.deleteNotice.set('')
    this.confirmingDelete.set(true)
  }

  protected closeDeleteDialog(): void {
    if (!this.deleteBusy()) {
      this.confirmingDelete.set(false)
      this.focus(`#${this.id}-delete-password`)
    }
  }

  protected delete(): void {
    const target = this.deleting()
    if (this.deleteBusy() || !target) {
      return
    }
    this.deleteBusy.set(true)
    this.mfa.deletePasskey(target.id, this.deletePassword()).subscribe({
      next: () => {
        this.state.passkeyGone()
        this.deleteBusy.set(false)
        this.confirmingDelete.set(false)
        this.closeDelete()
        this.passkeys.update((list) => list.filter((passkey) => passkey.id !== target.id))
        this.result.set(null)
        this.view.set('revoked')
        this.focus('[data-passkeys-anchor]')
        this.sessionRevoked.emit()
      },
      error: (err: unknown) => this.deleteFailed(err, target),
    })
  }

  private deleteFailed(err: unknown, target: Passkey): void {
    this.deleteBusy.set(false)
    this.confirmingDelete.set(false)
    if (isAuthPortError(err) && err.status === 404) {
      this.closeDelete()
      this.passkeys.update((list) => list.filter((passkey) => passkey.id !== target.id))
      this.state.passkeyGone()
      this.result.set(this.text().passkeyGone(target.name))
      this.focus('[data-passkeys-anchor]')
      return
    }
    switch (classifyPasswordFailure(err)) {
      case 'wrong-password':
        this.deletePasswordError.set(this.text().wrongPassword)
        break
      case 'rate-limited':
        this.deleteNotice.set(this.text().tooManyAttempts)
        break
      default:
        this.deleteNotice.set(this.text().deleteFailed)
    }
    this.focus(`#${this.id}-delete-password`)
  }

  private closeDelete(): void {
    this.resetDelete()
    this.deleting.set(null)
  }

  private resetDelete(): void {
    this.deletePassword.set('')
    this.deletePasswordError.set(null)
    this.deleteNotice.set('')
    this.confirmingDelete.set(false)
  }

  private cancelAddQuietly(): void {
    this.resetAdd()
    this.adding.set(false)
  }

  private focus(selector: string): void {
    focusAfterRender(this.host, this.injector, selector)
  }
}
