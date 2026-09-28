import { Component, type Provider } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { type FakeClipboard, installFakeClipboard } from '../../../testing/fake-clipboard'
import { expectNoA11yViolations } from '../../../testing/expect-no-a11y-violations'
import { type BackupCodesLabels, provideAuthLabels } from '../auth-labels'
import { BackupCodes } from './backup-codes'

const CODES = Array.from(
  { length: 10 },
  (_, i) => `${String(i).repeat(8)}abcdef01${'2'.repeat(8)}${'f'.repeat(8)}`,
)

/** Two-way binding of `acknowledged`, as a parent gating its primary action writes it. */
@Component({
  standalone: true,
  imports: [BackupCodes],
  template: `<gbt-backup-codes [codes]="codes" [(acknowledged)]="saved" />`,
})
class Host {
  codes = CODES
  saved = false
}

describe('BackupCodes', () => {
  // jsdom has no clipboard nor object URLs: fakes are put back exactly as found (spec files share one
  // global scope).
  let clipboard: FakeClipboard
  let savedCreate: typeof URL.createObjectURL | undefined
  let savedRevoke: typeof URL.revokeObjectURL | undefined

  beforeEach(() => {
    savedCreate = URL.createObjectURL
    savedRevoke = URL.revokeObjectURL
    clipboard = installFakeClipboard()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    window.getSelection()?.removeAllRanges()
    clipboard.restore()
    URL.createObjectURL = savedCreate as typeof URL.createObjectURL
    URL.revokeObjectURL = savedRevoke as typeof URL.revokeObjectURL
  })

  /** Replaces the default fake clipboard with another one. */
  function useClipboard(kind: 'rejects' | 'absent') {
    clipboard.restore()
    clipboard = installFakeClipboard({ clipboard: kind })
  }

  function setup(
    codes: string[] = CODES,
    options: { labels?: Partial<BackupCodesLabels>; providers?: Provider[] } = {},
  ) {
    TestBed.configureTestingModule({ providers: options.providers ?? [] })
    const fixture = TestBed.createComponent(BackupCodes)
    fixture.componentRef.setInput('codes', codes)
    if (options.labels) {
      fixture.componentRef.setInput('labels', options.labels)
    }
    fixture.detectChanges()
    return {
      fixture,
      component: fixture.componentInstance,
      el: fixture.nativeElement as HTMLElement,
    }
  }

  const byText = (el: HTMLElement, text: string) =>
    Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement
  const checkbox = (el: HTMLElement) =>
    el.querySelector<HTMLInputElement>('input[type="checkbox"]')!

  /** Captures the download: the object URL's blob and the anchor that was clicked. */
  function captureDownload() {
    const createObjectURL = vi.fn().mockReturnValue('blob:codes')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this)
    })
    return {
      clicked,
      revokeObjectURL,
      blob: () => createObjectURL.mock.calls[0][0] as Blob,
    }
  }

  it('lists every code, in order, in a numbered list', () => {
    const { el } = setup()

    const list = el.querySelector('ol.gbt-backup-codes__grid')!
    expect(list.getAttribute('aria-label')).toBe('Backup codes')
    const items = Array.from(list.querySelectorAll('li.gbt-backup-codes__code'))
    expect(items.length).toBe(10)
    // Two lines of two groups of 8 (a 32-character code would not fit twice on a line otherwise).
    expect(items[0].textContent?.replace(/\s+/g, '')).toBe(CODES[0])
    expect(items[9].textContent?.replace(/\s+/g, '')).toBe(CODES[9])
    const lines = Array.from(items[0].querySelectorAll('.gbt-backup-codes__line'), (line) =>
      line.textContent?.trim(),
    )
    expect(lines).toEqual(['00000000 abcdef01', '22222222 ffffffff'])
  })

  it('has a required-looking acknowledgement checkbox, unchecked, with a label', () => {
    const { el } = setup()

    expect(checkbox(el).checked).toBe(false)
    expect(el.textContent).toContain('I have saved my backup codes')
  })

  it('reports the acknowledgement through the model', () => {
    const { fixture, component, el } = setup()

    checkbox(el).click()
    fixture.detectChanges()

    expect(component.acknowledged()).toBe(true)
    checkbox(el).click()
    expect(component.acknowledged()).toBe(false)
  })

  it('binds the acknowledgement both ways with a parent', async () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement

    checkbox(el).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.saved).toBe(true)

    fixture.componentInstance.saved = false
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(checkbox(el).checked).toBe(false)
  })

  it('unticks itself when new codes come in, even when the parent reuses one signal for both sets', async () => {
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement
    checkbox(el).click()
    fixture.detectChanges()
    expect(fixture.componentInstance.saved).toBe(true)

    // A second set (a regeneration): the parent does not reset its own flag.
    fixture.componentInstance.codes = CODES.map((code) => code.toUpperCase())
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(fixture.componentInstance.saved).toBe(false)
    expect(checkbox(el).checked).toBe(false)
  })

  it('keeps the acknowledgement while the codes stay the same', async () => {
    const { fixture, component, el } = setup()
    // ngModel writes its first value asynchronously: let it land before the user ticks.
    await fixture.whenStable()
    fixture.detectChanges()
    checkbox(el).click()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(component.acknowledged()).toBe(true)
    expect(checkbox(el).checked).toBe(true)
  })

  it('copies the codes, one per line, and says so', async () => {
    const { fixture, el } = setup()

    byText(el, 'Copy codes').click()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(clipboard.writeText).toHaveBeenCalledWith(CODES.join('\n'))
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('Codes copied')
  })

  it('has one polite live region for the copy, in the DOM before any copy, right after the button it belongs to', () => {
    const { el } = setup()

    const regions = el.querySelectorAll('[role="status"]')
    expect(regions).toHaveLength(1)
    expect(regions[0].getAttribute('aria-live')).toBe('polite')
    expect(regions[0].textContent?.trim()).toBe('')
    expect(regions[0].previousElementSibling?.textContent?.trim()).toBe('Copy codes')
    // "Copy codes" first, then "Download", as before.
    const actions = Array.from(el.querySelectorAll('.gbt-backup-codes__actions button'), (button) =>
      button.textContent?.trim(),
    )
    expect(actions).toEqual(['Copy codes', 'Download'])
  })

  it('keeps the button name while it says "Codes copied" (the icon and the status change, not the label)', async () => {
    const { fixture, el } = setup()

    byText(el, 'Copy codes').click()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('Codes copied')
    expect(byText(el, 'Copy codes')).toBeTruthy()
    expect(el.querySelector('gbt-copy-button')?.getAttribute('data-status')).toBe('copied')
  })

  it('forgets the "copied" message after a moment', async () => {
    vi.useFakeTimers()
    const { fixture, el } = setup()

    byText(el, 'Copy codes').click()
    await vi.advanceTimersByTimeAsync(0)
    fixture.detectChanges()
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('Codes copied')

    await vi.advanceTimersByTimeAsync(2500)
    fixture.detectChanges()
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('')
  })

  it('selects the codes and asks to copy by hand when the clipboard refuses', async () => {
    useClipboard('rejects')
    const { fixture, el } = setup()

    byText(el, 'Copy codes').click()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Copy failed, codes selected',
    )
    expect(window.getSelection()?.toString().replace(/\s+/g, '')).toBe(CODES.join(''))
  })

  it('says the same when there is no clipboard at all (plain HTTP)', async () => {
    useClipboard('absent')
    const { fixture, el } = setup()

    byText(el, 'Copy codes').click()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Copy failed, codes selected',
    )
  })

  it('downloads a text file named backup-codes.txt holding every code', async () => {
    const download = captureDownload()
    const { el } = setup()

    byText(el, 'Download').click()

    expect(download.clicked).toHaveLength(1)
    const link = download.clicked[0]
    expect(link.download).toBe('backup-codes.txt')
    expect(link.getAttribute('href')).toBe('blob:codes')
    // Created from the injected DOCUMENT and never attached to the page.
    expect(link.ownerDocument).toBe(document)
    expect(link.isConnected).toBe(false)
    const blob = download.blob()
    expect(blob.type).toContain('text/plain')
    const text = await blob.text()
    const lines = text.split('\n')
    expect(lines[0]).toBe('Backup codes')
    expect(lines[1]).toBe('Each code can only be used once. Keep them somewhere safe.')
    for (const code of CODES) {
      expect(text).toContain(code)
    }
    expect(lines.filter((line) => CODES.includes(line)).length).toBe(10)
    expect(download.revokeObjectURL).toHaveBeenCalledWith('blob:codes')
  })

  it('names and titles the downloaded file from its labels', async () => {
    const download = captureDownload()
    const { el } = setup(CODES, {
      labels: {
        download: 'Télécharger',
        fileName: 'acme-codes-de-secours.txt',
        fileTitle: 'Acme - codes de secours',
        fileNotice: "Chaque code ne peut être utilisé qu'une seule fois.",
      },
    })

    byText(el, 'Télécharger').click()

    expect(download.clicked[0].download).toBe('acme-codes-de-secours.txt')
    const lines = (await download.blob().text()).split('\n')
    expect(lines[0]).toBe('Acme - codes de secours')
    expect(lines[1]).toBe("Chaque code ne peut être utilisé qu'une seule fois.")
  })

  it('has no primary button (the parent owns the primary action)', () => {
    const { el } = setup()

    expect(el.querySelectorAll('button.gbt-button--primary').length).toBe(0)
  })

  it('takes its strings from the labels input', () => {
    const { el } = setup(CODES, {
      labels: {
        listLabel: 'Codes de secours',
        copy: 'Copier les codes',
        acknowledge: "J'ai enregistré mes codes de secours",
      },
    })

    expect(el.querySelector('ol')?.getAttribute('aria-label')).toBe('Codes de secours')
    expect(byText(el, 'Copier les codes')).toBeTruthy()
    expect(byText(el, 'Download')).toBeTruthy()
    expect(el.textContent).toContain("J'ai enregistré mes codes de secours")
  })

  it('takes its strings from provideAuthLabels, under the labels input', async () => {
    const { fixture, el } = setup(CODES, {
      providers: [provideAuthLabels({ backupCodes: { copy: 'Copier', copied: 'Codes copiés' } })],
      labels: { copy: 'Copier les codes' },
    })

    byText(el, 'Copier les codes').click()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe('Codes copiés')
  })

  it('has no a11y violations, before and after the acknowledgement', async () => {
    const { fixture, el } = setup()
    await expectNoA11yViolations(el)

    checkbox(el).click()
    fixture.detectChanges()
    await expectNoA11yViolations(el)
  })
})
