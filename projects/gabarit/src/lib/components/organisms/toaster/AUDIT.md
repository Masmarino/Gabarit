# RGAA Audit — Toaster

Verified against RGAA 4.1.2 by exercising `Organisms/Toaster` in
Storybook (stories `All Variants`, `Top Left`, `Dark`) and by code
review (`toaster.ts`, `toaster.html`, `toaster.scss`).

`gbt-toaster` sets no ARIA attribute on its own host — `role` and
`aria-atomic` live on each `.gbt-toaster__item`. Roles are checked by
direct DOM inspection in `toaster.spec.ts` ("uses role=\"status\" for
success and info toasts", "uses role=\"alert\" for warning and error
toasts"), not only by the axe pass.

## Checklist

| Criterion   | Short title                                  | Verification                                                                                                                                                                                                                                                                            | Result               |
| ----------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 7.1         | Scripts compatible with assistive technology | Each toast carries `role="status"` (success, info) or `role="alert"` (warning, error) with `aria-atomic="true"`, the DOM equivalent of WCAG 2.1 SC 4.1.3 (Status Messages) — assistive tech announces new toasts without a focus change. 0 axe violations across all three stories (Storybook a11y addon: "No accessibility violations found", 15 passes). | Compliant            |
| 7.3         | Keyboard- and pointer-operable               | The close button is a native `<button>`, reachable and activatable by keyboard with no custom key handling required. Tested ("emits dismissed with the toast id when its close button is clicked").                                                                                  | Compliant            |
| 7.4         | No uncontrolled context change               | A toast never steals focus on appearance or dismissal — the component only ever emits `dismissed`; the application decides what happens next. No context change (navigation, focus move) is triggered by the component itself.                                                       | Compliant            |
| WCAG 2.2.1  | Timing adjustable                            | Auto-dismiss (`duration`, default 5000 ms) is informational only, not a task deadline: the message is already announced via `role="status"`/`role="alert"` the instant it appears, and its removal doesn't block or hide a pending action. Any toast can opt out with `duration: 0` or `Infinity` (tested: "does not auto-dismiss a toast with duration 0") — the application is expected to use this for toasts that require a response.  | Compliant            |
| 10.7        | Visible focus indicator                      | Unlike `gbt-modal`'s close button, `.gbt-toaster__close` *does* set an explicit `:focus-visible { outline: 2px solid var(--text-on-color); }` — the fixed near-black card means a default browser outline (often blue/black) could land with poor contrast, so a guaranteed-white ring replaces it deliberately.                                | Compliant            |
| WCAG 2.5.8  | 24×24px target size                          | `.gbt-toaster__close` reuses `gbt-modal`'s `::before` technique, extending its target area with no change to the visible button box. Measured in Storybook (`Dark` story, `getComputedStyle(button, '::before')`): **28.6641 × 24px**.                                                | Compliant — verified |

## Externalized strings

`closeLabel` defaults to `'Close'`. Tested by "uses the provided close
label" and "uses an English default close label".

## Color usage

The card is deliberately fixed-chrome — same near-black background,
white text and white-on-vivid icon badges regardless of the host app's
light/dark theme, by design (a toast must stay legible over whatever
page is behind it, and its badge shouldn't shift hue as the app's
theme changes). This required new theme-invariant semantic tokens in
`_semantic.scss`, defined once in `:root` and intentionally **not**
redefined for the dark theme (the same pattern already used by
`--site-border-radius`, `--font-family`, etc.):

- `--bg-inverse` (`--grey-900`) — the card background.
- `--color-{success,warning,error,info}-vivid-base` — the icon badge
  fill: `green-500`, the light theme's warning hex, `red-500`, and a
  new dedicated vivid blue (`#2f6feb`) for `info` (no blue scale exists
  in `_palette.scss`, and `--primary`/`brand-600` is a muted
  navy-grey, not vivid).

Each badge fill is a small graphic, not text — audited at the 3:1
non-text threshold (WCAG 1.4.11), the same bar as chart series colors
and the `-base` tokens they use, via the existing
`token-graphique-sans-texte` marker in `token-usage.spec.ts`. The icon
glyph itself is always `--text-on-color` (pure white in both themes),
same as the message text and close button, rather than
`--text-primary`/`--text-discret`, which would resolve to a dark,
low-contrast color against the always-dark card in a light-themed host
app.

Verified in Storybook (`Dark` story, host app itself in dark mode):
badge fills resolve to the identical `rgb(41, 160, 121)` /
`rgb(217, 90, 90)` / `rgb(195, 137, 39)` / `rgb(47, 111, 235)` as in
the light-themed host — confirming the theme-invariant tokens work as
intended, not just the always-dark card itself
(`background-color: rgb(13, 27, 36)`, `border: 0px none`).
