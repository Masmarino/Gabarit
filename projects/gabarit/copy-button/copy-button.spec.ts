import { Component, ErrorHandler, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FakeClipboard, installFakeClipboard } from '../src/testing/fake-clipboard'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { CopyButton, CopyValue } from './copy-button'

@Component({
  standalone: true,
  imports: [CopyButton],
  template: `
    <code #code>{{ shown() }}</code>
    <gbt-copy-button
      [value]="value()"
      [text]="text()"
      [ariaLabel]="label()"
      [disabled]="disabled()"
      [selectTarget]="code"
      [feedbackMs]="1000"
      (copied)="copiedWith.push($event)"
      (copyFailed)="failures = failures + 1"
    />
  `,
})
class Host {
  value = signal<CopyValue>('git clone https://example.test/a.git')
  shown = signal('git clone https://example.test/a.git')
  text = signal('')
  label = signal<string | null>(null)
  disabled = signal(false)
  copiedWith: string[] = []
  failures = 0
}

let fake: FakeClipboard

afterEach(() => {
  fake?.restore()
  vi.useRealTimers()
})

function setup() {
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    button: () => root.querySelector('button') as HTMLButtonElement,
    status: () => root.querySelector('.gbt-copy-button__status') as HTMLElement,
  }
}

// Microtasks only: `whenStable()` never settles under fake timers.
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

async function press(fixture: { detectChanges(): void }, el: HTMLElement) {
  el.click()
  await flush()
  fixture.detectChanges()
}

