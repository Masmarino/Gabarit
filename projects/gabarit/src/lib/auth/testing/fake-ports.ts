import { Observable, type Subscriber } from 'rxjs'
import type { AuthPort } from '../ports/auth.port'
import type { MfaPort } from '../ports/mfa.port'

export class PendingCall {
  cancelled = false
  answered = false

  constructor(
    readonly method: string,
    readonly args: readonly unknown[],
    private readonly subscriber: Subscriber<unknown>,
  ) {}

  flush(value?: unknown): void {
    this.answered = true
    this.subscriber.next(value)
    this.subscriber.complete()
  }

  fail(status: number, body: unknown = null): void {
    this.error({ status, statusText: 'x', error: body })
  }

  error(err: unknown): void {
    this.answered = true
    this.subscriber.error(err)
  }
}

export class FakePortController {
  private readonly open: PendingCall[] = []
  readonly calls: PendingCall[] = []

  call<T>(method: string, args: readonly unknown[]): Observable<T> {
    return new Observable<T>((subscriber) => {
      const pending = new PendingCall(method, args, subscriber as Subscriber<unknown>)
      this.open.push(pending)
      this.calls.push(pending)
      return () => {
        if (!pending.answered) {
          pending.cancelled = true
        }
      }
    })
  }

  expectOne(method: string): PendingCall {
    const matches = this.open.filter((call) => call.method === method)
    if (matches.length !== 1) {
      throw new Error(`Expected one open call to ${method}, found ${matches.length}`)
    }
    this.open.splice(this.open.indexOf(matches[0]), 1)
    return matches[0]
  }

  expectNone(method: string): void {
    const matches = this.open.filter((call) => call.method === method)
    if (matches.length > 0) {
      throw new Error(`Expected no open call to ${method}, found ${matches.length}`)
    }
  }

  match(method: string): PendingCall[] {
    const matches = this.open.filter((call) => call.method === method)
    for (const found of matches) {
      this.open.splice(this.open.indexOf(found), 1)
    }
    return matches
  }

  verify(): void {
    if (this.open.length > 0) {
      throw new Error(`Unexpected open calls: ${this.open.map((call) => call.method).join(', ')}`)
    }
  }
}

export interface FakeAuthPort extends AuthPort {
  readonly calls: FakePortController
  readonly tokens: string[]
}

export function fakeAuthPort(): FakeAuthPort {
  const calls = new FakePortController()
  const tokens: string[] = []
  const call =
    <T>(method: string) =>
    (...args: unknown[]) =>
      calls.call<T>(method, args)
  return {
    calls,
    tokens,
    authConfig: call('authConfig'),
    login: call('login'),
    register: call('register'),
    activate: call('activate'),
    resetPassword: call('resetPassword'),
    verifyMfa: call('verifyMfa'),
    startPasskeyChallenge: call('startPasskeyChallenge'),
    finishPasskeyChallenge: call('finishPasskeyChallenge'),
    enrollTotp: call('enrollTotp'),
    confirmTotp: call('confirmTotp'),
    startPasskeySetup: call('startPasskeySetup'),
    finishPasskeySetup: call('finishPasskeySetup'),
    setToken: (token: string) => {
      tokens.push(token)
    },
  }
}

export interface FakeMfaPort extends MfaPort {
  readonly calls: FakePortController
}

export function fakeMfaPort(): FakeMfaPort {
  const calls = new FakePortController()
  const call =
    <T>(method: string) =>
    (...args: unknown[]) =>
      calls.call<T>(method, args)
  return {
    calls,
    status: call('status'),
    enroll: call('enroll'),
    confirm: call('confirm'),
    regenerate: call('regenerate'),
    disable: call('disable'),
    startPasskeyRegistration: call('startPasskeyRegistration'),
    finishPasskeyRegistration: call('finishPasskeyRegistration'),
    deletePasskey: call('deletePasskey'),
  }
}

export const FAKE_QR_DATA_URL = 'data:image/png;base64,QR'
export const fakeQrRenderer = () => Promise.resolve(FAKE_QR_DATA_URL)
