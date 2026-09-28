export const PASSKEY_NAME_MAX = 40

export type PasskeyNameProblem = 'too-long' | 'control-characters'

export function passkeyNameProblem(
  name: string,
  maxLength: number = PASSKEY_NAME_MAX,
): PasskeyNameProblem | null {
  if (Array.from(name).length > maxLength) {
    return 'too-long'
  }
  // eslint-disable-next-line no-control-regex
  return /[\u0000-\u001f\u007f-\u009f]/.test(name) ? 'control-characters' : null
}
