import { TestBed } from '@angular/core/testing'
import { TagInput } from './tag-input'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

function setup() {
  const fixture = TestBed.createComponent(TagInput)
  fixture.componentRef.setInput('label', 'Labels')
  fixture.detectChanges()
  return fixture
}

const textInput = (f: ReturnType<typeof setup>): HTMLInputElement =>
  f.nativeElement.querySelector('.gbt-tag-input__input')

const tags = (f: ReturnType<typeof setup>): HTMLElement[] => [
  ...f.nativeElement.querySelectorAll('gbt-tag'),
]

function type(f: ReturnType<typeof setup>, value: string): void {
  const el = textInput(f)
  el.value = value
  el.dispatchEvent(new Event('input'))
  f.detectChanges()
}

function press(f: ReturnType<typeof setup>, key: string): void {
  textInput(f).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  f.detectChanges()
}

describe('TagInput', () => {
  it('starts with no tags', () => {
    const fixture = setup()
    expect(tags(fixture).length).toBe(0)
  })

  it('shows the written value (writeValue)', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug', 'urgent'])
    fixture.detectChanges()
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['bug', 'urgent'])
  })

  it('commits the current text as a new tag on Enter, and clears the field', () => {
    const fixture = setup()
    let emitted: string[] | null = null
    fixture.componentInstance.registerOnChange((v: string[]) => (emitted = v))

    type(fixture, 'bug')
    press(fixture, 'Enter')

    expect(emitted).toEqual(['bug'])
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['bug'])
    expect(textInput(fixture).value).toBe('')
  })

  it('commits on a configured separator key (comma)', () => {
    const fixture = setup()
    type(fixture, 'bug')
    press(fixture, ',')
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['bug'])
  })

  it('ignores an empty or whitespace-only draft', () => {
    const fixture = setup()
    type(fixture, '   ')
    press(fixture, 'Enter')
    expect(tags(fixture).length).toBe(0)
  })

  it('trims surrounding whitespace from a committed tag', () => {
    const fixture = setup()
    type(fixture, '  bug  ')
    press(fixture, 'Enter')
    expect(tags(fixture)[0].textContent?.trim()).toBe('bug')
  })

  it('ignores a duplicate tag by default', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug'])
    fixture.detectChanges()
    type(fixture, 'bug')
    press(fixture, 'Enter')
    expect(tags(fixture).length).toBe(1)
  })

  it('allows a duplicate tag when allowDuplicates is true', () => {
    const fixture = setup()
    fixture.componentRef.setInput('allowDuplicates', true)
    fixture.componentInstance.writeValue(['bug'])
    fixture.detectChanges()
    type(fixture, 'bug')
    press(fixture, 'Enter')
    expect(tags(fixture).length).toBe(2)
  })

  it('removes the last tag on Backspace when the field is empty', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug', 'urgent'])
    fixture.detectChanges()
    press(fixture, 'Backspace')
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['bug'])
  })

  it('does not remove a tag on Backspace when the field has text', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug'])
    fixture.detectChanges()
    type(fixture, 'x')
    press(fixture, 'Backspace')
    expect(tags(fixture).length).toBe(1)
  })

  it('removes a tag when its own remove button is clicked, and calls onChange', () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug', 'urgent'])
    fixture.detectChanges()
    let emitted: string[] | null = null
    fixture.componentInstance.registerOnChange((v: string[]) => (emitted = v))

    fixture.nativeElement.querySelectorAll('.gbt-tag__remove')[0].click()
    fixture.detectChanges()

    expect(emitted).toEqual(['urgent'])
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['urgent'])
  })

  it('commits a pending draft on blur', () => {
    const fixture = setup()
    type(fixture, 'bug')
    textInput(fixture).dispatchEvent(new Event('blur'))
    fixture.detectChanges()
    expect(tags(fixture).map((t) => t.textContent?.trim())).toEqual(['bug'])
  })

  it('disables the input when disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(textInput(fixture).disabled).toBe(true)
  })

  it('disables via setDisabledState (form-driven)', () => {
    const fixture = setup()
    fixture.componentInstance.setDisabledState(true)
    fixture.detectChanges()
    expect(textInput(fixture).disabled).toBe(true)
  })

  it('renders the error message with role alert', () => {
    const fixture = setup()
    fixture.componentRef.setInput('errorMessage', 'Au moins un label est requis')
    fixture.detectChanges()
    const error = fixture.nativeElement.querySelector('[role="alert"]')
    expect(error.textContent.trim()).toBe('Au moins un label est requis')
  })

  it('has no a11y violations, empty', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with tags', async () => {
    const fixture = setup()
    fixture.componentInstance.writeValue(['bug', 'urgent'])
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
