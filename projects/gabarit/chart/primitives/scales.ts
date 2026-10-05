export interface Scale<T> {
  map(value: T): number
  invert(pixel: number): T
  readonly domain: [T, T]
  readonly range: [number, number]
}

export function linearScale(domain: [number, number], range: [number, number]): Scale<number> {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0

  const ratio = span === 0 ? 0 : (r1 - r0) / span
  return {
    domain,
    range,
    map: (value) => r0 + (value - d0) * ratio,
    invert: (pixel) => (ratio === 0 ? d0 : d0 + (pixel - r0) / ratio),
  }
}

export function timeScale(domain: [Date, Date], range: [number, number]): Scale<Date> {
  const numeric = linearScale([domain[0].getTime(), domain[1].getTime()], range)
  return {
    domain,
    range,
    map: (value) => numeric.map(value.getTime()),
    invert: (pixel) => new Date(numeric.invert(pixel)),
  }
}

export interface BandScale {
  map(value: string): number
  invert(pixel: number): string | null
  readonly bandwidth: number
  readonly domain: string[]
  readonly range: [number, number]
}

export function bandScale(domain: string[], range: [number, number], padding = 0): BandScale {
  const [r0, r1] = range
  const step = domain.length === 0 ? 0 : (r1 - r0) / domain.length

  const gutter = Math.min(Math.max(padding, 0), 1)
  const bandwidth = step * (1 - gutter)
  return {
    domain,
    range,
    bandwidth,
    map: (value) => {
      const index = domain.indexOf(value)

      return index === -1 ? Number.NaN : r0 + index * step
    },
    invert: (pixel) => {
      if (step === 0) return null
      const index = Math.floor((pixel - r0) / step)
      return index >= 0 && index < domain.length ? domain[index] : null
    },
  }
}
