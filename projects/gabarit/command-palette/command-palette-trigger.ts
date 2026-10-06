import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { Icon } from '@masmarino/gabarit/icon'
import type { CommandPalette } from './command-palette'
import { ariaKeyshortcuts, shortcutLabel } from './shortcut'

/**
 * Where a header's search field would be: a button that looks like one, says the shortcut, and opens the palette.
 * Below 600px it folds to its icon, its label kept as its accessible name.
 */
@Component({
  selector: 'gbt-command-palette-trigger',
  standalone: true,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="gbt-cp-trigger"
      aria-haspopup="dialog"
      [attr.aria-label]="label()"
      [attr.aria-keyshortcuts]="keyshortcuts()"
      (click)="palette().show()"
    >
      <gbt-icon name="search" class="gbt-cp-trigger__icon" aria-hidden="true" />
      <span class="gbt-cp-trigger__label" aria-hidden="true">{{ label() }}</span>
      <kbd class="gbt-cp-trigger__kbd" aria-hidden="true">{{ keys() }}</kbd>
    </button>
  `,
  styleUrl: './command-palette-trigger.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteTrigger {
  /** Any palette, whatever its items carry: the button only opens it. */
  palette = input.required<Pick<CommandPalette<unknown>, 'show'>>()
  label = input('Search or jump to…')
  /** The shortcut shown; keep it the palette's first. */
  shortcut = input('mod+k')

  protected readonly keys = computed(() => shortcutLabel(this.shortcut()))
  protected readonly keyshortcuts = computed(() => ariaKeyshortcuts(this.shortcut()))
}
