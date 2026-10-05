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

describe('formatDuration days option', () => {
  const HOUR = 3600_000
  const DAY = 24 * HOUR

  it('is off by default: long durations stay in hours, exactly as before', () => {
    expect(formatDuration(25 * HOUR, 'en-US')).toBe('25 h')
    expect(formatDuration(2 * DAY + 3 * HOUR + 30 * 60_000, 'en-US')).toBe('51 h 30 min')
    expect(formatDuration(25 * HOUR, 'en-US', {})).toBe('25 h')
    expect(formatDuration(25 * HOUR, 'en-US', { days: false })).toBe('25 h')
  })

  it.each([
    [25 * HOUR, '1 d 1 h', '1 j 1 h'],
    [DAY, '1 d', '1 j'],
    [2 * DAY + 3 * HOUR, '2 d 3 h', '2 j 3 h'],
    [2 * DAY + 3 * HOUR + 30 * 60_000, '2 d 3 h', '2 j 3 h'],
    [2 * DAY + 30 * 60_000, '2 d', '2 j'],
    [400 * DAY, '400 d', '400 j'],
  ])('days: true breaks %d ms into %s (en) and %s (fr)', (ms, en, fr) => {
    expect(formatDuration(ms, 'en-US', { days: true })).toBe(en)
    expect(formatDuration(ms, 'fr-FR', { days: true })).toBe(fr)
  })

  it('leaves durations under a day unchanged', () => {
    for (const ms of [0, 950, 90_000, 5_430_000, 23 * HOUR + 59 * 60_000]) {
      expect(formatDuration(ms, 'fr-FR', { days: true })).toBe(formatDuration(ms, 'fr-FR'))
    }
  })

  it('formats the day count with the locale', () => {
    expect(formatDuration(2000 * DAY, 'en-US', { days: true })).toBe('2,000 d')
  })
})
