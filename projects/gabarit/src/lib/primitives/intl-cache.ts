const MAX_ENTRIES = 100
const cache = new Map<string, unknown>()

export function cachedIntl<T>(
  kind: string,
  locale: string,
  options: object | undefined,
  create: () => T,
): T {
  const key = `${kind}|${locale}|${options === undefined ? '' : JSON.stringify(options)}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit as T
  if (cache.size >= MAX_ENTRIES) cache.clear()
  const created = create()
  cache.set(key, created)
  return created
}