describe('CopyButton', () => {
  it('renders an icon-only button named "Copy" and an empty live region that is always there', () => {
    fake = installFakeClipboard()
    const { button, status } = setup()

    expect(button().getAttribute('aria-label')).toBe('Copy')
    expect(button().classList.contains('gbt-button--icon-only')).toBe(true)
    expect(button().querySelector('gbt-icon')).not.toBeNull()
    expect(status().getAttribute('role')).toBe('status')
    expect(status().getAttribute('aria-live')).toBe('polite')
    expect(status().textContent?.trim()).toBe('')
    expect(status().getAttribute('data-status')).toBe('idle')
  })

  it('takes its name from ariaLabel, or from the visible text when there is one', () => {
    fake = installFakeClipboard()
    const { fixture, host, button } = setup()

    host.label.set('Copy the clone URL')
    fixture.detectChanges()
    expect(button().getAttribute('aria-label')).toBe('Copy the clone URL')

    host.label.set(null)
    host.text.set('Copy codes')
    fixture.detectChanges()
    expect(button().hasAttribute('aria-label')).toBe(false)
    expect(button().textContent).toContain('Copy codes')
    expect(button().classList.contains('gbt-button--icon-only')).toBe(false)
  })

  it('copies the value, announces "Copied", swaps the icon, emits, then goes back to idle', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    const { fixture, host, root, button, status } = setup()

    await press(fixture, button())

    expect(fake.writeText).toHaveBeenCalledWith('git clone https://example.test/a.git')
    expect(host.copiedWith).toEqual(['git clone https://example.test/a.git'])
    expect(status().textContent?.trim()).toBe('Copied')
    expect(status().getAttribute('data-status')).toBe('copied')
    expect(root.querySelector('gbt-copy-button')?.getAttribute('data-status')).toBe('copied')
    // The name never changes: the outcome is told by the live region.
    expect(button().getAttribute('aria-label')).toBe('Copy')

    vi.advanceTimersByTime(1000)
    fixture.detectChanges()
    expect(status().textContent?.trim()).toBe('')
    expect(status().getAttribute('data-status')).toBe('idle')
  })

  it('calls a function value only when pressed', async () => {
    fake = installFakeClipboard()
    const producer = vi.fn(() => 'file body')
    const { fixture, host, button } = setup()
    host.value.set(producer)
    fixture.detectChanges()
    expect(producer).not.toHaveBeenCalled()

    await press(fixture, button())

    expect(producer).toHaveBeenCalledTimes(1)
    expect(fake.writeText).toHaveBeenCalledWith('file body')
    expect(host.copiedWith).toEqual(['file body'])
  })

  it('falls back to execCommand when there is no Clipboard API', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const { fixture, host, button, status } = setup()

    await press(fixture, button())

    expect(fake.execCommand).toHaveBeenCalledWith('copy')
    expect(host.copiedWith.length).toBe(1)
    expect(status().textContent?.trim()).toBe('Copied')
  })

  it('reports a failure: copyFailed, the message, the alert icon, and the target is selected', async () => {
    fake = installFakeClipboard({ clipboard: 'rejects', execCommand: false })
    const { fixture, host, root, button, status } = setup()

    await press(fixture, button())

    expect(host.failures).toBe(1)
    expect(host.copiedWith).toEqual([])
    expect(status().textContent?.trim()).toBe('Copy failed')
    expect(status().getAttribute('data-status')).toBe('failed')
    expect(window.getSelection()?.toString()).toBe(root.querySelector('code')?.textContent)
  })

  it('does nothing when disabled', async () => {
    fake = installFakeClipboard()
    const { fixture, host, button } = setup()
    host.disabled.set(true)
    fixture.detectChanges()

    await press(fixture, button())

    expect(fake.writeText).not.toHaveBeenCalled()
    expect(host.copiedWith).toEqual([])
  })

  it('applies its message inputs and feedback placement', async () => {
    fake = installFakeClipboard()
    const fixture = TestBed.createComponent(CopyButton)
    fixture.componentRef.setInput('value', 'abc')
    fixture.componentRef.setInput('copiedText', 'Copié')
    fixture.componentRef.setInput('feedback', 'inline')
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    await press(fixture, root.querySelector('button') as HTMLButtonElement)

    const status = root.querySelector('.gbt-copy-button__status') as HTMLElement
    expect(status.textContent?.trim()).toBe('Copié')
    expect(status.getAttribute('data-feedback')).toBe('inline')
  })

  it('drops a stale "Copied" when the value changes, but not when the value is a function', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    const { fixture, host, button, status } = setup()

    await press(fixture, button())
    expect(status().getAttribute('data-status')).toBe('copied')

    host.value.set('another value')
    fixture.detectChanges()
    expect(status().getAttribute('data-status')).toBe('idle')
    expect(status().textContent?.trim()).toBe('')

    host.value.set(() => 'lazy')
    fixture.detectChanges()
    await press(fixture, button())
    host.value.set(() => 'lazy again')
    fixture.detectChanges()
    expect(status().getAttribute('data-status')).toBe('copied')
  })

  it('a second press restarts the message timer', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    const { fixture, button, status } = setup()

    await press(fixture, button())
    vi.advanceTimersByTime(800)
    await press(fixture, button())
    vi.advanceTimersByTime(800)
    fixture.detectChanges()
    expect(status().getAttribute('data-status')).toBe('copied')
    vi.advanceTimersByTime(200)
    fixture.detectChanges()
    expect(status().getAttribute('data-status')).toBe('idle')
  })

  describe('browser globals', () => {
    it('never reads navigator.clipboard or execCommand while it only renders', () => {
      const reads: string[] = []
      const nav = navigator as unknown as Record<string, unknown>
      const original = Object.getOwnPropertyDescriptor(nav, 'clipboard')
      Object.defineProperty(nav, 'clipboard', {
        configurable: true,
        get() {
          reads.push('clipboard')
          return { writeText: () => Promise.resolve() }
        },
      })
      try {
        const reported: unknown[] = []
        TestBed.configureTestingModule({
          providers: [
            { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } },
          ],
        })
        const fixture = TestBed.createComponent(CopyButton)
        fixture.detectChanges()
        fixture.destroy()
        expect(reads).toEqual([])
        expect(reported).toEqual([])
      } finally {
        if (original) Object.defineProperty(nav, 'clipboard', original)
        else Reflect.deleteProperty(nav, 'clipboard')
      }
    })

    it('emits nothing and raises nothing when destroyed while the write is pending', async () => {
      fake = installFakeClipboard()
      vi.useFakeTimers()
      let release!: () => void
      fake.writeText.mockImplementation(
        () => new Promise<void>((resolve) => (release = () => resolve())),
      )
      const reported: unknown[] = []
      TestBed.configureTestingModule({
        providers: [
          { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } },
        ],
      })
      const { fixture, host, button } = setup()

      button().click()
      fixture.destroy()
      release()
      await flush()
      // Whatever timer the pending write would have started must not fire (or throw) now.
      vi.advanceTimersByTime(10_000)
      await flush()

      expect(host.copiedWith).toEqual([])
      expect(reported).toEqual([])
    })
  })

  it('has no accessibility violations (idle, copied, failed, with text)', async () => {
    fake = installFakeClipboard()
    const { fixture, host, root, button } = setup()
    await expectNoA11yViolations(root)

    await press(fixture, button())
    await expectNoA11yViolations(root)

    fake.restore()
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: false })
    host.text.set('Copy')
    fixture.detectChanges()
    await press(fixture, button())
    await expectNoA11yViolations(root)
  })
})
