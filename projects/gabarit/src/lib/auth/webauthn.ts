export type PasskeyFailure = 'cancelled' | 'already-registered' | 'unsupported' | 'failed'

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const unpadded = base64Url.replace(/=+$/, '')
  const base64 = (unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function passkeysSupported(): boolean {
  return (
    typeof PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  )
}

export function classifyPasskeyError(e: unknown): PasskeyFailure {
  const name =
    typeof e === 'object' && e !== null && 'name' in e ? (e as { name: unknown }).name : null
  switch (name) {
    case 'NotAllowedError':
    case 'AbortError':
      return 'cancelled'
    case 'InvalidStateError':
      return 'already-registered'
    case 'NotSupportedError':
      return 'unsupported'
    default:
      return 'failed'
  }
}

interface CredentialDescriptorJson {
  id: string
  [key: string]: unknown
}

function ceremonyError(
  message: string,
  name: 'NotSupportedError' | 'NotAllowedError' | 'DataError',
): DOMException {
  return new DOMException(message, name)
}

function decodeDescriptors(list: unknown): PublicKeyCredentialDescriptor[] {
  if (list === undefined || list === null) {
    return []
  }
  return (list as CredentialDescriptorJson[]).map(
    (descriptor) =>
      ({ ...descriptor, id: base64UrlToBuffer(descriptor.id) }) as PublicKeyCredentialDescriptor,
  )
}

function asOptions(options: unknown): Record<string, unknown> {
  if (typeof options !== 'object' || options === null) {
    throw ceremonyError('The passkey options are not an object', 'DataError')
  }
  return options as Record<string, unknown>
}

export async function createPasskeyCredential(publicKey: unknown): Promise<unknown> {
  if (!passkeysSupported()) {
    throw ceremonyError('WebAuthn is not available in this browser', 'NotSupportedError')
  }
  const options = asOptions(publicKey)
  const user = options['user'] as { id: string } | null | undefined
  if (typeof options['challenge'] !== 'string' || typeof user?.id !== 'string') {
    throw ceremonyError('The passkey options are incomplete', 'DataError')
  }
  const decoded = {
    ...options,
    challenge: base64UrlToBuffer(options['challenge']),
    user: { ...user, id: base64UrlToBuffer(user.id) },
    excludeCredentials: decodeDescriptors(options['excludeCredentials']),
  } as unknown as PublicKeyCredentialCreationOptions

  const credential = (await navigator.credentials.create({
    publicKey: decoded,
  })) as PublicKeyCredential | null
  if (!credential) {
    throw ceremonyError('No credential was created', 'NotAllowedError')
  }
  const response = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64Url(response.attestationObject),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
    },
  }
}

export async function getPasskeyAssertion(publicKey: unknown): Promise<unknown> {
  if (!passkeysSupported()) {
    throw ceremonyError('WebAuthn is not available in this browser', 'NotSupportedError')
  }
  const options = asOptions(publicKey)
  if (typeof options['challenge'] !== 'string') {
    throw ceremonyError('The passkey options are incomplete', 'DataError')
  }
  const decoded = {
    ...options,
    challenge: base64UrlToBuffer(options['challenge']),
    allowCredentials: decodeDescriptors(options['allowCredentials']),
  } as unknown as PublicKeyCredentialRequestOptions

  const credential = (await navigator.credentials.get({
    publicKey: decoded,
  })) as PublicKeyCredential | null
  if (!credential) {
    throw ceremonyError('No credential was returned', 'NotAllowedError')
  }
  const response = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : null,
    },
  }
}
