import { TestBed } from '@angular/core/testing'
import { Tab } from './tab'

describe('Tab', () => {
  it('is hidden until setState marks it active', () => {
    const fixture = TestBed.createComponent(Tab)
    fixture.componentRef.setInput('label', 'Un')
    fixture.detectChanges()

    expect(fixture.nativeElement.style.display).toBe('none')

    fixture.componentInstance.setState(0, true, 'gbt-tabs-test')
    fixture.detectChanges()

    expect(fixture.nativeElement.style.display).not.toBe('none')
  })

  it('exposes its label input', () => {
    const fixture = TestBed.createComponent(Tab)
    fixture.componentRef.setInput('label', 'Sécurité')
    fixture.detectChanges()

    expect(fixture.componentInstance.label()).toBe('Sécurité')
  })
})
