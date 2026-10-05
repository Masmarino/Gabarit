# GitField

The family's animated commit graph, drawn on the graphite frame: lanes that drift slowly
sideways, commits that blink in turn, pushes running along some lanes, over two soft fields of
colour (the rust accent and the indigo). It sits behind the sign-in panel or a dark band.

**Selector**: `gbt-git-field` · **Import**: `@masmarino/gabarit/git-field`

## Usage

Behind the sign-in pages, in the `[auth-backdrop]` slot of `gbt-auth-panel` and of the pages built
on it (`gbt-auth-login`, `gbt-auth-register`, `gbt-auth-activate`, `gbt-auth-reset-password`):

```html
<gbt-auth-login (loggedIn)="signedIn()">
  <img auth-logo src="logo.svg" alt="Acme" />
  <gbt-git-field auth-backdrop />
</gbt-auth-login>
```

Anywhere else, it fills its nearest positioned ancestor (`position: absolute; inset: 0`), under
the content (`z-index: 0`): give that ancestor `position: relative` and `isolation: isolate`, and
lift the content above it.

## Behaviour

- Decoration only: `aria-hidden="true"` on the host, `focusable="false"` on the SVG, no pointer
  events.
- The drawing comes from a seeded generator, so it is the same on the server and in the browser.
- Two identical tiles scroll by one width and start again, so the loop has no seam.
- It reads the frame's colours (`frame-tokens`) in both themes, since it is drawn on the graphite.
- The graph fades out towards the middle, where a centred panel sits, and stands further back
  (half opacity) below 48rem, where the panel takes the whole width.
- Still under `prefers-reduced-motion: reduce`: the graph stays drawn, nothing moves.
