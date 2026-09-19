import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { vi } from 'vitest'
import { FileUpload } from './file-upload'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(FileUpload)
  fixture.detectChanges()
  return fixture
}

const dropzone = (f: ReturnType<typeof setup>): HTMLButtonElement =>
  f.nativeElement.querySelector('.gbt-file-upload__dropzone')

const fileInput = (f: ReturnType<typeof setup>): HTMLInputElement =>
  f.nativeElement.querySelector('.gbt-file-upload__input')

const fileRows = (f: ReturnType<typeof setup>): HTMLElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-file-upload__file'),
]

function fileList(files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* files
    },
  } as unknown as FileList
}

function selectFiles(f: ReturnType<typeof setup>, files: File[]): void {
  const input = fileInput(f)
  Object.defineProperty(input, 'files', { value: fileList(files), configurable: true })
  input.dispatchEvent(new Event('change'))
  f.detectChanges()
}

function dropFiles(f: ReturnType<typeof setup>, files: File[]): void {
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: { files: fileList(files) } })
  dropzone(f).dispatchEvent(event)
  f.detectChanges()
}

describe('FileUpload', () => {
  it('renders the label', () => {
    const fixture = setup()
    fixture.componentRef.setInput('label', 'Justificatif')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Justificatif')
  })

  it('opens the native file picker when the dropzone is clicked', () => {
    const fixture = setup()
    const input = fileInput(fixture)
    const clickSpy = vi.spyOn(input, 'click')

    dropzone(fixture).click()

    expect(clickSpy).toHaveBeenCalled()
  })

  it('adds a file selected via the native input, calls onChange, and lists it', () => {
    const fixture = setup()
    let emitted: File[] | null = null
    fixture.componentInstance.registerOnChange((v: File[]) => (emitted = v))
    const file = new File(['a'], 'contrat.pdf', { type: 'application/pdf' })

    selectFiles(fixture, [file])

    expect(emitted).toEqual([file])
    expect(fileRows(fixture).length).toBe(1)
    expect(fileRows(fixture)[0].textContent).toContain('contrat.pdf')
  })

  it('adds a file dropped on the dropzone', () => {
    const fixture = setup()
    const file = new File(['a'], 'photo.png', { type: 'image/png' })

    dropFiles(fixture, [file])

    expect(fileRows(fixture).length).toBe(1)
    expect(fileRows(fixture)[0].textContent).toContain('photo.png')
  })

  it('replaces the current file when not multiple', () => {
    const fixture = setup()
    selectFiles(fixture, [new File(['a'], 'un.pdf')])
    selectFiles(fixture, [new File(['b'], 'deux.pdf')])

    expect(fileRows(fixture).length).toBe(1)
    expect(fileRows(fixture)[0].textContent).toContain('deux.pdf')
  })

  it('accumulates files when multiple', () => {
    const fixture = setup()
    fixture.componentRef.setInput('multiple', true)
    fixture.detectChanges()
    selectFiles(fixture, [new File(['a'], 'un.pdf')])
    selectFiles(fixture, [new File(['b'], 'deux.pdf')])

    expect(fileRows(fixture).length).toBe(2)
  })

  it('removes a file when its remove button is clicked, and calls onChange', () => {
    const fixture = setup()
    fixture.componentRef.setInput('multiple', true)
    fixture.detectChanges()
    let emitted: File[] | null = null
    fixture.componentInstance.registerOnChange((v: File[]) => (emitted = v))
    selectFiles(fixture, [new File(['a'], 'un.pdf'), new File(['b'], 'deux.pdf')])

    fileRows(fixture)[0].querySelector('button')!.click()
    fixture.detectChanges()

    expect(emitted).toEqual([new File(['b'], 'deux.pdf')])
    expect(fileRows(fixture).length).toBe(1)
    expect(fileRows(fixture)[0].textContent).toContain('deux.pdf')
  })

  it('rejects a file larger than maxSizeMb, with a message, and does not add it', () => {
    const fixture = setup()
    fixture.componentRef.setInput('maxSizeMb', 1)
    fixture.detectChanges()
    const big = new File([new Uint8Array(2 * 1024 * 1024)], 'big.zip')

    selectFiles(fixture, [big])

    expect(fileRows(fixture).length).toBe(0)
    const rejection = fixture.nativeElement.querySelector('.gbt-file-upload__rejections')
    expect(rejection.textContent).toContain('big.zip')
  })

  it('clears previous rejections on a new successful selection', () => {
    const fixture = setup()
    fixture.componentRef.setInput('maxSizeMb', 1)
    fixture.detectChanges()
    selectFiles(fixture, [new File([new Uint8Array(2 * 1024 * 1024)], 'big.zip')])
    expect(fixture.nativeElement.querySelector('.gbt-file-upload__rejections')).not.toBeNull()

    selectFiles(fixture, [new File(['a'], 'small.txt')])

    expect(fixture.nativeElement.querySelector('.gbt-file-upload__rejections')).toBeNull()
  })

  it('writes an initial value via writeValue', () => {
    const fixture = setup()
    const file = new File(['a'], 'existing.pdf')
    fixture.componentInstance.writeValue([file])
    fixture.detectChanges()
    expect(fileRows(fixture)[0].textContent).toContain('existing.pdf')
  })

  it('disables the dropzone when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(dropzone(fixture).disabled).toBe(true)
  })

  it('disables via setDisabledState (form-driven)', () => {
    const fixture = setup()
    fixture.componentInstance.setDisabledState(true)
    fixture.detectChanges()
    expect(dropzone(fixture).disabled).toBe(true)
  })

  it('renders the error message with role alert', () => {
    const fixture = setup()
    fixture.componentRef.setInput('errorMessage', 'Un fichier est requis')
    fixture.detectChanges()
    const error = fixture.nativeElement.querySelector('.gbt-file-upload__error')
    expect(error.getAttribute('role')).toBe('alert')
    expect(error.textContent.trim()).toBe('Un fichier est requis')
  })

  it('has no a11y violations, empty', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with files and a rejection', async () => {
    const fixture = setup()
    fixture.componentRef.setInput('multiple', true)
    fixture.componentRef.setInput('maxSizeMb', 1)
    fixture.detectChanges()
    selectFiles(fixture, [
      new File(['a'], 'ok.txt'),
      new File([new Uint8Array(2 * 1024 * 1024)], 'big.zip'),
    ])
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

@Component({
  standalone: true,
  imports: [FileUpload, ReactiveFormsModule],
  template: `<gbt-file-upload [formControl]="control" />`,
})
class FormControlHostComponent {
  control = new FormControl<File[]>({ value: [], disabled: true })
}

describe('FileUpload — reactive forms integration', () => {
  it('starts disabled when bound to a FormControl created already disabled', () => {
    const fixture = TestBed.createComponent(FormControlHostComponent)
    fixture.detectChanges()

    const dropzone: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.gbt-file-upload__dropzone',
    )
    expect(dropzone.disabled).toBe(true)
  })
})
