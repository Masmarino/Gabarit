import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  signal,
} from '@angular/core'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipCoords {
  top: number
  left: number
}

const SHOW_DELAY_MS = 400
const FADE_MS = 120
const GAP_PX = 8

let nextId = 0

@Component({
  selector: 'gbt-tooltip',
  standalone: true,
  exportAs: 'gbtTooltip',
  imports: [],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gbt-tooltip-host',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '(window:scroll)': 'updatePosition()',
    '(window:resize)': 'updatePosition()',
  },
})
export class Tooltip implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>)

  text = input.required<string>()
  position = input<TooltipPosition>('top')

  readonly tooltipId = `gbt-tooltip-${++nextId}`

  protected readonly visible = signal(false)
  protected readonly closing = signal(false)
  protected readonly coords = signal<TooltipCoords | null>(null)

  private showTimer: ReturnType<typeof setTimeout> | null = null
  private hideTimer: ReturnType<typeof setTimeout> | null = null

  protected onMouseEnter(): void {
    this.showTimer = setTimeout(() => {
      this.showTimer = null
      this.show()
    }, SHOW_DELAY_MS)
  }

  protected onFocusIn(): void {
    this.show()
  }

  private show(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
    this.closing.set(false)
    this.updatePosition()
    this.visible.set(true)
  }

  protected updatePosition(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect()
    switch (this.position()) {
      case 'top':
        this.coords.set({ top: rect.top - GAP_PX, left: rect.left + rect.width / 2 })
        break
      case 'bottom':
        this.coords.set({ top: rect.bottom + GAP_PX, left: rect.left + rect.width / 2 })
        break
      case 'left':
        this.coords.set({ top: rect.top + rect.height / 2, left: rect.left - GAP_PX })
        break
      case 'right':
        this.coords.set({ top: rect.top + rect.height / 2, left: rect.right + GAP_PX })
        break
    }
  }

  protected hide(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer)
      this.showTimer = null
    }
    if (!this.visible() || this.closing()) return
    this.closing.set(true)
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null
      this.closing.set(false)
      this.visible.set(false)
    }, FADE_MS)
  }

  ngOnDestroy(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer)
      this.showTimer = null
    }
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
  }
}
