import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  effect,
  inject,
  input,
  signal,
} from '@angular/core'
import { CopyField } from '@masmarino/gabarit/copy-field'
import { DEFAULT_TOTP_QR_LABELS, type TotpQrLabels, authLabels } from '@masmarino/gabarit/auth'

export interface TotpQrRenderOptions {
  width: number
  margin: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
}

export type TotpQrRenderer = (text: string, options: TotpQrRenderOptions) => Promise<string>

export const TOTP_QR_RENDERER = new InjectionToken<TotpQrRenderer>('TOTP_QR_RENDERER')

const RENDER_OPTIONS: TotpQrRenderOptions = { errorCorrectionLevel: 'M', margin: 1, width: 448 }

@Component({
  selector: 'gbt-totp-qr',
  standalone: true,
  imports: [CopyField],
  templateUrl: './totp-qr.html',
  styleUrl: './totp-qr.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotpQr {
  otpauthUrl = input.required<string>()
  secret = input.required<string>()
  labels = input<Partial<TotpQrLabels>>({})

  protected readonly text = authLabels('totpQr', DEFAULT_TOTP_QR_LABELS, this.labels)
  protected dataUrl = signal<string | null>(null)
  protected failed = signal(false)

  private readonly render = inject(TOTP_QR_RENDERER, { optional: true })
  private generation = 0

  constructor() {
    effect(() => {
      const url = this.otpauthUrl()
      const current = ++this.generation
      this.dataUrl.set(null)
      this.failed.set(false)
      const render = this.render
      if (!render) {
        this.failed.set(true)
        return
      }
      Promise.resolve()
        .then(() => render(url, RENDER_OPTIONS))
        .then((dataUrl) => {
          if (current === this.generation) {
            this.dataUrl.set(dataUrl)
          }
        })
        .catch(() => {
          if (current === this.generation) {
            this.failed.set(true)
          }
        })
    })
  }
}
