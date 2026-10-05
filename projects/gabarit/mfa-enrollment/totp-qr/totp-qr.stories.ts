import type { Meta, StoryObj } from '@storybook/angular-vite'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { darkTheme } from '../../.storybook/preview'
import {
  OTPAUTH_URL,
  SECRET,
  atPhoneWidth,
  rendered,
  storyQrRenderer,
} from '../../auth/testing/auth-story-helpers'
import { TOTP_QR_RENDERER, TotpQr, type TotpQrRenderer } from './totp-qr'

/** Provides a QR encoder to a story (the stand-in one unless given). */
const withRenderer = (render: TotpQrRenderer = storyQrRenderer) =>
  moduleMetadata({ providers: [{ provide: TOTP_QR_RENDERER, useValue: render }] })

const inColumn = componentWrapperDecorator(
  (story) =>
    `<div style="max-width: 26rem; padding: 1rem; background: var(--bg-principal);">${story}</div>`,
)

/**
 * The QR code of an `otpauth://` URL, with the secret to type by hand. The QR is drawn by the
 * application's `TOTP_QR_RENDERER` (here a stand-in picture, not a scannable code).
 */
const meta: Meta<TotpQr> = {
  title: 'Auth/TotpQr',
  component: TotpQr,
  tags: ['autodocs'],
  decorators: [inColumn],
  args: { otpauthUrl: OTPAUTH_URL, secret: SECRET },
}

export default meta
type Story = StoryObj<TotpQr>

const qrDrawn = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await rendered(canvasElement, '.gbt-totp-qr__frame img')
}

export const Default: Story = {
  decorators: [withRenderer()],
  play: qrDrawn,
}

/** The renderer refuses the URL: only the secret is left, with an explanation. */
export const QrUnavailable: Story = {
  decorators: [withRenderer(() => Promise.reject(new Error('the payload exceeds a QR capacity')))],
  play: async ({ canvasElement }) => {
    const fallback = await rendered(canvasElement, '.gbt-totp-qr__fallback')
    await expect(fallback).toHaveTextContent('The QR code could not be displayed')
    await expect(canvasElement.querySelector('.gbt-totp-qr__frame')).toBeNull()
  },
}

/** The application provides no renderer: the same fallback, the secret to type by hand. */
export const NoRenderer: Story = {
  play: QrUnavailable.play,
}

/** While the renderer works: an empty frame of the final size, `aria-busy`. */
export const Drawing: Story = {
  decorators: [withRenderer(() => new Promise<string>(() => undefined))],
  play: async ({ canvasElement }) => {
    const frame = await rendered(canvasElement, '.gbt-totp-qr__frame')
    await expect(frame).toHaveAttribute('aria-busy', 'true')
  },
}

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
    const status = canvasElement.querySelector('gbt-copy-field [role="status"]')
    if (status?.textContent?.trim() !== text) throw new Error(`status is not "${text}" yet`)
  })

/** After a click on the copy button: the check icon and the "Copied" bubble for 2 s. */
export const SecretCopied: Story = {
  decorators: [withRenderer()],
  beforeEach: () => stubClipboard(() => Promise.resolve()),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Copy the setup key' }),
    )
    await statusSays(canvasElement, 'Copied')
  },
}

/** No clipboard (plain-HTTP instance) or a refused write: the secret gets selected instead. */
export const SecretCopyFailed: Story = {
  decorators: [withRenderer()],
  beforeEach: () => stubClipboard(() => Promise.reject(new Error('refused'))),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Copy the setup key' }),
    )
    await statusSays(canvasElement, 'Copy failed, key selected')
  },
}

/** The QR frame stays white on the dark theme: a camera needs dark modules on a light ground. */
export const Dark: Story = {
  decorators: [darkTheme, withRenderer()],
  play: qrDrawn,
}

/** A phone's width: the frame and the secret's box fit the column. */
export const Phone: Story = {
  decorators: [atPhoneWidth, withRenderer()],
  play: async ({ canvasElement }) => {
    await qrDrawn({ canvasElement })
    const doc = canvasElement.ownerDocument.documentElement
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth)
  },
}

/** Every string comes from `labels` (or `provideAuthLabels`): here the French of the original. */
export const Localised: Story = {
  decorators: [withRenderer()],
  args: {
    labels: {
      fallback:
        "Le QR code n'a pas pu être affiché : saisissez la clé ci-dessous dans votre application.",
      imageAlt: "QR code à scanner avec votre application d'authentification",
      secretLabel: 'Ou saisissez cette clé dans votre application',
      fallbackSecretLabel: 'Clé de configuration',
      copyLabel: 'Copier la clé de configuration',
      copied: 'Copié',
      copyFailed: 'Copie impossible, clé sélectionnée',
    },
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('img', {
      name: "QR code à scanner avec votre application d'authentification",
    })
    await expect(
      within(canvasElement).getByRole('button', { name: 'Copier la clé de configuration' }),
    ).toBeVisible()
  },
}
