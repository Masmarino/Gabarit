import { formatDateTime, formatRelativeTime } from './format-time'

const NOW = Date.UTC(2026, 8, 26, 12, 0, 0)
const S = 1000
const M = 60 * S
const H = 60 * M
const D = 24 * H

const ago = (ms: number) => new Date(NOW - ms)
const ahead = (ms: number) => new Date(NOW + ms)

describe('formatRelativeTime', () => {
  it.each([
    [0, 'now', 'maintenant'],
    [5 * S, 'now', 'maintenant'],
    [9_999, 'now', 'maintenant'],
    [30 * S, '30 seconds ago', 'il y a 30 secondes'],
    [59 * S, '59 seconds ago', 'il y a 59 secondes'],
    [60 * S, '1 minute ago', 'il y a 1 minute'],
    [5 * M + 59 * S, '5 minutes ago', 'il y a 5 minutes'],
    [59 * M, '59 minutes ago', 'il y a 59 minutes'],
    [60 * M, '1 hour ago', 'il y a 1 heure'],
    [3 * H, '3 hours ago', 'il y a 3 heures'],
    [23 * H, '23 hours ago', 'il y a 23 heures'],
    [24 * H, 'yesterday', 'hier'],
    [47 * H, 'yesterday', 'hier'],
    [48 * H, '2 days ago', 'avant-hier'],
    [3 * D, '3 days ago', 'il y a 3 jours'],
    [6 * D, '6 days ago', 'il y a 6 jours'],
    [7 * D, 'last week', 'la semaine dernière'],
    [15 * D, '2 weeks ago', 'il y a 2 semaines'],
    [29 * D, '4 weeks ago', 'il y a 4 semaines'],
    [30 * D, 'last month', 'le mois dernier'],
    [90 * D, '3 months ago', 'il y a 3 mois'],
    [364 * D, '12 months ago', 'il y a 12 mois'],
    [365 * D, 'last year', 'l’année dernière'],
    [800 * D, '2 years ago', 'il y a 2 ans'],
  ])('a date %d ms in the past reads %s (en) and %s (fr)', (gap, en, fr) => {
    expect(formatRelativeTime(ago(gap), 'en', NOW)).toBe(en)
    expect(formatRelativeTime(ago(gap), 'fr', NOW)).toBe(fr)
  })

  it.each([
    [30 * S, 'in 30 seconds', 'dans 30 secondes'],
    [2 * H, 'in 2 hours', 'dans 2 heures'],
    [24 * H, 'tomorrow', 'demain'],
    [3 * D, 'in 3 days', 'dans 3 jours'],
    [400 * D, 'next year', 'l’année prochaine'],
  ])('a date %d ms ahead reads %s (en) and %s (fr)', (gap, en, fr) => {
    expect(formatRelativeTime(ahead(gap), 'en', NOW)).toBe(en)
    expect(formatRelativeTime(ahead(gap), 'fr', NOW)).toBe(fr)
  })

  it('reads a small future gap (clock skew) as now, not as a future', () => {
    expect(formatRelativeTime(ahead(3 * S), 'fr', NOW)).toBe('maintenant')
  })

  it('numeric: always writes a number even for the nearest days', () => {
    expect(formatRelativeTime(ago(26 * H), 'en', NOW, { numeric: 'always' })).toBe('1 day ago')
    expect(formatRelativeTime(ago(26 * H), 'fr', NOW, { numeric: 'always' })).toBe('il y a 1 jour')
    expect(formatRelativeTime(ago(S), 'en', NOW, { numeric: 'always' })).toBe('now')
  })

  it('style short abbreviates the unit', () => {
    const short = (gap: number, locale: string) =>
      formatRelativeTime(ago(gap), locale, NOW, { style: 'short' }).replace(/\s/g, ' ')
    expect(short(5 * M, 'en')).toBe('5 min. ago')
    expect(short(5 * M, 'fr')).toBe('il y a 5 min')
    expect(short(3 * H, 'fr')).toBe('il y a 3 h')
    expect(short(3 * D, 'fr')).toBe('il y a 3 j')
  })

  it('maxUnit caps the largest unit so weeks and months can be avoided', () => {
    const fr = (gap: number, maxUnit: 'hour' | 'day' | 'week' | 'month') =>
      formatRelativeTime(ago(gap), 'fr', NOW, { maxUnit })
    expect(fr(12 * D, 'day')).toBe('il y a 12 jours')
    expect(fr(45 * D, 'day')).toBe('il y a 45 jours')
    expect(fr(800 * D, 'day')).toBe('il y a 800 jours')
    expect(fr(3 * D, 'day')).toBe('il y a 3 jours')
    expect(fr(26 * H, 'day')).toBe('hier')
    expect(fr(50 * H, 'hour')).toBe('il y a 50 heures')
    expect(fr(15 * D, 'week')).toBe('il y a 2 semaines')
    expect(fr(90 * D, 'week')).toBe('il y a 12 semaines')
    expect(fr(400 * D, 'month')).toBe('il y a 13 mois')
    expect(formatRelativeTime(ahead(12 * D), 'en', NOW, { maxUnit: 'day' })).toBe('in 12 days')
  })

  it('maxUnit leaves smaller gaps alone', () => {
    expect(formatRelativeTime(ago(5 * M), 'en', NOW, { maxUnit: 'day' })).toBe('5 minutes ago')
    expect(formatRelativeTime(ago(3 * H), 'en', NOW, { maxUnit: 'day' })).toBe('3 hours ago')
  })

  it('absoluteAfterDays switches to the numeric date from that gap on', () => {
    const options = { absoluteAfterDays: 30, timeZone: 'UTC' }
    expect(formatRelativeTime(ago(29 * D), 'fr', NOW, options)).toBe('il y a 4 semaines')
    expect(formatRelativeTime(ago(31 * D), 'fr', NOW, options)).toBe('26/08/2026')
    expect(formatRelativeTime(ago(31 * D), 'en', NOW, options)).toBe('08/26/2026')
    expect(formatRelativeTime(ahead(31 * D), 'fr', NOW, options)).toBe('27/10/2026')
  })

  it('accepts a Date, an ISO string or epoch milliseconds, for the date and for now', () => {
    const iso = '2026-09-26T11:55:00Z'
    expect(formatRelativeTime(iso, 'en', NOW)).toBe('5 minutes ago')
    expect(formatRelativeTime(Date.parse(iso), 'en', NOW)).toBe('5 minutes ago')
    expect(formatRelativeTime(new Date(iso), 'en', new Date(NOW))).toBe('5 minutes ago')
    expect(formatRelativeTime(iso, 'en', '2026-09-26T12:00:00Z')).toBe('5 minutes ago')
  })

  it('returns an empty string for a missing date and a dash for one that does not parse', () => {
    expect(formatRelativeTime(null, 'en', NOW)).toBe('')
    expect(formatRelativeTime(undefined, 'en', NOW)).toBe('')
    expect(formatRelativeTime('not a date', 'en', NOW)).toBe('—')
    expect(formatRelativeTime(new Date(NaN), 'fr', NOW)).toBe('—')
    expect(formatRelativeTime(NOW, 'en', 'nope')).toBe('—')
  })

  describe('without an explicit now', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW)
    })
    afterEach(() => vi.useRealTimers())

    it('measures from the current time', () => {
      expect(formatRelativeTime(ago(5 * M), 'en')).toBe('5 minutes ago')
      vi.setSystemTime(NOW + 10 * M)
      expect(formatRelativeTime(ago(5 * M), 'en')).toBe('15 minutes ago')
    })
  })
})

