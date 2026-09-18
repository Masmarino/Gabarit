import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component, input, signal } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { Drawer, DrawerEdge } from './drawer'

const meta: Meta<Drawer> = {
  title: 'Organisms/Drawer',
  component: Drawer,
}

export default meta
type Story = StoryObj<Drawer>

@Component({
  selector: 'gbt-story-drawer-host',
  standalone: true,
  imports: [Drawer],
  template: `
    <button type="button" (click)="open.set(true)">Ouvrir le tiroir</button>
    <gbt-drawer [isOpen]="open()" [edge]="edge()" heading="Filtres" (closed)="open.set(false)">
      <p>Fait glisser depuis le bord « {{ edge() }} », avec une animation à l'ouverture et à la fermeture.</p>
      <button type="button">Un champ</button>
    </gbt-drawer>
  `,
})
class DrawerHost {
  open = signal(false)
  edge = input<DrawerEdge>('right')
}

export const Right: Story = {
  render: () => ({
    template: `<gbt-story-drawer-host />`,
    moduleMetadata: { imports: [DrawerHost] },
  }),
}

export const Left: Story = {
  render: () => ({
    template: `<gbt-story-drawer-host [edge]="'left'" />`,
    moduleMetadata: { imports: [DrawerHost] },
  }),
}

export const Top: Story = {
  render: () => ({
    template: `<gbt-story-drawer-host [edge]="'top'" />`,
    moduleMetadata: { imports: [DrawerHost] },
  }),
}

export const Bottom: Story = {
  render: () => ({
    template: `<gbt-story-drawer-host [edge]="'bottom'" />`,
    moduleMetadata: { imports: [DrawerHost] },
  }),
}

export const AlwaysOpen: Story = {
  name: 'Open (static, for inspection)',
  render: () => ({
    template: `
      <gbt-drawer [isOpen]="true" heading="Filtres">
        <p>Contenu du tiroir.</p>
      </gbt-drawer>`,
    moduleMetadata: { imports: [Drawer] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-drawer [isOpen]="true" heading="Filtres">
        <p>Contenu du tiroir sur fond sombre.</p>
      </gbt-drawer>`,
    moduleMetadata: { imports: [Drawer] },
  }),
  decorators: [darkTheme],
}
