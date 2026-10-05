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
}
