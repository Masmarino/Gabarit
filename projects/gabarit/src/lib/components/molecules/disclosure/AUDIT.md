# RGAA Audit — Disclosure

Verified against RGAA 4.1.2 by exercising `Molecules/Disclosure` in Storybook (stories `Default`, `Open`,
`WithIcon`, `AsAHeading`, `Plain`, `Several`, `Dark`, with the keyboard: Tab, Space, Enter) and by code
review (`disclosure.ts`, `disclosure.html`, `disclosure.scss`).

## Checklist

| Criterion  | Short title                                    | Verification                                                                                                                                                                                                                       | Result    |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 7.1        | Scripts compatible with assistive technology   | A native `<button type="button">` with `aria-expanded` (`true` / `false`, kept in sync with the model) and `aria-controls` pointing at the panel's id; distinct ids per instance. Enter and Space toggle it natively. Tested.      | Compliant |
| 7.3        | Keyboard operable                              | Everything is the button: no pointer-only behaviour. While closed the panel is `inert`: its controls are out of the tab order and not readable; open, they are reached after the toggle, in DOM order.                             | Compliant |
| 9.1        | Information structured by headings             | `headingLevel` wraps the toggle in a real `h2`…`h6` (the button inside the heading, per the ARIA pattern), exactly one heading, none by default. The level is the application's choice.                                            | Compliant |
| 10.7       | Focus visible                                  | `:focus-visible` draws a 2 px `--primary` outline inside the toggle.                                                                                                                                                               | Compliant |
| 3.1        | Information not conveyed by colour alone       | Open or closed is told by `aria-expanded` and by the chevron's direction (up / down), not by colour.                                                                                                                               | Compliant |
| 3.2        | Text contrast                                  | `--text-primary` on `--bg-principal`; on the hover fill and on the bordered panel (`--bg-hover` over the page or a panel) `--text-primary` and `--text-secondary` reach 7:1 in both themes (`tokens/contrast.spec.ts`, "widgets"). | Compliant |
| 13.8       | Moving content can be controlled               | The 200 ms collapse and the chevron rotation are removed under `prefers-reduced-motion: reduce`.                                                                                                                                   | Compliant |
| 12.11      | Hidden content ignored by assistive technology | The chevron and the icon are `aria-hidden`; a closed panel is `inert` and `visibility: hidden`, so its content is neither read nor found.                                                                                          | Compliant |
| WCAG 2.5.8 | Target size minimum                            | The toggle is 40 px tall (32 px in `plain`) and as wide as its box.                                                                                                                                                                | Compliant |

## Accessibility test

`disclosure.spec.ts` runs axe closed, then open with a heading and an icon: 0 violations.

## Externalized strings

`label` is the only text and is an input (no default).
