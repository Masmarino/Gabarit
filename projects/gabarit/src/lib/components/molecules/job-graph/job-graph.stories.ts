import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { JobGraph } from './job-graph'
import type { JobGraphStage } from './job-graph.types'

const meta: Meta<JobGraph> = {
  title: 'Molecules/JobGraph',
  component: JobGraph,
}

export default meta
type Story = StoryObj<JobGraph>

const RUNNING: JobGraphStage[] = [
  { name: 'prepare', jobs: [{ id: 'j1', name: 'hello', status: 'success', durationLabel: '3s', needs: [] }] },
  {
    name: 'check',
    jobs: [
      { id: 'j2', name: 'app-health', status: 'success', durationLabel: '2s', needs: ['hello'] },
      { id: 'j3', name: 'parallel-a', status: 'running', durationLabel: '5s', needs: ['hello'] },
      { id: 'j4', name: 'parallel-b', status: 'running', durationLabel: '5s', needs: ['hello'] },
    ],
  },
  {
    name: 'report',
    jobs: [{ id: 'j5', name: 'summary', status: 'pending', needs: ['app-health', 'parallel-a', 'parallel-b'] }],
  },
]

export const Running: Story = { args: { stages: RUNNING } }

export const WithSelection: Story = { args: { stages: RUNNING, selectedJobId: 'j3' } }

export const Failed: Story = {
  args: {
    stages: RUNNING.map((stage) => ({
      ...stage,
      jobs: stage.jobs.map((job) =>
        job.id === 'j3'
          ? { ...job, status: 'failed' as const }
          : job.status === 'running'
            ? { ...job, status: 'canceled' as const }
            : job,
      ),
    })),
  },
}

export const Dark: Story = { args: { stages: RUNNING }, decorators: [darkTheme] }
