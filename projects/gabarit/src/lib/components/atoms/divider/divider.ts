import { ChangeDetectionStrategy, Component, input } from '@angular/core'

export type DividerOrientation = 'horizontal' | 'vertical'

@Component({
  selector: 'gbt-divider',
  standalone: true,
  templateUrl: './divider.html',
  styleUrl: './divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'separator',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-orientation]': "orientation() === 'vertical' ? 'vertical' : null",
  },
})
export class Divider {
  orientation = input<DividerOrientation>('horizontal')
  label = input<string>('')
}
