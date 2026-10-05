# RGAA Audit — Avatar

Verified against RGAA 4.1.2 by exercising `Atoms/Avatar` in Storybook
(stories `Initials`, `WithImage`, `BrokenImage`, `Sizes`, `InAList`,
`Dark`) and by code review (`avatar.ts`, `avatar.html`, `avatar.scss`).

`gbt-avatar` is a purely informational atom: no interactive
affordance, no focusable element — either an `<img>` or a `<span>`,
never both at once.

## Checklist

| Criterion   | Short title                                    | Verification                                                                                                                                                                                                     | Result                |
| ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 3.2         | Text contrast                                  | The initials fallback pairs `--text-on-primary` on `--primary` — the same pair already measured at 7:1 (AAA) in `contrast.spec.ts`. Re-measured live in Storybook (`Dark` story, computed styles): 8.46:1.       | Compliant               |
| 1.1         | Text alternative for a meaningful image        | `<img [alt]="name()">` — the full name, not a generic "avatar" or "user photo". Tested directly (`avatar.spec.ts`, "shows the image when a src is given").                                                       | Compliant               |
| 7.1         | Scripts compatible with assistive technology   | The image/initials swap on load failure (`(error)`) never leaves a broken-image icon on screen, nor an unlabelled element — the initials fallback carries its own `aria-label` with the full name (see 11.1). 0 axe violations, both states (`avatar.spec.ts`). | Compliant               |
| 11.1        | Label presence                                 | The initials fallback (`<span>`) is announced by its `aria-label`, set to `name()` — not by its visible text ("AL"), which would read out only two letters instead of the full name.                             | Compliant               |
| 11.2        | Label relevance                                | `name` is required — there is no way to render `gbt-avatar` without a real name driving both the initials and the accessible name.                                                                               | Compliant               |
| 12.11       | Hidden content ignored by assistive technology | N/A — nothing in this component is decorative-only; every rendered element (image or initials) carries meaningful accessible text.                                                                              | N/A                      |

## Why a single fallback color, not one hashed per user

Hashing a background color per user (a common pattern in other design
systems) needs its own small palette, each entry separately audited
for contrast against the initials text — multiplying the audit surface
for a purely cosmetic distinction. `--primary`/`--text-on-primary` is
already audited at 7:1+ (AAA) for both themes, so reusing it costs
nothing new. Revisit if a real product need for per-user distinction
in dense lists emerges.

## Externalized strings

None — `name` is the only string input, and it's never given a
default; there is no English copy to localize here, unlike most other
components in this library.

Dark mode is visually confirmed in Storybook (`Dark` story).
