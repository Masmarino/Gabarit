import type { JobStatusValue } from '@masmarino/gabarit/job-status'

export type JobGraphStatus = JobStatusValue

export interface JobGraphJob {
  id: string
  name: string
  status: JobGraphStatus
  durationLabel?: string
  needs: string[]
}

export interface JobGraphStage {
  name: string
  jobs: JobGraphJob[]
}
