import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Tag } from './tag'

@Component({
  standalone: true,
  imports: [Tag],
  template: `<gbt-tag [color]="color" [removable]="removable" (removed)="onRemoved()">{{ label }}</gbt-tag>`,
})
class HostComponent {
  color = '#1a1a2e'
  removable = false
  label = 'Bug'
  removedCount = 0
  onRemoved(): void {
    this.removedCount++
  }
}

@Component({
  standalone: true,
  imports: [Tag],
  // The ancestor click listener lives in `host` metadata rather than in the
  // template so it stands in for a real clickable ancestor (e.g. `Select`'s
  // trigger) without tripping the template accessibility lint rules.
  host: { '(click)': 'ancestorClicks = ancestorClicks + 1' },
  template: `<gbt-tag [color]="color" [removable]="true" (removed)="removedCount = removedCount + 1"
    >Bug</gbt-tag
  >`,
})
class ClickableAncestorHost {
  color = '#1a1a2e'
  removedCount = 0
  ancestorClicks = 0
}

function setupTag() {
  return TestBed.createComponent(Tag)
}

describe('Tag', () => {
  it('renders its projected content', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Bug')
  })

  it('applies the given background color and a readable text color', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#1a1a2e')
    fixture.detectChanges()
    const el: HTMLElement = fixture.nativeElement.querySelector('.gbt-tag')
    expect(el.style.background).toBe('rgb(26, 26, 46)')
    expect(el.style.color).toBe('rgb(255, 255, 255)')
  })

  it('computes dark text on a light background', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#ffe680')
    fixture.detectChanges()
    const el: HTMLElement = fixture.nativeElement.querySelector('.gbt-tag')
    expect(el.style.color).toBe('rgb(0, 0, 0)')
  })

  it('throws on a malformed color rather than painting unreadable text', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#000')
    expect(() => fixture.detectChanges()).toThrowError(/6-digit hex/)
  })

  it('has no remove button by default', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#1a1a2e')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-tag__remove')).toBeNull()
  })

  it('shows a remove button when removable, labeled with removeLabel', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#1a1a2e')
    fixture.componentRef.setInput('removable', true)
    fixture.componentRef.setInput('removeLabel', 'Retirer Bug')
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-tag__remove')
    expect(button).not.toBeNull()
    expect(button.getAttribute('aria-label')).toBe('Retirer Bug')
  })

  it('labels the remove button in English by default', () => {
    const fixture = setupTag()
    fixture.componentRef.setInput('color', '#1a1a2e')
    fixture.componentRef.setInput('removable', true)
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-tag__remove')
    expect(button.getAttribute('aria-label')).toBe('Remove')
  })

  it('emits removed when the remove button is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.removable = true
    fixture.detectChanges()
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-tag__remove')
    button.click()
    expect(fixture.componentInstance.removedCount).toBe(1)
  })

  it('stops the remove click from reaching a clickable ancestor', () => {
    const fixture = TestBed.createComponent(ClickableAncestorHost)
    fixture.detectChanges()

    // A click on the chip itself does reach the ancestor — the baseline that
    // makes the assertion below meaningful (`Select` relies on this: a chip
    // click may open the panel, a remove click must not).
    const chip: HTMLElement = fixture.nativeElement.querySelector('.gbt-tag')
    chip.click()
    expect(fixture.componentInstance.ancestorClicks).toBe(1)

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.gbt-tag__remove')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    let stopPropagationCalls = 0
    const originalStopPropagation = event.stopPropagation.bind(event)
    event.stopPropagation = () => {
      stopPropagationCalls++
      originalStopPropagation()
    }
    button.dispatchEvent(event)

    expect(stopPropagationCalls).toBe(1)
    expect(fixture.componentInstance.removedCount).toBe(1)
    expect(fixture.componentInstance.ancestorClicks).toBe(1)
  })

  it('has no a11y violations without a remove button', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('has no a11y violations with a remove button', async () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.removable = true
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
