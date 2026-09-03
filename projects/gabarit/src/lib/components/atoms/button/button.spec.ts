import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Button } from './button'

describe('Button', () => {
  it('renders the given text', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Enregistrer')
  })

  it('emits click when clicked while enabled', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(true)
  })

  it('does not emit click when disabled', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('disabled', true)
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(false)
  })

  it('does not emit click while loading', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    let emitted = false
    fixture.componentInstance.clicked.subscribe(() => (emitted = true))
    fixture.detectChanges()

    fixture.nativeElement.querySelector('button').click()

    expect(emitted).toBe(false)
  })

  it('keeps the visible text label next to the spinner while loading — a sighted user should not see an unlabelled spinner', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.componentRef.setInput('loading', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-button__spinner')).not.toBeNull()
    expect(fixture.nativeElement.textContent).toContain('Enregistrer')
  })

  it('uses the English default for the loading announcement', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Loading')
  })

  it('renders an overridden loading announcement', () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Go')
    fixture.componentRef.setInput('loading', true)
    fixture.componentRef.setInput('loadingLabel', 'Chargement en cours')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Chargement en cours')
  })

  it('presents no accessibility violation', async () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', 'Enregistrer')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })

  it('hides its loading label without depending on global utilities', () => {
    const dir = join(process.cwd(), 'projects/gabarit/src/lib/components/atoms/button')
    const html = readFileSync(join(dir, 'button.html'), 'utf8')
    const scss = readFileSync(join(dir, 'button.scss'), 'utf8')
    expect(html, 'button.html no longer uses .sr-only').toContain('class="sr-only"')
    const block = /\.sr-only\s*\{([^}]*)\}/.exec(scss)
    expect(block, '.sr-only is not defined in button.scss').not.toBeNull()

    expect(block![1]).toContain('position: absolute')
    expect(block![1]).toContain('width: 1px')
    expect(block![1]).toMatch(/clip-path:|clip:/)
  })

  it('presents no violation as an icon-only button', async () => {
    const fixture = TestBed.createComponent(Button)
    fixture.componentRef.setInput('text', '')
    fixture.componentRef.setInput('iconName', 'check')
    fixture.componentRef.setInput('ariaLabel', 'Valider')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
