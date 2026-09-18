import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Avatar, computeInitials } from './avatar'

describe('computeInitials', () => {
  it('takes the first letter of the first and last word for a full name', () => {
    expect(computeInitials('Ada Lovelace')).toBe('AL')
    expect(computeInitials('Ada Marie Lovelace')).toBe('AL')
  })

  it('takes the first two letters of a single-word name', () => {
    expect(computeInitials('Ada')).toBe('AD')
  })

  it('is uppercase regardless of input casing', () => {
    expect(computeInitials('ada lovelace')).toBe('AL')
  })

  it('returns an empty string for a blank name', () => {
    expect(computeInitials('   ')).toBe('')
  })
})

function setup() {
  const fixture = TestBed.createComponent(Avatar)
  fixture.componentRef.setInput('name', 'Ada Lovelace')
  fixture.detectChanges()
  return fixture
}

describe('Avatar', () => {
  it('shows initials when no src is given', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-avatar__initials')?.textContent?.trim()).toBe(
      'AL',
    )
    expect(fixture.nativeElement.querySelector('img')).toBeNull()
  })

  it('names the initials fallback with the full name, not the visible letters', () => {
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.gbt-avatar__initials').getAttribute('aria-label')).toBe(
      'Ada Lovelace',
    )
  })

  it('shows the image when a src is given', () => {
    const fixture = TestBed.createComponent(Avatar)
    fixture.componentRef.setInput('name', 'Ada Lovelace')
    fixture.componentRef.setInput('src', 'https://example.com/ada.jpg')
    fixture.detectChanges()

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img')
    expect(img).not.toBeNull()
    expect(img.src).toBe('https://example.com/ada.jpg')
    expect(img.alt).toBe('Ada Lovelace')
    expect(fixture.nativeElement.querySelector('.gbt-avatar__initials')).toBeNull()
  })

  it('falls back to initials when the image fails to load', () => {
    const fixture = TestBed.createComponent(Avatar)
    fixture.componentRef.setInput('name', 'Ada Lovelace')
    fixture.componentRef.setInput('src', 'https://example.com/broken.jpg')
    fixture.detectChanges()

    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'))
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('img')).toBeNull()
    expect(fixture.nativeElement.querySelector('.gbt-avatar__initials')?.textContent?.trim()).toBe(
      'AL',
    )
  })

  it('defaults to the md size', () => {
    const fixture = setup()
    expect(fixture.nativeElement.getAttribute('data-size')).toBe('md')
  })

  it.each<'sm' | 'md' | 'lg'>(['sm', 'md', 'lg'])('reflects the %s size as a data attribute', (size) => {
    const fixture = TestBed.createComponent(Avatar)
    fixture.componentRef.setInput('name', 'Ada Lovelace')
    fixture.componentRef.setInput('size', size)
    fixture.detectChanges()

    expect(fixture.nativeElement.getAttribute('data-size')).toBe(size)
  })

  it('has no a11y violations, initials fallback', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })

  it('has no a11y violations, with an image', async () => {
    const fixture = TestBed.createComponent(Avatar)
    fixture.componentRef.setInput('name', 'Ada Lovelace')
    fixture.componentRef.setInput('src', 'https://example.com/ada.jpg')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
