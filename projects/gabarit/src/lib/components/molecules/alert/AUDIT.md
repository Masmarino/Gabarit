# RGAA Audit — Alert

Verified against RGAA 4.1.2 by exercising `Molecules/Alert` in
Storybook (stories `Info`, `Success`, `Warning`, `Error`, `Dismissible`,
`WithAction`, `AllVariants`, `Dark`) and by code review (`alert.ts`,
`alert.html`, `alert.scss`).

`gbt-alert` sets no interactive role on its own host beyond `alert`/
`status` — a plain container, styled block, with an optional native
`<button>` for the close action.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                                     | Result                 |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 3.2         | Text contrast                                  | Each variant pairs `--color-{variant}-bg-text` on `--color-{variant}-bg` — the same tokens already measured for `Badge`. Re-measured live in Storybook (`AllVariants` story, computed styles): info 7.15:1, success 9.43:1, warning 8.26:1, error 8.33:1 — all above 7:1 (AAA). | Compliant               |
| 3.3         | Component contrast                             | The icon circle (`.gbt-alert__icon`) is an outline only — `border: 1.5px solid currentColor`, no fill — so its color is exactly `--color-{variant}-bg-text`, the same already-audited 7:1+ token the message text itself uses (inherited, not a separate token to re-check). | Compliant               |
| 7.1         | Scripts compatible with assistive technology   | `warning`/`error` use `role="alert"` (announced immediately, matching their urgency); `info`/`success` use `role="status"` (announced politely) — the same split already used by `Toaster`. `aria-atomic="true"` so the whole message is read, not just a changed fragment. 0 axe violations, every variant, with and without the close button (`alert.spec.ts`). | Compliant               |
| 7.3         | Keyboard- and pointer-operable                 | The close button is a plain native `<button>` — normal tab order, `Enter`/`Space` activates. Its hit area is widened to 24×24px minimum via the same `::before` trick already used by `GbtInput`'s password toggle and `Toaster`'s close button, regardless of the visible icon's smaller size. | Compliant               |
| 7.4         | No uncontrolled context change                 | `Alert` never disappears on its own — dismissing only happens on an explicit click of the close button, and even then `Alert` doesn't remove itself: it emits `dismissed` and waits for the app to stop rendering it (`alert.spec.ts`, "does not remove itself when dismissed…"), so nothing vanishes the user didn't act on directly. | Compliant               |
| 12.11       | Hidden content ignored by assistive technology | The variant icon (inside its colored circle badge) carries `aria-hidden="true"` (inherited from `gbt-icon`'s own host binding) — it never duplicates the message; it's purely decorative reinforcement of the color/role already conveying the variant. | Compliant               |
| 11.1        | Label presence                                 | The close button's accessible name comes from `closeLabel`, a real `aria-label` — not inferred from the `×`-shaped icon alone.                                                                                                    | Compliant               |
| 11.2        | Label relevance                                | Message text entirely delegated to the consumer via `<ng-content />` — nothing to check on the component's side.                                                                                                                  | Compliant (delegated)   |

## Why `role` differs by variant, not a single fixed role

Reusing `Toaster`'s exact split (`alert` for `warning`/`error`,
`status` for `info`/`success`) keeps the two components' screen-reader
behavior consistent — a user who's learned what an "assertive" Gabarit
notification sounds like gets the same signal from an inline `Alert`.
A single fixed `role="status"` for every variant would under-announce
an error; a single fixed `role="alert"` would over-announce routine
info banners.

## Externalized strings

`closeLabel` defaults to English and is meant to be localized by the
consuming app, like every other button label in this library.

Dark mode is visually confirmed in Storybook (`Dark` story).
