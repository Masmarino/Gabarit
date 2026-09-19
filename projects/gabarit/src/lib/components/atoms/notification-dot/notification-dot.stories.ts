import type { Meta, StoryObj } from '@storybook/angular-vite'
import { darkTheme } from '../../../../../.storybook/preview'
import { NotificationDot } from './notification-dot'

const meta: Meta<NotificationDot> = {
  title: 'Atoms/NotificationDot',
  component: NotificationDot,
}

export default meta
type Story = StoryObj<NotificationDot>

export const PlainDot: Story = {
  render: () => ({
    template: `
      <gbt-notification-dot>
        <button type="button" aria-label="Notifications">🔔</button>
      </gbt-notification-dot>
    `,
    moduleMetadata: { imports: [NotificationDot] },
  }),
}

export const WithCount: Story = {
  render: () => ({
    template: `
      <gbt-notification-dot #dot="gbtNotificationDot" [count]="3">
        <button type="button" [attr.aria-label]="'Notifications, ' + dot.count() + ' non lues'">🔔</button>
      </gbt-notification-dot>
    `,
    moduleMetadata: { imports: [NotificationDot] },
  }),
}

export const TruncatedCount: Story = {
  name: 'Count above max ("99+")',
  render: () => ({
    template: `
      <gbt-notification-dot [count]="150">
        <button type="button" aria-label="Notifications">🔔</button>
      </gbt-notification-dot>
    `,
    moduleMetadata: { imports: [NotificationDot] },
  }),
}

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:2rem">
        <gbt-notification-dot variant="error"><span style="font-size:24px">🔔</span></gbt-notification-dot>
        <gbt-notification-dot variant="warning"><span style="font-size:24px">🔔</span></gbt-notification-dot>
        <gbt-notification-dot variant="success"><span style="font-size:24px">🔔</span></gbt-notification-dot>
        <gbt-notification-dot variant="info"><span style="font-size:24px">🔔</span></gbt-notification-dot>
      </div>
    `,
    moduleMetadata: { imports: [NotificationDot] },
  }),
}

export const Dark: Story = {
  render: () => ({
    template: `
      <gbt-notification-dot [count]="3">
        <button type="button" aria-label="Notifications">🔔</button>
      </gbt-notification-dot>
    `,
    moduleMetadata: { imports: [NotificationDot] },
  }),
  decorators: [darkTheme],
}
