import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'a[gbtCardLink]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './card-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'gbt-card__link' },
})
export class CardLink {}
