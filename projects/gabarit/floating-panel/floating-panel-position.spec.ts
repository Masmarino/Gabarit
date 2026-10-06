import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { floatingPanelAnchor, followPageScroll } from './floating-panel-position'

function trigger(rect: Partial<DOMRect>): HTMLElement {
  const el = document.createElement('button')
  el.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  })
  return el
}

describe('floatingPanelAnchor', () => {
  it('resolves nothing while closed, even with a trigger in the DOM', () => {
    expect(floatingPanelAnchor(false, trigger({ bottom: 100, left: 10 }))).toBeNull()
  })

  it("resolves nothing while open if the trigger isn't in the DOM yet", () => {
    expect(floatingPanelAnchor(true, null)).toBeNull()
  })

  it("anchors 6px below the trigger's bottom edge, at its left edge, by default", () => {
    const anchor = floatingPanelAnchor(true, trigger({ bottom: 100, left: 10, width: 200 }))
    expect(anchor).toEqual({
      rect: expect.objectContaining({ bottom: 100, left: 10, width: 200 }),
      bottom: 106,
      left: 10,
    })
  })

  it('extends the anchor past the trigger when anchorBottom says to', () => {
    const anchor = floatingPanelAnchor(true, trigger({ bottom: 40, left: 10 }), () => 100)
    expect(anchor?.bottom).toBe(106)
  })

  it("keeps the trigger's own bottom edge when anchorBottom returns something smaller", () => {
    const anchor = floatingPanelAnchor(true, trigger({ bottom: 100, left: 10 }), (rect) =>
      Math.max(rect.bottom, 40),
    )
    expect(anchor?.bottom).toBe(106)
  })
})

describe('followPageScroll', () => {
  @Component({ standalone: true, template: '' })
  class Panel {
    follows = 0
    constructor() {
      followPageScroll(() => this.follows++)
    }
  }

  it("follows the window's scroll, and a scrolling container's, whose scroll events don't bubble", () => {
    const fixture = TestBed.createComponent(Panel)
    const sheet = document.body.appendChild(document.createElement('main'))

    window.dispatchEvent(new Event('scroll'))
    document.dispatchEvent(new Event('scroll'))
    sheet.dispatchEvent(new Event('scroll', { bubbles: false }))

    expect(fixture.componentInstance.follows).toBe(3)
    sheet.remove()
  })

  it('stops with its component', () => {
    const fixture = TestBed.createComponent(Panel)
    const panel = fixture.componentInstance
    fixture.destroy()

    document.body.dispatchEvent(new Event('scroll', { bubbles: false }))

    expect(panel.follows).toBe(0)
  })
})
