import type { CommandItem } from './command-palette'

/** Lower case, accents dropped: "Dépôts" is found by "depots". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * How well an item answers a query, or `null` when it does not: every word of the query must appear in its label,
 * description or keywords. A label that starts with the query ranks first, then one with a word that does.
 */
export function matchCommand(item: CommandItem<unknown>, query: string): number | null {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const label = normalize(item.label)
  const haystack = [
    label,
    normalize(item.description ?? ''),
    ...(item.keywords ?? []).map(normalize),
  ].join(' ')
  if (!words.every((word) => haystack.includes(word))) return null
  const whole = words.join(' ')
  if (label.startsWith(whole)) return 3
  if (label.split(/[\s/._-]+/).some((part) => part.startsWith(words[0]))) return 2
  return 1
}
