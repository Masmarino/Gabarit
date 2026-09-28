export interface AuthPortError {
  status: number
  error?: unknown
}

export const AUTH_PORT_ERROR_BODIES = {
  invalidToken: 'invalid or expired token',
  invalidCode: 'invalid code',
  alreadySetUp: 'MFA is already set up',
  wrongPassword: 'current password is incorrect',
  tooManyPasskeys: 'too many passkeys',
  registrationDisabled: 'registration is disabled',
  usernameReserved: 'username is reserved',
  emailTaken: 'email already in use',
  invalidEmail: 'email is not a valid address',
  weakPasswordPrefix: 'password must be at least',
  usernamePrefix: 'username ',
} as const

export function isAuthPortError(err: unknown): err is AuthPortError {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { status?: unknown }).status === 'number'
  )
}

export function portErrorMessage(err: AuthPortError): string | null {
  const body = err.error
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'string'
  ) {
    return (body as { error: string }).error
  }
  return null
}
