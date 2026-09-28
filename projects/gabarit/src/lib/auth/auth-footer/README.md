# AuthFooter

The last line of a sign-in panel: a hairline, then the way to the sibling page ("No account yet?
Create an account", "Already have an account? Sign in"). It is **router-agnostic**: the link is
either projected by the application (with its own `routerLink`) or drawn from a plain `href`.

**Selectors**: `gbt-auth-footer` (the component) and `[gbtAuthFooterLink]` (`AuthFooterLink`, the
marker directive for a projected link).

## Inputs

| Input      | Type             | Default    | Role                                                               |
| ---------- | ---------------- | ---------- | ------------------------------------------------------------------ |
| `text`     | `string`         | (required) | The sentence before the link ("Already have an account?").         |
| `href`     | `string \| null` | `null`     | A plain URL for a link drawn by the footer. `null`: no drawn link. |
| `linkText` | `string`         | `''`       | The drawn link's text, with `href`.                                |

## Outputs

None.

## Slots

| Selector  | Role                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| (default) | The link, after the sentence: an `a[gbtButton][gbtAuthFooterLink]` in the `link` variant, carrying the application's `routerLink`. |

## `AuthFooterLink` (`[gbtAuthFooterLink]`)

Marks the anchor an application hands to a kit page for its footer, and adds the
`gbt-auth-footer__link` class (the hook of the 44 px rule). The kit's pages
(`gbt-auth-login`, `gbt-auth-register`, `gbt-auth-activate`) project whatever carries it into their
footer, and show the footer only when one is given (the login page: and only when registration is
enabled).

## Behaviour

- The link, drawn or projected, is Gabarit's `a[gbtButton]` in its `link` variant, made 44 px high
  to tap; a negative bottom margin gives the panel's padding back.
- With neither `href` nor a projected link, only the sentence shows.
- A projected `a[gbtButton]` with `[disabled]="true"` gets `aria-disabled="true"`, leaves the tab
  order and swallows clicks before `routerLink` sees them (the button's own guard).
- Lives inside `gbt-auth-panel`.

## Example

With the Angular router: put `routerLink` on the projected anchor, next to `gbtButton` and
`gbtAuthFooterLink` (import `Button`, `AuthFooterLink` and `RouterLink`).

```ts
import { Component, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { AuthFooterLink, AuthLogin, Button } from '@masmarino/gabarit'

@Component({
  selector: 'app-login-page',
  imports: [AuthLogin, Button, AuthFooterLink, RouterLink],
  template: `
    <gbt-auth-login (loggedIn)="router.navigateByUrl('/')">
      <img auth-logo src="logo.svg" alt="Acme" width="480" height="120" />
      <a gbtButton variant="link" gbtAuthFooterLink routerLink="/register">Create an account</a>
    </gbt-auth-login>
  `,
})
export class LoginPage {
  protected readonly router = inject(Router)
}
```

`gbt-auth-login` needs the application's `AUTH_PORT` (and `TOTP_QR_RENDERER` for a first
enrolment); `provideAuthLabels({ login: { registerPrompt: '…' } })` changes the sentence it passes
to the footer.

In a panel of your own, either form:

```html
<gbt-auth-panel heading="Check your inbox">
  <!-- Projected, with the router -->
  <gbt-auth-footer text="Already activated?">
    <a gbtButton variant="link" gbtAuthFooterLink routerLink="/login">Sign in</a>
  </gbt-auth-footer>

  <!-- Drawn, a plain URL -->
  <gbt-auth-footer text="Already activated?" href="/login" linkText="Sign in" />
</gbt-auth-panel>
```

## Accessibility

See [AUDIT.md](./AUDIT.md).
