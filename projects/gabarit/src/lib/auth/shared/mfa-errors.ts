import { AUTH_PORT_ERROR_BODIES, isAuthPortError, portErrorMessage } from './port-error'

export type MfaFailure =
  'wrong-code' | 'expired' | 'rate-limited' | 'unavailable' | 'already-set-up' | 'other'

export function classifyMfaFailure(err: unknown): MfaFailure {
  if (!isAuthPortError(err)) {
    return 'other'
  }
  const message = portErrorMessage(err)
  switch (err.status) {
    case 429:
      return 'rate-limited'
    case 503:
      return 'unavailable'
    case 401:
      return message === AUTH_PORT_ERROR_BODIES.invalidToken ? 'expired' : 'wrong-code'
    case 400:
      if (message === AUTH_PORT_ERROR_BODIES.invalidCode) {
        return 'wrong-code'
      }
      return message === AUTH_PORT_ERROR_BODIES.alreadySetUp ? 'already-set-up' : 'other'
    default:
      return 'other'
  }
}

export type PasswordGatedFailure = 'wrong-password' | 'rate-limited' | 'other'

export function classifyPasswordFailure(err: unknown): PasswordGatedFailure {
  if (!isAuthPortError(err)) {
    return 'other'
  }
  if (err.status === 429) {
    return 'rate-limited'
  }
  if (err.status === 400) {
    return portErrorMessage(err) === AUTH_PORT_ERROR_BODIES.wrongPassword
      ? 'wrong-password'
      : 'other'
  }
  return 'other'
}

export function isTooManyPasskeys(err: unknown): boolean {
  return (
    isAuthPortError(err) &&
    err.status === 400 &&
    portErrorMessage(err) === AUTH_PORT_ERROR_BODIES.tooManyPasskeys
  )
}
