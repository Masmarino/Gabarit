export function formatNumber(value: number, locale: string, decimals?: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDuration(ms: number, locale: string): string {
  if (ms < 1000) return `${formatNumber(Math.round(ms), locale)} ms`

  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const num = (value: number) => formatNumber(value, locale)

  if (hours > 0) return minutes > 0 ? `${num(hours)} h ${num(minutes)} min` : `${num(hours)} h`
  if (minutes > 0)
    return seconds > 0 ? `${num(minutes)} min ${num(seconds)} s` : `${num(minutes)} min`
  return `${num(seconds)} s`
}

export function formatPercent(ratio: number, locale: string, decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio)
}
