import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Breadcrumb } from './breadcrumb'
import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [Breadcrumb],
  template: `
    <gbt-breadcrumb ariaLabel="Fil d'Ariane">
      <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="/groupe">Groupe</a></li>
      <li breadcrumb-ancestor>
        <a class="gbt-breadcrumb__item" href="/groupe/sous-groupe">Sous-groupe</a>
      </li>
      Dépôt
    </gbt-breadcrumb>
  `,
})
class HostComponent {}

function setup() {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.detectChanges()
  return fixture
}

describe('Breadcrumb', () => {
  it('names the nav landmark from the input', () => {
    const fixture = setup()
    const nav: HTMLElement = fixture.nativeElement.querySelector('nav')
    expect(nav.getAttribute('aria-label')).toBe("Fil d'Ariane")
  })

  it('projects the ancestor items before the current segment, in order', () => {
    const fixture = setup()
    const items = [...fixture.nativeElement.querySelectorAll('li')]
    expect(items.length).toBe(3)
    expect(items[0].textContent?.trim()).toBe('Groupe')
    expect(items[1].textContent?.trim()).toBe('Sous-groupe')
    expect(items[2].textContent?.trim()).toBe('Dépôt')
  })

  it('marks the current (last, default-projected) segment with its own class', () => {
    const fixture = setup()
    const items = [...fixture.nativeElement.querySelectorAll('li')]
    expect(items[2].classList.contains('gbt-breadcrumb__current')).toBe(true)
    expect(items[0].classList.contains('gbt-breadcrumb__current')).toBe(false)
  })

  it('renders zero ancestors without error (a non-hierarchical page)', () => {
    @Component({
      standalone: true,
      imports: [Breadcrumb],
      template: `<gbt-breadcrumb ariaLabel="Fil d'Ariane">Accueil</gbt-breadcrumb>`,
    })
    class NoAncestorsHost {}

    const fixture = TestBed.createComponent(NoAncestorsHost)
    fixture.detectChanges()
    const items = [...fixture.nativeElement.querySelectorAll('li')]
    expect(items.length).toBe(1)
    expect(items[0].textContent?.trim()).toBe('Accueil')
  })

  it('publishes list/item/current styles in the global stylesheet, outside encapsulation', () => {
    const root = join(process.cwd(), 'projects/gabarit/src/lib')
    const utilities = readFileSync(join(root, 'tokens/_utilities.scss'), 'utf8')
    const componentScss = readFileSync(
      join(root, 'components/molecules/breadcrumb/breadcrumb.scss'),
      'utf8',
    )
    expect(utilities).toContain('.gbt-breadcrumb__list')
    expect(utilities).toContain('.gbt-breadcrumb__item')
    expect(utilities).toContain('.gbt-breadcrumb__current')
    expect(componentScss).not.toContain('__list')
    expect(componentScss).not.toContain('__item')
    expect(componentScss).not.toContain('__current')
  })

  it('has no violation detected by axe', async () => {
    await expectNoA11yViolations(setup().nativeElement)
  })
})
