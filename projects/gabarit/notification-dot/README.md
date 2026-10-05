# NotificationDot

A small dot or count badge overlaid on the corner of whatever it
wraps — an icon, an avatar, a button — for an "unread"/"new" signal
(e.g. a bell icon with an unread-notifications count). Distinct from
`Badge`, which is a standalone inline label, not an overlay on another
element.

**Selector**: `gbt-notification-dot` (`exportAs="gbtNotificationDot"`)

## Inputs

| Input     | Type                                          | Default   | Role                                                   |
| --------- | ------------------------------------------------ | ----------- | --------------------------------------------------------- |
| `count`   | `number \| null`                                  | `null`      | `null` shows a plain dot; a number shows it as text.        |
| `max`     | `number`                                          | `99`         | A count above this shows as `"{max}+"`.                     |
| `variant` | `'error' \| 'warning' \| 'success' \| 'info'`     | `'error'`    | Reuses `Badge`'s own semantic color tokens.                 |
| `hidden`  | `boolean`                                          | `false`      | Force-hides the dot regardless of `count`.                  |

A `count` of exactly `0` also hides the dot — there's rarely a reason
to show "0" as a notification badge.

## Example

```html
<gbt-notification-dot #dot="gbtNotificationDot" [count]="unreadCount()">
  <button type="button" [attr.aria-label]="'Notifications, ' + dot.count() + ' unread'">
    <gbt-icon name="bell" />
  </button>
</gbt-notification-dot>
```

## Accessibility

Like `Tooltip` and `Popover`, `gbt-notification-dot` wraps arbitrary
projected content and cannot inject an accessible name onto it — the
visual dot itself is `aria-hidden="true"`, since a screen reader
reading "3" out of context (disconnected from what it's a count of)
isn't useful. Instead, `count` is exposed publicly via
`exportAs="gbtNotificationDot"` so the consumer can fold it into
*their own* trigger's accessible name (as in the example above),
producing one coherent announcement ("Notifications, 3 unread") rather
than two disconnected ones.
