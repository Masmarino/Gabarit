import { HttpErrorResponse } from '@angular/common/http'
import { classifyActivateFailure, classifyRegisterFailure } from './account-errors'
import { classifyMfaFailure, classifyPasswordFailure } from './mfa-errors'
import { AUTH_PORT_ERROR_BODIES, isAuthPortError, portErrorMessage } from './port-error'

describe('the port error contract', () => {
  it("takes Angular's HttpErrorResponse as it is (an HttpClient adapter passes its errors through)", () => {
    const err = new HttpErrorResponse({ status: 401, error: { error: 'invalid code' } })
    expect(isAuthPortError(err)).toBe(true)
    expect(portErrorMessage(err)).toBe('invalid code')
  })

  it('takes any plain object with a numeric status (another transport maps onto it)', () => {
    const err = { status: 401, error: { error: AUTH_PORT_ERROR_BODIES.invalidToken } }
    expect(isAuthPortError(err)).toBe(true)
    expect(classifyMfaFailure(err)).toBe('expired')
    expect(
      classifyPasswordFailure({ status: 400, error: { error: 'current password is incorrect' } }),
    ).toBe('wrong-password')
    expect(classifyRegisterFailure({ status: 409, error: { error: 'email already in use' } })).toBe(
      'email-taken',
    )
    expect(classifyActivateFailure({ status: 429 })).toBe('rate-limited')
  })

  it("never takes the browser's WebAuthn errors, plain errors or nothing for a backend answer", () => {
    expect(isAuthPortError(new DOMException('dismissed', 'NotAllowedError'))).toBe(false)
    expect(isAuthPortError(new Error('boom'))).toBe(false)
    expect(isAuthPortError({ status: '401' })).toBe(false)
    expect(isAuthPortError(null)).toBe(false)
    expect(isAuthPortError(undefined)).toBe(false)
  })

  it('reads the message of a { error: string } body only', () => {
    expect(portErrorMessage({ status: 400 })).toBeNull()
    expect(portErrorMessage({ status: 400, error: 'plain text' })).toBeNull()
    expect(portErrorMessage({ status: 400, error: { error: 42 } })).toBeNull()
    expect(portErrorMessage({ status: 400, error: { error: 'x' } })).toBe('x')
  })
})
