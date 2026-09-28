import { Injectable, signal } from '@angular/core'
import type { MfaStatus } from '../ports/mfa.port'

export type MfaFormOwner = 'passkeys' | 'app'

@Injectable({ providedIn: 'root' })
export class MfaSettingsState {
  private readonly passkeys = signal<number | null>(null)
  private readonly totp = signal<boolean | null>(null)
  private readonly owner = signal<MfaFormOwner | null>(null)
  private readonly appFlow = signal(false)

  readonly passkeyCount = this.passkeys.asReadonly()

  readonly totpEnabled = this.totp.asReadonly()

  readonly formOwner = this.owner.asReadonly()

  readonly appFlowActive = this.appFlow.asReadonly()

  claimForm(owner: MfaFormOwner): void {
    this.owner.set(owner)
  }

  setAppFlowActive(active: boolean): void {
    this.appFlow.set(active)
  }

  statusLoaded(status: MfaStatus): void {
    this.passkeys.set(status.passkeys.length)
    this.totp.set(status.totpEnabled)
  }

  totpConfirmed(): void {
    this.totp.set(true)
  }

  passkeyAdded(): void {
    this.passkeys.update((count) => (count === null ? count : count + 1))
  }

  passkeyGone(): void {
    this.passkeys.update((count) => (count === null ? count : Math.max(0, count - 1)))
  }
}
