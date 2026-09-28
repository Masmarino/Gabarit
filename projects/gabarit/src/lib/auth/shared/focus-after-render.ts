import { ElementRef, Injector, afterNextRender } from '@angular/core'

export interface FocusOptions {
  nestedFallback?: string
}

export function focusNow(
  host: ElementRef<HTMLElement>,
  selector: string,
  options?: FocusOptions,
): void {
  const target = host.nativeElement.querySelector<HTMLElement>(selector)
  const element =
    options?.nestedFallback && !target?.matches('input, button')
      ? target?.querySelector<HTMLElement>(options.nestedFallback)
      : target
  element?.focus()
}

/** `selector` may be a thunk to defer evaluation until after render (e.g. a signal input not yet settled at construction time). */
export function focusAfterRender(
  host: ElementRef<HTMLElement>,
  injector: Injector,
  selector: string | (() => string),
  options?: FocusOptions,
): void {
  afterNextRender(
    () => focusNow(host, typeof selector === 'function' ? selector() : selector, options),
    {
      injector,
    },
  )
}
