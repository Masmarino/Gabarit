# RGAA Audit — Slider

Verified against RGAA 4.1.2 by exercising `Atoms/Slider` in
Storybook (stories `Nominal`, `CustomFormat`, `NoValueReadout`,
`WithError`, `Disabled`, `Dark`) and by code review (`slider.ts`,
`slider.html`, `slider.scss`).

`gbt-slider` wraps a native `<input type="range">` rather than
building a custom `role="slider"` widget — most of the checklist below
is inherited browser behavior, confirmed present, not custom-built.

## Checklist

| Criterion  | Short title                                  | Verification                                                                                                                                                                                                                          | Result   |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1        | Scripts compatible with assistive technology     | Native `<input type="range">` carries its own implicit `role="slider"`, `aria-valuemin`/`aria-valuemax`/`aria-valuenow`, updated by the browser as the value changes — nothing custom to get wrong. 0 axe violations (`slider.spec.ts`, "has no a11y violations" ×2). | Compliant |
| 7.3        | Keyboard-operable                                | Arrow keys, `Home`/`End`, `Page Up`/`Down` all work natively on `<input type="range">` — no custom keydown handler was written, so there's nothing here to diverge from the browser's own behavior.                                          | Compliant |
| 10.7       | Visible focus indicator                          | `:focus-visible::-webkit-slider-thumb`/`::-moz-range-thumb` draw a dedicated outline on the thumb — a mouse-dragged thumb doesn't show one, confirming `:focus-visible`, not `:focus`, drives it.                                              | Compliant |
| 11.1       | Label presence                                   | `label` is `input.required`, wired to the input via a real `<label for>` — there is no way to render `gbt-slider` without an accessible name, unlike most other inputs in this library which default `label` to `''`.                         | Compliant |
| 11.2       | Label relevance                                  | The current value is shown next to the label by default (`showValue`), so the announced name and the visible state stay in sync — hiding it (`showValue="false"`) is opt-in, not the default.                                                | Compliant |

## Why a native `<input type="range">`, not a custom widget

A hand-built `role="slider"` thumb needs its own keydown handling
(arrows, Home/End, Page Up/Down, and — for a future range variant —
coordinating two thumbs), its own `aria-valuenow` bookkeeping, and a
fresh round of exactly the keyboard-pattern auditing `DatePicker`
already flagged as this library's most expensive category. The native
control gets all of that for free and is already used, unstyled,
throughout the web — only its skin needed building.

## Externalized strings

None of substance — `errorMessage` is entirely consumer-supplied, and
`formatValue`'s default (`${v}`) is locale-agnostic (no unit, no
separator) by design, left for the consumer to localize via the
function itself, demonstrated in the `CustomFormat` story (`fr-FR`
grouping and a `€` suffix).

Dark mode is visually confirmed in Storybook (`Dark` story) — track,
filled portion, and thumb all legible, no contrast regression.
