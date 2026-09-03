export interface Point {
  x: number
  y: number
}

const round = (n: number): number => Number(n.toFixed(2))

export function linePath(points: Point[]): string {
  if (points.length === 0) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)},${round(point.y)}`)
    .join('')
}

export function areaPath(points: Point[], baseline: number): string {
  if (points.length === 0) return ''
  const last = points[points.length - 1]
  const first = points[0]
  return `${linePath(points)}L${round(last.x)},${round(baseline)}L${round(first.x)},${round(baseline)}Z`
}
