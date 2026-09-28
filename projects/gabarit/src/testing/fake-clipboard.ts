/**
 * Fake clipboard globals for specs. jsdom has neither `navigator.clipboard` nor
 * `document.execCommand`, so a spec that exercises a copy widget installs its own, and MUST call
 * `restore()` in `afterEach` so no fake leaks into another spec.
 */
export interface FakeClipboard {
  /** `navigator.clipboard.writeText`, resolved (or rejected when `clipboard: 'rejects'`). */
  writeText: ReturnType<typeof vi.fn>
  /** `document.execCommand`, returning `execCommand` from the options. */
  execCommand: ReturnType<typeof vi.fn>
  restore(): void
}

export interface FakeClipboardOptions {
  /** `available`: writeText resolves; `rejects`: it rejects; `absent`: no `navigator.clipboard`. */
  clipboard?: 'available' | 'rejects' | 'absent'
  /** What `document.execCommand('copy')` returns; `undefined` removes the method (jsdom default). */
  execCommand?: boolean | 'absent'
}

export function installFakeClipboard(options: FakeClipboardOptions = {}): FakeClipboard {
  const { clipboard = 'available', execCommand = 'absent' } = options
  const nav = navigator as unknown as Record<string, unknown>
  const doc = document as unknown as Record<string, unknown>
  const hadClipboard = Object.getOwnPropertyDescriptor(nav, 'clipboard')
  const hadExec = Object.getOwnPropertyDescriptor(doc, 'execCommand')

  const writeText = vi.fn(() =>
    clipboard === 'rejects' ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(),
  )
  const exec = vi.fn(() => execCommand === true)

  if (clipboard !== 'absent') {
    Object.defineProperty(nav, 'clipboard', { value: { writeText }, configurable: true })
  }
  if (execCommand !== 'absent') {
    Object.defineProperty(doc, 'execCommand', { value: exec, configurable: true })
  }

  return {
    writeText,
    execCommand: exec,
    restore() {
      if (hadClipboard) Object.defineProperty(nav, 'clipboard', hadClipboard)
      else Reflect.deleteProperty(nav, 'clipboard')
      if (hadExec) Object.defineProperty(doc, 'execCommand', hadExec)
      else Reflect.deleteProperty(doc, 'execCommand')
    },
  }
}
