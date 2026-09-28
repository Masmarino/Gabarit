import {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  accountName,
  emailProblem,
  passwordProblem,
  usernameProblem,
} from './account-rules'

describe('account rules (client mirror of the server)', () => {
  describe('usernameProblem', () => {
    it.each(['abc', 'Alice', 'a_b-c1', 'a'.repeat(32), 'x1_'])('accepts %s', (username) => {
      expect(usernameProblem(username)).toBeNull()
    })

    it('ignores the spaces around the name, as the server trims', () => {
      expect(usernameProblem('  alice  ')).toBeNull()
    })

    it('asks for a name when it is empty', () => {
      expect(usernameProblem('')).toBe('empty')
      expect(usernameProblem('   ')).toBe('empty')
    })

    it.each(['ab', 'a'.repeat(33), '1abc', '_abc', 'a b', 'a.git', 'é'.repeat(3), 'ali ce', 'a@b'])(
      'refuses %s with the rule, not a vague message',
      (username) => {
        expect(usernameProblem(username)).toBe('invalid')
      },
    )

    it('takes another rule when the backend has one', () => {
      expect(usernameProblem('ab', /^[a-z]{2}$/)).toBeNull()
      expect(usernameProblem('abc', /^[a-z]{2}$/)).toBe('invalid')
      expect(USERNAME_PATTERN.test('abc')).toBe(true)
    })
  })

  describe('emailProblem', () => {
    it.each(['a@example.com', 'first.last+tag@sub.example.co', ' padded@example.com '])(
      'accepts %s',
      (email) => {
        expect(emailProblem(email)).toBeNull()
      },
    )

    it('asks for an address when it is empty', () => {
      expect(emailProblem('')).toBe('empty')
    })

    it.each([
      'nope',
      'admin@localhost',
      '@example.com',
      'a@@example.com',
      'a@b@example.com',
      'a@.example.com',
      'a@example.com.',
      'a b@example.com',
      `${'a'.repeat(250)}@example.com`,
    ])('refuses %s', (email) => {
      expect(emailProblem(email)).toBe('invalid')
    })
  })

  describe('passwordProblem', () => {
    it('asks for a password when it is empty', () => {
      expect(passwordProblem('')).toBe('empty')
    })

    it('refuses a password under the minimum length', () => {
      expect(MIN_PASSWORD_LENGTH).toBe(8)
      expect(passwordProblem('1234567')).toBe('too-short')
    })

    it('accepts the minimum length, spaces included (a password is never trimmed)', () => {
      expect(passwordProblem('12345678')).toBeNull()
      expect(passwordProblem('       8')).toBeNull()
    })

    it('takes another minimum when the backend has one', () => {
      expect(passwordProblem('12345678', 12)).toBe('too-short')
      expect(passwordProblem('123456789012', 12)).toBeNull()
    })
  })

  describe('the name of the account', () => {
    it('is stored trimmed and lower-cased, so it is shown that way', () => {
      expect(accountName('  Florian_D ')).toBe('florian_d')
      expect(accountName('alice')).toBe('alice')
    })
  })
})
