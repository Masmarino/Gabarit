import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component, ErrorHandler, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'
import { FakeClipboard, installFakeClipboard } from '../src/testing/fake-clipboard'
import { Badge, BadgeVariant } from './badge'
import { Icon } from '../icon/icon'

@Component({
  standalone: true,
  imports: [Badge],
  template: `<gbt-badge>{{ label }}</gbt-badge>`,
})
class HostComponent {
  label = 'Actif'
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

const badge = (f: ReturnType<typeof setup>): HTMLElement =>
  f.nativeElement.querySelector('.gbt-badge')

const SCSS = 'projects/gabarit/badge/badge.scss'

function setupBadge() {
  const fixture = TestBed.createComponent(Badge)
  fixture.detectChanges()
  return fixture
}

describe('Badge', () => {
  it('projects its content as the label', () => {
    const fixture = setup()
    expect(badge(fixture).textContent?.trim()).toBe('Actif')
  })

  it('defaults to the neutral variant', () => {
    const fixture = setup()
    expect(badge(fixture).getAttribute('data-variant')).toBe('neutral')
  })

  it.each<BadgeVariant>(['success', 'warning', 'error', 'info'])(
    'reflects the %s variant as a data attribute',
    (variant) => {
      const fixture = setupBadge()
      fixture.componentRef.setInput('variant', variant)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-badge').getAttribute('data-variant')).toBe(
        variant,
      )
    },
  )

  it('renders no icon by default', () => {
    const fixture = setup()
    expect(fixture.debugElement.query(By.directive(Icon))).toBeNull()
  })

  it('renders the given icon before the label', () => {
    const fixture = setupBadge()
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()

    const icon = fixture.debugElement.query(By.directive(Icon))
    expect(icon).not.toBeNull()
    expect(icon.componentInstance.name()).toBe('check')
  })

  it('has no a11y violations', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations with an icon', async () => {
    const fixture = setupBadge()
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})

describe('Badge additions', () => {
  function pill(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(Badge)
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value)
    fixture.detectChanges()
    return { fixture, el: fixture.nativeElement.querySelector('.gbt-badge') as HTMLElement }
  }

  it("keeps today's markup by default: only the variant attribute and the base class", () => {
    const { fixture, el } = pill()
    expect(el.className).toBe('gbt-badge')
    expect(
      el
        .getAttributeNames()
        .filter((name) => !name.startsWith('_ngcontent'))
        .sort(),
    ).toEqual(['class', 'data-variant'])
    expect(fixture.nativeElement.className).not.toContain('gbt-badge-host')
  })

  describe('appearance', () => {
    it('reflects outline as a data attribute and leaves filled unmarked', () => {
      expect(pill({ appearance: 'filled' }).el.hasAttribute('data-appearance')).toBe(false)
      expect(pill({ appearance: 'outline' }).el.getAttribute('data-appearance')).toBe('outline')
    })

    it.each<BadgeVariant>(['neutral', 'success', 'warning', 'error', 'info'])(
      'combines outline with the %s variant',
      (variant) => {
        const { el } = pill({ appearance: 'outline', variant })
        expect(el.getAttribute('data-variant')).toBe(variant)
        expect(el.getAttribute('data-appearance')).toBe('outline')
      },
    )
  })

  describe('size', () => {
    it('reflects sm as a data attribute and leaves md unmarked', () => {
      expect(pill({ size: 'md' }).el.hasAttribute('data-size')).toBe(false)
      expect(pill({ size: 'sm' }).el.getAttribute('data-size')).toBe('sm')
    })

    it('makes the small pill shorter than the default one (same padding rule, smaller type)', () => {
      const scss = readFileSync(join(process.cwd(), SCSS), 'utf8')
      expect(scss).toMatch(/\[data-size='sm'\]\s*\{[^}]*font-size:\s*0\.6875rem/)
    })
  })

  describe('tabularNums', () => {
    it('adds the modifier only when asked', () => {
      expect(pill().el.classList.contains('gbt-badge--tabular')).toBe(false)
      expect(pill({ tabularNums: true }).el.classList.contains('gbt-badge--tabular')).toBe(true)
    })

    it('sets tabular-nums in the stylesheet for that modifier', () => {
      const scss = readFileSync(join(process.cwd(), SCSS), 'utf8')
      expect(scss).toMatch(/--tabular\s*\{[^}]*font-variant-numeric:\s*tabular-nums/)
    })
  })

  describe('truncate', () => {
    it('marks the host and the pill only when asked', () => {
      const off = pill()
      expect(off.el.classList.contains('gbt-badge--truncate')).toBe(false)
      const on = pill({ truncate: true })
      expect(on.el.classList.contains('gbt-badge--truncate')).toBe(true)
      expect(on.fixture.nativeElement.classList.contains('gbt-badge-host--truncate')).toBe(true)
    })

    it('keeps the whole label in the DOM (ellipsis is visual only)', () => {
      @Component({
        standalone: true,
        imports: [Badge],
        template: `<gbt-badge truncate>{{ label }}</gbt-badge>`,
      })
      class Host {
        label = 'Demande de fusion commentée sur une branche protégée'
      }
      const fixture = TestBed.createComponent(Host)
      fixture.detectChanges()
      expect(fixture.nativeElement.querySelector('.gbt-badge__label').textContent).toBe(
        'Demande de fusion commentée sur une branche protégée',
      )
    })

    it('lets the host and the pill shrink and ellipsises the label in the stylesheet', () => {
      const scss = readFileSync(join(process.cwd(), SCSS), 'utf8')
      expect(scss).toMatch(/:host\(\.gbt-badge-host--truncate\)\s*\{[^}]*min-width:\s*0/)
      expect(scss).toMatch(/--truncate\s*\{[^}]*min-width:\s*0/)
      expect(scss).toMatch(/\.gbt-badge__label\s*\{[^}]*text-overflow:\s*ellipsis/)
    })
  })

  describe('accessibility', () => {
    it('has no a11y violations for every variant as an outline, small, with an icon', async () => {
      const fixture = TestBed.createComponent(Badge)
      fixture.componentRef.setInput('appearance', 'outline')
      fixture.componentRef.setInput('size', 'sm')
      fixture.componentRef.setInput('icon', 'check')
      fixture.componentRef.setInput('truncate', true)
      fixture.componentRef.setInput('tabularNums', true)
      fixture.detectChanges()
      await expectNoA11yViolations(fixture.nativeElement)
    })
  })
})

