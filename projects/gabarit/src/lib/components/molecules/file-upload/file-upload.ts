import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Icon } from '../../atoms/icon/icon'

let nextId = 0

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

@Component({
  selector: 'gbt-file-upload',
  standalone: true,
  imports: [Icon],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUpload),
      multi: true,
    },
  ],
})
export class FileUpload implements ControlValueAccessor {
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput')

  id = input<string>(`gbt-file-upload-${++nextId}`)
  label = input<string>('')
  multiple = input(false, { transform: booleanAttribute })
  accept = input<string>('')
  maxSizeMb = input<number | null>(null)
  disabled = input(false, { transform: booleanAttribute })
  errorMessage = input<string | null>(null)
  dropLabel = input<string>('Drag and drop a file here, or click to browse')
  removeLabel = input<(name: string) => string>((name) => `Remove ${name}`)
  oversizeMessage = input<(name: string, maxSizeMb: number) => string>(
    (name, maxSizeMb) => `${name} exceeds ${maxSizeMb} MB and was not added.`,
  )

  protected readonly files = signal<File[]>([])
  protected readonly rejections = signal<string[]>([])
  protected readonly dragOver = signal(false)

  protected readonly formatFileSize = formatFileSize

  private readonly formDisabled = signal(false)
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled())

  private onChange: (value: File[]) => void = () => {}
  private onTouched: () => void = () => {}

  writeValue(value: File[] | null): void {
    this.files.set(value ?? [])
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled)
  }

  protected openPicker(): void {
    if (this.isDisabled()) {
      return
    }
    this.fileInput()?.nativeElement.click()
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    this.addFiles(input.files)
    input.value = ''
  }

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault()
    if (!this.isDisabled()) {
      this.dragOver.set(true)
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault()
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault()
    this.dragOver.set(false)
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault()
    this.dragOver.set(false)
    if (this.isDisabled()) {
      return
    }
    this.addFiles(event.dataTransfer?.files ?? null)
  }

  protected removeFile(file: File): void {
    if (this.isDisabled()) {
      return
    }
    const next = this.files().filter((f) => f !== file)
    this.files.set(next)
    this.onChange(next)
    this.onTouched()
  }

  private addFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) {
      return
    }
    const incoming = Array.from(fileList)
    const maxSizeMb = this.maxSizeMb()
    const accepted: File[] = []
    const rejected: string[] = []
    for (const file of incoming) {
      if (maxSizeMb !== null && file.size > maxSizeMb * 1024 * 1024) {
        rejected.push(this.oversizeMessage()(file.name, maxSizeMb))
      } else {
        accepted.push(file)
      }
    }
    this.rejections.set(rejected)
    if (accepted.length === 0) {
      return
    }
    const next = this.multiple() ? [...this.files(), ...accepted] : accepted.slice(0, 1)
    this.files.set(next)
    this.onChange(next)
    this.onTouched()
  }
}
