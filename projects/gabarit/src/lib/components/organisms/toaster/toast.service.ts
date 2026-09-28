import { DestroyRef, Injectable, inject, signal } from '@angular/core'
import type { ToastItem, ToastVariant } from './toaster'

export type GbtToastKind = ToastVariant

export interface GbtToastOptions {
  duration?: number
}

let nextToastId = 0

@Injectable({ providedIn: 'root' })
export class GbtToastService {
  private readonly items = signal<ToastItem[]>([])
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>()

  readonly toasts = this.items.asReadonly()

  readonly defaultDuration = signal(5000)

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers())
  }

  show(message: string, kind: GbtToastKind = 'success', options: GbtToastOptions = {}): string {
    const id = `gbt-toast-${++nextToastId}`
    const duration = options.duration ?? this.defaultDuration()
    this.items.update((current) => [...current, { id, variant: kind, message, duration }])

    if (Number.isFinite(duration) && duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      )
    }
    return id
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      this.timers.delete(id)
    }
    this.items.update((current) => {
      const next = current.filter((toast) => toast.id !== id)
      return next.length === current.length ? current : next
    })
  }

  clear(): void {
    this.clearTimers()
    this.items.set([])
  }

  private clearTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }
}
