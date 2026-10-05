import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { expect } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { MarkdownView } from './markdown-view'

const GUIDE = `# Guide d’installation

Un seul binaire : une base PostgreSQL et un répertoire de données suffisent.

## Prérequis

- PostgreSQL 16 ou plus récent
- Un nom de domaine, pour les liens envoyés par e-mail

### Ce qu’il faut vérifier

- [x] Le port 8080 est libre
- [ ] La clé de chiffrement est sauvegardée

## Démarrer

\`\`\`sh
docker compose up -d
\`\`\`

La variable \`PUBLIC_URL\` donne l’adresse publique. Voir la [référence](#variables).

> Une citation : ce qui est dit ailleurs, à garder en tête.

## Variables

| Variable | Rôle | Défaut |
| --- | --- | --- |
| \`PUBLIC_URL\` | L’adresse des liens envoyés par e-mail | — |
| \`DATABASE_URL\` | La base PostgreSQL | — |

---

Fin du guide.
`

/**
 * Markdown rendered to sanitised HTML with the design system's reading styles. Every heading gets a stable
 * `user-content-…` id; code blocks and tables take the focus, so a keyboard can scroll them sideways.
 */
const meta: Meta<MarkdownView> = {
  title: 'Docs/MarkdownView',
  component: MarkdownView,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-width: 46rem; padding: 1.5rem;">${story}</div>`,
    ),
  ],
  args: { content: GUIDE },
}

export default meta
type Story = StoryObj<MarkdownView>

export const Guide: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('h2')?.id).toBe('user-content-prérequis')
    await expect(canvasElement.querySelector('pre')?.getAttribute('tabindex')).toBe('0')
  },
}

export const Dark: Story = { decorators: [darkTheme] }

/** Raw HTML in the Markdown goes through DOMPurify: no script, no style, no form. */
export const Sanitised: Story = {
  args: {
    content: `Avant <script>alert(1)</script> après.\n\n<form><input type="password"></form>\n\n<span style="position:fixed;inset:0">Calque</span>`,
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('script, form, input, [style]')).toBeNull()
  },
}
