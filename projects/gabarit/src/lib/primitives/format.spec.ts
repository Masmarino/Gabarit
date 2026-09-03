import { formatCompact, formatDuration, formatNumber, formatPercent } from './format'

describe('formatNumber', () => {
  it('separates thousands per the locale', () => {
    expect(formatNumber(1234567, 'fr-FR')).toMatch(/1\s?234\s?567/)
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
  })

  it('respects the requested number of decimal places', () => {
    expect(formatNumber(3.14159, 'en-US', 2)).toBe('3.14')
  })
})

describe('formatCompact', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1K'],
    [1200, '1.2K'],
    [3400000, '3.4M'],
    [1500000000, '1.5B'],
  ])('formatCompact(%d) donne %s en en-US', (value, expected) => {
    expect(formatCompact(value, 'en-US')).toBe(expected)
  })

  it('stays readable for negative values', () => {
    expect(formatCompact(-1200, 'en-US')).toBe('-1.2K')
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0 ms'],
    [950, '950 ms'],
    [1000, '1 s'],
    [90000, '1 min 30 s'],
    [3600000, '1 h'],
    [5430000, '1 h 30 min'],
  ])('formatDuration(%d) gives %s', (ms, expected) => {
    expect(formatDuration(ms, 'fr-FR')).toBe(expected)
  })

  it.each([
    [3630000, '1 h'],
    [7205000, '2 h'],
    [60000, '1 min'],
  ])(
    'formatDuration(%d) omits a zero trailing unit rather than skipping a rank',
    (ms, expected) => {
      expect(formatDuration(ms, 'fr-FR')).toBe(expected)
    },
  )

  it('applies the locale to every number, not just milliseconds', () => {
    expect(formatDuration(36000000000, 'en-US')).toBe('10,000 h')
    expect(formatDuration(36000000000, 'fr-FR')).toMatch(/^10\s?000 h$/)
  })
})

describe('formatPercent', () => {
  it('formats a ratio, not an already-multiplied percentage', () => {
    expect(formatPercent(0.1234, 'en-US', 1)).toBe('12.3%')
    expect(formatPercent(1, 'en-US', 0)).toBe('100%')
  })
})
