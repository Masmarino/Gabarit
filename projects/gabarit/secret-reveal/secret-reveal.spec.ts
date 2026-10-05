import { Component, ErrorHandler, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { FakeClipboard, installFakeClipboard } from '../src/testing/fake-clipboard'
import { SecretReveal } from './secret-reveal'

const SECRET = 'frg_runner_9f3c1a7be2d04c58'

let fake: FakeClipboard

afterEach(() => fake?.restore())

@Component({
  standalone: true,
  imports: [SecretReveal],
  template: `<gbt-secret-reveal
    [value]="secret"
    [(revealed)]="revealed"
    label="Runner token"
    (copied)="copiedWith.push($event)"
    (copyFailed)="failures = failures + 1"
  />`,
})
class Host {
  secret = SECRET
  revealed = signal(false)
  copiedWith: string[] = []
  failures = 0
}

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    value: () => root.querySelector('.gbt-secret-reveal__value') as HTMLElement,
    toggle: () => root.querySelector('.gbt-secret-reveal__toggle button') as HTMLButtonElement,
    copy: () => root.querySelector('.gbt-secret-reveal__copy button') as HTMLButtonElement,
    status: () => root.querySelector('.gbt-copy-button__status') as HTMLElement,
  }
}

async function press(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  el: HTMLElement,
) {
  el.click()
  await fixture.whenStable()
  fixture.detectChanges()
  await fixture.whenStable()
}

describe('SecretReveal', () => {
  it('keeps the secret out of the DOM while it is masked', () => {
    fake = installFakeClipboard()
    const { root, value } = setup()

    expect(root.innerHTML).not.toContain(SECRET)
    expect(root.textContent).not.toContain(SECRET)
    const bullets = value().querySelector('[aria-hidden="true"]') as HTMLElement
    expect(bullets.textContent).toBe('•'.repeat(24))
    expect(value().querySelector('.sr-only')?.textContent).toBe('Secret hidden')
  })

  it('shows the secret, swaps the button name and hides it again', async () => {
    fake = installFakeClipboard()
    const { fixture, host, root, value, toggle } = setup()
    expect(toggle().getAttribute('aria-label')).toBe('Show the secret')

    await press(fixture, toggle())
    expect(host.revealed()).toBe(true)
    expect(value().textContent).toBe(SECRET)
    expect(toggle().getAttribute('aria-label')).toBe('Hide the secret')
    expect(root.hasAttribute('data-revealed') || root.querySelector('[data-revealed]')).toBeTruthy()

    await press(fixture, toggle())
    expect(host.revealed()).toBe(false)
    expect(root.innerHTML).not.toContain(SECRET)
  })

  it('points the toggle at the value it shows and hides', () => {
    fake = installFakeClipboard()
    const { value, toggle } = setup()

    expect(value().id).toBeTruthy()
    expect(toggle().getAttribute('aria-controls')).toBe(value().id)
  })

  it('can start revealed (a one-time secret shown on arrival)', () => {
    fake = installFakeClipboard()
    const fixture = TestBed.createComponent(SecretReveal)
    fixture.componentRef.setInput('value', SECRET)
    fixture.componentRef.setInput('revealed', true)
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('.gbt-secret-reveal__value').textContent).toBe(
      SECRET,
    )
  })

  it('draws maskLength bullets, at least one', () => {
    fake = installFakeClipboard()
    const fixture = TestBed.createComponent(SecretReveal)
    fixture.componentRef.setInput('value', SECRET)
    fixture.componentRef.setInput('maskLength', 8)
    fixture.detectChanges()
    const bullets = fixture.nativeElement.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(bullets.textContent).toBe('•'.repeat(8))

    fixture.componentRef.setInput('maskLength', 0)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[aria-hidden="true"]').textContent).toBe('•')
  })

  it('copies the real secret while it is masked, without revealing it', async () => {
    fake = installFakeClipboard()
    const { fixture, host, root, copy, status } = setup()

    await press(fixture, copy())

    expect(fake.writeText).toHaveBeenCalledWith(SECRET)
    expect(host.copiedWith).toEqual([SECRET])
    expect(host.revealed()).toBe(false)
    expect(root.innerHTML).not.toContain(SECRET)
    expect(status().textContent?.trim()).toBe('Copied')
  })

  it('reveals and selects the secret when the copy is refused', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: false })
    const { fixture, host, value, copy, status } = setup()

    await press(fixture, copy())

    expect(host.failures).toBe(1)
    expect(host.revealed()).toBe(true)
    expect(value().textContent).toBe(SECRET)
    expect(window.getSelection()?.toString()).toBe(SECRET)
    expect(status().textContent?.trim()).toBe('Copy failed, secret shown and selected')
  })

  it('drops the "Copied" message when the secret is hidden again', async () => {
    fake = installFakeClipboard()
    const { fixture, toggle, copy, status } = setup()
    await press(fixture, toggle())
    await press(fixture, copy())
    expect(status().textContent?.trim()).toBe('Copied')

    await press(fixture, toggle())

    expect(status().textContent?.trim()).toBe('')
  })

  it('names the group after its label', () => {
    fake = installFakeClipboard()
    const { root } = setup()
    const group = root.querySelector('[role="group"]') as HTMLElement
    const label = root.querySelector('.gbt-secret-reveal__label') as HTMLElement
    expect(label.textContent?.trim()).toBe('Runner token')
    expect(group.getAttribute('aria-labelledby')).toBe(label.id)
  })

  it('raises no error, reads no clipboard and never touches the selection when it only renders', () => {
    const reported: unknown[] = []
    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } },
      ],
    })
    let reads = 0
    const nav = navigator as unknown as Record<string, unknown>
    const original = Object.getOwnPropertyDescriptor(nav, 'clipboard')
    Object.defineProperty(nav, 'clipboard', {
      configurable: true,
      get() {
        reads++
        return undefined
      },
    })
    try {
      window.getSelection()?.removeAllRanges()
      const { fixture } = setup()
      fixture.destroy()
      expect(window.getSelection()?.rangeCount).toBe(0)
    } finally {
      if (original) Object.defineProperty(nav, 'clipboard', original)
      else Reflect.deleteProperty(nav, 'clipboard')
    }
    expect(reads).toBe(0)
    expect(reported).toEqual([])
  })

  it('has no accessibility violations (masked, revealed, after a copy)', async () => {
    fake = installFakeClipboard()
    const { fixture, root, toggle, copy } = setup()
    await expectNoA11yViolations(root)

    await press(fixture, toggle())
    await expectNoA11yViolations(root)

    await press(fixture, copy())
    await expectNoA11yViolations(root)
  })
})
