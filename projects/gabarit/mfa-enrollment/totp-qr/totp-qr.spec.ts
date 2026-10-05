import type { Provider } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { type FakeClipboard, installFakeClipboard } from '../../src/testing/fake-clipboard'
import { expectNoA11yViolations } from '../../src/testing/expect-no-a11y-violations'
import { type TotpQrLabels, provideAuthLabels } from '../../auth/auth-labels'
import { FAKE_QR_DATA_URL, fakeQrRenderer } from '../../auth/testing/fake-ports'
import { TOTP_QR_RENDERER, TotpQr, type TotpQrRenderer } from './totp-qr'

const URL = 'otpauth://totp/Acme:admin?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
const SECRET = 'JBSWY3DPEHPK3PXP'

// The renderer's promise chain is not tracked by `whenStable`: let it settle.
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 10))

describe('TotpQr', () => {
  let clipboard: FakeClipboard | undefined

  afterEach(() => {
    window.getSelection()?.removeAllRanges()
    clipboard?.restore()
    clipboard = undefined
  })

  /** `render`: the TOTP_QR_RENDERER to provide; `null` provides none. */
  async function setup(
    options: {
      render?: TotpQrRenderer | null
      url?: string
      secret?: string
      labels?: Partial<TotpQrLabels>
      providers?: Provider[]
    } = {},
  ) {
    const render = options.render === undefined ? fakeQrRenderer : options.render
    TestBed.configureTestingModule({
      providers: [
        ...(render ? [{ provide: TOTP_QR_RENDERER, useValue: render }] : []),
        ...(options.providers ?? []),
      ],
    })
    const fixture = TestBed.createComponent(TotpQr)
    fixture.componentRef.setInput('otpauthUrl', options.url ?? URL)
    fixture.componentRef.setInput('secret', options.secret ?? SECRET)
    if (options.labels) {
      fixture.componentRef.setInput('labels', options.labels)
    }
    fixture.detectChanges()
    await settle()
    fixture.detectChanges()
    return { fixture, el: fixture.nativeElement as HTMLElement }
  }

  it('renders the otpauth URL as a QR image with an accessible name', async () => {
    const render = vi.fn(fakeQrRenderer)
    const { el } = await setup({ render })

    expect(render).toHaveBeenCalledExactlyOnceWith(URL, {
      width: 448,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    const img = el.querySelector<HTMLImageElement>('.gbt-totp-qr__frame img')!
    expect(img.getAttribute('src')).toBe(FAKE_QR_DATA_URL)
    expect(img.getAttribute('alt')).toBe('QR code to scan with your authenticator app')
    expect(el.querySelector('.gbt-totp-qr__frame')?.hasAttribute('aria-busy')).toBe(false)
    expect(el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe(
      'Or enter this key in your app',
    )
  })

  it('shows the secret in monospace with a copy button that copies the raw secret', async () => {
    const { el } = await setup()

    expect(el.querySelector('code')?.textContent?.trim()).toBe(SECRET)
    expect(el.querySelector('button[aria-label="Copy the setup key"]')).toBeTruthy()
  })

  it('copies the raw secret and says "Copied" in a polite status', async () => {
    clipboard = installFakeClipboard()
    const { fixture, el } = await setup()
    const status = el.querySelector('gbt-copy-field [role="status"]') as HTMLElement
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.textContent?.trim()).toBe('')

    el.querySelector<HTMLButtonElement>('button[aria-label="Copy the setup key"]')!.click()
    await fixture.whenStable()
    await settle()
    fixture.detectChanges()

    expect(clipboard.writeText).toHaveBeenCalledExactlyOnceWith(SECRET)
    expect(status.textContent?.trim()).toBe('Copied')
  })

  it('selects the secret for a manual copy, and says so, when the clipboard is unavailable', async () => {
    clipboard = installFakeClipboard({ clipboard: 'absent' })
    const { fixture, el } = await setup()

    el.querySelector<HTMLButtonElement>('button[aria-label="Copy the setup key"]')!.click()
    await fixture.whenStable()
    await settle()
    fixture.detectChanges()

    expect(el.querySelector('gbt-copy-field [role="status"]')?.textContent?.trim()).toBe(
      'Copy failed, key selected',
    )
    expect(window.getSelection()?.toString()).toBe(SECRET)
  })

  it('keeps a placeholder of the final size while the QR is being generated', async () => {
    const { el } = await setup({ render: () => new Promise<string>(() => undefined) })

    expect(el.querySelector('.gbt-totp-qr__frame img')).toBeNull()
    expect(el.querySelector('.gbt-totp-qr__frame')?.getAttribute('aria-busy')).toBe('true')
    expect(el.querySelector('.gbt-totp-qr__fallback')).toBeNull()
  })

  it('falls back to the secret alone when the QR cannot be generated', async () => {
    const { el } = await setup({ render: () => Promise.reject(new Error('no canvas')) })

    expect(el.querySelector('.gbt-totp-qr__frame')).toBeNull()
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('[role="status"].gbt-totp-qr__fallback')?.textContent?.trim()).toBe(
      'The QR code could not be displayed: enter the key below in your app.',
    )
    expect(el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe('Setup key')
    expect(el.querySelector('code')?.textContent?.trim()).toBe(SECRET)
  })

  it('falls back too when a renderer throws instead of rejecting', async () => {
    const { el } = await setup({
      render: () => {
        throw new Error('no canvas')
      },
    })

    expect(el.querySelector('.gbt-totp-qr__frame')).toBeNull()
    expect(el.querySelector('[role="status"].gbt-totp-qr__fallback')).toBeTruthy()
  })

  it('shows the fallback when the application provides no renderer', async () => {
    const { el } = await setup({ render: null })

    expect(el.querySelector('.gbt-totp-qr__frame')).toBeNull()
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('[role="status"].gbt-totp-qr__fallback')?.textContent).toContain(
      'QR code',
    )
    expect(el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe('Setup key')
    expect(el.querySelector('code')?.textContent?.trim()).toBe(SECRET)
  })

  it('regenerates the QR when the URL changes and ignores a stale answer', async () => {
    let resolveFirst!: (value: string) => void
    const render = vi
      .fn<TotpQrRenderer>()
      .mockReturnValueOnce(new Promise<string>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce('data:image/png;base64,SECOND')
    const { fixture, el } = await setup({ render })
    const other = 'otpauth://totp/Acme:admin?secret=OTHER'

    fixture.componentRef.setInput('otpauthUrl', other)
    fixture.detectChanges()
    await settle()
    resolveFirst('data:image/png;base64,FIRST')
    await settle()
    fixture.detectChanges()

    expect(render).toHaveBeenCalledTimes(2)
    expect(render.mock.calls[1][0]).toBe(other)
    expect(el.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,SECOND')
  })

  it('ignores a stale failure too: an older render that rejects late leaves the newer QR', async () => {
    let rejectFirst!: (error: Error) => void
    const render = vi
      .fn<TotpQrRenderer>()
      .mockReturnValueOnce(new Promise<string>((_resolve, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce('data:image/png;base64,SECOND')
    const { fixture, el } = await setup({ render })

    fixture.componentRef.setInput('otpauthUrl', 'otpauth://totp/Acme:admin?secret=OTHER')
    fixture.detectChanges()
    await settle()
    rejectFirst(new Error('late'))
    await settle()
    fixture.detectChanges()

    expect(el.querySelector('.gbt-totp-qr__fallback')).toBeNull()
    expect(el.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,SECOND')
  })

  it('takes its strings from the labels input', async () => {
    const { el } = await setup({
      labels: {
        imageAlt: 'QR code à scanner avec votre application d’authentification',
        secretLabel: 'Ou saisissez cette clé dans votre application',
        copyLabel: 'Copier la clé de configuration',
      },
    })

    expect(el.querySelector('img')?.getAttribute('alt')).toBe(
      'QR code à scanner avec votre application d’authentification',
    )
    expect(el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe(
      'Ou saisissez cette clé dans votre application',
    )
    expect(el.querySelector('button[aria-label="Copier la clé de configuration"]')).toBeTruthy()
  })

  it('takes its strings from provideAuthLabels, under the labels input', async () => {
    const { el } = await setup({
      render: null,
      providers: [
        provideAuthLabels({
          totpQr: { fallback: 'Le QR code n’a pas pu être affiché.', fallbackSecretLabel: 'Clé' },
        }),
      ],
      labels: { fallbackSecretLabel: 'Clé de configuration' },
    })

    expect(el.querySelector('.gbt-totp-qr__fallback')?.textContent?.trim()).toBe(
      'Le QR code n’a pas pu être affiché.',
    )
    // The input wins over the application's labels.
    expect(el.querySelector('.gbt-totp-qr__label')?.textContent?.trim()).toBe(
      'Clé de configuration',
    )
  })

  it('has no a11y violations with the QR, while drawing, and in the fallback', async () => {
    await expectNoA11yViolations((await setup()).el)
    TestBed.resetTestingModule()
    await expectNoA11yViolations(
      (await setup({ render: () => new Promise<string>(() => undefined) })).el,
    )
    TestBed.resetTestingModule()
    await expectNoA11yViolations((await setup({ render: null })).el)
  })
})
