import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'

export type DescriptionListLayout = 'stacked' | 'inline'
export type DescriptionListValueAlign = 'start' | 'end'
export type DescriptionListResponsive = 'viewport' | 'container'

export interface DescriptionListEntry {
  term: string
  value: string | TemplateRef<unknown>
}

@Component({
  selector: 'gbt-description-list',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './description-list.html',
  styleUrl: './description-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-responsive]': "responsive() === 'container' ? 'container' : null",
  },
})
export class DescriptionList {
  items = input.required<DescriptionListEntry[]>()
  layout = input<DescriptionListLayout>('stacked')
  valueAlign = input<DescriptionListValueAlign>('start')
  responsive = input<DescriptionListResponsive>('viewport')

  protected isTemplate(value: DescriptionListEntry['value']): value is TemplateRef<unknown> {
    return value instanceof TemplateRef
  }
}
