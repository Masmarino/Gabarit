import { activationToken } from './activation-link'

const TOKEN = 'ab12'.repeat(16)

describe('activationToken', () => {
  it('reads the token from the fragment of the link (`#token=…`), which never reaches a server', () => {
    expect(activationToken(`token=${TOKEN}`, null)).toBe(TOKEN)
  })

  it('is tolerant of a leading `#`, other parameters around it and the case of the hex digits', () => {
    expect(activationToken(`#token=${TOKEN}`, null)).toBe(TOKEN)
    expect(activationToken(`utm=x&token=${TOKEN}&y=1`, null)).toBe(TOKEN)
    expect(activationToken(`token=${TOKEN.toUpperCase()}`, null)).toBe(TOKEN.toUpperCase())
  })

  it('falls back to the `?token=` of a mail sent before the link moved to the fragment', () => {
    expect(activationToken(null, TOKEN)).toBe(TOKEN)
    expect(activationToken('other=1', TOKEN)).toBe(TOKEN)
  })

  it('prefers the fragment when both are present', () => {
    expect(activationToken(`token=${TOKEN}`, 'c'.repeat(64))).toBe(TOKEN)
  })

  it.each([
    [null, null],
    ['', ''],
    ['token=', null],
    ['token', null],
    ['other=1', null],
    [null, ''],
    [`token=${TOKEN}x`, null],
    ['token=abc', null],
    [`token=${'g'.repeat(64)}`, null],
    ['token=%00', null],
  ])(
    'is null for a missing or malformed token (%j, %j): the page then never calls the API',
    (fragment, query) => {
      expect(activationToken(fragment, query)).toBeNull()
    },
  )

  it('does not fall back to the query when the fragment holds a malformed token, but does when it holds none', () => {
    expect(activationToken('token=abc', TOKEN)).toBeNull()
    expect(activationToken('other=1', TOKEN)).toBe(TOKEN)
  })

  it('takes the shape of another backend when given one', () => {
    expect(activationToken('token=abc', null, /^[a-z]{3}$/)).toBe('abc')
    expect(activationToken(`token=${TOKEN}`, null, /^[a-z]{3}$/)).toBeNull()
  })
})
