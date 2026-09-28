import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { Icon } from '../icon/icon'

export type IconMarkerTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type IconMarkerSize = 'sm' | 'md' | 'lg' | 'xl'
export type IconMarkerShape = 'disc' | 'tile'
export type IconMarkerAppearance = 'soft' | 'outline'

@Component({
  selector: 'gbt-icon-marker',
  standalone: true,
  imports: [Icon],
  templateUrl: './icon-marker.html',
  styleUrl: './icon-marker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconMarker {
  icon = input.required<string>()
  tone = input<IconMarkerTone>('neutral')
  size = input<IconMarkerSize>('md')
  shape = input<IconMarkerShape>('disc')
  appearance = input<IconMarkerAppearance>('soft')
  label = input<string | null>(null)
}
