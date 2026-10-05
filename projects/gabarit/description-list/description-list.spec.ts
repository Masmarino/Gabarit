import { Component, TemplateRef, viewChild } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DescriptionList, DescriptionListEntry } from './description-list'
import { expectNoA11yViolations } from '../src/testing/expect-no-a11y-violations'

@Component({
  standalone: true,
  imports: [DescriptionList],
  template: `
    <ng-template #statusValue>
      <button type="button" class="rich-value">Actif</button>
    </ng-template>
    <gbt-description-list
      [items]="items()"
      [layout]="layout"
      [valueAlign]="valueAlign"
      [responsive]="responsive"
    />
  `,
})
class HostComponent {
  private readonly statusValue = viewChild.required<TemplateRef<unknown>>('statusValue')
  layout: 'stacked' | 'inline' = 'stacked'
  valueAlign: 'start' | 'end' = 'start'
  responsive: 'viewport' | 'container' = 'viewport'

  items(): DescriptionListEntry[] {
    return [
      { term: 'Propriétaire', value: 'Ada Lovelace' },
      { term: 'Créé le', value: '12 mars 2024' },
      { term: 'Statut', value: this.statusValue() },
    ]
  }
}

function render(
  layout: 'stacked' | 'inline' = 'stacked',
  options: { valueAlign?: 'start' | 'end'; responsive?: 'viewport' | 'container' } = {},
) {
  const fixture = TestBed.createComponent(HostComponent)
  fixture.componentInstance.layout = layout
  fixture.componentInstance.valueAlign = options.valueAlign ?? 'start'
  fixture.componentInstance.responsive = options.responsive ?? 'viewport'
  fixture.detectChanges()
  return fixture
}

describe('DescriptionList', () => {
  it('renders a real dl with one dt/dd pair per item, in order', () => {
    const fixture = render()
    const dl: HTMLElement = fixture.nativeElement.querySelector('dl')
    const children = [...dl.children].map((el) => el.tagName.toLowerCase())

    expect(children).toEqual(['dt', 'dd', 'dt', 'dd', 'dt', 'dd'])
    expect(dl.querySelectorAll('dt')[0].textContent?.trim()).toBe('Propriétaire')
    expect(dl.querySelectorAll('dd')[0].textContent?.trim()).toBe('Ada Lovelace')
  })

  it('renders a plain string value as text', () => {
    const fixture = render()
    expect(fixture.nativeElement.querySelectorAll('dd')[1].textContent?.trim()).toBe('12 mars 2024')
  })

  it('renders a TemplateRef value as rich projected content', () => {
    const fixture = render()
    const richValue = fixture.nativeElement.querySelector('dd .rich-value')
    expect(richValue).not.toBeNull()
    expect(richValue.textContent?.trim()).toBe('Actif')
  })

  it('defaults to the stacked layout', () => {
    const fixture = render()
    expect(fixture.nativeElement.querySelector('dl').getAttribute('data-layout')).toBe('stacked')
  })

  it('reflects the inline layout', () => {
    const fixture = render('inline')
    expect(fixture.nativeElement.querySelector('dl').getAttribute('data-layout')).toBe('inline')
  })

  it('leaves the default markup as it was: no data-value-align / data-responsive attribute', () => {
    const fixture = render('inline')
    const dl = fixture.nativeElement.querySelector('dl')
    expect(dl.hasAttribute('data-value-align')).toBe(false)
    expect(dl.hasAttribute('data-responsive')).toBe(false)
    expect(
      fixture.nativeElement.querySelector('gbt-description-list').hasAttribute('data-responsive'),
    ).toBe(false)
    expect(dl.getAttribute('data-layout')).toBe('inline')
  })

  it('does not right-align the values by default', () => {
    const fixture = render('inline')
    expect(getComputedStyle(fixture.nativeElement.querySelector('dd')).textAlign).not.toBe('end')
  })

  it('reflects valueAlign="end" and right-aligns the values', () => {
    const fixture = render('inline', { valueAlign: 'end' })
    expect(fixture.nativeElement.querySelector('dl').getAttribute('data-value-align')).toBe('end')
    expect(getComputedStyle(fixture.nativeElement.querySelector('dd')).textAlign).toBe('end')
  })

  it('reflects responsive="container" on the list and the host (the query container)', () => {
    const fixture = render('inline', { responsive: 'container' })
    expect(fixture.nativeElement.querySelector('dl').getAttribute('data-responsive')).toBe(
      'container',
    )
    expect(
      fixture.nativeElement.querySelector('gbt-description-list').getAttribute('data-responsive'),
    ).toBe('container')
  })

  it('keeps the same dt/dd structure whatever the options', () => {
    const fixture = render('inline', { valueAlign: 'end', responsive: 'container' })
    const children = [...fixture.nativeElement.querySelector('dl').children].map((el: Element) =>
      el.tagName.toLowerCase(),
    )
    expect(children).toEqual(['dt', 'dd', 'dt', 'dd', 'dt', 'dd'])
  })

  it('has no a11y violations, inline end-aligned in a container', async () => {
    await expectNoA11yViolations(
      render('inline', { valueAlign: 'end', responsive: 'container' }).nativeElement,
    )
  })

  it('has no a11y violations, stacked', async () => {
    await expectNoA11yViolations(render('stacked').nativeElement)
  })

  it('has no a11y violations, inline', async () => {
    await expectNoA11yViolations(render('inline').nativeElement)
  })
})
