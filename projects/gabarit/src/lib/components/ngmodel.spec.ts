import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TestBed } from '@angular/core/testing'
import { GbtInput } from './atoms/input/input'
import { Checkbox } from './atoms/checkbox/checkbox'
import { Select } from './molecules/select/select'

@Component({
  standalone: true,
  imports: [FormsModule, GbtInput, Checkbox, Select],
  template: `
    <gbt-input label="Nom" [(ngModel)]="text" name="t" />
    <gbt-checkbox label="Actif" [(ngModel)]="checked" name="c" />
    <gbt-select label="Rôle" [options]="opts" [(ngModel)]="choice" name="s" />
  `,
})
class NgModelHost {
  text = 'valeur initiale'
  checked = true
  choice = 'b'
  opts = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Bravo' },
  ]
}

describe('driven by [(ngModel)]', () => {
  async function render() {
    const fixture = TestBed.createComponent(NgModelHost)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    return fixture
  }

  it("gbt-input receives the model's initial value", async () => {
    const fixture = await render()
    const field: HTMLInputElement = fixture.nativeElement.querySelector('gbt-input input')
    expect(field.value).toBe('valeur initiale')
  })

  it("gbt-checkbox receives the model's initial value", async () => {
    const fixture = await render()
    const box: HTMLInputElement = fixture.nativeElement.querySelector('gbt-checkbox input')
    expect(box.checked).toBe(true)
  })

  it("gbt-select receives the model's initial value", async () => {
    const fixture = await render()
    const trigger: HTMLElement = fixture.nativeElement.querySelector('gbt-select button')
    expect(trigger.textContent?.trim()).toContain('Bravo')
  })

  it('gbt-input pushes typed input back to the model', async () => {
    const fixture = await render()
    const field: HTMLInputElement = fixture.nativeElement.querySelector('gbt-input input')
    field.value = 'saisie'
    field.dispatchEvent(new Event('input'))
    await fixture.whenStable()
    expect(fixture.componentInstance.text).toBe('saisie')
  })

  it('gbt-checkbox pushes the toggle back to the model', async () => {
    const fixture = await render()
    const box: HTMLInputElement = fixture.nativeElement.querySelector('gbt-checkbox input')
    box.click()
    await fixture.whenStable()
    expect(fixture.componentInstance.checked).toBe(false)
  })
})
