import type { Meta, StoryObj } from '@storybook/angular-vite'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { darkTheme } from '../../../../../.storybook/preview'
import { Textarea } from './textarea'

const meta: Meta<Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
}

export default meta
type Story = StoryObj<Textarea>

export const Empty: Story = {
  args: {
    label: 'Description',
  },
}

export const Filled: Story = {
  render: () => ({
    template: `<gbt-textarea label="Description" [formControl]="control" />`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: { control: new FormControl('Un texte un peu plus long sur plusieurs lignes.') },
  }),
}

export const Error: Story = {
  args: {
    label: 'Description',
    errorMessage: 'Ce champ est obligatoire',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Description',
    disabled: true,
  },
}

const COLUMN = 'display:grid; gap:1rem; max-width:26rem'

export const WithHint: Story = {
  args: {
    label: 'Description',
    hint: 'Markdown accepté. 500 caractères au maximum.',
    placeholder: 'À quoi sert ce dépôt (optionnel)',
  },
}

export const HintReplacedByError: Story = {
  name: 'Hint gives way to the error',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-textarea label="Description" hint="500 caractères au maximum." [formControl]="ok" />
        <gbt-textarea
          label="Description"
          hint="500 caractères au maximum."
          errorMessage="La description dépasse 500 caractères."
          [formControl]="tooLong"
        />
      </div>`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: {
      ok: new FormControl('Un court texte.'),
      tooLong: new FormControl('Un texte beaucoup trop long…'),
    },
  }),
}

export const HiddenLabel: Story = {
  name: 'Hidden label (still names the field)',
  args: {
    label: 'Ajouter un commentaire',
    hideLabel: true,
    placeholder: 'Ajouter un commentaire…',
    rows: 2,
  },
}

export const Mono: Story = {
  render: () => ({
    template: `
      <gbt-textarea style="max-width:26rem" label="Variables d'environnement" [mono]="true" [rows]="4" [formControl]="control" hint="Une variable par ligne : CLE=valeur." />`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: {
      control: new FormControl(
        'DATABASE_URL=postgres://localhost/ferris\nLOG_LEVEL=debug\nRUST_BACKTRACE=1',
      ),
    },
  }),
}

export const Autosize: Story = {
  name: 'Autosize (grows with the text, up to maxRows)',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-textarea label="Message de commit" [autosize]="true" [rows]="2" [maxRows]="6" hint="Tapez plusieurs lignes : le champ grandit jusqu'à 6 lignes, puis défile." [formControl]="control" />
        <gbt-textarea label="Sans limite" [autosize]="true" [rows]="1" [formControl]="free" />
      </div>`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: {
      control: new FormControl(
        'Corrige le calcul de la durée\n\nLe fuseau horaire était ignoré.\nAjoute un test de non-régression.',
      ),
      free: new FormControl('Une ligne'),
    },
  }),
}

export const Resize: Story = {
  name: 'Resize handle',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-textarea label="vertical (default)" />
        <gbt-textarea label="none" resize="none" />
        <gbt-textarea label="both" resize="both" />
      </div>`,
    moduleMetadata: { imports: [Textarea] },
  }),
}

export const Dark: Story = {
  args: {
    label: 'Description',
  },
  decorators: [darkTheme],
}

export const DarkFields: Story = {
  name: 'Dark — hint, error, mono, autosize',
  render: () => ({
    template: `
      <div style="${COLUMN}">
        <gbt-textarea label="Description" hint="500 caractères au maximum." [formControl]="a" />
        <gbt-textarea label="Description" hint="500 caractères au maximum." errorMessage="La description est trop longue." [formControl]="a" />
        <gbt-textarea label="Configuration" [mono]="true" [autosize]="true" [maxRows]="4" [formControl]="b" />
      </div>`,
    moduleMetadata: { imports: [Textarea, ReactiveFormsModule] },
    props: {
      a: new FormControl('Un court texte.'),
      b: new FormControl('cle=valeur\nautre=valeur'),
    },
  }),
  decorators: [darkTheme],
}
