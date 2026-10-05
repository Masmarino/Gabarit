import { graphEdges, linkPath } from './job-graph-layout'
import type { JobGraphStage } from './job-graph.types'

const job = (name: string, needs: string[] = []) => ({
  id: name,
  name,
  status: 'success' as const,
  needs,
})

describe('graphEdges', () => {
  it('returns one edge per needed job, from the needed job to the dependent one', () => {
    const stages: JobGraphStage[] = [
      { name: 'prepare', jobs: [job('hello')] },
      { name: 'check', jobs: [job('a', ['hello']), job('b', ['hello'])] },
      { name: 'report', jobs: [job('summary', ['a', 'b'])] },
    ]
    expect(graphEdges(stages)).toEqual([
      { from: 'hello', to: 'a' },
      { from: 'hello', to: 'b' },
      { from: 'a', to: 'summary' },
      { from: 'b', to: 'summary' },
    ])
  })

  it('ignores a need that names no job in the graph', () => {
    const stages: JobGraphStage[] = [{ name: 's', jobs: [job('a', ['ghost'])] }]
    expect(graphEdges(stages)).toEqual([])
  })

  it('returns nothing for an empty graph', () => {
    expect(graphEdges([])).toEqual([])
  })
})

describe('linkPath', () => {
  it('draws a cubic curve from the right edge of the source to the left edge of the target', () => {
    const from = { left: 0, top: 0, width: 100, height: 40 }
    const to = { left: 200, top: 60, width: 100, height: 40 }
    expect(linkPath(from, to)).toBe('M 100 20 C 150 20, 150 80, 200 80')
  })

  it('keeps a minimum horizontal control offset when nodes are close', () => {
    const from = { left: 0, top: 0, width: 100, height: 40 }
    const to = { left: 110, top: 0, width: 100, height: 40 }
    expect(linkPath(from, to)).toBe('M 100 20 C 124 20, 86 20, 110 20')
  })
})
