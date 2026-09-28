export const MIN_PASSWORD_LENGTH = 8

export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{2,31}$/

const MAX_EMAIL_LENGTH = 254

export type UsernameProblem = 'empty' | 'invalid'
export type EmailProblem = 'empty' | 'invalid'
export type PasswordProblem = 'empty' | 'too-short'

export function usernameProblem(
  raw: string,
  pattern: RegExp = USERNAME_PATTERN,
): UsernameProblem | null {
  const username = raw.trim()
  if (username === '') {
    return 'empty'
  }
  return pattern.test(username) ? null : 'invalid'
}

export function emailProblem(raw: string): EmailProblem | null {
  const email = raw.trim()
  if (email === '') {
    return 'empty'
  }
  const parts = email.split('@')
  const [local, domain] = parts
  const valid =
    email.length <= MAX_EMAIL_LENGTH &&
    !/\s/.test(email) &&
    parts.length === 2 &&
    local.length > 0 &&
    domain.includes('.') &&
    !domain.startsWith('.') &&
    !domain.endsWith('.')
  return valid ? null : 'invalid'
}

export function passwordProblem(
  password: string,
  minLength: number = MIN_PASSWORD_LENGTH,
): PasswordProblem | null {
  if (password === '') {
    return 'empty'
  }
  return password.length >= minLength ? null : 'too-short'
}

export function accountName(raw: string): string {
  return raw.trim().toLowerCase()
}
