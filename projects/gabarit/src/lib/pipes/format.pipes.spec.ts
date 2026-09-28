import { Component, LOCALE_ID, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../testing/expect-no-a11y-violations'
import { GbtBytesPipe, GbtDateTimePipe, GbtRelativeTimePipe } from './format.pipes'

const NOW = Date.UTC(2026, 8, 26, 12, 0, 0)
const NBSP = '\u00a0'

@Component({
  selector: 'gbt-host',
  standalone: true,
  imports: [GbtRelativeTimePipe, GbtBytesPipe, GbtDateTimePipe],
  template: `
    <p id="rel">{{ at() | gbtRelativeTime: { now: now() } }}</p>
    <p id="rel-fr">{{ at() | gbtRelativeTime: { now: now(), locale: 'fr' } }}</p>
    <p id="rel-null">{{ null | gbtRelativeTime }}</p>
    <p id="bytes">{{ size() | gbtBytes }}</p>
    <p id="bytes-opts">{{ size() | gbtBytes: { base: 1000, locale: 'fr' } }}</p>
    <p id="bytes-null">{{ null | gbtBytes }}</p>
    <p id="dt">{{ at() | gbtDateTime: { timeZone: 'UTC' } }}</p>
    <p id="dt-opts">
      {{ at() | gbtDateTime: { dateStyle: 'long', timeZone: 'UTC', locale: 'fr' } }}
    </p>
    <p id="dt-null">{{ undefined | gbtDateTime }}</p>
  `,
})
class Host {
  readonly at = signal<Date | string>(new Date(NOW - 5 * 60_000))
  readonly now = signal<number>(NOW)
  readonly size = signal(1536)
}

function setup(locale?: string) {
  TestBed.configureTestingModule({
    providers: locale ? [{ provide: LOCALE_ID, useValue: locale }] : [],
  })
  const fixture = TestBed.createComponent(Host)
  fixture.detectChanges()
  const text = (id: string) =>
    (fixture.nativeElement.querySelector(`#${id}`) as HTMLElement).textContent?.trim()
  return { fixture, text }
}

describe('gbt format pipes', () => {
  it('use Angular’s LOCALE_ID, en-US by default', () => {
    const { text } = setup()
    expect(text('rel')).toBe('5 minutes ago')
    expect(text('bytes')).toBe(`1.5${NBSP}KiB`)
    expect(text('dt')).toMatch(/^Sep 26, 2026, 11:55\sAM$/)
  })

  it('follow a fr LOCALE_ID', () => {
    const { text } = setup('fr')
    expect(text('rel')).toBe('il y a 5 minutes')
    expect(text('bytes')).toBe(`1,5${NBSP}Kio`)
    expect(text('dt')).toBe('26 sept. 2026, 11:55')
  })

  it('let the options override the locale and pass the function options through', () => {
    const { text } = setup()
    expect(text('rel-fr')).toBe('il y a 5 minutes')
    expect(text('bytes-opts')).toBe(`1,5${NBSP}ko`)
    expect(text('dt-opts')).toBe('26 septembre 2026')
  })

  it('print nothing for a missing value', () => {
    const { text } = setup()
    expect(text('rel-null')).toBe('')
    expect(text('bytes-null')).toBe('')
    expect(text('dt-null')).toBe('')
  })

  it('accept an ISO string', () => {
    const { fixture, text } = setup('fr')
    fixture.componentInstance.at.set('2026-09-26T09:00:00Z')
    fixture.detectChanges()
    expect(text('rel')).toBe('il y a 3 heures')
  })

  it('are declared pure', () => {
    for (const pipe of [GbtRelativeTimePipe, GbtBytesPipe, GbtDateTimePipe]) {
      expect((pipe as unknown as { ɵpipe: { pure: boolean } }).ɵpipe.pure).toBe(true)
    }
  })

  it('are pure: the relative time is as of the last evaluation and moves only when `now` does', () => {
    const { fixture, text } = setup()
    expect(text('rel')).toBe('5 minutes ago')

    // Time passes but no input changes: the pipe is not re-evaluated.
    vi.useFakeTimers()
    try {
      vi.setSystemTime(NOW + 3_600_000)
      vi.advanceTimersByTime(3_600_000)
    } finally {
      vi.useRealTimers()
    }
    fixture.detectChanges()
    expect(text('rel')).toBe('5 minutes ago')

    // A ticking clock passed through `now` refreshes it.
    fixture.componentInstance.now.set(NOW + 3_600_000)
    fixture.detectChanges()
    expect(text('rel')).toBe('1 hour ago')
  })

  it('re-format when the value changes', () => {
    const { fixture, text } = setup()
    fixture.componentInstance.size.set(5 * 1024 ** 2)
    fixture.detectChanges()
    expect(text('bytes')).toBe(`5${NBSP}MiB`)
  })

  it('leaves an accessible page', async () => {
    const { fixture } = setup()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
