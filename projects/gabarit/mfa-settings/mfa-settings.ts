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
import { Badge } from '@masmarino/gabarit/badge'
import { Button } from '@masmarino/gabarit/button'
import { Icon } from '@masmarino/gabarit/icon'
import { GbtInput } from '@masmarino/gabarit/input'
import { Skeleton } from '@masmarino/gabarit/skeleton'
import { Alert } from '@masmarino/gabarit/alert'
import { Card } from '@masmarino/gabarit/card'
import { ConfirmDangerModal } from '@masmarino/gabarit/confirm-danger-modal'
import {
  DEFAULT_MFA_SETTINGS_LABELS,
  type MfaSettingsLabels,
  authLabels,
} from '@masmarino/gabarit/auth'
import { BackupCodes } from '@masmarino/gabarit/mfa-enrollment'
import { MFA_PORT, type MfaStatus } from '@masmarino/gabarit/auth'
import { focusAfterRender } from '@masmarino/gabarit/auth'
import { classifyMfaFailure, classifyPasswordFailure } from '@masmarino/gabarit/auth'
import { MfaSettingsState } from '@masmarino/gabarit/auth'
import { TotpQr } from '@masmarino/gabarit/mfa-enrollment'

type View = 'loading' | 'failed' | 'ready' | 'enrolling' | 'codes' | 'revoked'
type Prompt = 'enroll' | 'regenerate' | 'disable'
type CodesOrigin = 'enrolled' | 'regenerated'

let nextId = 0

interface PromptCopy {
  lead: string
  submit: string
  busy: string
  variant: 'primary' | 'secondary'
  failed: string
}

interface RemovalCopy {
  title: string
  help: string
  action: string
  dialogHeading: string
  dialogMessage: string
  promptLead: string
  busy: string
}

