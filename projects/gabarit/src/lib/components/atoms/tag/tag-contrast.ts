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

export function getReadableTextColor(backgroundHex: string): string {
  const background = normalizeHex(backgroundHex)
  const white = 'ffffff'
  const dark = '000000'
  return contrastRatio(background, white) >= contrastRatio(background, dark) ? '#ffffff' : '#000000'
}
