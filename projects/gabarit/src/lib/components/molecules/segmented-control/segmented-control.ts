import { ChangeDetectionStrategy, Component, ElementRef, booleanAttribute, input, model, viewChild } from '@angular/core'

export interface SegmentedControlOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

@Component({
  selector: 'gbt-segmented-control',
  standalone: true,
  imports: [],
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControl<T = string> {
  private readonly group = viewChild<ElementRef<HTMLElement>>('group')

  options = input.required<SegmentedControlOption<T>[]>()
  value = model.required<T>()
  ariaLabel = input<string>('')
  disabled = input(false, { transform: booleanAttribute })

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
