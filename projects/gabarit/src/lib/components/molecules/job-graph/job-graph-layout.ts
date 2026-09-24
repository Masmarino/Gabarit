import type { JobGraphStage } from './job-graph.types'

export interface GraphEdge {
  from: string
  to: string
}

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export function graphEdges(stages: JobGraphStage[]): GraphEdge[] {
  const names = new Set(stages.flatMap((stage) => stage.jobs.map((job) => job.name)))
  return stages.flatMap((stage) =>
    stage.jobs.flatMap((job) =>
      job.needs.filter((need) => names.has(need)).map((need) => ({ from: need, to: job.name })),
    ),
  )
}

const round = (value: number): number => Math.round(value * 10) / 10

export function linkPath(from: Box, to: Box): string {
  const x1 = from.left + from.width
  const y1 = from.top + from.height / 2
  const x2 = to.left
  const y2 = to.top + to.height / 2
  const dx = Math.max(24, (x2 - x1) / 2)
  return `M ${round(x1)} ${round(y1)} C ${round(x1 + dx)} ${round(y1)}, ${round(x2 - dx)} ${round(y2)}, ${round(x2)} ${round(y2)}`
}
