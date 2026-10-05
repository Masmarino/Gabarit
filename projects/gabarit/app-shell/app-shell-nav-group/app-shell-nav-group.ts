import { ChangeDetectionStrategy, Component, input, model } from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'

let nextNavGroupId = 0

@Component({
  selector: 'gbt-app-shell-nav-group',
  standalone: true,
  imports: [Icon],
  templateUrl: './app-shell-nav-group.html',
  styleUrl: './app-shell-nav-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellNavGroup {
  label = input.required<string>()
  icon = input<string | null>(null)
  expanded = model(false)

  protected readonly panelId = `gbt-app-shell-nav-group-${++nextNavGroupId}`

  protected toggle(): void {
    this.expanded.update((value) => !value)
  }
}
