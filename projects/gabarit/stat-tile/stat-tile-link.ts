import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  selector: 'a[gbtStatTileLink]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: './stat-tile-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'gbt-stat-tile__link' },
})
export class StatTileLink {}
