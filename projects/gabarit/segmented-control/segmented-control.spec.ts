import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { SegmentedControl, SegmentedControlOption } from './segmented-control'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'

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
    expect(buttons(fixture).map((b) => b.textContent?.trim())).toEqual(['Jour', 'Semaine', 'Mois'])
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
    const fixture = setup([
      ...OPTIONS.slice(0, 2),
      { value: 'month', label: 'Mois', disabled: true },
    ])

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

    buttons(fixture)[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )

    expect(fixture.componentInstance.value()).toBe('day')
    expect(document.activeElement).toBe(buttons(fixture)[0])
  })

  it('moves selection and focus with ArrowLeft, wrapping before the first option', () => {
    const fixture = setup(OPTIONS, 'day')

    buttons(fixture)[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    )

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

    buttons(fixture)[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )

    expect(fixture.componentInstance.value()).toBe('month')
  })

  it('names the group via ariaLabel', () => {
    const fixture = setup()
    fixture.componentRef.setInput('ariaLabel', 'Période')
    fixture.detectChanges()
    expect(
      fixture.nativeElement.querySelector('[role="radiogroup"]').getAttribute('aria-label'),
    ).toBe('Période')
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

describe('SegmentedControl additions', () => {
  const group = (f: ReturnType<typeof setup>): HTMLElement =>
    f.nativeElement.querySelector('[role="radiogroup"]')
  const track = (f: ReturnType<typeof setup>): HTMLElement =>
    f.nativeElement.querySelector('.gbt-segmented-control')

  it("keeps today's rendering by default: no label, no modifier classes, no labelledby", () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-segmented-control__label')).toBeNull()
    expect(track(fixture).className).toBe('gbt-segmented-control')
    expect(group(fixture).hasAttribute('aria-labelledby')).toBe(false)
    expect(fixture.nativeElement.className).not.toContain('gbt-segmented-control-host')
  })

  describe('label', () => {
    it('renders a visible label and names the group with it', () => {
      const fixture = setup()
      fixture.componentRef.setInput('label', 'Period')
      fixture.detectChanges()
      const label: HTMLElement = fixture.nativeElement.querySelector(
        '.gbt-segmented-control__label',
      )
      expect(label.textContent?.trim()).toBe('Period')
      expect(group(fixture).getAttribute('aria-labelledby')).toBe(label.id)
      expect(label.id).toBeTruthy()
    })

    it('lets the visible label win over ariaLabel (one name, no duplicate)', () => {
      const fixture = setup()
      fixture.componentRef.setInput('ariaLabel', 'Hidden name')
      fixture.componentRef.setInput('label', 'Period')
      fixture.detectChanges()
      expect(group(fixture).hasAttribute('aria-label')).toBe(false)
      expect(group(fixture).hasAttribute('aria-labelledby')).toBe(true)
    })

    it('gives two controls two distinct label ids', () => {
      const a = setup()
      const b = setup()
      for (const f of [a, b]) f.componentRef.setInput('label', 'Period')
      a.detectChanges()
      b.detectChanges()
      expect(group(a).getAttribute('aria-labelledby')).not.toBe(
        group(b).getAttribute('aria-labelledby'),
      )
    })

    it('marks the host as labelled so it becomes a box', () => {
      const fixture = setup()
      fixture.componentRef.setInput('label', 'Period')
      fixture.detectChanges()
      expect(fixture.nativeElement.classList.contains('gbt-segmented-control-host--labelled')).toBe(
        true,
      )
    })
  })

  describe('fullWidth', () => {
    it('marks the host so it fills its container', () => {
      const fixture = setup()
      fixture.componentRef.setInput('fullWidth', true)
      fixture.detectChanges()
      expect(fixture.nativeElement.classList.contains('gbt-segmented-control-host--full')).toBe(
        true,
      )
    })

    it('leaves the option list, order and keyboard behaviour untouched', () => {
      const fixture = setup()
      fixture.componentRef.setInput('fullWidth', true)
      fixture.detectChanges()
      expect(buttons(fixture).map((b) => b.textContent?.trim())).toEqual([
        'Jour',
        'Semaine',
        'Mois',
      ])
      buttons(fixture)[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
      expect(fixture.componentInstance.value()).toBe('week')
    })
  })

  describe('wrap', () => {
    it('adds the wrap modifier only when asked', () => {
      const fixture = setup()
      expect(track(fixture).classList.contains('gbt-segmented-control--wrap')).toBe(false)
      fixture.componentRef.setInput('wrap', true)
      fixture.detectChanges()
      expect(track(fixture).classList.contains('gbt-segmented-control--wrap')).toBe(true)
    })

    it('keeps arrow navigation in DOM order across wrapped rows', () => {
      const fixture = setup(OPTIONS, 'month')
      fixture.componentRef.setInput('wrap', true)
      fixture.detectChanges()
      buttons(fixture)[2].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      )
      expect(fixture.componentInstance.value()).toBe('week')
    })
  })

  describe('size', () => {
    it('defaults to md and adds the sm modifier for size="sm"', () => {
      const fixture = setup()
      expect(track(fixture).classList.contains('gbt-segmented-control--sm')).toBe(false)
      fixture.componentRef.setInput('size', 'sm')
      fixture.detectChanges()
      expect(track(fixture).classList.contains('gbt-segmented-control--sm')).toBe(true)
    })
  })

  describe('tinted', () => {
    it('uses the default track unless tinted is set', () => {
      const fixture = setup()
      expect(track(fixture).classList.contains('gbt-segmented-control--tinted')).toBe(false)
      fixture.componentRef.setInput('tinted', true)
      fixture.detectChanges()
      expect(track(fixture).classList.contains('gbt-segmented-control--tinted')).toBe(true)
    })

    it('draws the tinted track with the --bg-track token, not --bg-panel', () => {
      const scss = readFileSync(
        join(process.cwd(), 'projects/gabarit/segmented-control/segmented-control.scss'),
        'utf8',
      )
      expect(scss).toMatch(/--tinted\s*\{[^}]*background:\s*var\(--bg-track\)/)
      expect(scss).toMatch(/\.gbt-segmented-control\s*\{[^}]*background:\s*var\(--bg-panel\)/)
    })
  })

  describe('accessibility', () => {
    it('has no a11y violations with a label, sm, wrap, fullWidth and tinted', async () => {
      const fixture = setup()
      for (const [name, value] of Object.entries({
        label: 'Period',
        size: 'sm',
        wrap: true,
        fullWidth: true,
        tinted: true,
      })) {
        fixture.componentRef.setInput(name, value)
      }
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })

    it('has no a11y violations with only a visible label', async () => {
      const fixture = setup()
      fixture.componentRef.setInput('label', 'Period')
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})