// --- Merged from the removed `gbt-code-chip`: `mono`, `maxWidth`, `fullText`, `copyable`/copy* ---

describe('Badge mono/copy/maxWidth/fullText (from CodeChip)', () => {
  @Component({
    standalone: true,
    imports: [Badge],
    template: `<gbt-badge
      mono
      [icon]="icon"
      [copyable]="copyable"
      [copyValue]="copyValue"
      [maxWidth]="maxWidth"
      [fullText]="fullText"
      copyLabel="Copy the commit SHA"
      (copied)="copiedWith.push($event)"
      (copyFailed)="failures = failures + 1"
      >a1b2c3d</gbt-badge
    >`,
  })
  class Host {
    icon: string | undefined = undefined
    copyable = false
    copyValue: string | null = null
    maxWidth: string | null = null
    fullText: string | null = null
    copiedWith: string[] = []
    failures = 0
  }

  let fake: FakeClipboard

  afterEach(() => fake?.restore())

  function setupChip(props: Partial<Host> = {}) {
    const fixture = TestBed.createComponent(Host)
    Object.assign(fixture.componentInstance, props)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      chip: () => root.querySelector('gbt-badge') as HTMLElement,
      label: () => root.querySelector('.gbt-badge__label') as HTMLElement,
      button: () => root.querySelector('button') as HTMLButtonElement | null,
      status: () => root.querySelector('[role="status"]') as HTMLElement | null,
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

  it('shows the projected text in the label and nothing interactive by default', () => {
    const { label, button, status, root } = setupChip()

    expect(label().textContent).toBe('a1b2c3d')
    expect(button()).toBeNull()
    expect(status()).toBeNull()
    expect(root.querySelector('gbt-icon')).toBeNull()
  })

  it('applies the mono look', () => {
    const { root } = setupChip()
    expect(root.querySelector('.gbt-badge')!.classList.contains('gbt-badge--mono')).toBe(true)
    const scss = readFileSync(join(process.cwd(), SCSS), 'utf8')
    expect(scss).toMatch(/--mono\s*\{[^}]*font-family:\s*var\(--gbt-font-mono\)/)
    expect(scss).toMatch(/--mono\s*\{[^}]*border:\s*1px solid var\(--gbt-hairline\)/)
  })

  it('caps its width with maxWidth and exposes the full text as a title', () => {
    const { chip, label } = setupChip({ maxWidth: '8rem', fullText: 'a1b2c3d4e5f6a7b8c9d0' })

    expect(chip().style.maxWidth).toBe('8rem')
    expect(label().getAttribute('title')).toBe('a1b2c3d4e5f6a7b8c9d0')
  })

  it('has no width cap and no title unless asked', () => {
    const { chip, label } = setupChip()

    expect(chip().style.maxWidth).toBe('')
    expect(label().hasAttribute('title')).toBe(false)
  })

  it('shows an icon before the text', () => {
    const { root } = setupChip({ icon: 'folder' })
    expect(root.querySelector('.gbt-badge__icon')).not.toBeNull()
  })

  it('adds a named copy button and a live region when copyable', () => {
    const { button, status } = setupChip({ copyable: true })

    expect(button()?.getAttribute('aria-label')).toBe('Copy the commit SHA')
    expect(button()?.getAttribute('type')).toBe('button')
    expect(status()?.getAttribute('aria-live')).toBe('polite')
    expect(status()?.textContent?.trim()).toBe('')
  })

  it('copies the text shown in the badge, announces it and emits', async () => {
    fake = installFakeClipboard()
    const { fixture, host, button, status } = setupChip({ copyable: true })

    await press(fixture, button()!)

    expect(fake.writeText).toHaveBeenCalledWith('a1b2c3d')
    expect(host.copiedWith).toEqual(['a1b2c3d'])
    expect(status()?.textContent?.trim()).toBe('Copied')
    expect(button()?.getAttribute('data-status')).toBe('copied')
  })

  it('copies copyValue (the full SHA) instead of the shown text', async () => {
    fake = installFakeClipboard()
    const full = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
    const { fixture, host, button } = setupChip({ copyable: true, copyValue: full })

    await press(fixture, button()!)

    expect(fake.writeText).toHaveBeenCalledWith(full)
    expect(host.copiedWith).toEqual([full])
  })

  it('selects the badge text and emits copyFailed when nothing can copy', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: false })
    const { fixture, host, button, status } = setupChip({ copyable: true })

    await press(fixture, button()!)

    expect(host.failures).toBe(1)
    expect(window.getSelection()?.toString()).toBe('a1b2c3d')
    expect(status()?.textContent?.trim()).toBe('Copy failed')
    expect(button()?.getAttribute('data-status')).toBe('failed')
  })

  it('falls back to execCommand without a Clipboard API', async () => {
    fake = installFakeClipboard({ clipboard: 'absent', execCommand: true })
    const { fixture, host, button } = setupChip({ copyable: true })

    await press(fixture, button()!)

    expect(fake.execCommand).toHaveBeenCalledWith('copy')
    expect(host.copiedWith).toEqual(['a1b2c3d'])
  })

  it('reads no browser global and raises no error while it only renders', () => {
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
      const { fixture } = setupChip({ copyable: true })
      fixture.destroy()
    } finally {
      if (original) Object.defineProperty(nav, 'clipboard', original)
      else Reflect.deleteProperty(nav, 'clipboard')
    }
    expect(reads).toBe(0)
    expect(reported).toEqual([])
  })

  it('has no accessibility violations (plain, with icon, copyable, after a copy)', async () => {
    fake = installFakeClipboard()
    await expectNoA11yViolations(setupChip().root)
    await expectNoA11yViolations(setupChip({ icon: 'folder' }).root)
    const copyable = setupChip({ copyable: true, fullText: 'a1b2c3d4' })
    await expectNoA11yViolations(copyable.root)
    await press(copyable.fixture, copyable.button()!)
    await expectNoA11yViolations(copyable.root)
  })
})

