import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, vi } from 'vitest'
import { GbtToastService } from './toast.service'

describe('GbtToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    TestBed.configureTestingModule({})
    return TestBed.inject(GbtToastService)
  }

  it('is provided in root and starts empty', () => {
    const service = setup()

    expect(service.toasts()).toEqual([])
    expect(TestBed.inject(GbtToastService)).toBe(service)
  })

  it('show() adds a toast with the message and kind, and returns its id', () => {
    const service = setup()

    const id = service.show('Token revoked', 'error')

    expect(service.toasts()).toEqual([
      { id, variant: 'error', message: 'Token revoked', duration: 5000 },
    ])
  })

  it('defaults the kind to success', () => {
    const service = setup()

    service.show('Done')

    expect(service.toasts()[0].variant).toBe('success')
  })

  it('accepts every kind', () => {
    const service = setup()

    for (const kind of ['success', 'error', 'info', 'warning'] as const) {
      service.show(kind, kind)
    }

    expect(service.toasts().map((toast) => toast.variant)).toEqual([
      'success',
      'error',
      'info',
      'warning',
    ])
  })

  it('gives every toast a unique id, in insertion order', () => {
    const service = setup()

    const first = service.show('first')
    const second = service.show('second')

    expect(first).not.toBe(second)
    expect(service.toasts().map((toast) => toast.message)).toEqual(['first', 'second'])
  })

  it('does not need crypto.randomUUID (missing outside secure contexts)', () => {
    const service = setup()
    const original = globalThis.crypto.randomUUID
    Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: undefined })
    try {
      expect(() => service.show('works over http')).not.toThrow()
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: original,
      })
    }
  })

  it('dismisses a toast by itself after the default 5 s', () => {
    const service = setup()
    service.show('bye')

    vi.advanceTimersByTime(4999)
    expect(service.toasts().length).toBe(1)

    vi.advanceTimersByTime(1)
    expect(service.toasts()).toEqual([])
  })

  it('honours the duration of the toast', () => {
    const service = setup()
    service.show('quick', 'info', { duration: 1000 })
    service.show('slow', 'info', { duration: 8000 })

    vi.advanceTimersByTime(1000)
    expect(service.toasts().map((toast) => toast.message)).toEqual(['slow'])

    vi.advanceTimersByTime(7000)
    expect(service.toasts()).toEqual([])
  })

  it('follows defaultDuration for the toasts shown afterwards', () => {
    const service = setup()
    service.defaultDuration.set(2000)

    service.show('short')
    vi.advanceTimersByTime(2000)

    expect(service.toasts()).toEqual([])
  })

  it('keeps a toast with duration 0 or Infinity until it is dismissed', () => {
    const service = setup()
    const stays = service.show('blocking', 'error', { duration: 0 })
    service.show('forever', 'warning', { duration: Infinity })

    vi.advanceTimersByTime(600_000)
    expect(service.toasts().length).toBe(2)

    service.dismiss(stays)
    expect(service.toasts().map((toast) => toast.message)).toEqual(['forever'])
  })

  it('dismiss() removes only the toast with the id, and cancels its timer', () => {
    const service = setup()
    const first = service.show('first')
    const second = service.show('second')

    service.dismiss(first)

    expect(service.toasts().map((toast) => toast.id)).toEqual([second])
    // A stale timer would fire here on an unrelated toast: none may be left for `first`.
    expect(vi.getTimerCount()).toBe(1)
  })

  it('dismiss() with an unknown id changes nothing', () => {
    const service = setup()
    service.show('kept')
    const before = service.toasts()

    service.dismiss('nope')

    expect(service.toasts()).toBe(before)
  })

  it('clear() removes every toast and every timer', () => {
    const service = setup()
    service.show('a')
    service.show('b', 'error', { duration: 0 })

    service.clear()

    expect(service.toasts()).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its timers when the injector is destroyed', () => {
    const service = setup()
    service.show('a')
    service.show('b')
    expect(vi.getTimerCount()).toBe(2)

    TestBed.resetTestingModule()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('exposes a read-only signal', () => {
    const service = setup()

    expect((service.toasts as unknown as { set?: unknown }).set).toBeUndefined()
  })
})
