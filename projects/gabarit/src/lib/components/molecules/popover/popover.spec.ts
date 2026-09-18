import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Popover } from './popover'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Popover],
  template: `
    <gbt-popover #pop="gbtPopover" [align]="align">
      <button type="button" [attr.aria-expanded]="pop.open()" [attr.aria-controls]="pop.panelId">
        Options
      </button>
      <div popover-content>
        <p>Contenu riche</p>
        <button type="button" class="inside-action">Une action</button>
      </div>
    </gbt-popover>
  `,
})
class HostComponent {
  align: 'start' | 'end' = 'start'
}

function render() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const trigger = (fixture: ReturnType<typeof render>): HTMLButtonElement =>
  fixture.nativeElement.querySelector('button')

const panel = (fixture: ReturnType<typeof render>): HTMLElement | null =>
  fixture.nativeElement.querySelector('.gbt-popover__panel')

describe('Popover', () => {
  it('renders the trigger content, panel closed by default', () => {
    const fixture = render()
    expect(trigger(fixture).textContent?.trim()).toBe('Options')
    expect(panel(fixture)).toBeNull()
  })

  it('opens the panel when the trigger is clicked', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    expect(panel(fixture)).not.toBeNull()
    expect(fixture.nativeElement.textContent).toContain('Contenu riche')
  })

  it('closes the panel when the trigger is clicked again', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()
    trigger(fixture).click()
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('closes the panel on an outside click', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
  })

  it('does not close the panel when clicking inside its projected content', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    fixture.nativeElement.querySelector('.inside-action').click()
    fixture.detectChanges()

    expect(panel(fixture)).not.toBeNull()
  })

  it('closes the panel on Escape and returns focus to the trigger', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    trigger(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(panel(fixture)).toBeNull()
    expect(document.activeElement).toBe(trigger(fixture))
  })

  it('exposes a stable panelId consumers can wire onto their own trigger', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    const panelId = panel(fixture)!.getAttribute('id')
    expect(panelId).toMatch(/^gbt-popover-\d+$/)
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(panelId)
  })

  it('reflects the open state for a consumer-bound aria-expanded', () => {
    const fixture = render()
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false')

    trigger(fixture).click()
    fixture.detectChanges()

    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true')
  })

  it('imposes no role on the projected panel content', () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()

    expect(panel(fixture)!.getAttribute('role')).toBeNull()
  })

  it('has no a11y violations, closed', async () => {
    await expectNoA11yViolations(render().nativeElement)
  })

  it('has no a11y violations, open', async () => {
    const fixture = render()
    trigger(fixture).click()
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
