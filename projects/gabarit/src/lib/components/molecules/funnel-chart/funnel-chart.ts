import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'
import { ChartEmpty } from '../../organisms/chart-empty/chart-empty'
import { ChartTable } from '../../organisms/chart-table/chart-table'
import { formatNumber, formatPercent } from '../../../primitives'

export interface FunnelStep {
  label: string
  value: number
}

interface RenderedStep {
  label: string
  formattedValue: string

  part: number

  conversionFromPrevious: string
}

@Component({
  selector: 'gbt-funnel-chart',
  standalone: true,
  imports: [ChartTable, ChartEmpty],
  templateUrl: './funnel-chart.html',
  styleUrl: './funnel-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FunnelChart {
  steps = input.required<FunnelStep[]>()
  label = input.required<string>()
  locale = input.required<string>()
  emptyMessage = input.required<string>()
  tableCaption = input.required<string>()
  stepColumn = input.required<string>()
  valueColumn = input.required<string>()
  conversionColumn = input.required<string>()
  stepAnnouncement = input.required<(label: string, conversion: string) => string>()

  private readonly reference = computed(() => this.steps()[0]?.value ?? 0)

  protected readonly activeIndex = signal<number | null>(null)

  protected onMouseLeave(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement
    if (target.ownerDocument.activeElement === target) return
    this.activeIndex.set(null)
  }

  protected readonly renderedSteps = computed<RenderedStep[]>(() => {
    const reference = this.reference()
    const steps = this.steps()
    return steps.map((step, index) => {
      const previousValue = index === 0 ? step.value : steps[index - 1].value
      return {
        label: step.label,
        formattedValue: formatNumber(step.value, this.locale()),

        part: reference <= 0 ? 0 : (step.value / reference) * 100,
        conversionFromPrevious: formatPercent(
          previousValue <= 0 ? 0 : step.value / previousValue,
          this.locale(),
        ),
      }
    })
  })

  protected readonly activeStep = computed<RenderedStep | null>(() => {
    const index = this.activeIndex()
    if (index === null) return null
    return this.renderedSteps()[index] ?? null
  })

  protected readonly columns = computed(() => [
    this.stepColumn(),
    this.valueColumn(),
    this.conversionColumn(),
  ])

  protected readonly tableRows = computed<(string | number)[][]>(() => {
    const reference = this.reference()
    return this.steps().map((step) => [
      step.label,
      formatNumber(step.value, this.locale()),
      formatPercent(reference <= 0 ? 0 : step.value / reference, this.locale()),
    ])
  })
}
