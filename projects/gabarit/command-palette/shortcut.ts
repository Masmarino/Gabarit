/**
 * Keyboard shortcuts as `'mod+k'` or `'/'`. `mod` is ⌘ on Apple systems and Ctrl elsewhere, which is what people
 * expect from a palette: ⌘K on a Mac, Ctrl+K on Windows and Linux.
 */
export interface ParsedShortcut {
  mod: boolean
  shift: boolean
  alt: boolean
  key: string
}

export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts.pop() ?? ''
  return {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key,
  }
}

/** Whether this runs on macOS or iOS, where `mod` is ⌘. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    ''
  return /mac|iphone|ipad|ipod/i.test(platform || navigator.userAgent)
}

/** Whether the key typed is part of someone's typing, where a plain-key shortcut like `/` must not fire. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string,
  apple = isApplePlatform(),
): boolean {
  const parsed = parseShortcut(shortcut)
  const mod = apple ? event.metaKey : event.ctrlKey
  const otherMod = apple ? event.ctrlKey : event.metaKey
  if (parsed.mod !== mod || otherMod) return false
  if (parsed.alt !== event.altKey) return false
  // Shift is part of some keys (`?` is Shift+/ on many layouts): only checked when the shortcut names it.
  if (parsed.shift && !event.shiftKey) return false
  if (!parsed.mod && !parsed.alt && isTyping(event.target)) return false
  return event.key.toLowerCase() === parsed.key
}

/** How to write the shortcut for people: `⌘K` on Apple systems, `Ctrl K` elsewhere. */
export function shortcutLabel(shortcut: string, apple = isApplePlatform()): string {
  const parsed = parseShortcut(shortcut)
  const key = parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key
  if (apple) {
    return `${parsed.mod ? '⌘' : ''}${parsed.alt ? '⌥' : ''}${parsed.shift ? '⇧' : ''}${key}`
  }
  return [parsed.mod ? 'Ctrl' : null, parsed.alt ? 'Alt' : null, parsed.shift ? 'Shift' : null, key]
    .filter(Boolean)
    .join(' ')
}

/** The `aria-keyshortcuts` value: `Meta+K` on Apple systems, `Control+K` elsewhere. */
export function ariaKeyshortcuts(shortcut: string, apple = isApplePlatform()): string {
  const parsed = parseShortcut(shortcut)
  const key = parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key
  return [
    parsed.mod ? (apple ? 'Meta' : 'Control') : null,
    parsed.alt ? 'Alt' : null,
    parsed.shift ? 'Shift' : null,
    key,
  ]
    .filter(Boolean)
    .join('+')
}
