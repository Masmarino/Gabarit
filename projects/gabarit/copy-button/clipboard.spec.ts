import { Component, ErrorHandler } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FakeClipboard, installFakeClipboard } from '../src/testing/fake-clipboard'
import { ClipboardFeedback, copyToClipboard, selectContents } from './clipboard'

let fake: FakeClipboard

afterEach(() => {
  fake?.restore()
  vi.useRealTimers()
})

describe('copyToClipboard', () => {
  it('writes through the Clipboard API when it exists', async () => {
    fake = installFakeClipboard({ clipboard: 'available' })

    expect(await copyToClipboard('hello')).toBe(true)
    expect(fake.writeText).toHaveBeenCalledWith('hello')
    expect(fake.execCommand).not.toHaveBeenCalled()
  })

  it('falls back to execCommand when the API is absent (plain HTTP)', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })

    expect(await copyToClipboard('hello')).toBe(true)
    expect(fake.execCommand).toHaveBeenCalledWith('copy')
    // The throw-away textarea is gone.
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('falls back to execCommand when the API refuses the write', async () => {
    fake = installFakeClipboard({ clipboard: 'rejects', execCommand: true })

    expect(await copyToClipboard('hello')).toBe(true)
    expect(fake.writeText).toHaveBeenCalled()
    expect(fake.execCommand).toHaveBeenCalledWith('copy')
  })

  it("puts the temporary textarea inside the trigger's dialog, so a modal <dialog> does not inert it", async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const dialog = document.createElement('dialog')
    const button = document.createElement('button')
    dialog.appendChild(button)
    // Open, or its button can't take the focus (jsdom has no showModal()).
    dialog.setAttribute('open', '')
    document.body.appendChild(dialog)
    button.focus()
    let parentAtCopy: Element | null = null
    fake.execCommand.mockImplementation(() => {
      parentAtCopy = document.querySelector('textarea')?.parentElement ?? null
      return true
    })

    expect(await copyToClipboard('hello')).toBe(true)

    expect(parentAtCopy).toBe(dialog)
    expect(dialog.querySelector('textarea')).toBeNull()
    dialog.remove()
  })

  it('also finds a role="dialog" container, and falls back to the body without one', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const box = document.createElement('div')
    box.setAttribute('role', 'dialog')
    const button = document.createElement('button')
    box.appendChild(button)
    document.body.appendChild(box)
    button.focus()
    const parents: (Element | null)[] = []
    fake.execCommand.mockImplementation(() => {
      parents.push(document.querySelector('textarea')?.parentElement ?? null)
      return true
    })

    await copyToClipboard('a')
    button.blur()
    box.remove()
    await copyToClipboard('b')

    expect(parents[0]).toBe(box)
    expect(parents[1]).toBe(document.body)
  })

  it('resolves false when nothing can copy', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: 'absent' })
    expect(await copyToClipboard('x')).toBe(false)

    fake.restore()
    fake = installFakeClipboard({ clipboard: 'rejects', execCommand: false })
    expect(await copyToClipboard('x')).toBe(false)
  })

  it('resolves false when execCommand throws, and still cleans up', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    fake.execCommand.mockImplementation(() => {
      throw new Error('boom')
    })

    expect(await copyToClipboard('x')).toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('gives the focus and the selection back after the legacy copy', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const button = document.createElement('button')
    const paragraph = document.createElement('p')
    paragraph.textContent = 'selected text'
    document.body.append(button, paragraph)
    button.focus()
    selectContents(paragraph)

    await copyToClipboard('hello')

    expect(document.activeElement).toBe(button)
    expect(window.getSelection()?.toString()).toBe('selected text')
    button.remove()
    paragraph.remove()
  })
})

describe('selectContents', () => {
  it('selects the contents of an element and ignores null', () => {
    const el = document.createElement('code')
    el.textContent = 'abc/def'
    document.body.appendChild(el)

    selectContents(el)
    expect(window.getSelection()?.toString()).toBe('abc/def')

    expect(() => selectContents(null)).not.toThrow()
    el.remove()
  })
})

