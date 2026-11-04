import { AfterViewInit, Component, ElementRef, inject } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../.storybook/preview'
import { Button } from '../../../button'
import { Card } from '../../../card'
import { GbtInput } from '../../../input'
import { SegmentedControl } from '../../../segmented-control'
import { Select } from '../../../select'
import { Slider } from '../../../slider'
import { Switch } from '../../../switch'
import { Tabs, Tab } from '../../../tabs'
import { Textarea } from '../../../textarea'

// The style at a glance, as the apps' galleries show it: every state side by side. CSS cannot force a hover or a press,
// so the page copies the rules that name them into rules that read a `data-state` attribute.
const forced = new CSSStyleSheet()

function forceStates(root: HTMLElement): void {
  const sheet = forced
  const copy = (rules: CSSRuleList, wrap: (text: string) => string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule && matchMedia(rule.conditionText).matches) {
        copy(rule.cssRules, wrap)
      } else if (rule instanceof CSSStyleRule && /:(hover|active)/.test(rule.selectorText)) {
        const hover = rule.cssText.replace(/:hover/g, '[data-state="hover"]')
        const both = hover.replace(/:active/g, '[data-state="active"]')
        try {
          sheet.insertRule(wrap(both), sheet.cssRules.length)
        } catch {
          // A pseudo-element's rule that the browser refuses to copy.
        }
      }
    }
  }
  for (const styles of Array.from(document.styleSheets)) {
    try {
      copy(styles.cssRules, (text) => text)
    } catch {
      // Another origin's stylesheet.
    }
  }
  if (!document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  }
  root.querySelectorAll<HTMLElement>('[data-force]').forEach((host) => {
    host
      .querySelectorAll<HTMLElement>('button, input, textarea, label, .gbt-card, .gbt-switch')
      .forEach((element) => {
        element.dataset['state'] = host.dataset['force']
      })
  })
}

@Component({
  selector: 'gbt-style-gallery',
  imports: [
    ReactiveFormsModule,
    Button,
    Card,
    GbtInput,
    SegmentedControl,
    Select,
    Slider,
    Switch,
    Tabs,
    Tab,
    Textarea,
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 52rem;
      font-family: var(--font-family);
      color: var(--text-primary);
    }
    h2 {
      margin: 0 0 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .states {
      display: grid;
      grid-template-columns: 5rem repeat(4, 1fr);
      gap: 0.75rem;
      align-items: center;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: 1rem;
    }
    .contents {
      display: contents;
    }
  `,
  template: `
    <section>
      <h2>Buttons, at rest, under the pointer, held down</h2>
      <div class="states">
        <span></span><span>Primary</span><span>Secondary</span><span>Ghost</span><span>Danger</span>
        @for (state of states; track state.name) {
          <span>{{ state.name }}</span>
          <div class="contents" [attr.data-force]="state.force">
            <gbt-button text="Save" variant="primary" />
            <gbt-button text="Cancel" variant="secondary" />
            <gbt-button text="More" variant="ghost" />
            <gbt-button text="Delete" variant="danger" />
          </div>
        }
      </div>
    </section>
    <section>
      <h2>Controls, at rest, under the pointer, held down</h2>
      <div class="states">
        <span></span><span>Switch</span><span>Slider</span><span>Menu</span><span>Field</span>
        @for (state of states; track state.name) {
          <span>{{ state.name }}</span>
          <div class="contents" [attr.data-force]="state.force">
            <gbt-switch label="On" [formControl]="on" />
            <gbt-slider label="Level" [formControl]="volume" />
            <gbt-select label="Language" [options]="languages" [formControl]="language" />
            <gbt-input label="Name" placeholder="Name" />
          </div>
        }
      </div>
    </section>
    <section class="columns">
      <gbt-card heading="A card rests on the page">
        <p>A soft shadow, the light on its top edge.</p>
        <div class="row"><gbt-button text="Action" variant="secondary" /></div>
      </gbt-card>
      <gbt-card heading="Outlined" variant="outlined"
        ><p>A hairline, and the same depth.</p></gbt-card
      >
      <gbt-card heading="Pressable" [hoverable]="true"
        ><p>It rises under the pointer, sinks when held.</p></gbt-card
      >
    </section>
    <section class="columns">
      <gbt-card heading="Controls">
        <div class="row">
          <gbt-switch label="On" [formControl]="on" />
          <gbt-switch label="Off" [formControl]="off" />
          <gbt-switch label="Off, disabled" [disabled]="true" />
        </div>
        <gbt-slider label="Volume" [formControl]="volume" />
        <gbt-segmented-control label="View" [options]="views" [(value)]="view" />
      </gbt-card>
      <gbt-card heading="Fields">
        <gbt-input label="Name" placeholder="Hollow" />
        <gbt-select label="Language" [options]="languages" [formControl]="language" />
      </gbt-card>
      <gbt-card heading="A form's card" [form]="true">
        <gbt-input label="Name" placeholder="No frame in a frame" />
        <gbt-textarea label="About" />
        <gbt-select label="Language" [options]="languages" [formControl]="language" />
      </gbt-card>
    </section>
    <gbt-tabs>
      <gbt-tab label="Current">The current tab glows a little.</gbt-tab>
      <gbt-tab label="Other">Another.</gbt-tab>
    </gbt-tabs>
  `,
})
class StyleGallery implements AfterViewInit {
  private readonly element = inject(ElementRef<HTMLElement>)
  states = [
    { name: 'Rest', force: null },
    { name: 'Hover', force: 'hover' },
    { name: 'Press', force: 'active' },
  ]
  on = new FormControl(true)
  off = new FormControl(false)
  volume = new FormControl(55)
  view = 'list'
  views = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
    { value: 'board', label: 'Board' },
  ]
  language = new FormControl('fr')
  languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ]

  ngAfterViewInit(): void {
    forceStates(this.element.nativeElement)
  }
}

const meta: Meta<StyleGallery> = {
  title: 'Foundations/Style',
  component: StyleGallery,
}

export default meta
type Story = StoryObj<StyleGallery>

export const Light: Story = {}

export const Dark: Story = { decorators: [darkTheme] }
