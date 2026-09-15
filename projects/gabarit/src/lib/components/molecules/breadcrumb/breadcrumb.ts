import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  selector: 'gbt-breadcrumb',
  standalone: true,
  imports: [],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumb {
  ariaLabel = input.required<string>()
}
