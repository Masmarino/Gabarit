import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { UserChip, UserChipSize } from './user-chip'

@Component({
  standalone: true,
  imports: [UserChip],
  template: `
    <ul>
      <li><gbt-user-chip name="Alice Martin" /></li>
      <li><gbt-user-chip name="florian" size="md" /></li>
    </ul>
  `,
})
class HostComponent {}

function setup(name: string, size?: UserChipSize, src?: string) {
  const fixture = TestBed.createComponent(UserChip)
  fixture.componentRef.setInput('name', name)
  if (size) fixture.componentRef.setInput('size', size)
  if (src) fixture.componentRef.setInput('src', src)
  fixture.detectChanges()
  return fixture
}

describe('UserChip', () => {
  it('shows the name', () => {
    const fixture = setup('Alice Martin')
    expect(fixture.nativeElement.querySelector('.gbt-user-chip__name').textContent.trim()).toBe(
      'Alice Martin',
    )
  })

  it('carries the full name in a title attribute, for truncated names', () => {
    const fixture = setup('Marie-Hélène de La Tour d’Auvergne')
    expect(fixture.nativeElement.querySelector('.gbt-user-chip').getAttribute('title')).toBe(
      'Marie-Hélène de La Tour d’Auvergne',
    )
  })

  it('renders an initials avatar, hidden from assistive technology (the name is already read)', () => {
    const fixture = setup('Alice Martin')
    const avatar = fixture.nativeElement.querySelector('gbt-avatar') as HTMLElement
    expect(avatar.textContent?.trim()).toBe('AM')
    expect(avatar.getAttribute('aria-hidden')).toBe('true')
  })

  it('is built on gbt-avatar: the small avatar by default, the medium one for size md', () => {
    expect(setup('alice').nativeElement.querySelector('gbt-avatar').getAttribute('data-size')).toBe(
      'sm',
    )

    const md = setup('alice', 'md')
    expect(md.nativeElement.querySelector('gbt-avatar').getAttribute('data-size')).toBe('md')
    expect(md.nativeElement.querySelector('.gbt-user-chip').getAttribute('data-size')).toBe('md')
  })

  it('hands src to the avatar, which falls back to the initials when the picture fails', () => {
    const fixture = setup('Alice Martin', 'sm', 'https://example.test/alice.png')
    const image = fixture.nativeElement.querySelector('gbt-avatar img') as HTMLImageElement
    expect(image.getAttribute('src')).toBe('https://example.test/alice.png')

    image.dispatchEvent(new Event('error'))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('gbt-avatar img')).toBeNull()
    expect(fixture.nativeElement.querySelector('gbt-avatar').textContent.trim()).toBe('AM')
  })

  it('shows a corrected picture after the previous one failed', () => {
    const fixture = setup('Alice Martin', 'sm', 'https://example.test/broken.png')
    fixture.nativeElement.querySelector('gbt-avatar img').dispatchEvent(new Event('error'))
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('gbt-avatar img')).toBeNull()

    fixture.componentRef.setInput('src', 'https://example.test/fixed.png')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('gbt-avatar img')?.getAttribute('src')).toBe(
      'https://example.test/fixed.png',
    )
  })

  it('reads its name once: the avatar adds no second announcement', () => {
    const fixture = setup('Alice Martin')
    const el = fixture.nativeElement as HTMLElement
    expect(el.querySelector('[aria-hidden="true"] [aria-label]')).not.toBeNull()
    expect(el.querySelector(':not([aria-hidden="true"]) > [aria-label]')).toBeNull()
  })

  it('has no a11y violations, alone and in a list', async () => {
    await expectNoA11yViolations(setup('Alice Martin').nativeElement)
    await expectNoA11yViolations(setup('florian', 'md').nativeElement)
    const host = TestBed.createComponent(HostComponent)
    host.detectChanges()
    await expectNoA11yViolations(host.nativeElement)
  })
})
