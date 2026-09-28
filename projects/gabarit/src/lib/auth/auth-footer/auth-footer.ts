import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core'
import { Button } from '../../components/atoms/button/button'

@Directive({
  selector: '[gbtAuthFooterLink]',
  standalone: true,
  host: { class: 'gbt-auth-footer__link' },
})
export class AuthFooterLink {}

@Component({
  selector: 'gbt-auth-footer',
  standalone: true,
  imports: [Button],
  templateUrl: './auth-footer.html',
  styleUrl: './auth-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFooter {
  text = input.required<string>()
  href = input<string | null>(null)
  linkText = input('')
}
