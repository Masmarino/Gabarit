import { InjectionToken } from '@angular/core'
import type { Observable } from 'rxjs'
import type { PasskeyChallenge, TotpEnrollment } from './auth.port'

export interface Passkey {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}

export interface MfaStatus {
  totpEnabled: boolean
  backupCodesRemaining: number
  passkeys: Passkey[]
}

export interface BackupCodesResult {
  backupCodes: string[]
}

export interface MfaPort {
  status(): Observable<MfaStatus>

  enroll(currentPassword: string): Observable<TotpEnrollment>

  confirm(code: string): Observable<BackupCodesResult>

  regenerate(currentPassword: string): Observable<BackupCodesResult>

  disable(currentPassword: string): Observable<void>

  startPasskeyRegistration(currentPassword: string): Observable<PasskeyChallenge>

  finishPasskeyRegistration(
    challengeId: string,
    credential: unknown,
    name: string,
  ): Observable<Passkey>

  deletePasskey(id: string, currentPassword: string): Observable<void>
}

export const MFA_PORT = new InjectionToken<MfaPort>('MFA_PORT')
