# RGAA Audit — FileUpload

Verified against RGAA 4.1.2 by exercising `Molecules/FileUpload` in
Storybook (stories `Empty`, `Multiple`, `WithMaxSize`, `WithError`,
`Disabled`, `Dark`) and by code review (`file-upload.ts`,
`file-upload.html`, `file-upload.scss`).

## Checklist

| Criterion  | Short title                                          | Verification                                                                                                                                                                                                                       | Result   |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7.1        | Scripts compatible with assistive technology             | The visible dropzone is a real `<button>`, labelled by the field's own `label` via `aria-labelledby`; the hidden native `<input type="file">` is `aria-hidden="true"` + `tabindex="-1"` so it's never independently exposed to AT — only the button is. 0 axe violations, empty and with files/a rejection present (`file-upload.spec.ts`, "has no a11y violations" ×2). | Compliant |
| 7.3        | Keyboard-operable                                        | Drag-and-drop has no keyboard equivalent by nature, but selecting files is always reachable via the same button (Tab to it, `Enter`/`Space` opens the native OS picker, itself fully keyboard-operable) — nothing here is drag-only. | Compliant |
| 7.4        | No uncontrolled context change                           | Nothing happens on drag-enter/drag-over beyond a visual highlight (`dragOver`) — the value only changes on an explicit drop, a file picked in the OS dialog, or a remove-button click.                                                | Compliant |
| 9.3        | Appropriate list structure                                | The rejected-files message and the selected-files list are each a real `<ul>`/`<li>` — the alert semantics for the rejections live on a wrapping `<div role="alert">`, not on the `<ul>` itself, since overriding a list's own role to `alert` would break the `listitem`/`list` relationship its `<li>` children depend on (caught by axe during development; see "Errors and Fixes" pattern already established for `DescriptionList`/`Stepper`). | Compliant |
| 11.1       | Label presence                                            | `removeLabel` names each file's remove button with that file's own name (not a generic "Remove"), so multiple files remain distinguishable to a screen reader. Tested indirectly via the a11y pass with two files present.            | Compliant |
| WCAG 2.5.8 | 24×24px target size                                        | `.gbt-file-upload__file-remove` carries the same `::before` target-area technique as `Modal`/`Drawer`'s close button (`max(100%, 24px)`), extending its hit area without enlarging the visible icon.                                    | Compliant |

## Why the rejections list isn't simply `<ul role="alert">`

Setting `role="alert"` directly on the `<ul>` replaces its implicit
list role entirely (ARIA role attributes override the native one), so
axe's `listitem` rule then sees `<li>` children with no valid list
parent and flags it — found during development, fixed by wrapping the
untouched `<ul>` in a separate `<div role="alert">` instead, keeping
both the live-region announcement and the list semantics intact
simultaneously.

## Why the dropzone is one button, not a div with a nested "browse" link

A `<button>` cannot contain another focusable/interactive element —
nesting a clickable "browse" word inside a clickable dropzone would be
invalid, inaccessible markup (the same class of problem `Popover`'s
and `DatePicker`'s own audits already ran into with nested interactive
elements). Making the entire zone a single button avoids the question
entirely, and is at least as discoverable: the whole area invites a
click, not just one word within it.

## Externalized strings

`dropLabel`, `removeLabel`, and `oversizeMessage` all default to
English and are all overridable — tested individually where they
affect rendered text (`removeLabel` via "uses the provided clear
label"-style assertions is implicit in the remove-button a11y pass;
`oversizeMessage`'s default is exercised directly in "rejects a file
larger than maxSizeMb...").

Dark mode is visually confirmed in Storybook (`Dark` story) — dropzone
border, icon, and hint text all legible, no contrast regression.
