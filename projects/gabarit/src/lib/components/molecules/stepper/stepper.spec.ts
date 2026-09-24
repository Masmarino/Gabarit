import { TestBed } from '@angular/core/testing'
import { Stepper, StepperStep } from './stepper'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

const STEPS: StepperStep[] = [
  { label: 'Compte' },
  { label: 'Livraison' },
  { label: 'Paiement' },
]

function setup(steps: StepperStep[] = STEPS, activeIndex = 0) {
  const fixture = TestBed.createComponent(Stepper)
  fixture.componentRef.setInput('steps', steps)
  fixture.componentRef.setInput('activeIndex', activeIndex)
  fixture.detectChanges()
  return fixture
}

const items = (f: ReturnType<typeof setup>): HTMLLIElement[] => [
  ...f.nativeElement.querySelectorAll('.gbt-stepper__step'),
]

describe('Stepper', () => {
  it('renders a real ol with one li per step, in order', () => {
    const fixture = setup()
    const ol = fixture.nativeElement.querySelector('ol')
    const children = [...ol.children].map((el: HTMLElement) => el.tagName.toLowerCase())
    expect(children).toEqual(['li', 'li', 'li'])
  })

  it('marks steps before activeIndex as completed', () => {
    const fixture = setup(STEPS, 2)
    expect(items(fixture)[0].getAttribute('data-status')).toBe('completed')
    expect(items(fixture)[1].getAttribute('data-status')).toBe('completed')
  })

  it('marks the step at activeIndex as current, with aria-current="step"', () => {
    const fixture = setup(STEPS, 1)
    expect(items(fixture)[1].getAttribute('data-status')).toBe('current')
    expect(items(fixture)[1].getAttribute('aria-current')).toBe('step')
    expect(items(fixture)[0].getAttribute('aria-current')).toBeNull()
  })

  it('marks steps after activeIndex as upcoming', () => {
    const fixture = setup(STEPS, 0)
    expect(items(fixture)[1].getAttribute('data-status')).toBe('upcoming')
    expect(items(fixture)[2].getAttribute('data-status')).toBe('upcoming')
  })

  it('shows a checkmark icon for a completed step', () => {
    const fixture = setup(STEPS, 1)
    expect(items(fixture)[0].querySelector('gbt-icon')).not.toBeNull()
    expect(items(fixture)[0].textContent).not.toContain('1')
  })

  it('shows the 1-based step number for current/upcoming steps', () => {
    const fixture = setup(STEPS, 0)
    expect(items(fixture)[0].textContent).toContain('1')
    expect(items(fixture)[1].textContent).toContain('2')
    expect(items(fixture)[2].textContent).toContain('3')
  })

  it('marks a step with hasError as an error, once reached', () => {
    const fixture = setup([{ label: 'Compte' }, { label: 'Livraison', hasError: true }], 1)
    expect(items(fixture)[1].getAttribute('data-status')).toBe('error')
  })

  it('does not mark a future step with hasError as an error before it is reached', () => {
    const fixture = setup([{ label: 'Compte' }, { label: 'Livraison', hasError: true }], 0)
    expect(items(fixture)[1].getAttribute('data-status')).toBe('upcoming')
  })

  it('announces completed/error status via visually-hidden text', () => {
    const fixture = setup([{ label: 'Compte' }, { label: 'Livraison', hasError: true }], 1)
    expect(items(fixture)[0].querySelector('.sr-only')?.textContent).toContain('Completed')
    expect(items(fixture)[1].querySelector('.sr-only')?.textContent).toContain('Error')
  })

  it('defaults to horizontal orientation', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('ol').getAttribute('data-orientation')).toBe(
      'horizontal',
    )
  })

  it('reflects the vertical orientation', () => {
    const fixture = setup()
    fixture.componentRef.setInput('orientation', 'vertical')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('ol').getAttribute('data-orientation')).toBe(
      'vertical',
    )
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup(STEPS, 1).nativeElement)
  })

  it('has no a11y violations with an error step', async () => {
    const fixture = setup([{ label: 'Compte' }, { label: 'Livraison', hasError: true }], 1)
    await expectNoA11yViolations(fixture.nativeElement)
  })

  describe('interactive mode', () => {
    function setupInteractive(activeIndex = 1, selectedIndex: number | null = null) {
      const fixture = TestBed.createComponent(Stepper)
      fixture.componentRef.setInput('steps', STEPS)
      fixture.componentRef.setInput('activeIndex', activeIndex)
      fixture.componentRef.setInput('interactive', true)
      fixture.componentRef.setInput('selectedIndex', selectedIndex)
      fixture.detectChanges()
      return fixture
    }

    const buttons = (f: ReturnType<typeof setup>): HTMLButtonElement[] => [
      ...f.nativeElement.querySelectorAll('button.gbt-stepper__button'),
    ]

    it('renders no buttons when not interactive', () => {
      const fixture = setup()
      expect(buttons(fixture).length).toBe(0)
    })

    it('renders one type="button" per step inside its li when interactive', () => {
      const fixture = setupInteractive()
      expect(buttons(fixture).length).toBe(3)
      expect(buttons(fixture).every((b) => b.type === 'button')).toBe(true)
      expect(items(fixture).every((li) => li.querySelector(':scope > button') !== null)).toBe(true)
    })

    it('keeps the ol/li structure with only li children', () => {
      const fixture = setupInteractive()
      const ol = fixture.nativeElement.querySelector('ol')
      expect([...ol.children].map((el: HTMLElement) => el.tagName.toLowerCase())).toEqual([
        'li',
        'li',
        'li',
      ])
    })

    it('sets selectedIndex when a step button is clicked', () => {
      const fixture = setupInteractive()
      buttons(fixture)[2].click()
      fixture.detectChanges()
      expect(fixture.componentInstance.selectedIndex()).toBe(2)
    })

    it('marks only the selected step with data-selected and a visually-hidden label', () => {
      const fixture = setupInteractive(1, 0)
      expect(items(fixture)[0].hasAttribute('data-selected')).toBe(true)
      expect(items(fixture)[1].hasAttribute('data-selected')).toBe(false)
      const hidden = [...items(fixture)[0].querySelectorAll('.sr-only')].map((el) => el.textContent)
      expect(hidden.some((text) => text?.includes('Selected'))).toBe(true)
      expect(
        [...items(fixture)[1].querySelectorAll('.sr-only')].some((el) =>
          el.textContent?.includes('Selected'),
        ),
      ).toBe(false)
    })

    it('keeps aria-current="step" on the active step only, regardless of the selection', () => {
      const fixture = setupInteractive(1, 0)
      expect(items(fixture)[1].getAttribute('aria-current')).toBe('step')
      expect(items(fixture)[0].getAttribute('aria-current')).toBeNull()
    })

    it('does not mark a step selected when not interactive', () => {
      const fixture = setup()
      fixture.componentRef.setInput('selectedIndex', 0)
      fixture.detectChanges()
      expect(items(fixture)[0].hasAttribute('data-selected')).toBe(false)
    })

    it('has no accessibility violations in interactive mode', async () => {
      const fixture = setupInteractive(1, 0)
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
