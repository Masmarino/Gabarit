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

export interface Arc {
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
}

function arcPoint(radius: number, angle: number): Point {
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) }
}

function point(p: Point): string {
  return `${round(p.x)},${round(p.y)}`
}

const FULL_CIRCLE = Math.PI * 2

export function arcPath(arc: Arc): string {
  const { startAngle, endAngle, innerRadius, outerRadius } = arc
  const span = endAngle - startAngle
  if (span <= 0) return ''
  if (span >= FULL_CIRCLE - 1e-9) {
    const mid = startAngle + Math.PI
    return (
      arcPath({ startAngle, endAngle: mid, innerRadius, outerRadius }) +
      arcPath({ startAngle: mid, endAngle: startAngle + FULL_CIRCLE, innerRadius, outerRadius })
    )
  }

  const largeArc = span > Math.PI ? 1 : 0
  const outerStart = arcPoint(outerRadius, startAngle)
  const outerEnd = arcPoint(outerRadius, endAngle)
  const outerArc = `A${round(outerRadius)},${round(outerRadius)} 0 ${largeArc},1 ${point(outerEnd)}`

  if (innerRadius <= 0) {
    return `M0,0L${point(outerStart)}${outerArc}Z`
  }

  const innerStart = arcPoint(innerRadius, startAngle)
  const innerEnd = arcPoint(innerRadius, endAngle)
  const innerArc = `A${round(innerRadius)},${round(innerRadius)} 0 ${largeArc},0 ${point(innerStart)}`
  return `M${point(outerStart)}${outerArc}L${point(innerEnd)}${innerArc}Z`
}
