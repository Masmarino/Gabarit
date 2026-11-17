import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core'

export interface SegmentedControlOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

export type SegmentedControlSize = 'md' | 'sm'

let nextSegmentedControlId = 0

/** Where the lens sits, in the group's box (px). */
interface LensBox {
  x: number
  y: number
  width: number
  height: number
}

@Component({
  selector: 'gbt-segmented-control',
  standalone: true,
  imports: [],
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.gbt-segmented-control-host--full]': 'fullWidth()',
    '[class.gbt-segmented-control-host--labelled]': '!!label()',
  },
})
export class SegmentedControl<T = string> {
  private readonly group = viewChild<ElementRef<HTMLElement>>('group')

  options = input.required<SegmentedControlOption<T>[]>()
  value = model.required<T>()
  ariaLabel = input<string>('')
  disabled = input(false, { transform: booleanAttribute })
  label = input<string>('')
  fullWidth = input(false, { transform: booleanAttribute })
  wrap = input(false, { transform: booleanAttribute })
  size = input<SegmentedControlSize>('md')
  tinted = input(false, { transform: booleanAttribute })

  protected readonly labelId = `gbt-segmented-control-label-${++nextSegmentedControlId}`

  /** The lens of liquid glass under the chosen option (4.1): measured once the options are laid out, null before (the
   * chosen option then shows its own ground, as on a server render). */
  protected readonly lens = signal<LensBox | null>(null)
  /** The lens glides only once it has a place: it does not fly in from the corner on the first render. */
  protected readonly lensGlides = signal(false)

  constructor() {
    const layout = signal(0)
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => layout.update((n) => n + 1))
      afterRenderEffect(() => {
        const group = this.group()?.nativeElement
        if (group) {
          observer.disconnect()
          observer.observe(group)
        }
      })
      inject(DestroyRef).onDestroy(() => observer.disconnect())
    }
    afterRenderEffect({
      read: () => {
        layout()
        this.value()
        this.options()
        this.place()
      },
    })
  }

  private place(): void {
    const group = this.group()?.nativeElement
    const chosen = group?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')
    if (!group || !chosen || chosen.offsetWidth === 0) {
      this.lens.set(null)
      return
    }
    const box = {
      x: chosen.offsetLeft,
      y: chosen.offsetTop,
      width: chosen.offsetWidth,
      height: chosen.offsetHeight,
    }
    const current = this.lens()
    if (
      current &&
      current.x === box.x &&
      current.y === box.y &&
      current.width === box.width &&
      current.height === box.height
    ) {
      return
    }
    const first = current === null
    this.lens.set(box)
    if (first && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.lensGlides.set(true))
    }
  }

  protected isSelected(value: T): boolean {
    return this.value() === value
  }

  protected select(option: SegmentedControlOption<T>): void {
    if (this.disabled() || option.disabled) {
      return
    }
    this.value.set(option.value)
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const options = this.options()
    const count = options.length
    if (count === 0) {
      return
    }
    let next: number | null = null
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextEnabledIndex(index, 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextEnabledIndex(index, -1)
        break
      case 'Home':
        next = this.nextEnabledIndex(-1, 1)
        break
      case 'End':
        next = this.nextEnabledIndex(count, -1)
        break
    }
    if (next === null) {
      return
    }
    event.preventDefault()
    this.select(options[next])
    this.focusButton(next)
  }

  private nextEnabledIndex(from: number, direction: 1 | -1): number | null {
    const options = this.options()
    const count = options.length
    for (let step = 1; step <= count; step++) {
      const candidate = (from + direction * step + count) % count
      if (!options[candidate].disabled) {
        return candidate
      }
    }
    return null
  }

  private focusButton(index: number): void {
    this.group()?.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus()
  }
}
