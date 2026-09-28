import type { Meta, StoryObj } from '@storybook/angular-vite'
import { Component, signal } from '@angular/core'
import { darkTheme } from '../../../../../.storybook/preview'
import { Button } from '../../atoms/button/button'
import { Modal } from './modal'

const meta: Meta<Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
}

export default meta
type Story = StoryObj<Modal>

export const Closed: Story = {
  args: {
    isOpen: false,
    heading: 'Nouveau dépôt',
  },
}

export const Open: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Nouveau dépôt">
        <p>Contenu de la boîte de dialogue.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
}

export const LongTitle: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Confirmer la suppression définitive de ce dépôt et de tout son historique">
        <p>Cette action est irréversible.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" heading="Nouveau dépôt">
        <p>Contenu de la boîte de dialogue.</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
  decorators: [darkTheme],
}

@Component({
  selector: 'gbt-story-modal-footer-host',
  standalone: true,
  imports: [Modal, Button],
  template: `
    <gbt-modal [isOpen]="true" heading="Nouveau dépôt">
      <p>Donnez un nom au dépôt. Vous pourrez le renommer plus tard.</p>
      <div modal-footer>
        <gbt-button variant="secondary" text="Annuler" />
        <gbt-button text="Créer" />
      </div>
    </gbt-modal>
  `,
})
class FooterHost {}

/** Actions go in `[modal-footer]`: under a hairline, no extra import. */
export const WithFooter: Story = {
  render: () => ({
    template: `<gbt-story-modal-footer-host />`,
    moduleMetadata: { imports: [FooterHost] },
  }),
}

@Component({
  selector: 'gbt-story-modal-long-host',
  standalone: true,
  imports: [Modal, Button],
  template: `
    <gbt-modal [isOpen]="true" heading="Conditions d'utilisation">
      @for (n of paragraphs; track n) {
        <p>
          Paragraphe {{ n }}. Le contenu défile sous l'en-tête, tandis que les actions restent
          visibles en bas de la boîte de dialogue tant que la lecture n'est pas terminée.
        </p>
      }
      <div modal-footer>
        <gbt-button variant="secondary" text="Refuser" />
        <gbt-button text="Accepter" />
      </div>
    </gbt-modal>
  `,
})
class LongFooterHost {
  paragraphs = Array.from({ length: 14 }, (_, i) => i + 1)
}

/** A long body scrolls; the footer stays in view. */
export const LongBodyWithFooter: Story = {
  render: () => ({
    template: `<gbt-story-modal-long-host />`,
    moduleMetadata: { imports: [LongFooterHost] },
  }),
}

@Component({
  selector: 'gbt-story-modal-busy-host',
  standalone: true,
  imports: [Modal, Button],
  template: `
    <button type="button" (click)="open.set(true)">Ouvrir</button>
    <gbt-modal
      [isOpen]="open()"
      [busy]="busy()"
      busyLabel="Enregistrement en cours"
      heading="Renommer le dépôt"
      (closed)="open.set(false)"
    >
      <p>
        Cliquez sur Enregistrer, puis essayez Échap, l'arrière-plan ou la croix : rien ne ferme.
      </p>
      <div modal-footer>
        <gbt-button
          variant="secondary"
          text="Annuler"
          [disabled]="busy()"
          (clicked)="open.set(false)"
        />
        <gbt-button
          text="Enregistrer"
          [loading]="busy()"
          loadingLabel="Enregistrement en cours"
          (clicked)="save()"
        />
      </div>
    </gbt-modal>
  `,
})
class BusyHost {
  open = signal(true)
  busy = signal(false)

  save(): void {
    this.busy.set(true)
    setTimeout(() => {
      this.busy.set(false)
      this.open.set(false)
    }, 3000)
  }
}

/** `busy` while a request runs: Escape, the backdrop and the close button are ignored. */
export const Busy: Story = {
  render: () => ({
    template: `<gbt-story-modal-busy-host />`,
    moduleMetadata: { imports: [BusyHost] },
  }),
}

export const BusyStatic: Story = {
  render: () => ({
    template: `
      <gbt-modal [isOpen]="true" [busy]="true" busyLabel="Enregistrement en cours" heading="Renommer le dépôt">
        <p>Enregistrement en cours…</p>
      </gbt-modal>`,
    moduleMetadata: { imports: [Modal] },
  }),
}

export const FooterDark: Story = {
  render: () => ({
    template: `<gbt-story-modal-footer-host />`,
    moduleMetadata: { imports: [FooterHost] },
  }),
  decorators: [darkTheme],
}

export const BusyDark: Story = {
  render: () => ({
    template: `<gbt-story-modal-busy-host />`,
    moduleMetadata: { imports: [BusyHost] },
  }),
  decorators: [darkTheme],
}
