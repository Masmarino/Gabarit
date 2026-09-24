import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core'
import { Icon } from '../../atoms/icon/icon'

export type StepperStatus = 'upcoming' | 'current' | 'completed' | 'error'
export type StepperOrientation = 'horizontal' | 'vertical'

export interface StepperStep {
  label: string
  hasError?: boolean
}

@Component({
  selector: 'gbt-stepper',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stepper {
  steps = input.required<StepperStep[]>()
  activeIndex = model(0)
  orientation = input<StepperOrientation>('horizontal')
  completedLabel = input<string>('Completed')
  errorLabel = input<string>('Error')
  interactive = input(false, { transform: booleanAttribute })
  selectedIndex = model<number | null>(null)
  selectedLabel = input<string>('Selected')

  protected select(index: number): void {
    this.selectedIndex.set(index)
  }

  protected isSelected(index: number): boolean {
    return this.interactive() && this.selectedIndex() === index
  }

  protected statusOf(index: number): StepperStatus {
    const step = this.steps()[index]
    const active = this.activeIndex()
    if (step.hasError && index <= active) {
      return 'error'
    }
    if (index < active) {
      return 'completed'
    }
    if (index === active) {
      return 'current'
    }
    return 'upcoming'
  }
}
