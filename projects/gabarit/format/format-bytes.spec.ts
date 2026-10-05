import { formatBytes } from './format-bytes'

const NBSP = '\u00a0'

describe('formatBytes', () => {
  it.each([
    [0, `0${NBSP}B`, `0${NBSP}o`],
    [512, `512${NBSP}B`, `512${NBSP}o`],
    [1024, `1${NBSP}KiB`, `1${NBSP}Kio`],
    [1536, `1.5${NBSP}KiB`, `1,5${NBSP}Kio`],
    [13002343, `12.4${NBSP}MiB`, `12,4${NBSP}Mio`],
    [1024 ** 3 * 3.7, `3.7${NBSP}GiB`, `3,7${NBSP}Gio`],
    [1024 ** 4, `1${NBSP}TiB`, `1${NBSP}Tio`],
    [1024 ** 5, `1${NBSP}PiB`, `1${NBSP}Pio`],
  ])('formats %d bytes on base 1024 as %s (en) and %s (fr)', (bytes, en, fr) => {
    expect(formatBytes(bytes, 'en')).toBe(en)
    expect(formatBytes(bytes, 'fr')).toBe(fr)
  })

  it('groups thousands per the locale', () => {
    expect(formatBytes(1023, 'en')).toBe(`1,023${NBSP}B`)
    expect(formatBytes(1023, 'fr')).toMatch(/^1\s023\u00a0o$/)
  })

  it('separates the number from the unit with a no-break space', () => {
    expect(formatBytes(2048, 'en')).toContain(NBSP)
    expect(formatBytes(2048, 'en')).not.toContain(' ')
  })

  it('base 1000 counts in thousands and uses the SI labels of the locale', () => {
    expect(formatBytes(999, 'en', { base: 1000 })).toBe(`999${NBSP}B`)
    expect(formatBytes(1500, 'en', { base: 1000 })).toBe(`1.5${NBSP}kB`)
    expect(formatBytes(1500, 'fr', { base: 1000 })).toBe(`1,5${NBSP}ko`)
    expect(formatBytes(2_500_000, 'fr', { base: 1000 })).toBe(`2,5${NBSP}Mo`)
    expect(formatBytes(3e9, 'en', { base: 1000 })).toBe(`3${NBSP}GB`)
  })

  it('the same size reads differently on the two bases', () => {
    expect(formatBytes(1_000_000, 'en')).toBe(`976.6${NBSP}KiB`)
    expect(formatBytes(1_000_000, 'en', { base: 1000 })).toBe(`1${NBSP}MB`)
  })

  it('binaryUnits: legacy keeps the KB / Ko labels on base 1024 (what FerrisGit printed)', () => {
    expect(formatBytes(1536, 'en', { binaryUnits: 'legacy' })).toBe(`1.5${NBSP}KB`)
    expect(formatBytes(1536, 'fr', { binaryUnits: 'legacy' })).toBe(`1,5${NBSP}Ko`)
    expect(formatBytes(5 * 1024 ** 2, 'fr', { binaryUnits: 'legacy' })).toBe(`5${NBSP}Mo`)
    expect(formatBytes(1536, 'fr', { binaryUnits: 'legacy', base: 1000 })).toBe(`1,5${NBSP}ko`)
  })

  it('shows at most `decimals` digits (default 1) and drops a trailing zero', () => {
    expect(formatBytes(1024 * 1.25, 'en')).toBe(`1.3${NBSP}KiB`)
    expect(formatBytes(1024 * 1.25, 'en', { decimals: 2 })).toBe(`1.25${NBSP}KiB`)
    expect(formatBytes(1024 * 1.25, 'en', { decimals: 0 })).toBe(`1${NBSP}KiB`)
    expect(formatBytes(1024 * 2.04, 'en')).toBe(`2${NBSP}KiB`)
  })

  it('never shows a fraction of a byte', () => {
    expect(formatBytes(0.4, 'en')).toBe(`0${NBSP}B`)
    expect(formatBytes(999.6, 'en', { base: 1000 })).toBe(`1${NBSP}kB`)
  })

  it('rolls over to the next rank instead of showing 1024 KiB or 1000 kB', () => {
    expect(formatBytes(1024 * 1023.96, 'en')).toBe(`1${NBSP}MiB`)
    expect(formatBytes(999_999, 'en', { base: 1000 })).toBe(`1${NBSP}MB`)
  })

  it('stops at the peta rank', () => {
    expect(formatBytes(1024 ** 5 * 3000, 'en')).toBe(`3,000${NBSP}PiB`)
  })

  it('keeps the sign of a negative size (a delta)', () => {
    expect(formatBytes(-1536, 'en')).toBe(`-1.5${NBSP}KiB`)
    expect(formatBytes(-1536, 'fr')).toBe(`-1,5${NBSP}Kio`)
    expect(formatBytes(-512, 'en')).toBe(`-512${NBSP}B`)
  })

  it('never prints a negative zero', () => {
    expect(formatBytes(-0.2, 'en')).toBe(`0${NBSP}B`)
    expect(formatBytes(-0, 'en')).toBe(`0${NBSP}B`)
  })

  it.each([NaN, Infinity, -Infinity])('prints a dash for %s', (value) => {
    expect(formatBytes(value, 'en')).toBe('—')
    expect(formatBytes(value, 'fr')).toBe('—')
  })

  it('takes the byte and unit letters from the locale', () => {
    expect(formatBytes(1500, 'de', { base: 1000 })).toBe(`1,5${NBSP}kB`)
    expect(formatBytes(10, 'ru')).toBe(`10${NBSP}Б`)
  })

  describe('IEC labels stay in one script per token', () => {
    const SCRIPTS = ['Latin', 'Cyrillic', 'Arabic', 'Greek', 'Hebrew', 'Devanagari', 'Thai']
    const scriptsOf = (token: string) =>
      SCRIPTS.filter((script) => new RegExp(`\\p{Script=${script}}`, 'u').test(token))

    const LOCALES = ['ru', 'uk', 'ar', 'ja', 'zh', 'ko', 'he', 'hi', 'th', 'el', 'fr', 'en', 'de']
    const SIZES = [10, 1536, 5 * 1024 ** 2, 3 * 1024 ** 3, 2 * 1024 ** 5]
    const OPTIONS = [{}, { base: 1000 as const }, { binaryUnits: 'legacy' as const }]

    it.each(LOCALES)('%s: no output mixes the letters of two scripts in one word', (locale) => {
      for (const size of SIZES) {
        for (const options of OPTIONS) {
          const text = formatBytes(size, locale, options)
          const unit = text.split(NBSP).slice(1).join(NBSP)
          expect(
            scriptsOf(unit),
            `${locale} ${size} ${JSON.stringify(options)}: ${text}`,
          ).toSatisfy((found: string[]) => found.length <= 1)
        }
      }
    })

    it('falls back to the Latin IEC symbols where the locale spells its byte in another script', () => {
      expect(formatBytes(1536, 'ru')).toBe(`1,5${NBSP}KiB`)
      expect(formatBytes(5 * 1024 ** 2, 'uk')).toBe(`5${NBSP}MiB`)
      expect(formatBytes(3 * 1024 ** 3, 'ar', { decimals: 0 })).toMatch(/GiB$/)
      expect(formatBytes(2 * 1024 ** 5, 'ru')).toBe(`2${NBSP}PiB`)
    })

    it('keeps the own byte letter of the locale below the kilo and its SI labels on base 1000', () => {
      expect(formatBytes(10, 'ru')).toBe(`10${NBSP}Б`)
      expect(formatBytes(1500, 'ru', { base: 1000 })).toBe(`1,5${NBSP}кБ`)
      expect(formatBytes(2_500_000, 'uk', { base: 1000 })).toBe(`2,5${NBSP}МБ`)
    })

    it('legacy labels of a Cyrillic locale stay Cyrillic', () => {
      expect(formatBytes(1536, 'ru', { binaryUnits: 'legacy' })).toBe(`1,5${NBSP}КБ`)
    })

    it('derives the IEC label only from Latin labels', () => {
      expect(formatBytes(1536, 'ja')).toBe(`1.5${NBSP}KiB`)
      expect(formatBytes(1536, 'zh')).toBe(`1.5${NBSP}KiB`)
      expect(formatBytes(1536, 'de')).toBe(`1,5${NBSP}KiB`)
      expect(formatBytes(1536, 'fr')).toBe(`1,5${NBSP}Kio`)
    })
  })

  it('treats a NaN or infinite `decimals` as the default instead of throwing', () => {
    expect(formatBytes(1536, 'en', { decimals: NaN })).toBe(`1.5${NBSP}KiB`)
    expect(formatBytes(1536, 'en', { decimals: Infinity })).toBe(`1.5${NBSP}KiB`)
  })
})
