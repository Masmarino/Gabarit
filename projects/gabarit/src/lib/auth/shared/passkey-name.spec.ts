import { PASSKEY_NAME_MAX, passkeyNameProblem } from './passkey-name'

describe('passkeyNameProblem', () => {
  it('accepts an ordinary name, an empty one (the default applies) and the longest one', () => {
    expect(passkeyNameProblem('MacBook Touch ID')).toBeNull()
    expect(passkeyNameProblem('')).toBeNull()
    expect(passkeyNameProblem('é'.repeat(PASSKEY_NAME_MAX))).toBeNull()
  })

  it('counts code points like the server: 40 astral characters are fine, 41 are not', () => {
    expect('😀'.length).toBe(2)
    expect(passkeyNameProblem('😀'.repeat(40))).toBeNull()
    expect(passkeyNameProblem('😀'.repeat(41))).toBe('too-long')
  })

  it('refuses a name one character too long', () => {
    expect(PASSKEY_NAME_MAX).toBe(40)
    expect(passkeyNameProblem('a'.repeat(PASSKEY_NAME_MAX + 1))).toBe('too-long')
  })

  it('takes another maximum when the backend has one', () => {
    expect(passkeyNameProblem('abcd', 3)).toBe('too-long')
    expect(passkeyNameProblem('abc', 3)).toBeNull()
  })

  it.each(['a\nb', 'a\tb', 'a\u0000b', 'a\u007fb', 'a\u0085b'])(
    'refuses control characters (%j)',
    (name) => {
      expect(passkeyNameProblem(name)).toBe('control-characters')
    },
  )
})
