import { DestroyRef, inject, signal } from '@angular/core'

export type CopyStatus = 'idle' | 'copied' | 'failed'

export type CopyValue = string | (() => string)

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Refused (permissions, focus, insecure context): try the legacy path below.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false
  }
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const selection = document.getSelection()
  const savedRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null

  const area = document.createElement('textarea')
  area.value = text
  area.readOnly = true
  area.tabIndex = -1
  area.setAttribute('aria-hidden', 'true')
  area.style.cssText =
    'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;'
  const host = active?.closest('dialog, [role="dialog"]') ?? document.body
  host.appendChild(area)

  let copied: boolean
  try {
    area.focus({ preventScroll: true })
    area.select()
    area.setSelectionRange(0, text.length)
    copied = document.execCommand('copy')
  } catch {
    copied = false
  } finally {
    area.remove()
    active?.focus({ preventScroll: true })
    if (selection && savedRange) {
      selection.removeAllRanges()
      selection.addRange(savedRange)
    }
  }
  return copied
}

export function selectContents(element: HTMLElement | null | undefined): void {
  const selection = typeof window === 'undefined' ? null : window.getSelection()
  if (!element || !selection) {
    return
  }
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

export interface CopyOutcome {
  copied: boolean
  text: string
}

export class ClipboardFeedback {
  readonly status = signal<CopyStatus>('idle')

  private timer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true
      this.clearTimer()
    })
  }

  async copy(
    value: CopyValue,
    feedbackMs: number,
    selectTarget?: HTMLElement | null,
  ): Promise<CopyOutcome | null> {
    let text = ''
    let copied: boolean
    try {
      text = typeof value === 'function' ? value() : value
      copied = await copyToClipboard(text)
    } catch {
      copied = false
    }
    if (this.destroyed) {
      return null
    }
    if (!copied) {
      selectContents(selectTarget)
    }
    this.show(copied ? 'copied' : 'failed', copied ? feedbackMs : feedbackMs * 2)
    return { copied, text }
  }

  reset(): void {
    this.clearTimer()
    this.status.set('idle')
  }

  private show(status: CopyStatus, durationMs: number): void {
    this.clearTimer()
    this.status.set(status)
    this.timer = setTimeout(() => {
      this.timer = null
      this.status.set('idle')
    }, durationMs)
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
