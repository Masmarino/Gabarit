import { DOCUMENT } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Button } from '../../components/atoms/button/button'
import { Checkbox } from '../../components/atoms/checkbox/checkbox'
import { CopyButton } from '../../components/atoms/copy-button/copy-button'
import { type BackupCodesLabels, DEFAULT_BACKUP_CODES_LABELS, authLabels } from '../auth-labels'

let nextId = 0

@Component({
  selector: 'gbt-backup-codes',
  standalone: true,
  imports: [FormsModule, Button, Checkbox, CopyButton],
  templateUrl: './backup-codes.html',
  styleUrl: './backup-codes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupCodes {
  codes = input.required<string[]>()
  acknowledged = model(false)
  labels = input<Partial<BackupCodesLabels>>({})

  protected readonly text = authLabels('backupCodes', DEFAULT_BACKUP_CODES_LABELS, this.labels)
  protected readonly id = `gbt-backup-codes-${nextId++}`
  private readonly document = inject(DOCUMENT)

  protected readonly display = computed(() =>
    this.codes().map((code) =>
      (code.match(/.{1,16}/g) ?? []).map((line) => line.replace(/(.{8})(?=.)/g, '$1 ')),
    ),
  )

  constructor() {
    let shown: string[] | undefined
    effect(() => {
      const codes = this.codes()
      if (shown !== undefined && codes !== shown) {
        untracked(() => this.acknowledged.set(false))
      }
      shown = codes
    })
  }

  protected readonly codesText = computed(() => this.codes().join('\n'))

  protected download(): void {
    const text = this.text()
    const content = [text.fileTitle, text.fileNotice, '', ...this.codes(), ''].join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = this.document.createElement('a')
    link.href = url
    link.download = text.fileName
    link.click()
    URL.revokeObjectURL(url)
  }
}
