import { Component, ElementRef, Injector, inject } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { focusAfterRender, focusNow } from './focus-after-render'

describe('focusNow', () => {
  function dom(html: string): ElementRef<HTMLElement> {
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.appendChild(root)
    return new ElementRef(root)
  }

  it('focuses the element matching the selector', () => {
    const host = dom('<button id="a">A</button><button id="b">B</button>')
    focusNow(host, '#b')
    expect(document.activeElement).toBe(host.nativeElement.querySelector('#b'))
    host.nativeElement.remove()
  })

  it('does nothing when the selector matches no element', () => {
    const host = dom('<button id="a">A</button>')
    expect(() => focusNow(host, '#missing')).not.toThrow()
    host.nativeElement.remove()
  })

  it("focuses the target directly when it's an input or a button, even with a nestedFallback", () => {
    const host = dom('<button id="toggle">Toggle</button>')
    focusNow(host, '#toggle', { nestedFallback: 'button' })
    expect(document.activeElement).toBe(host.nativeElement.querySelector('#toggle'))
    host.nativeElement.remove()
  })

  it("falls back to the nested descendant when the target isn't itself focusable", () => {
    const host = dom('<div id="row"><span>Label</span><button>Nested</button></div>')
    focusNow(host, '#row', { nestedFallback: 'button' })
    expect(document.activeElement).toBe(host.nativeElement.querySelector('button'))
    host.nativeElement.remove()
  })

  it("focuses nothing when the target isn't focusable and has no matching descendant", () => {
    const host = dom('<div id="row"><span>Label</span></div>')
    focusNow(host, '#row', { nestedFallback: 'button' })
    expect(document.activeElement).not.toBe(host.nativeElement.querySelector('#row'))
    host.nativeElement.remove()
  })
})

@Component({
  standalone: true,
  template: `
    <h1 tabindex="-1">Heading</h1>
    <div id="row"><span>Label</span><button>Toggle</button></div>
  `,
})
class Host {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef)
  readonly injector = inject(Injector)
}

describe('focusAfterRender', () => {
  it('focuses the element once the view has flushed, not synchronously', async () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const { el, injector } = fixture.componentInstance

    focusAfterRender(el, injector, 'h1')
    expect(document.activeElement).not.toBe(el.nativeElement.querySelector('h1'))

    await fixture.whenStable()
    expect(document.activeElement).toBe(el.nativeElement.querySelector('h1'))
  })

  it('forwards nestedFallback to focusNow', async () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const { el, injector } = fixture.componentInstance

    focusAfterRender(el, injector, '#row', { nestedFallback: 'button' })
    await fixture.whenStable()

    expect(document.activeElement).toBe(el.nativeElement.querySelector('button'))
  })
})
