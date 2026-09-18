import type { Meta, StoryObj } from '@storybook/angular-vite'
import { moduleMetadata } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { Accordion } from './accordion'
import { AccordionItem } from '../accordion-item/accordion-item'

const meta: Meta<Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  decorators: [moduleMetadata({ imports: [Accordion, AccordionItem] })],
}

export default meta
type Story = StoryObj<Accordion>

export const Faq: Story = {
  name: 'Single mode (FAQ)',
  render: () => ({
    template: `
      <gbt-accordion style="max-width: 480px; display: block;">
        <gbt-accordion-item label="Comment créer un compte ?">
          Rendez-vous sur la page d'inscription et renseignez votre email
          et un mot de passe.
        </gbt-accordion-item>
        <gbt-accordion-item label="Comment réinitialiser mon mot de passe ?">
          Cliquez sur « Mot de passe oublié » sur la page de connexion,
          puis suivez les instructions reçues par email.
        </gbt-accordion-item>
        <gbt-accordion-item label="Comment contacter le support ?">
          Par email à support&#64;exemple.com, ou via le chat en bas à
          droite de l'application.
        </gbt-accordion-item>
      </gbt-accordion>`,
  }),
}

export const Multiple: Story = {
  render: () => ({
    template: `
      <gbt-accordion mode="multiple" style="max-width: 480px; display: block;">
        <gbt-accordion-item label="Section un">Contenu de la section un.</gbt-accordion-item>
        <gbt-accordion-item label="Section deux">Contenu de la section deux.</gbt-accordion-item>
        <gbt-accordion-item label="Section trois">Contenu de la section trois.</gbt-accordion-item>
      </gbt-accordion>`,
  }),
}

export const OpenByDefault: Story = {
  name: 'Opened by default (controlled)',
  render: () => ({
    template: `
      <gbt-accordion [expanded]="[0]" style="max-width: 480px; display: block;">
        <gbt-accordion-item label="Déjà ouverte">Contenu visible dès le départ.</gbt-accordion-item>
        <gbt-accordion-item label="Repliée">Contenu masqué au départ.</gbt-accordion-item>
      </gbt-accordion>`,
  }),
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: () => ({
    template: `
      <gbt-accordion style="max-width: 480px; display: block;">
        <gbt-accordion-item label="Comment créer un compte ?">
          Rendez-vous sur la page d'inscription et renseignez votre email
          et un mot de passe.
        </gbt-accordion-item>
        <gbt-accordion-item label="Comment réinitialiser mon mot de passe ?">
          Cliquez sur « Mot de passe oublié » sur la page de connexion,
          puis suivez les instructions reçues par email.
        </gbt-accordion-item>
      </gbt-accordion>`,
  }),
}
