import { TestBed } from '@angular/core/testing'
import { SegmentedControl, SegmentedControlOption } from './segmented-control'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

const OPTIONS: SegmentedControlOption[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

function setup(options: SegmentedControlOption[] = OPTIONS, value = 'day') {
  const fixture = TestBed.createComponent(SegmentedControl)
  fixture.componentRef.setInput('options', options)
  fixture.componentRef.setInput('value', value)
  fixture.detectChanges()
  return fixture
}

const buttons = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
  ...f.nativeElement.querySelectorAll('[role="radio"]'),
]

describe('SegmentedControl', () => {
  it('renders one button per option, labelled', () => {
    const fixture = setup()
    expect(buttons(fixture).map((b) => b.textContent?.trim())).toEqual([
      'Jour',
      'Semaine',
      'Mois',
    ])
  })

  it('marks the option matching value as checked', () => {
    const fixture = setup(OPTIONS, 'week')
    const checked = buttons(fixture).map((b) => b.getAttribute('aria-checked'))
    expect(checked).toEqual(['false', 'true', 'false'])
  })

  it('updates value when a different option is clicked', () => {
    const fixture = setup()

    buttons(fixture)[2].click()

    expect(fixture.componentInstance.value()).toBe('month')
  })

  it('does not change value when the disabled option is clicked', () => {
    const fixture = setup([...OPTIONS.slice(0, 2), { value: 'month', label: 'Mois', disabled: true }])

    buttons(fixture)[2].click()

    expect(fixture.componentInstance.value()).toBe('day')
    expect(buttons(fixture)[2].hasAttribute('disabled')).toBe(true)
  })

  it('gives only the checked option a tabIndex of 0, others -1 (roving tabindex)', () => {
    const fixture = setup(OPTIONS, 'week')
    const tabIndexes = buttons(fixture).map((b) => b.tabIndex)
    expect(tabIndexes).toEqual([-1, 0, -1])
  })

  it('moves selection and focus with ArrowRight, wrapping past the last option', () => {
    const fixture = setup(OPTIONS, 'month')

    buttons(fixture)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(fixture.componentInstance.value()).toBe('day')
    expect(document.activeElement).toBe(buttons(fixture)[0])
  })

  it('moves selection and focus with ArrowLeft, wrapping before the first option', () => {
    const fixture = setup(OPTIONS, 'day')

    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

    expect(fixture.componentInstance.value()).toBe('month')
  })

  it('jumps to the first/last option with Home/End', () => {
    const fixture = setup(OPTIONS, 'week')

    buttons(fixture)[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(fixture.componentInstance.value()).toBe('month')

    buttons(fixture)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(fixture.componentInstance.value()).toBe('day')
  })

  it('skips a disabled option when navigating with arrow keys', () => {
    const fixture = setup([OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]], 'day')

    buttons(fixture)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(fixture.componentInstance.value()).toBe('month')
  })

  it('names the group via ariaLabel', () => {
    const fixture = setup()
    fixture.componentRef.setInput('ariaLabel', 'Période')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]').getAttribute('aria-label')).toBe(
      'Période',
    )
  })

  it('disables every option when the control itself is disabled', () => {
    const fixture = setup()
    fixture.componentRef.setInput('disabled', true)
    fixture.detectChanges()
    expect(buttons(fixture).every((b) => b.hasAttribute('disabled'))).toBe(true)
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
