import { AfterViewInit, Component, ElementRef, inject } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import type { Meta, StoryObj } from '@storybook/angular-vite'
import {
  auroreAmbiance,
  darkTheme,
  doreAmbiance,
  doreWithoutAccent,
} from '../../../.storybook/preview'
import { Badge } from '../../../badge'
import { Button } from '../../../button'
import { Card } from '../../../card'
import { Checkbox } from '../../../checkbox'
import { GbtInput } from '../../../input'
import { NavTab, NavTabs } from '../../../nav-tabs'
import { SegmentedControl } from '../../../segmented-control'
import { Select } from '../../../select'
import { Slider } from '../../../slider'
import { Switch } from '../../../switch'
import { Tabs, Tab } from '../../../tabs'
import { Tag } from '../../../tag'
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
      } else if (rule instanceof CSSStyleRule && /:(hover|active|focus)/.test(rule.selectorText)) {
        const hover = rule.cssText.replace(/:hover/g, '[data-state="hover"]')
        const both = hover.replace(/:active/g, '[data-state="active"]')
        const all = both.replace(/:focus(-visible|-within)?(?![\w-])/g, '[data-state="focus"]')
        try {
          sheet.insertRule(wrap(all), sheet.cssRules.length)
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
      .querySelectorAll<HTMLElement>(
        'button, input, textarea, label, .gbt-card, .gbt-switch, .gbt-tag-input__field',
      )
      .forEach((element) => {
        element.dataset['state'] = host.dataset['force']
      })
  })
}

@Component({
  selector: 'gbt-style-gallery',
  imports: [
    ReactiveFormsModule,
    Badge,
    Button,
    Card,
    Checkbox,
    GbtInput,
    NavTab,
    NavTabs,
    SegmentedControl,
    Select,
    Slider,
    Switch,
    Tabs,
    Tab,
    Tag,
    Textarea,
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 68rem;
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
      grid-template-columns: 5rem repeat(var(--columns, 4), minmax(0, 1fr));
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
      <div class="states" style="--columns: 6">
        <span></span><span>Primary</span><span>Prominent glass</span><span>Secondary</span
        ><span>Ghost</span><span>Danger</span><span>Round icons</span>
        @for (state of states; track state.name) {
          <span>{{ state.name }}</span>
          <div class="contents" [attr.data-force]="state.force">
            <gbt-button text="Save" variant="primary" />
            <gbt-button text="Send" variant="glass-prominent" />
            <gbt-button text="Cancel" variant="secondary" />
            <gbt-button text="More" variant="ghost" />
            <gbt-button text="Delete" variant="danger" />
            <div class="row">
              <gbt-button iconName="plus" ariaLabel="Add" variant="secondary" [iconOnly]="true" />
              <gbt-button iconName="search" ariaLabel="Search" variant="ghost" [iconOnly]="true" />
            </div>
          </div>
        }
      </div>
    </section>
    <section>
      <h2>Controls, at rest, under the pointer, held down, with the focus</h2>
      <div class="states" style="--columns: 5">
        <span></span><span>Switch</span><span>Slider</span><span>Menu</span><span>Field</span
        ><span>Search</span>
        @for (state of fieldStates; track state.name) {
          <span>{{ state.name }}</span>
          <div class="contents" [attr.data-force]="state.force">
            <gbt-switch label="On" [formControl]="on" />
            <gbt-slider label="Level" [formControl]="volume" />
            <gbt-select label="Language" [options]="languages" [formControl]="language" />
            <gbt-input label="Name" placeholder="Name" />
            <gbt-input label="Search" type="search" leadingIcon="search" placeholder="Search" />
          </div>
        }
      </div>
    </section>
    <section>
      <h2>Chips, labels and counters</h2>
      <div class="row" role="group" aria-label="Filters">
        @for (filter of filters; track filter) {
          <button
            type="button"
            class="gbt-chip"
            [attr.aria-pressed]="filter === chosenFilter"
            (click)="chosenFilter = filter"
          >
            {{ filter }}
          </button>
        }
      </div>
      <div class="row" style="margin-top: 0.75rem">
        <gbt-badge>Draft</gbt-badge>
        <gbt-badge variant="success">Active</gbt-badge>
        <gbt-badge variant="warning">Quota</gbt-badge>
        <gbt-badge [value]="12" label="unread" />
        <gbt-tag color="#2f49c9">Design</gbt-tag>
        <gbt-tag color="#15805d" [removable]="true">Ready</gbt-tag>
      </div>
    </section>
    <section>
      <h2>Links, checks, the page's tabs and the focus ring</h2>
      <div class="row">
        <gbt-button text="Read the guide" variant="link" />
        <gbt-checkbox label="Checked" [checked]="true" />
        <gbt-checkbox label="Not checked" />
        <div class="row" data-force="focus">
          <button type="button" class="gbt-chip" aria-pressed="true">Focused chip</button>
          <button type="button" class="gbt-chip">Focused</button>
        </div>
      </div>
      <gbt-nav-tabs ariaLabel="Settings" [landmark]="false">
        <a gbtNavTab href="#general" [active]="true" [badge]="3">General</a>
        <a gbtNavTab href="#members">Members</a>
        <a gbtNavTab href="#security">Security</a>
      </gbt-nav-tabs>
    </section>
    <section class="row">
      <gbt-segmented-control label="View" [options]="views" [(value)]="view" />
      <gbt-segmented-control ariaLabel="Period" size="sm" [options]="periods" [(value)]="period" />
    </section>
    <gbt-tabs>
      <gbt-tab label="Current">The current tab glows a little.</gbt-tab>
      <gbt-tab label="Other">Another.</gbt-tab>
      <gbt-tab label="Third">A third.</gbt-tab>
    </gbt-tabs>
    <section class="columns">
      <gbt-card heading="A card rests on the ground">
        <p>The content glass: a rim of light at its top, a soft shadow.</p>
        <div class="row"><gbt-button text="Action" variant="secondary" /></div>
      </gbt-card>
      <gbt-card heading="Glass"><p>No hairline: the light is its edge.</p></gbt-card>
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
  `,
})
class StyleGallery implements AfterViewInit {
  private readonly element = inject(ElementRef<HTMLElement>)
  states = [
    { name: 'Rest', force: null },
    { name: 'Hover', force: 'hover' },
    { name: 'Press', force: 'active' },
  ]
  fieldStates = [...this.states, { name: 'Focus', force: 'focus' }]
  on = new FormControl(true)
  off = new FormControl(false)
  volume = new FormControl(55)
  view = 'list'
  period = 'week'
  filters = ['All', 'Unread', 'Mentions', 'Files']
  chosenFilter = 'Unread'
  periods = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ]
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

export const Aurore: Story = { decorators: [auroreAmbiance] }

/** The doré ambiance (4.2) brings its own accent: the main buttons, the chosen chips and tab, the links, the checked
 * controls and the focus ring follow it. */
export const Dore: Story = { name: 'Doré (its own accent)', decorators: [doreAmbiance] }

/** The same ground under Gabarit's accent, to compare. */
export const DoreWithoutAccent: Story = {
  name: 'Doré without its accent',
  decorators: [doreWithoutAccent],
}