@Component({
  selector: 'gbt-mfa-settings',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    Badge,
    Button,
    GbtInput,
    Icon,
    Skeleton,
    Alert,
    BackupCodes,
    TotpQr,
    ConfirmDangerModal,
    Card,
  ],
  templateUrl: './mfa-settings.html',
  styleUrl: './mfa-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaSettings {
  private readonly mfa = inject(MFA_PORT)
  private readonly state = inject(MfaSettingsState)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly injector = inject(Injector)

  labels = input<Partial<MfaSettingsLabels>>({})
  lowCodesThreshold = input(3)
  sessionRevoked = output<void>()

  protected readonly text = authLabels('mfaSettings', DEFAULT_MFA_SETTINGS_LABELS, this.labels)
  protected readonly id = `gbt-mfa-settings-${nextId++}`
  protected view = signal<View>('loading')
  protected status = signal<MfaStatus>({
    totpEnabled: false,
    backupCodesRemaining: 0,
    passkeys: [],
  })
  protected prompt = signal<Prompt | null>(null)
  protected password = signal('')
  protected passwordError = signal<string | null>(null)
  protected notice = signal('')
  protected secret = signal('')
  protected otpauthUrl = signal('')
  protected code = signal('')
  protected codeError = signal<string | null>(null)
  protected backupCodes = signal<string[]>([])
  protected codesOrigin = signal<CodesOrigin>('enrolled')
  protected acknowledged = signal(false)
  protected busy = signal(false)
  protected confirmingDisable = signal(false)

  protected hasPasskey = computed(
    () => (this.state.passkeyCount() ?? this.status().passkeys.length) > 0,
  )
  protected hasFactor = computed(() => this.status().totpEnabled || this.hasPasskey())
  protected removal = computed<RemovalCopy>(() => {
    const text = this.text()
    return this.hasPasskey()
      ? {
          title: text.removeTitle,
          help: text.removeHelp,
          action: text.removeAction,
          dialogHeading: text.removeDialogHeading,
          dialogMessage: text.removeDialogMessage,
          promptLead: text.removePromptLead,
          busy: text.removeBusy,
        }
      : {
          title: text.resetTitle,
          help: text.resetHelp,
          action: text.resetAction,
          dialogHeading: text.resetDialogHeading,
          dialogMessage: text.resetDialogMessage,
          promptLead: text.resetPromptLead,
          busy: text.resetBusy,
        }
  })
  protected lowCodes = computed(
    () => this.status().backupCodesRemaining <= this.lowCodesThreshold(),
  )
  protected codesLeft = computed(() => this.text().codesLeft(this.status().backupCodesRemaining))
  protected promptCopy = computed<PromptCopy>(() => this.copyOf(this.prompt() ?? 'enroll'))
  protected heading = computed(() => {
    switch (this.view()) {
      case 'enrolling':
        return this.text().enrollingHeading
      case 'codes':
        return this.text().codesHeading
      default:
        return this.text().heading
    }
  })
  protected help = computed(() =>
    this.view() === 'codes' ? this.text().codesHelp : this.text().help,
  )

  constructor() {
    this.load()
    effect(() => {
      if (this.state.formOwner() === 'passkeys') {
        untracked(() => {
          if (this.prompt() !== null) {
            this.resetPrompt()
            this.prompt.set(null)
            this.confirmingDisable.set(false)
          }
        })
      }
    })
    effect(() =>
      this.state.setAppFlowActive(this.view() === 'enrolling' || this.view() === 'codes'),
    )
    effect((onCleanup) => {
      if (this.view() === 'codes' && !this.acknowledged()) {
        const view = this.host.nativeElement.ownerDocument.defaultView
        const warn = (event: BeforeUnloadEvent) => {
          event.preventDefault()
          event.returnValue = ''
        }
        view?.addEventListener('beforeunload', warn)
        onCleanup(() => view?.removeEventListener('beforeunload', warn))
      }
    })
    inject(DestroyRef).onDestroy(() => {
      this.state.setAppFlowActive(false)
      this.password.set('')
      this.code.set('')
      this.secret.set('')
      this.otpauthUrl.set('')
      this.backupCodes.set([])
    })
  }

  protected load(): void {
    this.view.set('loading')
    this.mfa.status().subscribe({
      next: (status) => {
        this.state.statusLoaded(status)
        this.status.set(status)
        this.view.set('ready')
      },
      error: () => this.view.set('failed'),
    })
  }

  private copyOf(prompt: Prompt): PromptCopy {
    const text = this.text()
    switch (prompt) {
      case 'enroll':
        return {
          lead: text.enrollLead,
          submit: text.enrollSubmit,
          busy: text.enrollBusy,
          variant: 'primary',
          failed: text.enrollFailed,
        }
      case 'regenerate':
        return {
          lead: text.regenerateLead,
          submit: text.regenerateSubmit,
          busy: text.regenerateBusy,
          variant: 'primary',
          failed: text.regenerateFailed,
        }
      case 'disable':
        return {
          lead: this.removal().promptLead,
          submit: text.disableSubmit,
          busy: text.disableCheckBusy,
          variant: 'secondary',
          failed: text.disableFailed,
        }
    }
  }

  protected openPrompt(prompt: Prompt): void {
    this.state.claimForm('app')
    this.resetPrompt()
    this.prompt.set(prompt)
    this.focus(`#${this.id}-password`)
  }

  protected cancelPrompt(): void {
    const prompt = this.prompt()
    this.resetPrompt()
    this.prompt.set(null)
    if (prompt) {
      this.focus(`[data-opener="${prompt}"] button`)
    }
  }

  protected setPassword(value: string): void {
    this.password.set(value)
    this.passwordError.set(null)
    this.notice.set('')
  }

  protected submitPrompt(): void {
    const prompt = this.prompt()
    if (this.busy() || !prompt) {
      return
    }
    if (this.password() === '') {
      this.passwordError.set(this.text().enterPassword)
      this.focus(`#${this.id}-password`)
      return
    }
    this.passwordError.set(null)
    this.notice.set('')
    switch (prompt) {
      case 'enroll':
        return this.enroll()
      case 'regenerate':
        return this.regenerate()
      case 'disable':
        this.confirmingDisable.set(true)
        return
    }
  }

  private enroll(): void {
    this.busy.set(true)
    this.mfa.enroll(this.password()).subscribe({
      next: ({ secret, otpauthUrl }) => {
        this.busy.set(false)
        this.resetPrompt()
        this.prompt.set(null)
        this.secret.set(secret)
        this.otpauthUrl.set(otpauthUrl)
        this.view.set('enrolling')
        this.focus('[data-mfa-anchor]')
      },
      error: (err: unknown) => this.promptFailed(err),
    })
  }

  private regenerate(): void {
    this.busy.set(true)
    this.mfa.regenerate(this.password()).subscribe({
      next: ({ backupCodes }) => {
        this.busy.set(false)
        this.resetPrompt()
        this.prompt.set(null)
        this.showCodes(backupCodes, 'regenerated')
      },
      error: (err: unknown) => this.promptFailed(err),
    })
  }

  protected disable(): void {
    if (this.busy()) {
      return
    }
    this.busy.set(true)
    this.mfa.disable(this.password()).subscribe({
      next: () => {
        this.busy.set(false)
        this.confirmingDisable.set(false)
        this.resetPrompt()
        this.prompt.set(null)
        this.status.update((status) => ({ ...status, totpEnabled: false }))
        this.view.set('revoked')
        this.focus('[data-mfa-anchor]')
        this.sessionRevoked.emit()
      },
      error: (err: unknown) => {
        this.confirmingDisable.set(false)
        this.promptFailed(err)
      },
    })
  }

  protected closeDisableDialog(): void {
    if (!this.busy()) {
      this.confirmingDisable.set(false)
      this.focus(`#${this.id}-password`)
    }
  }

  private promptFailed(err: unknown): void {
    this.busy.set(false)
    switch (classifyPasswordFailure(err)) {
      case 'wrong-password':
        this.passwordError.set(this.text().wrongPassword)
        break
      case 'rate-limited':
        this.notice.set(this.text().tooManyAttempts)
        break
      default:
        this.notice.set(this.copyOf(this.prompt() ?? 'enroll').failed)
    }
    this.focus(`#${this.id}-password`)
  }

  private resetPrompt(): void {
    this.password.set('')
    this.passwordError.set(null)
    this.notice.set('')
  }

  protected activate(): void {
    if (this.busy()) {
      return
    }
    const code = this.code().replace(/\s+/g, '')
    if (code === '') {
      this.codeError.set(this.text().enterCode)
      this.focus(`#${this.id}-code`)
      return
    }
    this.codeError.set(null)
    this.notice.set('')
    this.busy.set(true)
    this.mfa.confirm(code).subscribe({
      next: ({ backupCodes }) => {
        this.busy.set(false)
        this.state.totpConfirmed()
        this.secret.set('')
        this.otpauthUrl.set('')
        this.code.set('')
        this.showCodes(backupCodes, 'enrolled')
      },
      error: (err: unknown) => {
        this.busy.set(false)
        switch (classifyMfaFailure(err)) {
          case 'wrong-code':
            this.codeError.set(this.text().wrongCode)
            this.code.set('')
            break
          case 'rate-limited':
            this.notice.set(this.text().tooManyAttempts)
            break
          default:
            this.notice.set(this.text().activationFailed)
        }
        this.focus(`#${this.id}-code`)
      },
    })
  }

  protected setCode(value: string): void {
    this.code.set(value)
    this.codeError.set(null)
    this.notice.set('')
  }

  protected cancelEnrollment(): void {
    this.secret.set('')
    this.otpauthUrl.set('')
    this.code.set('')
    this.codeError.set(null)
    this.notice.set('')
    this.view.set('ready')
    this.focus('[data-opener="enroll"] button')
  }

  private showCodes(codes: string[], origin: CodesOrigin): void {
    this.backupCodes.set(codes)
    this.codesOrigin.set(origin)
    this.acknowledged.set(false)
    this.view.set('codes')
    this.focus('[data-mfa-anchor]')
  }

  protected finishCodes(): void {
    if (!this.acknowledged()) {
      return
    }
    this.status.update((status) => ({
      ...status,
      totpEnabled: status.totpEnabled || this.codesOrigin() === 'enrolled',
      backupCodesRemaining: this.backupCodes().length,
    }))
    this.backupCodes.set([])
    this.acknowledged.set(false)
    this.view.set('ready')
    this.focus('[data-mfa-anchor]')
  }

  private focus(selector: string): void {
    focusAfterRender(this.host, this.injector, selector)
  }
}
