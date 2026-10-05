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
