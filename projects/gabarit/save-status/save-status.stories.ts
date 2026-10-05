import { signal } from '@angular/core'
import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../.storybook/preview'
import { SaveStatus, SaveStatusState } from './save-status'

const meta: Meta<SaveStatus> = {
  title: 'Atoms/SaveStatus',
  component: SaveStatus,
  argTypes: {
    state: { control: 'inline-radio', options: ['idle', 'saving', 'saved', 'error'] },
  },
  args: {
    state: 'saved',
    savingLabel: 'Saving…',
    savedLabel: 'Saved',
    errorLabel: 'Not saved',
    message: null,
  },
}

export default meta
type Story = StoryObj<SaveStatus>

export const Default: Story = {}

export const AllStates: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;padding:1rem">
        <gbt-save-status state="idle" /> <span style="color:var(--text-secondary);font-size:0.75rem">↑ idle: empty, but the line and the live region are kept</span>
        <gbt-save-status state="saving" />
        <gbt-save-status state="saved" />
        <gbt-save-status state="error" />
      </div>`,
  }),
}

/** A specific message keeps the state's icon and colour (a password form, an API error). */
export const WithMessage: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:0.75rem;padding:1rem">
        <gbt-save-status state="saved" message="Password updated." />
        <gbt-save-status state="error" message="The current password is wrong." />
      </div>`,
  }),
}

/** A field saved on blur: the status sits under the input and never moves it. */
export const NextToAField: Story = {
  render: () => {
    const state = signal<SaveStatusState>('idle')
    return {
      props: {
        state,
        save: () => {
          state.set('saving')
          setTimeout(() => state.set('saved'), 900)
        },
      },
      template: `
        <div style="display:flex;flex-direction:column;gap:0.375rem;max-width:20rem;padding:1rem">
          <label for="site-name" style="color:var(--text-primary);font-size:0.875rem;font-weight:600">Instance name</label>
          <input id="site-name" value="FerrisGit"
            style="padding:0.5rem 0.75rem;border:1px solid var(--border-color);border-radius:var(--site-border-radius-sm);background:var(--bg-principal);color:var(--text-primary);font:inherit"
            (blur)="save()" />
          <gbt-save-status [state]="state()" />
          <span style="color:var(--text-secondary);font-size:0.75rem">Edit the field, then leave it.</span>
        </div>`,
    }
  },
}

export const Dark: Story = {
  decorators: [darkTheme],
  render: AllStates.render,
}
