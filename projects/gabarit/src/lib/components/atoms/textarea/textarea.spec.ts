import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Textarea } from './textarea'

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, Textarea],
  template: `
    <form [formGroup]="form">
      <gbt-textarea label="Description" formControlName="description" />
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({ description: new FormControl('') })
}

describe('Textarea', () => {
  it('writes the form control value into the rendered textarea', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.form.controls.description.setValue('florian')
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.value).toBe('florian')
  })

  it('propagates typed input back to the form control', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    textarea.value = 'new-value'
    textarea.dispatchEvent(new Event('input'))

    expect(fixture.componentInstance.form.controls.description.value).toBe('new-value')
  })

  it('disables the native textarea when the form control is disabled programmatically', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.componentInstance.form.controls.description.disable()
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.disabled).toBe(true)
  })

  it('applies the provided rows', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('rows', 6)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.rows).toBe(6)
  })

  it('defaults to 3 rows', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.rows).toBe(3)
  })

  it('emits committed on blur, with the value the user settled on', () => {
    const fixture = TestBed.createComponent(Textarea)
    const committed: string[] = []
    fixture.componentInstance.committed.subscribe((value) => committed.push(value))
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    textarea.value = 'a'
    textarea.dispatchEvent(new Event('input'))
    textarea.value = 'ab'
    textarea.dispatchEvent(new Event('input'))
    expect(committed).toEqual([])

    textarea.dispatchEvent(new Event('blur'))
    expect(committed).toEqual(['ab'])
  })

  it('renders the error message and wires aria-invalid/aria-describedby', () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('errorMessage', 'Ce champ est obligatoire')
    fixture.detectChanges()

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    const errorId = textarea.getAttribute('aria-describedby')
    expect(fixture.nativeElement.querySelector(`#${errorId}`).textContent).toContain(
      'Ce champ est obligatoire',
    )
  })

  it('presents no accessibility violation with a label', async () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('label', 'Description')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('presents no accessibility violation in error state', async () => {
    const fixture = TestBed.createComponent(Textarea)
    fixture.componentRef.setInput('label', 'Description')
    fixture.componentRef.setInput('errorMessage', 'Ce champ est obligatoire')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
