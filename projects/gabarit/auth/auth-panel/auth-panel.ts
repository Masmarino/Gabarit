import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core'

@Component({
  selector: 'gbt-auth-panel',
  standalone: true,
  templateUrl: './auth-panel.html',
  styleUrl: './auth-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPanel {
  heading = input('')
  intro = input('')
  wide = input(false, { transform: booleanAttribute })
  /** The graphite page of 3.x, in both themes, instead of the ground (4.0). */
  framed = input(false, { transform: booleanAttribute })
}
