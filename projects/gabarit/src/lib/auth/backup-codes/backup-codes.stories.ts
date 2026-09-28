import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../../../.storybook/preview'
import { BACKUP_CODES, atPhoneWidth } from '../testing/auth-story-helpers'
import { BackupCodes } from './backup-codes'

// Storybook's play clicks carry no user activation, which the real clipboard may refuse: each story
// stubs it (and the legacy `execCommand` path, refused), and puts the browser's own back afterwards.
function stubClipboard(writeText: () => Promise<void>): () => void {
  const nav = navigator as unknown as Record<string, unknown>
  const doc = document as unknown as Record<string, unknown>
  const clipboard = Object.getOwnPropertyDescriptor(nav, 'clipboard')
  const exec = Object.getOwnPropertyDescriptor(doc, 'execCommand')
  Object.defineProperty(nav, 'clipboard', { value: { writeText }, configurable: true })
  Object.defineProperty(doc, 'execCommand', { value: () => false, configurable: true })
  return () => {
    if (clipboard) Object.defineProperty(nav, 'clipboard', clipboard)
    else Reflect.deleteProperty(nav, 'clipboard')
    if (exec) Object.defineProperty(doc, 'execCommand', exec)
    else Reflect.deleteProperty(doc, 'execCommand')
  }
}

const statusSays = (canvasElement: HTMLElement, text: string) =>
  waitFor(() => {
    const status = canvasElement.querySelector('[role="status"]')
    if (status?.textContent?.trim() !== text) throw new Error(`status is not "${text}" yet`)
  })

/** The ten backup codes of an account: a numbered grid, copy / download, and the acknowledgement. */
const meta: Meta<BackupCodes> = {
  title: 'Auth/BackupCodes',
  component: BackupCodes,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width: 26rem; padding: 1rem; background: var(--bg-principal);">${story}</div>`,
    ),
  ],
  args: { codes: BACKUP_CODES },
}

export default meta
type Story = StoryObj<BackupCodes>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list', { name: 'Backup codes' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(10)
    await expect(within(canvasElement).getByRole('checkbox')).not.toBeChecked()
  },
}

export const Acknowledged: Story = {
  args: { acknowledged: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('checkbox')).toBeChecked()
  },
}

/** After "Copy codes": the confirmation beside the buttons. */
export const Copied: Story = {
  beforeEach: () => stubClipboard(() => Promise.resolve()),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Copy codes' }))
    await statusSays(canvasElement, 'Codes copied')
  },
}

/** No clipboard (plain-HTTP instance): the codes are selected instead. */
export const CopyFailed: Story = {
  beforeEach: () => stubClipboard(() => Promise.reject(new Error('refused'))),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Copy codes' }))
    await statusSays(canvasElement, 'Copy failed, codes selected')
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
}

/** A phone's width: two codes a row still fit, each on two lines. */
export const Phone: Story = {
  decorators: [atPhoneWidth],
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument.documentElement
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth)
    const grid = canvasElement.querySelector<HTMLElement>('.gbt-backup-codes__grid')!
    for (const code of Array.from(grid.querySelectorAll<HTMLElement>('li'))) {
      await expect(code.getBoundingClientRect().right).toBeLessThanOrEqual(
        grid.getBoundingClientRect().right + 0.5,
      )
    }
  },
}

/** Every string comes from `labels` (or `provideAuthLabels`), the file's too: here in French. */
export const Localised: Story = {
  args: {
    labels: {
      listLabel: 'Codes de secours',
      copy: 'Copier les codes',
      copied: 'Codes copiés',
      copyFailed: 'Copie impossible, codes sélectionnés',
      download: 'Télécharger',
      acknowledge: "J'ai enregistré mes codes de secours",
      fileName: 'codes-de-secours.txt',
      fileTitle: 'Codes de secours',
      fileNotice:
        "Chaque code ne peut être utilisé qu'une seule fois. Conservez-les dans un endroit sûr.",
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('list', { name: 'Codes de secours' }),
    ).toBeVisible()
    await expect(within(canvasElement).getByRole('button', { name: 'Télécharger' })).toBeVisible()
    await expect(
      within(canvasElement).getByRole('checkbox', {
        name: "J'ai enregistré mes codes de secours",
      }),
    ).toBeVisible()
  },
}
