import { ChangeDetectionStrategy, Component, OnDestroy, effect, input, output } from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

const DEFAULT_DURATION_MS = 5000

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export type ToasterPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  duration?: number
}

const ASSERTIVE_VARIANTS: ReadonlySet<ToastVariant> = new Set(['warning', 'error'])

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}

@Component({
  selector: 'gbt-toaster',
  standalone: true,
  imports: [Icon],
  templateUrl: './toaster.html',
  styleUrl: './toaster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toaster implements OnDestroy {
  toasts = input.required<ToastItem[]>()
  position = input<ToasterPosition>('bottom-right')
  closeLabel = input<string>('Close')

  dismissed = output<string>()

  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor() {
    effect(() => {
      const currentIds = new Set(this.toasts().map((toast) => toast.id))

      for (const [id, timer] of this.timers) {
        if (!currentIds.has(id)) {
          clearTimeout(timer)
          this.timers.delete(id)
        }
      }

      for (const toast of this.toasts()) {
        if (this.timers.has(toast.id)) {
          continue
        }
        const duration = toast.duration ?? DEFAULT_DURATION_MS
        if (!Number.isFinite(duration) || duration <= 0) {
          continue
        }
        this.timers.set(
          toast.id,
          setTimeout(() => {
            this.timers.delete(toast.id)
            this.dismissed.emit(toast.id)
          }, duration),
        )
      }
    })
  }

  ngOnDestroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }

  protected roleFor(variant: ToastVariant): 'alert' | 'status' {
    return ASSERTIVE_VARIANTS.has(variant) ? 'alert' : 'status'
  }

  protected iconFor(variant: ToastVariant): string {
    return VARIANT_ICONS[variant]
  }
}
