import { HttpErrorResponse } from '@angular/common/http'
import { classifyMfaFailure, classifyPasswordFailure, isTooManyPasskeys } from './mfa-errors'

const failure = (status: number, body?: unknown) => new HttpErrorResponse({ status, error: body })

describe('classifyMfaFailure', () => {
  it("reads the backend's invalid-or-expired-token 401 as an expired login", () => {
    expect(classifyMfaFailure(failure(401, { error: 'invalid or expired token' }))).toBe('expired')
  })

  it('reads a 401 "invalid code" as a wrong code', () => {
    expect(classifyMfaFailure(failure(401, { error: 'invalid code' }))).toBe('wrong-code')
  })

  it('reads a 400 "invalid code" (first-enrolment confirm) as a wrong code', () => {
    expect(classifyMfaFailure(failure(400, { error: 'invalid code' }))).toBe('wrong-code')
  })

  it('keeps a 401 with an unknown or missing body a wrong code (nothing else answers 401 at the challenge)', () => {
    expect(classifyMfaFailure(failure(401))).toBe('wrong-code')
    expect(classifyMfaFailure(failure(401, {}))).toBe('wrong-code')
    expect(classifyMfaFailure(failure(401, 'plain text'))).toBe('wrong-code')
    expect(classifyMfaFailure(failure(401, { error: 42 }))).toBe('wrong-code')
  })

  it('reads a 429 as rate limited whatever the body', () => {
    expect(classifyMfaFailure(failure(429, { error: 'too many attempts, try again later' }))).toBe(
      'rate-limited',
    )
    expect(classifyMfaFailure(failure(429))).toBe('rate-limited')
  })

  it('does not take any other 400 (already enrolled, nothing to confirm) for a wrong code', () => {
    expect(classifyMfaFailure(failure(400, { error: 'TOTP is already enrolled' }))).toBe('other')
    expect(classifyMfaFailure(failure(400))).toBe('other')
  })

  it('reads the 503 of an instance that cannot run passkeys as unavailable', () => {
    expect(
      classifyMfaFailure(failure(503, { error: 'passkeys are not available on this server' })),
    ).toBe('unavailable')
    expect(classifyMfaFailure(failure(503))).toBe('unavailable')
  })

  it('reads the setup routes\' "MFA is already set up" 400 as an account that already has its factor', () => {
    expect(classifyMfaFailure(failure(400, { error: 'MFA is already set up' }))).toBe(
      'already-set-up',
    )
  })

  it('does not take the passkey ceremony refusals of the setup finish for anything but other', () => {
    expect(classifyMfaFailure(failure(400, { error: 'invalid passkey' }))).toBe('other')
    expect(classifyMfaFailure(failure(400, { error: 'invalid passkey name' }))).toBe('other')
    expect(classifyMfaFailure(failure(400, { error: 'invalid request body' }))).toBe('other')
  })

  it('files server and network failures, and anything that is not an HTTP error, as other', () => {
    expect(classifyMfaFailure(failure(500, { error: 'internal error' }))).toBe('other')
    expect(classifyMfaFailure(failure(0))).toBe('other')
    expect(classifyMfaFailure(new Error('boom'))).toBe('other')
    expect(classifyMfaFailure(undefined)).toBe('other')
  })
})

describe('classifyPasswordFailure', () => {
  it('reads a 400 "current password is incorrect" as a wrong password', () => {
    expect(classifyPasswordFailure(failure(400, { error: 'current password is incorrect' }))).toBe(
      'wrong-password',
    )
  })

  it('does not take a 400 without the exact wrong-password body for a typo', () => {
    expect(classifyPasswordFailure(failure(400))).toBe('other')
    expect(classifyPasswordFailure(failure(400, {}))).toBe('other')
    expect(classifyPasswordFailure(failure(400, 'plain text'))).toBe('other')
    expect(classifyPasswordFailure(failure(400, { error: 42 }))).toBe('other')
    expect(classifyPasswordFailure(failure(400, { error: 'Current password is incorrect' }))).toBe(
      'other',
    )
    expect(classifyPasswordFailure(failure(400, { error: 'invalid code' }))).toBe('other')
  })

  it('does not take the other 400 refusals for a typo', () => {
    expect(classifyPasswordFailure(failure(400, { error: 'TOTP is already enrolled' }))).toBe(
      'other',
    )
    expect(classifyPasswordFailure(failure(400, { error: 'TOTP is not enrolled' }))).toBe('other')
  })

  it('reads a 429 as rate limited', () => {
    expect(
      classifyPasswordFailure(failure(429, { error: 'too many attempts, try again later' })),
    ).toBe('rate-limited')
  })

  it('reads anything else as other', () => {
    expect(classifyPasswordFailure(failure(500))).toBe('other')
    expect(classifyPasswordFailure(failure(401))).toBe('other')
    expect(classifyPasswordFailure(new Error('network'))).toBe('other')
  })
})

describe('isTooManyPasskeys', () => {
  it('recognises the exact 400 the server answers past its limit of passkeys', () => {
    expect(isTooManyPasskeys(failure(400, { error: 'too many passkeys' }))).toBe(true)
  })

  it('is not fooled by another refusal, another status or a non-HTTP error', () => {
    expect(isTooManyPasskeys(failure(400, { error: 'invalid passkey' }))).toBe(false)
    expect(isTooManyPasskeys(failure(400))).toBe(false)
    expect(isTooManyPasskeys(failure(500, { error: 'too many passkeys' }))).toBe(false)
    expect(isTooManyPasskeys(new Error('too many passkeys'))).toBe(false)
  })
})
