import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { JobStatus } from './job-status'

const meta: Meta<JobStatus> = {
  title: 'Atoms/JobStatus',
  component: JobStatus,
  argTypes: {
    status: {
      control: 'select',
      options: ['pending', 'running', 'success', 'failed', 'canceled'],
    },
  },
  args: { status: 'success', label: null },
}

export default meta
type Story = StoryObj<JobStatus>

const NAMES: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  success: 'Succeeded',
  failed: 'Failed',
  canceled: 'Canceled',
}
const STATUSES = Object.keys(NAMES)

export const Default: Story = {}

/** Every status: the shape tells it (check, alert, cross, spinning ring, still ring), never colour alone. */
export const AllStatuses: Story = {
  render: () => ({
    props: { statuses: STATUSES, names: NAMES },
    template: `
      <ul style="display:flex;flex-direction:column;gap:0.75rem;margin:0;padding:1rem;list-style:none;color:var(--text-primary);font-size:1rem">
        @for (status of statuses; track status) {
          <li style="display:flex;align-items:center;gap:0.5rem"><gbt-job-status [status]="status" /> {{ names[status] }}</li>
        }
      </ul>`,
  }),
}

/** Alone, the glyph is decorative: `label` adds the status in hidden text for screen readers. */
export const WithLabel: Story = {
  args: { status: 'failed', label: 'Failed' },
  render: (args) => ({
    props: args,
    template: `<div style="padding:1rem;font-size:1rem"><gbt-job-status [status]="status" [label]="label" /></div>`,
  }),
}

/** In a pipeline sidebar: a job per line, the status before its name. */
export const InAJobList: Story = {
  render: () => ({
    template: `
      <ul style="display:flex;flex-direction:column;gap:0.25rem;width:16rem;margin:0;padding:0.5rem;list-style:none;border:1px solid var(--gbt-card-border);border-radius:var(--site-border-radius-sm);background:var(--bg-principal);color:var(--text-primary);font-size:0.875rem">
        <li style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem"><gbt-job-status status="success" label="Succeeded" /> build</li>
        <li style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem"><gbt-job-status status="failed" label="Failed" /> unit-tests</li>
        <li style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem"><gbt-job-status status="running" label="Running" /> integration</li>
        <li style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem"><gbt-job-status status="pending" label="Pending" /> deploy</li>
        <li style="display:flex;align-items:center;gap:0.5rem;padding:0.375rem 0.5rem"><gbt-job-status status="canceled" label="Canceled" /> notify</li>
      </ul>`,
  }),
}

export const Dark: Story = { decorators: [darkTheme], render: AllStatuses.render }