@Component({ standalone: true, template: '' })
class Host {
  readonly feedback = new ClipboardFeedback()
}

describe('ClipboardFeedback', () => {
  it('starts idle, shows copied, then goes back to idle after the delay', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    const host = TestBed.createComponent(Host).componentInstance

    expect(host.feedback.status()).toBe('idle')
    const outcome = await host.feedback.copy('abc', 2000)
    expect(outcome).toEqual({ copied: true, text: 'abc' })
    expect(host.feedback.status()).toBe('copied')

    vi.advanceTimersByTime(1999)
    expect(host.feedback.status()).toBe('copied')
    vi.advanceTimersByTime(1)
    expect(host.feedback.status()).toBe('idle')
  })

  it('keeps a failure twice as long and selects the target', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: false })
    vi.useFakeTimers()
    const host = TestBed.createComponent(Host).componentInstance
    const target = document.createElement('code')
    target.textContent = 'secret'
    document.body.appendChild(target)

    const outcome = await host.feedback.copy('secret', 1000, target)

    expect(outcome).toEqual({ copied: false, text: 'secret' })
    expect(host.feedback.status()).toBe('failed')
    expect(window.getSelection()?.toString()).toBe('secret')
    vi.advanceTimersByTime(1999)
    expect(host.feedback.status()).toBe('failed')
    vi.advanceTimersByTime(1)
    expect(host.feedback.status()).toBe('idle')
    target.remove()
  })

  it('calls a function value only when copying, and treats a throwing function as a failure', async () => {
    fake = installFakeClipboard()
    const host = TestBed.createComponent(Host).componentInstance
    const producer = vi.fn(() => 'lazy')

    expect(producer).not.toHaveBeenCalled()
    expect(await host.feedback.copy(producer, 10)).toEqual({ copied: true, text: 'lazy' })
    expect(fake.writeText).toHaveBeenCalledWith('lazy')

    const failing = await host.feedback.copy(() => {
      throw new Error('nope')
    }, 10)
    expect(failing?.copied).toBe(false)
    expect(host.feedback.status()).toBe('failed')
  })

  it('schedules nothing and reports null when the component is destroyed mid-write', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    let release!: () => void
    fake.writeText.mockImplementation(
      () => new Promise<void>((resolve) => (release = () => resolve())),
    )
    const fixture = TestBed.createComponent(Host)
    const baseline = vi.getTimerCount()
    const pending = fixture.componentInstance.feedback.copy('abc', 2000)

    fixture.destroy()
    release()

    expect(await pending).toBeNull()
    expect(fixture.componentInstance.feedback.status()).toBe('idle')
    expect(vi.getTimerCount()).toBe(baseline)
  })

  it('clears its timer on destroy and reset()', async () => {
    fake = installFakeClipboard()
    vi.useFakeTimers()
    const fixture = TestBed.createComponent(Host)
    const baseline = vi.getTimerCount()
    await fixture.componentInstance.feedback.copy('a', 2000)
    expect(vi.getTimerCount()).toBe(baseline + 1)

    fixture.componentInstance.feedback.reset()
    expect(vi.getTimerCount()).toBe(baseline)
    expect(fixture.componentInstance.feedback.status()).toBe('idle')

    await fixture.componentInstance.feedback.copy('a', 2000)
    fixture.destroy()
    expect(vi.getTimerCount()).toBe(baseline)
  })

  it('reports no error to the ErrorHandler on any path', async () => {
    const reported: unknown[] = []
    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandler, useValue: { handleError: (e: unknown) => reported.push(e) } },
      ],
    })
    fake = installFakeClipboard({ clipboard: 'rejects', execCommand: false })
    const host = TestBed.createComponent(Host).componentInstance

    await host.feedback.copy('x', 10)
    expect(reported).toEqual([])
  })
})
