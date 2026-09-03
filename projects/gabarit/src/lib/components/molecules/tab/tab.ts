import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core'

@Component({
  selector: 'gbt-tab',
  standalone: true,
  imports: [],
  template: `<ng-content></ng-content>`,
  host: {
    role: 'tabpanel',
    '[style.display]': "active() ? null : 'none'",
    '[id]': "groupId() + '-panel-' + index()",
    '[attr.aria-labelledby]': "groupId() + '-trigger-' + index()",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab {
  label = input.required<string>()

  protected readonly active = signal(false)
  protected readonly index = signal(0)
  protected readonly groupId = signal('')

  setState(index: number, active: boolean, groupId: string): void {
    this.index.set(index)
    this.active.set(active)
    this.groupId.set(groupId)
  }
}
