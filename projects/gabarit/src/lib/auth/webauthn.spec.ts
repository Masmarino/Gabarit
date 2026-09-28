import {
  base64UrlToBuffer,
  bufferToBase64Url,
  classifyPasskeyError,
  createPasskeyCredential,
  getPasskeyAssertion,
  passkeysSupported,
} from './webauthn'

const bytes = (...values: number[]) => new Uint8Array(values).buffer
const toArray = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer))

/** The credentials container of a browser, whose two calls answer whatever the test needs. */
function stubBrowser(
  credentials: { create?: unknown; get?: unknown } | undefined,
  publicKeyCredential = true,
) {
  vi.stubGlobal('navigator', { credentials })
  if (publicKeyCredential) {
    vi.stubGlobal('PublicKeyCredential', class {})
  } else {
    vi.stubGlobal('PublicKeyCredential', undefined)
  }
}

describe('webauthn-browser', () => {
  // Every test patches `navigator`/`PublicKeyCredential`: put the real ones back.
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('base64url', () => {
    // [bytes, base64url without padding]. Chosen so that every padding length and both URL-safe
    // substitutions (+ -> -, / -> _) occur, and bytes >= 0x80 are covered.
    const VECTORS: [number[], string][] = [
      [[], ''],
      [[0x66], 'Zg'], // two characters of padding stripped
      [[0x66, 0x6f], 'Zm8'], // one character of padding stripped
      [[0x66, 0x6f, 0x6f], 'Zm9v'], // none
      [[0xfb, 0xff, 0xfe], '-__-'], // "+//+" in standard base64
      [[0x80, 0x81, 0xfe, 0xff], 'gIH-_w'], // high bytes, two characters of padding
      [[0x00, 0x00, 0x00, 0x00, 0x00], 'AAAAAAA'],
    ]

    it.each(VECTORS)('encodes %j as %s', (input, expected) => {
      expect(bufferToBase64Url(bytes(...input))).toBe(expected)
    })

    it.each(VECTORS)('decodes %j from %s', (input, encoded) => {
      expect(toArray(base64UrlToBuffer(encoded))).toEqual(input)
    })

    it('never emits padding, "+" or "/"', () => {
      const all = bytes(...Array.from({ length: 256 }, (_, i) => i))

      expect(bufferToBase64Url(all)).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('round-trips every byte value and every length up to 8', () => {
      for (let length = 0; length <= 8; length++) {
        const input = Array.from({ length }, (_, i) => (i * 37 + 0x7f) % 256)
        expect(toArray(base64UrlToBuffer(bufferToBase64Url(bytes(...input))))).toEqual(input)
      }
      const all = Array.from({ length: 256 }, (_, i) => i)
      expect(toArray(base64UrlToBuffer(bufferToBase64Url(bytes(...all))))).toEqual(all)
    })

    it('also decodes input that still carries its padding', () => {
      expect(toArray(base64UrlToBuffer('Zg=='))).toEqual([0x66])
    })

    it('refuses a string that is not base64url', () => {
      expect(() => base64UrlToBuffer('not base64!')).toThrow()
    })
  })

  describe('passkeysSupported', () => {
    it('is true when the browser has WebAuthn', () => {
      stubBrowser({ create: vi.fn(), get: vi.fn() })

      expect(passkeysSupported()).toBe(true)
    })

    it('is false without a credentials container (an insecure page, an old browser)', () => {
      stubBrowser(undefined)

      expect(passkeysSupported()).toBe(false)
    })

    it('is false when the container cannot create or get a public-key credential', () => {
      stubBrowser({ get: vi.fn() })
      expect(passkeysSupported()).toBe(false)

      stubBrowser({ create: vi.fn() })
      expect(passkeysSupported()).toBe(false)
    })

    it('is false when the browser has a credentials container but no PublicKeyCredential', () => {
      stubBrowser({ create: vi.fn(), get: vi.fn() }, false)

      expect(passkeysSupported()).toBe(false)
    })
  })

  describe('classifyPasskeyError', () => {
    const named = (name: string) => new DOMException('x', name)

    it.each(['NotAllowedError', 'AbortError'])(
      'reads %s (dismissed prompt, timeout) as cancelled',
      (name) => {
        expect(classifyPasskeyError(named(name))).toBe('cancelled')
      },
    )

    it('reads InvalidStateError (an authenticator already holding this credential) as already-registered', () => {
      expect(classifyPasskeyError(named('InvalidStateError'))).toBe('already-registered')
    })

    it('reads NotSupportedError (no authenticator can do what the server asked) as unsupported', () => {
      expect(classifyPasskeyError(named('NotSupportedError'))).toBe('unsupported')
    })

    it('reads anything else as failed', () => {
      expect(classifyPasskeyError(named('SecurityError'))).toBe('failed')
      expect(classifyPasskeyError(named('UnknownError'))).toBe('failed')
      expect(classifyPasskeyError(new TypeError('boom'))).toBe('failed')
      expect(classifyPasskeyError(new Error('boom'))).toBe('failed')
      expect(classifyPasskeyError('NotAllowedError')).toBe('failed')
      expect(classifyPasskeyError(null)).toBe('failed')
      expect(classifyPasskeyError(undefined)).toBe('failed')
    })

    it('goes by the error name, whatever the class (a cross-realm or wrapped DOMException)', () => {
      expect(classifyPasskeyError({ name: 'NotAllowedError' })).toBe('cancelled')
    })
  })

  describe('createPasskeyCredential', () => {
    const CHALLENGE = 'AQID' // 1, 2, 3
    const USER_ID = 'BAUG' // 4, 5, 6
    const EXCLUDED = 'Bwg' // 7, 8
    const options = () => ({
      challenge: CHALLENGE,
      rp: { id: 'git.example.com', name: 'FerrisGit' },
      user: { id: USER_ID, name: 'alice', displayName: 'alice' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60000,
      excludeCredentials: [{ type: 'public-key', id: EXCLUDED }],
      authenticatorSelection: { residentKey: 'discouraged', userVerification: 'preferred' },
    })
    const attestation = () => ({
      id: 'credential-id',
      rawId: bytes(0xfb, 0xff, 0xfe),
      type: 'public-key',
      response: {
        attestationObject: bytes(0x80, 0x81, 0xfe, 0xff),
        clientDataJSON: bytes(0x66, 0x6f, 0x6f),
        getTransports: () => ['internal'],
      },
      getClientExtensionResults: () => ({}),
    })

    it('decodes the challenge, the user id and the excluded ids for the browser and passes the rest through', async () => {
      const create = vi.fn().mockResolvedValue(attestation())
      stubBrowser({ create, get: vi.fn() })

      await createPasskeyCredential(options())

      const { publicKey } = create.mock.calls[0][0]
      expect(toArray(publicKey.challenge)).toEqual([1, 2, 3])
      expect(toArray(publicKey.user.id)).toEqual([4, 5, 6])
      expect(publicKey.user.name).toBe('alice')
      expect(toArray(publicKey.excludeCredentials[0].id)).toEqual([7, 8])
      expect(publicKey.excludeCredentials[0].type).toBe('public-key')
      expect(publicKey.rp).toEqual({ id: 'git.example.com', name: 'FerrisGit' })
      expect(publicKey.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }])
      expect(publicKey.timeout).toBe(60000)
      expect(publicKey.authenticatorSelection).toEqual({
        residentKey: 'discouraged',
        userVerification: 'preferred',
      })
    })

    it('accepts options without excludeCredentials', async () => {
      const create = vi.fn().mockResolvedValue(attestation())
      stubBrowser({ create, get: vi.fn() })
      const bare: Record<string, unknown> = options()
      delete bare['excludeCredentials']

      await createPasskeyCredential(bare)

      expect(create.mock.calls[0][0].publicKey.excludeCredentials).toEqual([])
    })

    it('does not modify the options it was given', async () => {
      stubBrowser({ create: vi.fn().mockResolvedValue(attestation()), get: vi.fn() })
      const given = options()

      await createPasskeyCredential(given)

      expect(given).toEqual(options())
    })

    it('answers with exactly the JSON the server deserialises, everything in base64url', async () => {
      stubBrowser({ create: vi.fn().mockResolvedValue(attestation()), get: vi.fn() })

      const credential = await createPasskeyCredential(options())

      expect(credential).toEqual({
        id: 'credential-id',
        rawId: '-__-',
        type: 'public-key',
        response: { attestationObject: 'gIH-_w', clientDataJSON: 'Zm9v' },
      })
    })

    it('rejects with NotAllowedError when the browser answers no credential', async () => {
      stubBrowser({ create: vi.fn().mockResolvedValue(null), get: vi.fn() })

      const failure = await createPasskeyCredential(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('cancelled')
    })

    it('lets the browser error through (a dismissed prompt stays a NotAllowedError)', async () => {
      stubBrowser({
        create: vi.fn().mockRejectedValue(new DOMException('x', 'NotAllowedError')),
        get: vi.fn(),
      })

      const failure = await createPasskeyCredential(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('cancelled')
    })

    it('rejects as unsupported, without touching the browser, when there is no WebAuthn', async () => {
      stubBrowser(undefined)

      const failure = await createPasskeyCredential(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('unsupported')
    })

    it('rejects as failed on options that are not what the server sends', async () => {
      const create = vi.fn()
      stubBrowser({ create, get: vi.fn() })

      for (const broken of [
        null,
        undefined,
        'x',
        {},
        { ...options(), challenge: '***' },
        { ...options(), user: undefined },
      ]) {
        const failure = await createPasskeyCredential(broken).catch((e: unknown) => e)
        expect(classifyPasskeyError(failure)).toBe('failed')
      }
      expect(create).not.toHaveBeenCalled()
    })
  })

  describe('getPasskeyAssertion', () => {
    const options = () => ({
      challenge: 'AQID',
      rpId: 'git.example.com',
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: [
        { type: 'public-key', id: 'Bwg' },
        { type: 'public-key', id: 'CQo' },
      ],
    })
    const assertion = (userHandle: ArrayBuffer | null) => ({
      id: 'credential-id',
      rawId: bytes(0xfb, 0xff, 0xfe),
      type: 'public-key',
      response: {
        authenticatorData: bytes(0x80, 0x81, 0xfe, 0xff),
        clientDataJSON: bytes(0x66, 0x6f, 0x6f),
        signature: bytes(0x66, 0x6f),
        userHandle,
      },
    })

    it('decodes the challenge and the allowed ids for the browser and passes the rest through', async () => {
      const get = vi.fn().mockResolvedValue(assertion(null))
      stubBrowser({ create: vi.fn(), get })

      await getPasskeyAssertion(options())

      const { publicKey } = get.mock.calls[0][0]
      expect(toArray(publicKey.challenge)).toEqual([1, 2, 3])
      expect(publicKey.allowCredentials.map((c: { id: ArrayBuffer }) => toArray(c.id))).toEqual([
        [7, 8],
        [9, 10],
      ])
      expect(publicKey.allowCredentials[0].type).toBe('public-key')
      expect(publicKey.rpId).toBe('git.example.com')
      expect(publicKey.userVerification).toBe('preferred')
      expect(publicKey.timeout).toBe(60000)
    })

    it('accepts options without allowCredentials', async () => {
      const get = vi.fn().mockResolvedValue(assertion(null))
      stubBrowser({ create: vi.fn(), get })
      const bare: Record<string, unknown> = options()
      delete bare['allowCredentials']

      await getPasskeyAssertion(bare)

      expect(get.mock.calls[0][0].publicKey.allowCredentials).toEqual([])
    })

    it('answers with exactly the JSON the server deserialises, a missing user handle as null', async () => {
      stubBrowser({ create: vi.fn(), get: vi.fn().mockResolvedValue(assertion(null)) })

      const credential = await getPasskeyAssertion(options())

      expect(credential).toEqual({
        id: 'credential-id',
        rawId: '-__-',
        type: 'public-key',
        response: {
          authenticatorData: 'gIH-_w',
          clientDataJSON: 'Zm9v',
          signature: 'Zm8',
          userHandle: null,
        },
      })
    })

    it('encodes a user handle when the authenticator returns one', async () => {
      stubBrowser({ create: vi.fn(), get: vi.fn().mockResolvedValue(assertion(bytes(4, 5, 6))) })

      const credential = (await getPasskeyAssertion(options())) as {
        response: { userHandle: string }
      }

      expect(credential.response.userHandle).toBe('BAUG')
    })

    it('rejects with NotAllowedError when the browser answers no credential', async () => {
      stubBrowser({ create: vi.fn(), get: vi.fn().mockResolvedValue(null) })

      const failure = await getPasskeyAssertion(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('cancelled')
    })

    it('lets the browser error through', async () => {
      stubBrowser({
        create: vi.fn(),
        get: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')),
      })

      const failure = await getPasskeyAssertion(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('cancelled')
    })

    it('rejects as unsupported, without touching the browser, when there is no WebAuthn', async () => {
      stubBrowser(undefined)

      const failure = await getPasskeyAssertion(options()).catch((e: unknown) => e)

      expect(classifyPasskeyError(failure)).toBe('unsupported')
    })

    it('rejects as failed on options that are not what the server sends', async () => {
      const get = vi.fn()
      stubBrowser({ create: vi.fn(), get })

      for (const broken of [null, undefined, 'x', {}, { ...options(), challenge: '***' }]) {
        const failure = await getPasskeyAssertion(broken).catch((e: unknown) => e)
        expect(classifyPasskeyError(failure)).toBe('failed')
      }
      expect(get).not.toHaveBeenCalled()
    })
  })
})
