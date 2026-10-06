import { DOCUMENT, DestroyRef, inject } from '@angular/core'

const GAP = 6

export interface FloatingPanelAnchor {
  rect: DOMRect
  bottom: number
  left: number
}

/** Returns `null` (panel closed, or trigger not in the DOM) when the caller should leave `panelStyle` untouched. */
export function floatingPanelAnchor(
  open: boolean,
  trigger: HTMLElement | null,
  anchorBottom?: (rect: DOMRect) => number,
): FloatingPanelAnchor | null {
  if (!open || !trigger) {
    return null
  }
  const rect = trigger.getBoundingClientRect()
  return {
    rect,
    bottom: (anchorBottom ? anchorBottom(rect) : rect.bottom) + GAP,
    left: rect.left,
  }
}

/**
 * Calls `follow` on every scroll in the page: the window's, and that of any scrolling container — the app shell's
 * `main`, a modal's body — since a panel fixed to the viewport must follow its trigger through all of them. Scroll
 * events don't bubble, so the listener sits on the window's capture phase. Call it in an injection context; it stops
 * with the component.
 */
export function followPageScroll(follow: () => void): void {
  const view = inject(DOCUMENT).defaultView
  if (!view) {
    return
  }
  const listener = () => follow()
  view.addEventListener('scroll', listener, { capture: true, passive: true })
  inject(DestroyRef).onDestroy(() =>
    view.removeEventListener('scroll', listener, { capture: true }),
  )
}
