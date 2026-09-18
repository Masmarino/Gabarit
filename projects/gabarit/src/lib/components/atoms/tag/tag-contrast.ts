/** A 6-digit hex color, with or without its leading `#`. */
const HEX_6 = /^#?[0-9a-fA-F]{6}$/

function normalizeHex(hex: string): string {
  if (!HEX_6.test(hex)) {
    throw new Error(
      `getReadableTextColor: expected a 6-digit hex color such as "#dc2626" or "dc2626", got ${JSON.stringify(hex)}. ` +
        'Shorthand hex (#abc), CSS named colors, rgb()/hsl() and custom properties are not supported.',
    )
  }
  return hex.replace('#', '')
}

function linearizeChannel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(normalizedHex: string): number {
  const r = parseInt(normalizedHex.substring(0, 2), 16)
  const g = parseInt(normalizedHex.substring(2, 4), 16)
  const b = parseInt(normalizedHex.substring(4, 6), 16)
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b)
}

function contrastRatio(normalizedA: string, normalizedB: string): number {
  const lA = relativeLuminance(normalizedA)
  const lB = relativeLuminance(normalizedB)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Returns `'#ffffff'` or `'#000000'`, whichever reaches a higher WCAG contrast
 * ratio against `backgroundHex`. Used by `Tag` to keep its text readable on
 * an arbitrary caller-supplied background color that isn't one of the
 * design system's own semantic tokens.
 *
 * These two endpoints are not interchangeable with a "softer" dark such as
 * `#1a1a1a`: sweeping all 16 777 216 sRGB backgrounds, the worst achievable
 * ratio is **4.58:1** with `#000000` (at `#cf0dcc`) but only **4.17:1** with
 * `#1a1a1a` (at `#da25c3`) — below the 4.5:1 AA threshold that `Tag`'s
 * 12px bold text must meet, since it is not "large text".
 *
 * @param backgroundHex a 6-digit hex color, with or without its leading `#`.
 * @throws if `backgroundHex` is not a well-formed 6-digit hex color. Silently
 * guessing would be worse: a malformed value used to produce `NaN` ratios,
 * and `NaN >= NaN` being `false` returned dark text for *any* unparseable
 * input — so `'#000'` got dark text on a black background.
 */
export function getReadableTextColor(backgroundHex: string): string {
  const background = normalizeHex(backgroundHex)
  const white = 'ffffff'
  const dark = '000000'
  return contrastRatio(background, white) >= contrastRatio(background, dark) ? '#ffffff' : '#000000'
}
