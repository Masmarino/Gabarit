# Badge

Short status/category label — a colored pill for text content (e.g. a
role, a status, a count), purely informational. Not interactive by default;
see [Copy](#copy) for the one exception (a small copy button inside the
pill). Not removable; see the component's GitHub issue if you need a
dismissible chip variant later.

**Selector**: `gbt-badge`. Also replaces the former `gbt-code-chip` (via the
`mono`/`copyable` inputs below) and `gbt-counter` (via `value`) — see
[Migrating from CodeChip](#migrating-from-codechip) and
[Migrating from Counter](#migrating-from-counter).

## Inputs

| Input         | Type                    | Default         | Role                                                                                                                                |
| ------------- | ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `variant`     | `BadgeVariant`          | `'neutral'`     | `'neutral' \| 'success' \| 'warning' \| 'error' \| 'info'`.                                                                         |
| `icon`        | `string`                | none            | Optional `gbt-icon` name, shown before the label.                                                                                   |
| `appearance`  | `'filled' \| 'outline'` | `'filled'`      | `outline`: transparent, 1px border in the variant's text colour (`--border-color` for `neutral`). Same height as `filled`.          |
| `size`        | `'md' \| 'sm'`          | `'md'`          | `sm`: smaller pill (11px), for counters and dense rows.                                                                             |
| `truncate`    | `boolean`               | `false`         | The badge may shrink below its content and ellipsises its label (see below).                                                        |
| `tabularNums` | `boolean`               | `false`         | `font-variant-numeric: tabular-nums`, so a live count keeps a steady width.                                                         |
| `mono`        | `boolean`               | `false`         | Monospace font, hairline border, tighter shape — the look of the former `gbt-code-chip`. See [below](#mono-monospacecode).          |
| `maxWidth`    | `string \| null`        | `null`          | Caps the pill's width (any CSS length, `12rem`). From `gbt-code-chip`.                                                              |
| `fullText`    | `string \| null`        | `null`          | The complete text, as a native tooltip (`title`) on the label: useful when `truncate` cuts it. From `gbt-code-chip`.                |
| `copyable`    | `boolean`               | `false`         | Adds a small copy button inside the badge. From `gbt-code-chip`.                                                                    |
| `copyValue`   | `string \| null`        | `null`          | What the button copies; by default the badge's own visible text.                                                                    |
| `copyLabel`   | `string`                | `'Copy'`        | Accessible name of the copy button ("Copy the commit SHA").                                                                         |
| `copiedText`  | `string`                | `'Copied'`      | Announced after a copy (visually hidden live region: the glyph turns into a check).                                                 |
| `failedText`  | `string`                | `'Copy failed'` | Announced when the copy is refused; the badge text is selected for a manual copy.                                                   |
| `feedbackMs`  | `number`                | `2000`          | How long the copied glyph stays.                                                                                                    |
| `value`       | `number \| null`        | `null`          | Numeric counter mode: replaces the projected content with this count. From `gbt-counter`. See [below](#value-numeric-counter-mode). |
| `max`         | `number \| null`        | `null`          | Counter mode: caps the display, e.g. `max` `99` shows `120` as `99+`. `null`: no cap.                                               |
| `hideZero`    | `boolean`               | `false`         | Counter mode: hides the badge (`hidden` on the host) when the shown count is `0`.                                                   |
| `label`       | `string \| null`        | `null`          | Counter mode: visually hidden text read after the number ("12 open issues").                                                        |

## Outputs

| Output       | Type     | Role                                                                    |
| ------------ | -------- | ----------------------------------------------------------------------- |
| `copied`     | `string` | Emitted with the copied text after a successful copy (`copyable` only). |
| `copyFailed` | `void`   | Emitted when the copy is refused (`copyable` only).                     |

## Content

The badge's text comes from projected content (`<ng-content />`), not
an input — like a native `<span>`, so it composes naturally with
interpolation, `@if`, or plain text — **except** in `value` mode (see
below), where the projected content is ignored and the computed count is
rendered instead.

## Truncation

In a narrow row a long label pushes its badge past the container. With `truncate`
the host and the pill are allowed to shrink (`min-width: 0`, `max-width: 100%`) and
the label ends in an ellipsis; a `max-width` on `<gbt-badge>` (or the `maxWidth` input)
caps it below the container width. The full text stays in the DOM for assistive
technology; add a `title` on the host, or the `fullText` input, for a hover tooltip.
If the badge is a flex item, give its wrapper `min-width: 0` as well.

```html
<li style="display: flex; min-width: 0">
  <gbt-badge appearance="outline" truncate [attr.title]="event">{{ event }}</gbt-badge>
</li>
```

## `mono` (monospace/code)

`mono` gives the badge the monospace font, hairline border and tighter shape
suited for a commit SHA, a tag, a branch name or a repository path, in a row,
a meta line or a sentence. It
layers on top of `variant`/`appearance`: an explicit colored variant still
wins for background/color (declared later in `badge.scss`); `mono` alone
only changes the shape and the type.

```html
<gbt-badge mono icon="git-commit" fullText="{{ sha }}">{{ sha.slice(0, 7) }}</gbt-badge>
```

## Copy

Same engine as [`gbt-copy-button`](../copy-button/README.md) (Clipboard API, `execCommand` fallback,
refusal selects the text), reusing `ClipboardFeedback` — no logic is duplicated. The badge itself is
not interactive: only its copy button is, with a 24 px hit area (drawn outside the pill so it does not
grow). The outcome is announced by a `role="status"` region that exists as long as the badge is
`copyable`.

```html
<gbt-badge mono icon="git-commit" copyable [copyValue]="commit.sha" copyLabel="Copy the commit SHA"
  >{{ commit.sha.slice(0, 7) }}</gbt-badge
>
```

## `value` (numeric counter mode)

Setting `value` switches the badge into the former `gbt-counter`'s mode: the
projected content is **ignored**, and the badge computes and renders the
count itself — fractions cut, negatives and non-numbers count as `0` — capped
by `max` (`120` with `max` `99` shows `99+`) and hideable at `0` with
`hideZero` (via the `hidden` attribute — the element stays in the DOM, no
`@if` needed around it). `label` adds a visually hidden suffix after the
number ("12 open issues"): **a bare number is ambiguous for assistive
technology** unless the surrounding context (a heading, a tab) already says
what it counts — see [AUDIT.md](AUDIT.md).

```html
<h2>Pages <gbt-badge [value]="pages().length" hideZero label="pages" /></h2>

<button gbtTab>Closed <gbt-badge [value]="closed()" [max]="99" size="sm" /></button>
<gbt-badge [value]="toReview()" variant="info" size="sm" label="to review" />
```

Badge already has `tabularNums` for equal-width digits (a live count does not
jitter) — set it explicitly in counter usage: it is not implied by `value`.

## Migrating from CodeChip

`gbt-code-chip` is gone; use `gbt-badge` with `mono` (its label is a `<span>`, not a `<code>`
wrapper, styled the same way). Every other `gbt-code-chip` input keeps its name:

```html
<!-- before -->
<gbt-code-chip icon="git-commit" copyable [copyValue]="sha" copyLabel="Copy the commit SHA"
  >{{ sha.slice(0, 7) }}</gbt-code-chip
>

<!-- after -->
<gbt-badge mono icon="git-commit" copyable [copyValue]="sha" copyLabel="Copy the commit SHA"
  >{{ sha.slice(0, 7) }}</gbt-badge
>
```

One behavioural difference: `gbt-code-chip`'s `truncate` defaulted to `true`
(and `truncate="false"` made it wrap instead of overflowing, via
`white-space: normal; overflow-wrap: anywhere`). `gbt-badge`'s `truncate`
keeps its own default of `false` and has no such wrapping mode — a mono
badge that needs the ellipsis behaviour should set `truncate` explicitly; one
that needs to wrap instead should sit inside a block-level container.

## Migrating from Counter

`gbt-counter` is gone; use `gbt-badge` with `value` (and the same `max` /
`hideZero` / `label` names):

```html
<!-- before -->
<gbt-counter [value]="pages().length" hideZero label="pages" />

<!-- after -->
<gbt-badge [value]="pages().length" hideZero label="pages" />
```

`gbt-counter`'s `appearance` (`'neutral' | 'primary'`) has no exact `gbt-badge`
equivalent: Badge's own `variant`/`appearance`/`size` axes replace it.
`appearance="neutral"` (the old default) is closest to `gbt-badge`'s own
default look (no `variant`, `appearance="filled"`); there is no ready-made
"brand-filled" look for the old `appearance="primary"` — pick the semantic
`variant` that fits (e.g. `variant="info"`) or a custom class. `size="sm"`/
`"md"` map directly. This is a visual difference to review when migrating a
call site, not just a rename.

## Example

```html
<gbt-badge variant="success">Actif</gbt-badge>
<gbt-badge variant="error" icon="alert-triangle">Erreur</gbt-badge>
```

```html
<gbt-badge appearance="outline" variant="success">Current version</gbt-badge>
<gbt-badge size="sm" tabularNums>1,118</gbt-badge>
```

## Accessibility

See [AUDIT.md](AUDIT.md).
