import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Breadcrumb } from './breadcrumb'
import { Menu } from '../menu/menu'

const meta: Meta<Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
}

export default meta
type Story = StoryObj<Breadcrumb>

export const PlainCurrentSegment: Story = {
  render: () => ({
    template: `
      <gbt-breadcrumb ariaLabel="Fil d'Ariane">
        <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="#">Groupe</a></li>
        <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="#">Sous-groupe</a></li>
        Dépôt
      </gbt-breadcrumb>
    `,
    moduleMetadata: { imports: [Breadcrumb] },
  }),
}

export const WithSwitcher: Story = {
  render: () => ({
    template: `
      <gbt-breadcrumb ariaLabel="Fil d'Ariane">
        <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="#">Groupe</a></li>
        <gbt-menu label="Dépôt" align="start">
          <a role="menuitem" class="gbt-menu__item" href="#">autre-depot</a>
          <a role="menuitem" class="gbt-menu__item" href="#">sous-groupe-2</a>
        </gbt-menu>
      </gbt-breadcrumb>
    `,
    moduleMetadata: { imports: [Breadcrumb, Menu] },
  }),
}

export const NoAncestors: Story = {
  render: () => ({
    template: `<gbt-breadcrumb ariaLabel="Fil d'Ariane">Accueil</gbt-breadcrumb>`,
    moduleMetadata: { imports: [Breadcrumb] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-breadcrumb ariaLabel="Fil d'Ariane">
        <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="#">Groupe</a></li>
        <li breadcrumb-ancestor><a class="gbt-breadcrumb__item" href="#">Sous-groupe</a></li>
        Dépôt
      </gbt-breadcrumb>
    `,
    moduleMetadata: { imports: [Breadcrumb] },
  }),
  decorators: [darkTheme],
}