// --- Merged from the removed `gbt-counter`: numeric `value` mode, `max`, `hideZero`, `label` ---

describe('Badge value mode (from Counter)', () => {
  function setupCounter(inputs: Record<string, unknown> = { value: 12 }) {
    const fixture = TestBed.createComponent(Badge)
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value)
    }
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement
    return {
      fixture,
      root,
      pill: () => root.querySelector('.gbt-badge') as HTMLElement,
      text: () => root.querySelector('.gbt-badge')?.textContent,
    }
  }

  it('shows the number with the default neutral/filled/medium look by default', () => {
    const { pill, text } = setupCounter({ value: 12 })

    expect(text()).toBe('12')
    expect(pill().getAttribute('data-variant')).toBe('neutral')
    expect(pill().hasAttribute('data-appearance')).toBe(false)
    expect(pill().hasAttribute('data-size')).toBe(false)
  })

  it('shows 0 unless hideZero is set, then hides the host with the hidden attribute', () => {
    const shown = setupCounter({ value: 0 })
    expect(shown.text()).toBe('0')
    expect(shown.root.hasAttribute('hidden')).toBe(false)

    const hidden = setupCounter({ value: 0, hideZero: true })
    expect(hidden.root.hasAttribute('hidden')).toBe(true)

    const nonZero = setupCounter({ value: 3, hideZero: true })
    expect(nonZero.root.hasAttribute('hidden')).toBe(false)
  })

  it('caps the display at max as "99+", and only above it', () => {
    expect(setupCounter({ value: 120, max: 99 }).text()).toBe('99+')
    expect(setupCounter({ value: 99, max: 99 }).text()).toBe('99')
    expect(setupCounter({ value: 100, max: 99 }).text()).toBe('99+')
    expect(setupCounter({ value: 5000, max: null }).text()).toBe('5000')
    expect(setupCounter({ value: 21, max: 20 }).text()).toBe('20+')
  })

  it('cuts fractions and treats negatives and non-numbers as 0', () => {
    expect(setupCounter({ value: 3.9 }).text()).toBe('3')
    expect(setupCounter({ value: -4 }).text()).toBe('0')
    expect(setupCounter({ value: Number.NaN }).text()).toBe('0')
    expect(setupCounter({ value: Number.POSITIVE_INFINITY }).text()).toBe('0')
  })

  it("composes with variant, appearance and size (Badge's own system replaces Counter's neutral/primary appearance)", () => {
    const { pill } = setupCounter({
      value: 2,
      variant: 'success',
      appearance: 'outline',
      size: 'sm',
    })

    expect(pill().getAttribute('data-variant')).toBe('success')
    expect(pill().getAttribute('data-appearance')).toBe('outline')
    expect(pill().getAttribute('data-size')).toBe('sm')
  })

  it('reads a hidden label after the number, separated by a space', () => {
    const { pill } = setupCounter({ value: 12, label: 'open issues' })

    const label = pill().querySelector('.sr-only') as HTMLElement
    expect(label.textContent).toBe(' open issues')
    expect(pill().textContent).toBe('12 open issues')
  })

  it('has no label element without a label', () => {
    expect(setupCounter({ value: 1 }).root.querySelector('.sr-only')).toBeNull()
  })

  it('ignores projected content once value is set (numeric mode replaces it, like Counter)', () => {
    @Component({
      standalone: true,
      imports: [Badge],
      template: `<gbt-badge [value]="12">should not render</gbt-badge>`,
    })
    class Host {}
    const fixture = TestBed.createComponent(Host)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-badge').textContent).toBe('12')
  })

  it('has no accessibility violations (plain, with a variant, labelled, hidden)', async () => {
    await expectNoA11yViolations(setupCounter({ value: 12 }).root)
    await expectNoA11yViolations(setupCounter({ value: 12, variant: 'success', max: 9 }).root)
    await expectNoA11yViolations(setupCounter({ value: 12, label: 'open issues' }).root)
    await expectNoA11yViolations(setupCounter({ value: 0, hideZero: true }).root)
  })
})

@Component({
  standalone: true,
  imports: [Badge],
  template: `<h2>Pages <gbt-badge [value]="n()" hideZero /></h2>`,
})
class ValueHeadingHost {
  n = signal(0)
}

describe('Badge value mode in a heading', () => {
  it('appears when the bound count becomes non-zero', () => {
    const fixture = TestBed.createComponent(ValueHeadingHost)
    fixture.detectChanges()
    const badgeEl = fixture.nativeElement.querySelector('gbt-badge') as HTMLElement
    expect(badgeEl.hasAttribute('hidden')).toBe(true)

    fixture.componentInstance.n.set(4)
    fixture.detectChanges()
    expect(badgeEl.hasAttribute('hidden')).toBe(false)
    expect(badgeEl.textContent).toBe('4')
  })
})
