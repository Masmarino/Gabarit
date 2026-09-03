import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

@Component({
  selector: 'gbt-gauge-bar',
  standalone: true,
  imports: [],
  templateUrl: './gauge-bar.html',
  styleUrl: './gauge-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeBar {
  value = input.required<number>()
  max = input.required<number>()
  label = input.required<string>()
  formattedValue = input.required<string>()
  warningLabel = input.required<string>()
  criticalLabel = input.required<string>()
  thresholds = input<{ warning: number; critical: number }>({ warning: 70, critical: 90 })

  protected readonly percentage = computed(() => {
    const max = this.max()

    if (max <= 0) return 0
    return Math.max(0, Math.min(100, (this.value() / max) * 100))
  })

  protected readonly severity = computed<'warning' | 'critical' | null>(() => {
    const percentage = this.percentage()
    const { warning, critical } = this.thresholds()
    if (percentage >= critical) return 'critical'
    if (percentage >= warning) return 'warning'
    return null
  })

  protected readonly severityLabel = computed(() => {
    const severity = this.severity()
    if (severity === 'critical') return this.criticalLabel()
    if (severity === 'warning') return this.warningLabel()
    return null
  })
}
