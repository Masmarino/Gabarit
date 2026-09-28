import { InjectionToken } from '@angular/core'
import type { Observable } from 'rxjs'

export interface LoginResponse {
  token: string | null
  mfaToken?: string
  mfaSetupRequired?: boolean
  mfaHasTotp?: boolean
  mfaHasPasskey?: boolean
}

export interface AuthConfig {
  registrationEnabled: boolean
  passkeysAvailable: boolean
}

export interface PasskeyChallenge {
  challengeId: string
  publicKey: unknown
}

export type MfaProof = { code: string } | { backupCode: string }

export interface TotpEnrollment {
  secret: string
  otpauthUrl: string
}

export interface MfaSetupResult {
  token: string
  backupCodes: string[]
}

export interface AuthPort {
  authConfig(): Observable<AuthConfig>

  login(username: string, password: string): Observable<LoginResponse>

  register(username: string, email: string, password: string): Observable<LoginResponse>

  activate(token: string, password: string): Observable<void>

  verifyMfa(mfaToken: string, proof: MfaProof): Observable<void>

  startPasskeyChallenge(mfaToken: string): Observable<PasskeyChallenge>

  finishPasskeyChallenge(
    mfaToken: string,
    challengeId: string,
    credential: unknown,
  ): Observable<void>

  enrollTotp(mfaToken: string): Observable<TotpEnrollment>

  confirmTotp(mfaToken: string, code: string): Observable<MfaSetupResult>

  startPasskeySetup(mfaToken: string): Observable<PasskeyChallenge>

  finishPasskeySetup(
    mfaToken: string,
    challengeId: string,
    credential: unknown,
    name: string,
  ): Observable<MfaSetupResult>

  setToken(token: string): void
}

export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT')
