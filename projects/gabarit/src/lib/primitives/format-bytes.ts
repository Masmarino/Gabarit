import { cachedIntl } from './intl-cache'
import { NO_VALUE } from './no-value'

export interface FormatBytesOptions {
  base?: 1000 | 1024
  decimals?: number
  binaryUnits?: 'iec' | 'legacy'
}

const NBSP = '\u00a0'

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'] as const

function siLabels(locale: string): string[] {
  return cachedIntl('bytes-labels', locale, undefined, () =>
    UNITS.map((unit) => {
      const parts = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit,
        unitDisplay: 'narrow',
      }).formatToParts(1)
      return parts.find((part) => part.type === 'unit')?.value ?? unit
    }),
  )
}

const IEC_SYMBOLS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']

function label(locale: string, rank: number, options: FormatBytesOptions): string {
  const si = siLabels(locale)[rank]
  if (rank === 0 || options.base === 1000) return si
  const capital = si.charAt(0).toUpperCase()
  if (options.binaryUnits === 'legacy') return capital + si.slice(1)
  return /^\p{Script=Latin}/u.test(si) ? `${capital}i${si.slice(1)}` : IEC_SYMBOLS[rank]
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function formatBytes(
  bytes: number,
  locale: string,
  options: FormatBytesOptions = {},
): string {
  if (!Number.isFinite(bytes)) return NO_VALUE
  const base = options.base === 1000 ? 1000 : 1024
  const requested = Math.trunc(options.decimals ?? 1)
  const decimals = Number.isFinite(requested) ? Math.max(0, Math.min(20, requested)) : 1
  const last = UNITS.length - 1

  let value = Math.abs(bytes)
  let rank = 0
  while (value >= base && rank < last) {
    value /= base
    rank++
  }
  let shown = round(value, rank === 0 ? 0 : decimals)
  if (shown >= base && rank < last) {
    shown = round(shown / base, decimals)
    rank++
  }

  const signed = bytes < 0 && shown !== 0 ? -shown : shown
  const number = cachedIntl(
    'bytes-number',
    locale,
    { decimals: rank === 0 ? 0 : decimals },
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: rank === 0 ? 0 : decimals,
      }),
  ).format(signed)
  return `${number}${NBSP}${label(locale, rank, { ...options, base })}`
}
