# AuthPanel

The frame of every public sign-in page of the auth kit (`gbt-auth-login`, `gbt-auth-register`,
`gbt-auth-activate` draw themselves inside it): the whole viewport on the page background with a
faint wash of the accent colour, a centred panel holding the application's logo, an optional
heading and intro, then the page's own content. Use it directly for a page of your own that must
look like the sign-in pages (a "check your inbox" page, a maintenance notice).

**Selector**: `gbt-auth-panel`

## Inputs

| Input     | Type      | Default | Role                                                                                                                                                 |
| --------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heading` | `string`  | `''`    | The page's `<h1>`, focusable by script (`tabindex="-1"`). Empty: no heading and no intro (the content draws its own, see `.gbt-auth-panel__status`). |
| `intro`   | `string`  | `''`    | The line under the heading. Without it the heading stands alone, with room under it (`--alone`).                                                     |
| `wide`    | `boolean` | `false` | A panel of 30rem instead of 25rem, for a QR code or a grid of codes (the MFA enrolment). Accepts a bare attribute.                                   |

## Outputs

None.

## Slots

| Selector      | Role                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[auth-logo]` | The application's logo, centred above the heading: an `img`, a `picture` (a dark variant through `<source media="(prefers-color-scheme: dark)">`) or an `svg`. Nothing projected: no room taken. |
| (default)     | The page's content, after the heading and intro.                                                                                                                                                 |

## Classes for the projected content

Styled once by the panel, so every sign-in page looks the same:

| Class                                                          | Use                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `gbt-auth-panel__form`                                         | The form's column (1rem gap).                                                                                                  |
| `gbt-auth-panel__submit`                                       | The one primary action, on a `gbt-button block size="large"` (full width, 44 px).                                              |
| `gbt-auth-panel__links`                                        | A row of side exits (`gbt-button variant="link"`) under the primary action, 44 px high to tap.                                 |
| `gbt-auth-panel__status` (+ `gbt-auth-panel__status--success`) | On a `gbt-empty-state` with `[headingLevel]="1"` and `headingFocusable`, for a state without a form (done, closed, dead link). |

## Behaviour

- The panel owns the page's **`<main>`** landmark: put it outside your application shell (a route of
  its own), never inside another `<main>`.
- The panel hangs from a fixed offset at the top instead of being centred vertically, so that it
  does not move while the page's content grows (an alert, a loaded form).
- Under 480 px the panel keeps a 16 px gutter, a lighter padding, and the fields of a projected
  `gbt-input` are 44 px high with 16 px text (no zoom on focus in iOS); a password field's eye gets a
  44 px hit area.
- Custom properties: `--gbt-auth-panel-logo-width` (15rem) sizes the logo's `img`/`svg`;
  `--gbt-auth-panel-logo-offset` (0) pulls it up, to take back a transparent margin of the artwork.
- To announce a change of state, move the focus to the heading (`h1.focus()`): it is focusable by
  script, without a focus ring (it is not a control).

## Example

A page of the application's own, framed like the kit's pages:

```ts
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthFooter, AuthFooterLink, AuthPanel, Button } from '@masmarino/gabarit'

@Component({
  selector: 'app-check-inbox',
  imports: [AuthPanel, AuthFooter, AuthFooterLink, Button, RouterLink],
  template: `
    <gbt-auth-panel heading="Check your inbox" intro="We sent you an activation link.">
      <picture auth-logo>
        <source srcset="logo-dark.svg" media="(prefers-color-scheme: dark)" />
        <img src="logo.svg" alt="Acme" width="480" height="120" />
      </picture>

      <gbt-auth-footer text="Already activated?">
        <a gbtButton variant="link" gbtAuthFooterLink routerLink="/login">Sign in</a>
      </gbt-auth-footer>
    </gbt-auth-panel>
  `,
})
export class CheckInboxPage {}
```

The kit's own pages take the same logo through their `[auth-logo]` slot and pass it on to the panel;
their backend is the application's `AUTH_PORT` (and `MFA_PORT` for the account settings), their QR
encoder `TOTP_QR_RENDERER`, their strings `provideAuthLabels(...)`:

```ts
// app.config.ts
providers: [
  { provide: AUTH_PORT, useClass: HttpAuthPort },
  { provide: MFA_PORT, useClass: HttpMfaPort },
  {
    provide: TOTP_QR_RENDERER,
    useValue: (text, options) => import('qrcode').then((m) => m.toDataURL(text, options)),
  },
  provideAuthLabels({ login: { heading: 'Connexion' } }),
]
```

```html
<gbt-auth-login (loggedIn)="router.navigateByUrl('/')">
  <img auth-logo src="logo.svg" alt="Acme" width="480" height="120" />
  <a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">Create an account</a>
</gbt-auth-login>
```

## Accessibility

See [AUDIT.md](./AUDIT.md). The logo's `alt` is the application's to write (the product's name).
