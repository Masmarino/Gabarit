import { AUTH_PORT_ERROR_BODIES, isAuthPortError, portErrorMessage } from './port-error'

export type RegisterFailure =
  | 'disabled'
  | 'invalid'
  | 'username-invalid'
  | 'email-invalid'
  | 'password-weak'
  | 'username-reserved'
  | 'username-taken'
  | 'email-taken'
  | 'rate-limited'
  | 'other'

export type ActivateFailure =
  | 'invalid-link'
  | 'weak-password'
  | 'username-invalid'
  | 'username-reserved'
  | 'username-taken'
  | 'rate-limited'
  | 'other'

export function classifyRegisterFailure(err: unknown): RegisterFailure {
  if (!isAuthPortError(err)) {
    return 'other'
  }
  const message = portErrorMessage(err)
  switch (err.status) {
    case 400:
      if (message === AUTH_PORT_ERROR_BODIES.registrationDisabled) {
        return 'disabled'
      }
      if (message === AUTH_PORT_ERROR_BODIES.usernameReserved) {
        return 'username-reserved'
      }
      if (message === AUTH_PORT_ERROR_BODIES.invalidEmail) {
        return 'email-invalid'
      }
      if (message?.startsWith(AUTH_PORT_ERROR_BODIES.weakPasswordPrefix)) {
        return 'password-weak'
      }
      return message?.startsWith(AUTH_PORT_ERROR_BODIES.usernamePrefix)
        ? 'username-invalid'
        : 'invalid'
    case 409:
      return message === AUTH_PORT_ERROR_BODIES.emailTaken ? 'email-taken' : 'username-taken'
    case 429:
      return 'rate-limited'
    default:
      return 'other'
  }
}

export function classifyActivateFailure(err: unknown): ActivateFailure {
  if (!isAuthPortError(err)) {
    return 'other'
  }
  const message = portErrorMessage(err)
  switch (err.status) {
    case 400:
      if (message?.startsWith(AUTH_PORT_ERROR_BODIES.weakPasswordPrefix)) {
        return 'weak-password'
      }
      if (message === AUTH_PORT_ERROR_BODIES.usernameReserved) {
        return 'username-reserved'
      }
      return message?.startsWith(AUTH_PORT_ERROR_BODIES.usernamePrefix)
        ? 'username-invalid'
        : 'invalid-link'
    case 409:
      return 'username-taken'
    case 429:
      return 'rate-limited'
    default:
      return 'other'
  }
}
