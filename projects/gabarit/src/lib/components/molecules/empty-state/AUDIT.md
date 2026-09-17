# RGAA Audit — EmptyState

Verified against RGAA 4.1.2 by exercising `Molecules/EmptyState` in
Storybook (all seven illustration stories, plus `Dark`) and by code
review (`empty-state.ts`, `empty-state.html`, `empty-state.scss`).

`gbt-empty-state` is a purely informational molecule: no interactive
affordance of its own (the optional action button is entirely the
consumer's own projected content, with its own accessible name and
behavior).

## Checklist

| Criterion | Short title                                    | Verification                                                                                                                                                           | Result                 |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 3.2       | Text contrast                                  | `.gbt-empty-state__heading` uses `--text-primary`, `.gbt-empty-state__message` uses `--text-secondary` — both already-audited tokens on the page background (`contrast.spec.ts`). No new color pairing introduced. | Compliant (inherited)   |
| 7.1       | Scripts compatible with assistive technology   | No script-driven behavior beyond the static `@switch`. 0 axe violations (`empty-state.spec.ts`).                                                                       | Compliant                |
| 11.1/11.2 | Label presence / relevance                     | `heading`/`message` are plain text content, read in document order. The action is the consumer's own labeled control.                                                | Compliant (delegated)   |
| 12.11     | Hidden content ignored by assistive technology | The illustration `<div>` carries `aria-hidden="true"` unconditionally — tested directly (`marks the illustration as decorative`).                                     | Compliant                |

## Why a `@switch`, not a registry

Unlike `gbt-icon` (whose `IconRegistry` lets a consuming app register
its own icon names), `EmptyState`'s seven illustrations are fixed,
curated art shipped by the library itself — there is no use case for a
consuming app supplying its own. A static template `@switch` avoids
introducing a second SVG-sanitization path (`gbt-icon` already needs
`DomSanitizer.bypassSecurityTrustHtml` for its registry-backed,
runtime-selected markup; a fixed, compile-time-known set of illustrations
needs none of that).

## Externalized content

`heading` and `message` are both plain required/optional string inputs
— entirely delegated to the consumer, nothing to externalize further.

Dark mode is visually confirmed in Storybook (`Dark` story).
