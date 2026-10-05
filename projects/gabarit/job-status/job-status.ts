import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

export type JobStatusValue = 'pending' | 'running' | 'success' | 'failed' | 'canceled'

@Component({
  selector: 'gbt-job-status',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './job-status.html',
  styleUrl: './job-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-status]': 'status()',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class JobStatus {
  status = input.required<JobStatusValue>()
  label = input<string | null>(null)
}
