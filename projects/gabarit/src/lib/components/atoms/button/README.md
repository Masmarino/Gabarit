# Button

Action button, or an anchor styled the same way — visual variants, sizes,
loading state, toggle and disclosure semantics. One component, two selectors
on the same class:

- **`gbt-button`** — a `<button>`, for an in-page action.
- **`a[gbtButton]`** — a real `<a>` that looks exactly like a `gbt-button`,
  for a router link, a download, or any navigation. It is
  **router-agnostic**: it never imports `@angular/router`. Put `routerLink`
  (or a plain `href`), a `download`… on the same element yourself.

```ts
import { Button } from '@masmarino/gabarit'
```

## Inputs (button form — `gbt-button`)

| Input          | Type                                                                          | Default     | Role                                                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`      | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'ghost-danger' \| 'link'` | `'primary'` | Visual treatment. See [Variants](#variants).                                                                                                                                                   |
| `size`         | `'small' \| 'medium' \| 'large'`                                              | `'medium'`  | Button size: at least 32 / 38 / 44px tall for `small` / `medium` / `large` (the shared `--gbt-control-height-*` scale, level with a field of the same tier); `large` is the 44px touch target. |
| `type`         | `'button' \| 'submit'`                                                        | `'button'`  | Native `type` attribute.                                                                                                                                                                       |
| `text`         | `string`                                                                      | `''`        | Visible label. The text `<span>` is only rendered when this is not empty.                                                                                                                      |
| `iconName`     | `string \| null`                                                              | `null`      | Icon shown before the text, if provided.                                                                                                                                                       |
| `ariaLabel`    | `string \| null`                                                              | `null`      | Accessible name, when the visible label isn't enough (mandatory for an icon-only button).                                                                                                      |
| `loading`      | `boolean`                                                                     | `false`     | Shows a loading indicator, disables the button.                                                                                                                                                |
| `loadingLabel` | `string`                                                                      | `'Loading'` | Text announced while loading (`.sr-only`).                                                                                                                                                     |
| `disabled`     | `boolean`                                                                     | `false`     | Disables the button.                                                                                                                                                                           |
| `pressed`      | `boolean \| null`                                                             | `null`      | Toggle button: renders `aria-pressed="true"` / `"false"`. `null` renders no attribute (an ordinary button).                                                                                    |
| `ariaExpanded` | `boolean \| null`                                                             | `null`      | Disclosure or menu trigger: renders `aria-expanded`. `null` renders no attribute.                                                                                                              |
| `ariaControls` | `string \| null`                                                              | `null`      | Id of the element the button controls (`aria-controls`).                                                                                                                                       |
| `ariaHaspopup` | `'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'dialog' \| boolean \| null`      | `null`      | Kind of popup the button opens (`aria-haspopup`); `true` means a menu.                                                                                                                         |
| `block`        | `boolean`                                                                     | `false`     | Stretches the button to the width of its container.                                                                                                                                            |
| `iconOnly`     | `boolean`                                                                     | `false`     | Squares the button around its icon (same padding on every side, as wide as tall: 32 / 38 / 44px for `small` / `medium` / `large`). Set `ariaLabel`.                                            |

## Outputs (button form)

| Output    | Type   | Role                                          |
| --------- | ------ | --------------------------------------------- |
| `clicked` | `void` | Emitted on click (not disabled, not loading). |

## Inputs (anchor form — `a[gbtButton]`)

| Input      | Type                                                                          | Default     | Role                                                                                                             |
| ---------- | ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'ghost-danger' \| 'link'` | `'primary'` | Visual treatment (same as `gbt-button`).                                                                         |
| `size`     | `'small' \| 'medium' \| 'large'`                                              | `'medium'`  | Size: at least 32 / 38 / 44px tall for `small` / `medium` / `large` (the shared `--gbt-control-height-*` scale). |
| `iconName` | `string \| null`                                                              | `null`      | Icon shown before the projected text.                                                                            |
| `block`    | `boolean`                                                                     | `false`     | Stretches the link to the width of its container.                                                                |
| `iconOnly` | `boolean`                                                                     | `false`     | Squares the link around its icon. Give the anchor an `aria-label`.                                               |
| `disabled` | `boolean`                                                                     | `false`     | Link "disabled" semantics: `aria-disabled="true"`, `tabindex="-1"`, the click is swallowed (see below).          |

The anchor's label is the projected content. Keep it a single text node or
wrap richer content in one `<span>`: the direct children are laid out as a
flex row with a 0.5rem gap, exactly like the button's icon and text. The
anchor form has no `type`, `text`, `ariaLabel`, `loading`, `loadingLabel`,
`pressed`, `ariaExpanded`, `ariaControls` or `ariaHaspopup` input — those are
native-`<button>` concerns the anchor form doesn't need (they exist on the
shared class but have no effect there; the anchor's accessible name is its
own `aria-label` attribute or its projected text, same as any link).

## One class, two selectors

`Button` is a single Angular class with `selector: 'gbt-button, a[gbtButton]'`.
Its constructor inspects `ElementRef.nativeElement.tagName` once to tell
which form it is applied to:

- On `<gbt-button>` it renders an internal native `<button>` carrying
  `type`/`disabled`/the ARIA attributes above, and emits `clicked` on a real
  click (guarded by `disabled`/`loading`).
- On `a[gbtButton]` there is no internal wrapper: the host **is** the anchor.
  The button-look classes (`gbt-button`, `gbt-button--{variant}`,
  `gbt-button--{size}`, `gbt-button--icon-only`) are put on the host itself,
  and a capture-phase `click`/`auxclick` listener plus a tabindex-restore
  effect implement the disabled-link semantics below. It never imports
  `@angular/router`.

Both forms share the same variant/size look: `_button-look.scss` is a single
Sass mixin, called once for the inner `<button>` (class selectors) and once
more with `$host: true` for the anchor (`:host(...)` selectors) — there is
exactly one place that defines "the gbt-button look".

## Variants

| Variant        | Use                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `primary`      | The main action of a view.                                                                                 |
| `secondary`    | A neutral action, outlined.                                                                                |
| `danger`       | A destructive action, filled.                                                                              |
| `ghost`        | A quiet action: no fill, no border until hovered — toolbars, rows, icon-only buttons.                      |
| `ghost-danger` | A quiet destructive action (delete in a row): looks like `ghost` until hovered or focused, then turns red. |
| `link`         | A text action inside running content: primary colour, underlined, no box.                                  |

## Icon-only

`text` is left empty: no text `<span>` is rendered, so nothing but the icon
sits in the flex row (no stray gap). Add `iconOnly` to square the box, and an
`ariaLabel` for the accessible name:

```html
<gbt-button
  variant="ghost-danger"
  size="small"
  iconName="x"
  [iconOnly]="true"
  ariaLabel="Delete label"
/>
```

Without `iconOnly` an icon-only button keeps the button's normal padding (a
slightly wider box) and renders no text `<span>` or gap around the icon.

## Toggle and disclosure

`pressed`, `ariaExpanded`, `ariaControls` and `ariaHaspopup` only reflect state:
the consumer flips it in its `clicked` handler. A pressed button also draws a
2px ring inside its box, so the state is not conveyed by colour alone.

```html
<gbt-button
  variant="secondary"
  [text]="following() ? 'Following' : 'Follow'"
  [pressed]="following()"
  (clicked)="toggle()"
/>

<gbt-button
  text="Advanced"
  iconName="chevron-down"
  [ariaExpanded]="open()"
  ariaControls="advanced"
  (clicked)="open.set(!open())"
/>
```

## Anchor: disabled

A link cannot be `disabled` natively. With `[disabled]="true"` the anchor gets
`aria-disabled="true"` and `tabindex="-1"` (a `tabindex` you had set is restored when it is enabled again), is dimmed with a `not-allowed`
cursor, and every `click` and middle click (`auxclick`) on it — including one
that lands on the icon — is stopped in the capture phase, before a `routerLink`
on the same element (or your own `(click)`) can run. `href` is left in place:
the attribute belongs to the consumer.

## Examples

```html
<gbt-button text="Enregistrer" variant="primary" (clicked)="save()" />
<gbt-button text="Se connecter" size="large" [block]="true" type="submit" />

<a gbtButton href="/groups">Groups</a>

<a gbtButton variant="secondary" iconName="folder" routerLink="/repositories">Repositories</a>

<a
  gbtButton
  variant="ghost"
  size="small"
  [iconOnly]="true"
  iconName="plus"
  aria-label="New group"
  routerLink="/groups/new"
></a>

<a gbtButton href="/export.csv" download [disabled]="!ready()">Download</a>
```

With a router, activeness/`aria-current` stay the consumer's business
(`routerLinkActive`); the anchor renders exactly the attributes you put on it,
plus the ones above.

## Accessibility

See [AUDIT.md](./AUDIT.md).
