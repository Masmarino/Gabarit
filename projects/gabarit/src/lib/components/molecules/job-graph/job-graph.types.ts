export type JobGraphStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled'

export interface JobGraphJob {
  id: string
  name: string
  status: JobGraphStatus
  durationLabel?: string
  /** Names (not ids) of the jobs this job depends on; names are unique within a graph. */
  needs: string[]
}

export interface JobGraphStage {
  name: string
  jobs: JobGraphJob[]
}
