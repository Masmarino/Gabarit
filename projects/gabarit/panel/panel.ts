import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type PanelHeadingLevel = 2 | 3 | 4

let nextId = 0

@Component({
  selector: 'gbt-panel',
  standalone: true,
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Panel {
  heading = input.required<string>()
  headingLevel = input<PanelHeadingLevel>(3)

  protected readonly headingId = `gbt-panel-heading-${nextId++}`
}
