import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { Icon } from '../../atoms/icon/icon'
import { graphEdges, linkPath } from './job-graph-layout'
import type { JobGraphStage, JobGraphStatus } from './job-graph.types'

export type { JobGraphJob, JobGraphStage, JobGraphStatus } from './job-graph.types'

interface GraphLink {
  key: string
  d: string
  done: boolean
}

const DEFAULT_STATUS_LABELS: Record<JobGraphStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  success: 'Succeeded',
  failed: 'Failed',
  canceled: 'Canceled',
}

@Component({
  selector: 'gbt-job-graph',
  standalone: true,
  imports: [Icon],
  templateUrl: './job-graph.html',
  styleUrl: './job-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobGraph {
  stages = input.required<JobGraphStage[]>()
  selectedJobId = input<string | null>(null)
  statusLabels = input<Record<JobGraphStatus, string>>(DEFAULT_STATUS_LABELS)
  needsLabel = input<string>('Needs')
  ariaLabel = input<string>('Pipeline jobs')
  jobSelected = output<string>()

  protected readonly links = signal<GraphLink[]>([])

  private readonly graph = viewChild<ElementRef<HTMLElement>>('graph')
  private readonly destroyRef = inject(DestroyRef)

  constructor() {
    afterRenderEffect(() => {
      this.stages()
      this.measure()
    })
    afterNextRender(() => {
      const root = this.graph()?.nativeElement
      if (!root || typeof ResizeObserver === 'undefined') {
        return
      }
      const observer = new ResizeObserver(() => this.measure())
      observer.observe(root)
      this.destroyRef.onDestroy(() => observer.disconnect())
    })
  }

  private measure(): void {
    const root = this.graph()?.nativeElement
    if (!root) {
      return
    }
    const origin = root.getBoundingClientRect()
    const boxes = new Map<string, { left: number; top: number; width: number; height: number }>()
    root.querySelectorAll<HTMLElement>('[data-job-name]').forEach((node) => {
      const rect = node.getBoundingClientRect()
      boxes.set(node.dataset['jobName'] ?? '', {
        left: rect.left - origin.left + root.scrollLeft,
        top: rect.top - origin.top + root.scrollTop,
        width: rect.width,
        height: rect.height,
      })
    })
    const statuses = new Map(
      this.stages().flatMap((s) => s.jobs.map((j) => [j.name, j.status] as const)),
    )
    this.links.set(
      graphEdges(this.stages()).flatMap((edge) => {
        const from = boxes.get(edge.from)
        const to = boxes.get(edge.to)
        return from && to
          ? [
              {
                key: `${edge.from}->${edge.to}`,
                d: linkPath(from, to),
                done: statuses.get(edge.from) === 'success',
              },
            ]
          : []
      }),
    )
  }
}
