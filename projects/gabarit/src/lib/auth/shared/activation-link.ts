export const ACTIVATION_TOKEN_SHAPE = /^[0-9a-f]{64}$/i

export function activationToken(
  fragment: string | null,
  query: string | null,
  shape: RegExp = ACTIVATION_TOKEN_SHAPE,
): string | null {
  const fromFragment = new URLSearchParams((fragment ?? '').replace(/^#/, '')).get('token')
  const raw = fromFragment ?? query
  return raw !== null && shape.test(raw) ? raw : null
}
