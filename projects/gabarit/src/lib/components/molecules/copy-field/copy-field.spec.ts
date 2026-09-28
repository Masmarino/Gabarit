import { Component, ErrorHandler } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { FakeClipboard, installFakeClipboard } from '../../../../testing/fake-clipboard'
import { CopyField } from './copy-field'

const URL_VALUE = 'https://forge.example.test/atelier/gabarit.git'

let fake: FakeClipboard

afterEach(() => fake?.restore())

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CopyField)
  fixture.componentRef.setInput('value', URL_VALUE)
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value)
  }
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return {
    fixture,
    root,
    value: () => root.querySelector('.gbt-copy-field__value') as HTMLElement,
    button: () => root.querySelector('button') as HTMLButtonElement,
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
}

describe('CopyField', () => {
  it('shows the value in a <code> whose text is exactly the value', () => {
    fake = installFakeClipboard()
    const { value } = setup()

    expect(value().tagName).toBe('CODE')
    expect(value().textContent).toBe(URL_VALUE)
  })

  it('offers a break after each path separator with <wbr>, but not inside "//"', () => {
    fake = installFakeClipboard()
    const { value } = setup()

    const before = Array.from(value().querySelectorAll('wbr')).map(
      (wbr) => wbr.previousSibling?.textContent,
    )
    expect(before).toEqual(['https://forge.example.test/', 'atelier/', 'gabarit.git'])
  })

  it('wraps nowhere with wrapAt null, and where a custom pattern says', () => {
    fake = installFakeClipboard()
    const none = setup({ wrapAt: null })
    expect(none.value().querySelectorAll('wbr').length).toBe(1) // the single segment's own <wbr>
    expect(none.value().textContent).toBe(URL_VALUE)

    const custom = setup({ value: 'a-b-c', wrapAt: /(?<=-)/ })
    expect(custom.value().textContent).toBe('a-b-c')
    expect(custom.value().querySelectorAll('wbr').length).toBe(3)
  })

  it('keeps the text intact whatever the pattern: a capturing group or a matched separator', () => {
    fake = installFakeClipboard()
    const grouped = setup({ value: 'a-b-c', wrapAt: /(-)/ })
    expect(grouped.value().textContent).toBe('a-b-c')
    expect(grouped.value().querySelectorAll('wbr').length).toBe(3)

    const separator = setup({ value: 'x/y/z', wrapAt: /\// })
    expect(separator.value().textContent).toBe('x/y/z')
    expect(
      Array.from(separator.value().querySelectorAll('wbr')).map(
        (w) => w.previousSibling?.textContent,
      ),
    ).toEqual(['x/', 'y/', 'z'])
  })

  it('names its copy button "Copy" and takes another name from copyLabel', () => {
    fake = installFakeClipboard()
    expect(setup().button().getAttribute('aria-label')).toBe('Copy')
    expect(
      setup({ copyLabel: "Copier l'URL de clonage" }).button().getAttribute('aria-label'),
    ).toBe("Copier l'URL de clonage")
  })

  it('copies the value, announces it and emits copied', async () => {
    fake = installFakeClipboard()
    const { fixture, button, status } = setup({ copiedText: 'Copié' })
    const copied: string[] = []
    fixture.componentInstance.copied.subscribe((v: string) => copied.push(v))

    await press(fixture, button())

    expect(fake.writeText).toHaveBeenCalledWith(URL_VALUE)
    expect(copied).toEqual([URL_VALUE])
    expect(status().textContent?.trim()).toBe('Copié')
    expect(status().getAttribute('role')).toBe('status')
  })

  it('selects the whole value when the copy is refused, and emits copyFailed', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: false })
    const { fixture, button, status } = setup()
    let failures = 0
    fixture.componentInstance.copyFailed.subscribe(() => failures++)

    await press(fixture, button())

    expect(failures).toBe(1)
    expect(window.getSelection()?.toString()).toBe(URL_VALUE)
    expect(status().textContent?.trim()).toBe('Copy failed, value selected')
  })

  it('works through the execCommand fallback when there is no Clipboard API', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const { fixture, button, status } = setup()

    await press(fixture, button())

    expect(fake.execCommand).toHaveBeenCalledWith('copy')
    expect(status().textContent?.trim()).toBe('Copied')
  })

  it('groups the field under its label when there is one, and only then', () => {
    fake = installFakeClipboard()
    const plain = setup()
    expect(plain.root.querySelector('[role="group"]')).toBeNull()
    expect(plain.root.querySelector('.gbt-copy-field__label')).toBeNull()

    const labelled = setup({ label: 'Clone URL' })
    const group = labelled.root.querySelector('[role="group"]') as HTMLElement
    const label = labelled.root.querySelector('.gbt-copy-field__label') as HTMLElement
    expect(label.textContent?.trim()).toBe('Clone URL')
    expect(group.getAttribute('aria-labelledby')).toBe(label.id)
  })

  it('reads no browser global and raises no error when it only renders', () => {
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
      const { fixture } = setup()
      fixture.destroy()
    } finally {
      if (original) Object.defineProperty(nav, 'clipboard', original)
      else Reflect.deleteProperty(nav, 'clipboard')
    }
    expect(reads).toBe(0)
    expect(reported).toEqual([])
  })

  it('has no accessibility violations (plain, labelled, after a copy)', async () => {
    fake = installFakeClipboard()
    const plain = setup()
    await expectNoA11yViolations(plain.root)

    const labelled = setup({ label: 'Clone URL' })
    await expectNoA11yViolations(labelled.root)
    await press(labelled.fixture, labelled.button())
    await expectNoA11yViolations(labelled.root)
  })
})

@Component({ standalone: true, imports: [CopyField], template: `<gbt-copy-field [value]="v" />` })
class Host {
  v = URL_VALUE
}

describe('CopyField in a template', () => {
  it('renders inside a host component', () => {
    fake = installFakeClipboard()
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-copy-field__value').textContent).toBe(
      URL_VALUE,
    )
  })
})
