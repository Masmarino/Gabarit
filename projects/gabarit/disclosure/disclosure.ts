import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

export type DisclosureAppearance = 'glass' | 'plain'
export type DisclosureHeadingLevel = 2 | 3 | 4 | 5 | 6

let nextDisclosureId = 0

@Component({
  selector: 'gbt-disclosure',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './disclosure.html',
  styleUrl: './disclosure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Disclosure {
  label = input.required<string>()
  open = model(false)
  icon = input<string | null>(null)
  appearance = input<DisclosureAppearance>('glass')
  headingLevel = input<DisclosureHeadingLevel | null>(null)

  protected readonly buttonId = `gbt-disclosure-${++nextDisclosureId}`
  protected readonly panelId = `${this.buttonId}-panel`

  protected toggle(): void {
    this.open.set(!this.open())
  }
}
