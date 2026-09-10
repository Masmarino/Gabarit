import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, vi } from 'vitest'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Tooltip } from './tooltip'

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <gbt-tooltip text="Supprimer">
      <button type="button" id="trigger">Action</button>
    </gbt-tooltip>
  `,
})
class HostComponent {}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the tooltip text after hovering for the show delay', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(400)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Supprimer')
  })

  it('does not show the tooltip if the pointer leaves before the delay elapses', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const host = fixture.nativeElement.querySelector('gbt-tooltip')
    host.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(200)
    host.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(400)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).not.toContain('Supprimer')
  })

  it('clears the pending show timer when the component is destroyed', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const host: HTMLElement = fixture.nativeElement.querySelector('gbt-tooltip')
    host.dispatchEvent(new MouseEvent('mouseenter'))
    const getRectSpy = vi.spyOn(host, 'getBoundingClientRect')

    fixture.destroy()
    vi.advanceTimersByTime(400)

    expect(getRectSpy).not.toHaveBeenCalled()
  })

  it('shows the tooltip immediately on keyboard focus, with no delay', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    fixture.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Supprimer')
  })

  describe('fade-out on hide', () => {
    function open(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>): HTMLElement {
      const host: HTMLElement = fixture.nativeElement.querySelector('gbt-tooltip')
      host.dispatchEvent(new FocusEvent('focusin'))
      fixture.detectChanges()
      return host
    }

    it('keeps the bubble in the DOM with a leaving class right after focusout, then removes it', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const host = open(fixture)

      host.dispatchEvent(new FocusEvent('focusout'))
      fixture.detectChanges()

      const bubble = fixture.nativeElement.querySelector('.gbt-tooltip__bubble')
      expect(bubble).not.toBeNull()
      expect(bubble.classList.contains('gbt-tooltip__bubble--leaving')).toBe(true)

      vi.advanceTimersByTime(120)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('.gbt-tooltip__bubble')).toBeNull()
    })

    it('hides the tooltip when Escape is pressed', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const host = open(fixture)

      host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      fixture.detectChanges()
      vi.advanceTimersByTime(120)
      fixture.detectChanges()

      expect(fixture.nativeElement.textContent).not.toContain('Supprimer')
    })

    it('cancels the pending removal if focus returns before the fade-out completes', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const host = open(fixture)

      host.dispatchEvent(new FocusEvent('focusout'))
      fixture.detectChanges()
      vi.advanceTimersByTime(60)
      host.dispatchEvent(new FocusEvent('focusin'))
      fixture.detectChanges()

      const bubble = fixture.nativeElement.querySelector('.gbt-tooltip__bubble')
      expect(bubble).not.toBeNull()
      expect(bubble.classList.contains('gbt-tooltip__bubble--leaving')).toBe(false)

      vi.advanceTimersByTime(120)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('.gbt-tooltip__bubble')).not.toBeNull()
    })

    it('clears the pending removal timer when the component is destroyed', () => {
      const fixture = TestBed.createComponent(HostComponent)
      fixture.detectChanges()
      const host = open(fixture)
      host.dispatchEvent(new FocusEvent('focusout'))
      fixture.detectChanges()

      expect(() => {
        fixture.destroy()
        vi.advanceTimersByTime(120)
      }).not.toThrow()
    })
  })

  it('defaults to the top position', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    fixture.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-tooltip__bubble').getAttribute('data-position'),
    ).toBe('top')
  })

  it('applies the provided position', () => {
    @Component({
      standalone: true,
      imports: [Tooltip],
      template: `
        <gbt-tooltip text="Supprimer" position="right">
          <button type="button">Action</button>
        </gbt-tooltip>
      `,
    })
    class RightHostComponent {}

    const fixture = TestBed.createComponent(RightHostComponent)
    fixture.detectChanges()
    fixture.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.gbt-tooltip__bubble').getAttribute('data-position'),
    ).toBe('right')
  })

  it('gives each instance a stable, unique tooltipId used as the bubble id and role="tooltip"', () => {
    const fixtureA = TestBed.createComponent(HostComponent)
    fixtureA.detectChanges()
    const fixtureB = TestBed.createComponent(HostComponent)
    fixtureB.detectChanges()

    const idA = fixtureA.debugElement.children[0].componentInstance.tooltipId
    const idB = fixtureB.debugElement.children[0].componentInstance.tooltipId
    expect(idA).not.toBe(idB)

    fixtureA.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new FocusEvent('focusin'))
    fixtureA.detectChanges()
    const bubble = fixtureA.nativeElement.querySelector('.gbt-tooltip__bubble')
    expect(bubble.id).toBe(idA)
    expect(bubble.getAttribute('role')).toBe('tooltip')
  })

  it('anchors the bubble above the trigger, horizontally centered, for the top position', () => {
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    const host: HTMLElement = fixture.nativeElement.querySelector('gbt-tooltip')
    host.getBoundingClientRect = () =>
      ({ top: 100, bottom: 130, left: 50, right: 150, width: 100, height: 30 }) as DOMRect

    host.dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()

    const bubble = fixture.nativeElement.querySelector('.gbt-tooltip__bubble')
    expect(bubble.style.top).toBe('92px')
    expect(bubble.style.left).toBe('100px')
  })

  it('anchors the bubble below the trigger for the bottom position', () => {
    @Component({
      standalone: true,
      imports: [Tooltip],
      template: `
        <gbt-tooltip text="Supprimer" position="bottom">
          <button type="button">Action</button>
        </gbt-tooltip>
      `,
    })
    class BottomHostComponent {}

    const fixture = TestBed.createComponent(BottomHostComponent)
    fixture.detectChanges()
    const host: HTMLElement = fixture.nativeElement.querySelector('gbt-tooltip')
    host.getBoundingClientRect = () =>
      ({ top: 100, bottom: 130, left: 50, right: 150, width: 100, height: 30 }) as DOMRect

    host.dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()

    const bubble = fixture.nativeElement.querySelector('.gbt-tooltip__bubble')
    expect(bubble.style.top).toBe('138px')
    expect(bubble.style.left).toBe('100px')
  })

  it('presents no accessibility violation, tooltip open', async () => {
    vi.useRealTimers()
    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()
    fixture.nativeElement.querySelector('gbt-tooltip').dispatchEvent(new FocusEvent('focusin'))
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
