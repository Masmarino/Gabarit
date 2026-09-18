import { getReadableTextColor } from './tag-contrast'

describe('getReadableTextColor', () => {
  it('returns white text for a dark background', () => {
    expect(getReadableTextColor('#1a1a2e')).toBe('#ffffff')
  })

  it('returns dark text for a light background', () => {
    expect(getReadableTextColor('#ffe680')).toBe('#000000')
  })

  it('returns white text for pure black', () => {
    expect(getReadableTextColor('#000000')).toBe('#ffffff')
  })

  it('returns dark text for pure white', () => {
    expect(getReadableTextColor('#ffffff')).toBe('#000000')
  })

  it('is case-insensitive on the hex input', () => {
    expect(getReadableTextColor('#1A1A2E')).toBe('#ffffff')
  })

  it('accepts a 6-digit hex without its leading #', () => {
    expect(getReadableTextColor('1a1a2e')).toBe('#ffffff')
  })

  it('clears 4.5:1 on a mid-grey background, where the former #1a1a1a endpoint did not', () => {
    // On #7c7c7c the dark endpoint is the one picked, and that is exactly
    // where the old #1a1a1a fell short: 4.17:1, below the 4.5:1 AA threshold
    // Tag's 12px bold text has to meet. #000000 reaches 5.03:1.
    expect(getReadableTextColor('#7c7c7c')).toBe('#000000')
    expect(contrastRatio('#7c7c7c', '#000000')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#7c7c7c', '#1a1a1a')).toBeLessThan(4.5)
  })

  it('reaches at least 4.5:1 against every background, including the global worst cases', () => {
    // #cf0dcc is the worst background over all 16 777 216 sRGB colors
    // (4.58:1); #757575 is the worst achromatic one (4.61:1, white text);
    // the rest are backgrounds the old #1a1a1a endpoint failed on.
    for (const background of ['#cf0dcc', '#757575', '#7c7c7c', '#808080', '#da25c3', '#946f9b']) {
      expect(contrastRatio(background, getReadableTextColor(background))).toBeGreaterThanOrEqual(4.5)
    }
  })

  describe('malformed input', () => {
    // Throwing rather than guessing: a malformed value used to produce NaN
    // ratios, and `NaN >= NaN` being false returned dark text for *any*
    // unparseable input — '#000' silently got dark text on black.
    it('throws on a 3-digit shorthand hex', () => {
      expect(() => getReadableTextColor('#000')).toThrowError(/6-digit hex/)
    })

    it('throws on a CSS named color', () => {
      expect(() => getReadableTextColor('red')).toThrowError(/6-digit hex/)
    })

    it('throws on an 8-digit hex with an alpha channel', () => {
      expect(() => getReadableTextColor('#dc2626ff')).toThrowError(/6-digit hex/)
    })

    it('throws on a non-hex string of the right length', () => {
      expect(() => getReadableTextColor('#gggggg')).toThrowError(/6-digit hex/)
    })

    it('throws on an rgb() functional notation', () => {
      expect(() => getReadableTextColor('rgb(220, 38, 38)')).toThrowError(/6-digit hex/)
    })

    it('throws on an empty string', () => {
      expect(() => getReadableTextColor('')).toThrowError(/6-digit hex/)
    })
  })
})

/** Local re-implementation, so the assertions above measure the real ratio. */
function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const normalized = hex.replace('#', '')
    const channel = (offset: number): number => {
      const c = parseInt(normalized.substring(offset, offset + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  }
  const lA = luminance(hexA)
  const lB = luminance(hexB)
  return (Math.max(lA, lB) + 0.05) / (Math.min(lA, lB) + 0.05)
}
