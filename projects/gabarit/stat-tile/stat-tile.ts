import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  contentChild,
  inject,
  input,
} from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'
import { IconMarker, IconMarkerTone } from '@masmarino/gabarit/icon-marker'
import { StatGrid } from '@masmarino/gabarit/stat-grid'
import { StatTileLink } from './stat-tile-link'

export type StatTileTrend = 'up' | 'down' | 'flat'
export type StatTileTrendTone = 'neutral' | 'success' | 'error'

@Component({
  selector: 'gbt-stat-tile',
  standalone: true,
  imports: [Icon, IconMarker, StatTileLink],
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'grid ? "listitem" : null',
    '[attr.data-link]': 'linked() ? "" : null',
    '[attr.data-muted]': 'muted() ? "" : null',
  },
})
export class StatTile {
  label = input('')
  value = input.required<string | number>()
  icon = input<string | null>(null)
  iconTone = input<IconMarkerTone>('info')
  hint = input<string | null>(null)
  trend = input<StatTileTrend | null>(null)
  trendLabel = input<string | null>(null)
  trendTone = input<StatTileTrendTone>('neutral')
  href = input<string | null>(null)
  muted = input(false, { transform: booleanAttribute })

  private readonly link = contentChild(StatTileLink)
  protected readonly grid = inject(StatGrid, { optional: true })

  protected linked(): boolean {
    return !!this.href() || !!this.link()
  }

  protected hasLink(): boolean {
    return !!this.link()
  }
}