describe('formatDateTime', () => {
  const date = new Date(Date.UTC(2026, 8, 26, 14, 5))

  it('prints the medium date and the short time by default', () => {
    expect(formatDateTime(date, 'fr', { timeZone: 'UTC' })).toBe('26 sept. 2026, 14:05')
    // Recent ICU puts a narrow no-break space before PM; \s covers both spellings.
    expect(formatDateTime(date, 'en', { timeZone: 'UTC' })).toMatch(/^Sep 26, 2026, 2:05\sPM$/)
  })

  it('options that select fields replace the defaults', () => {
    const numeric: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }
    expect(formatDateTime(date, 'fr', numeric)).toBe('26/09/2026 14:05')
    expect(formatDateTime(date, 'fr', { dateStyle: 'long', timeZone: 'UTC' })).toBe(
      '26 septembre 2026',
    )
    expect(formatDateTime(date, 'en', { timeStyle: 'short', hour12: false, timeZone: 'UTC' })).toBe(
      '14:05',
    )
  })

  it('options that select no field (a time zone) apply on top of the defaults', () => {
    expect(formatDateTime(date, 'fr', { timeZone: 'Asia/Tokyo' })).toBe('26 sept. 2026, 23:05')
  })

  it('accepts an ISO string and epoch milliseconds', () => {
    expect(formatDateTime('2026-09-26T14:05:00Z', 'fr', { timeZone: 'UTC' })).toBe(
      '26 sept. 2026, 14:05',
    )
    expect(formatDateTime(date.getTime(), 'fr', { timeZone: 'UTC' })).toBe('26 sept. 2026, 14:05')
  })

  it('returns an empty string for a missing date and a dash for one that does not parse', () => {
    expect(formatDateTime(null, 'en')).toBe('')
    expect(formatDateTime(undefined, 'en')).toBe('')
    expect(formatDateTime('nope', 'en')).toBe('—')
    expect(formatDateTime(new Date(NaN), 'fr')).toBe('—')
  })
})
