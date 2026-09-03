import { ComponentFixture, TestBed } from '@angular/core/testing'

import { expectNoA11yViolations } from '../../../../testing/expect-no-a11y-violations'
import { Card } from './card'

describe('Card', () => {
  let component: Card
  let fixture: ComponentFixture<Card>
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
    }).compileComponents()

    fixture = TestBed.createComponent(Card)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('renders no header when title is empty', () => {
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.gbt-card__header')).toBeNull()
  })

  it('renders a header with the title once set', () => {
    fixture.componentRef.setInput('heading', 'Serveur mail')
    fixture.detectChanges()

    const header = fixture.nativeElement.querySelector('.gbt-card__header')
    expect(header).toBeTruthy()
    expect(header.textContent).toContain('Serveur mail')
    expect(fixture.nativeElement.querySelector('gbt-icon')).toBeNull()
  })

  it('renders the icon alongside the title when set', () => {
    fixture.componentRef.setInput('heading', 'Serveur mail')
    fixture.componentRef.setInput('icon', 'mail')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('gbt-icon')).toBeTruthy()
  })

  it('renders an h2 by default', () => {
    const fixture = TestBed.createComponent(Card)
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Dépôts')
  })

  it('respects the requested heading level', () => {
    const fixture = TestBed.createComponent(Card)
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.componentRef.setInput('headingLevel', 3)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('h3')?.textContent).toContain('Dépôts')
    expect(fixture.nativeElement.querySelector('h2')).toBeNull()
  })

  it('presents no accessibility violation', async () => {
    fixture.componentRef.setInput('heading', 'Dépôts')
    fixture.componentRef.setInput('icon', 'check')
    fixture.detectChanges()
    await expectNoA11yViolations(fixture.nativeElement)
  })
})
